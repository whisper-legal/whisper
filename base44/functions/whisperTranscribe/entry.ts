import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { audio_base64, language } = body;

    if (!audio_base64) {
      return Response.json({ error: 'No audio provided' }, { status: 400 });
    }

    // Decode base64 → binary
    const binaryString = atob(audio_base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Build multipart form for OpenAI Whisper
    const audioBlob = new Blob([bytes], { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');

    // Whisper wants ISO-639-1 (2-letter) — extract from "bs-BA" → "bs"
    if (language) {
      const langCode = language.split('-')[0].toLowerCase();
      formData.append('language', langCode);
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json({ error: `Whisper API error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    return Response.json({ text: data.text || '' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});