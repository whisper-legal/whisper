import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { fileBase64, fileName, mimeType } = await req.json();

    if (!fileBase64) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // For plain text files, decode directly
    if (mimeType === 'text/plain') {
      const text = atob(fileBase64);
      return Response.json({ text });
    }

    // Convert base64 to Uint8Array blob, then upload as a File
    const binaryStr = atob(fileBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const file = new File([blob], fileName || 'document', { type: mimeType });

    // Upload file first
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({ file });

    // Extract text using the uploaded URL
    const result = await base44.asServiceRole.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          text: { type: "string", description: "All text content extracted from the document" }
        }
      }
    });

    if (result.status === "success") {
      const text = result.output?.text || (typeof result.output === 'string' ? result.output : JSON.stringify(result.output));
      return Response.json({ text });
    }

    return Response.json({ error: result.details || 'Extraction failed' }, { status: 500 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});