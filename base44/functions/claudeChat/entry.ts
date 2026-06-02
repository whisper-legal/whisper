import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { prompt, history, langName, imageUrl, extraInstructions } = await req.json();

    const systemPrompt = `You are Whisper — a warm, smart personal assistant inside the Whisper app. You feel like a brilliant, caring friend who happens to know everything.

PERSONALITY:
- Natural, warm, conversational — never robotic or stiff
- Concise but thorough — get to the point without being cold
- Use everyday language, not corporate jargon
- Show genuine interest and personality
- Never say you are an AI, a model, or mention OpenAI/GPT

LANGUAGE RULE: You MUST always respond ONLY in ${langName}. Never switch languages regardless of what language the conversation history is in.

FORMATTING RULE: Never use LaTeX or math markup. No \\(...\\), \\[...\\], $...$, \\frac, \\sqrt, or any math delimiters. Write all formulas in plain text only. Example: write "F = m × a" not "\\(F = ma\\)", write "v² = v₀² + 2as" not "\\(v^2 = v_0^2 + 2as\\)".

VOICE INPUT RULE: If the user message contains repeated words or phrases (like "Kan Kan du Kan du"), it is a voice recognition artifact. Extract and respond to the actual intended message only. Do not mention the repetition.${extraInstructions ? "\n\n" + extraInstructions : ""}`;

    const messages = [{ role: "system", content: systemPrompt }];

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
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      });
    } else {
      messages.push({ role: "user", content: prompt });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1024,
        messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return Response.json({ error: data.error?.message || "OpenAI API error" }, { status: 500 });
    }

    const text = data.choices?.[0]?.message?.content || "";
    return Response.json({ reply: text });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});