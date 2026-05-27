import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, history, langName, imageUrl } = await req.json();

    const systemPrompt = `You are Whisper — a warm, smart personal assistant inside the Whisper app. You feel like a brilliant, caring friend who happens to know everything.

PERSONALITY:
- Natural, warm, conversational — never robotic or stiff
- Concise but thorough — get to the point without being cold
- Use everyday language, not corporate jargon
- Show genuine interest and personality
- Never say you are an AI, a model, or mention Anthropic/Claude

LANGUAGE RULE: You MUST always respond ONLY in ${langName}. Never switch languages regardless of what language the conversation history is in.`;

    const messages = [];

    // Add history
    if (history && history.length > 0) {
      for (const msg of history.slice(-12)) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    // Add current user message
    if (imageUrl) {
      messages.push({
        role: "user",
        content: [
          ...(prompt ? [{ type: "text", text: prompt }] : [{ type: "text", text: "Please analyze this image." }]),
          { type: "image", source: { type: "url", url: imageUrl } },
        ],
      });
    } else {
      messages.push({ role: "user", content: prompt });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY"),
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return Response.json({ error: data.error?.message || "Claude API error" }, { status: 500 });
    }

    const text = data.content?.[0]?.text || "";
    return Response.json({ reply: text });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});