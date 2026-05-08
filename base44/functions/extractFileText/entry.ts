import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { fileBase64, fileName, mimeType } = await req.json();

    if (!fileBase64) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // For plain text files, decode directly
    if (mimeType === 'text/plain') {
      const text = atob(fileBase64);
      return Response.json({ text });
    }

    // For PDF/DOCX, use InvokeLLM via service role with the data URL
    const dataUrl = `data:${mimeType};base64,${fileBase64}`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: "Extract all text content from this document. Return ONLY the raw text content, no formatting or explanations.",
      file_urls: [dataUrl],
    });

    return Response.json({ text: typeof res === 'string' ? res.trim() : '' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});