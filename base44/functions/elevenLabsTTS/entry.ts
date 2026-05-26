import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, langCode } = await req.json();
    if (!text || !text.trim()) {
      return Response.json({ error: 'No text provided' }, { status: 400 });
    }

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return Response.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    // Map language code to ElevenLabs language code (ISO 639-1)
    const lang2 = (langCode || "en-US").split("-")[0].toLowerCase();

    // Use a multilingual voice — "Rachel" (21m00Tcm4TlvDq8ikWAM) supports many languages
    const voiceId = "21m00Tcm4TlvDq8ikWAM";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text: text.slice(0, 2500),
          model_id: "eleven_turbo_v2_5",
          language_code: lang2,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: `ElevenLabs error: ${err}` }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    return Response.json({ audio: base64Audio });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});