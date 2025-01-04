import { getClient } from '../../../chunks/supabase_C0n-HHBb.mjs';
import { put } from '@vercel/blob';
import { a as validateFile, v as validateBody, s as sanitizeInput, n as normalizeFileName } from '../../../chunks/validationMiddleware_-_YZoV9A.mjs';
export { renderers } from '../../../renderers.mjs';

const POST = async ({ request, locals }) => {
  const supabaseClient = getClient();
  const authUser = locals?.auth?.user;
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const formData = await request.formData();
    const file = formData.get("sound");
    const fileError = validateFile(file);
    if (fileError) {
      return new Response(
        JSON.stringify({ success: false, error: fileError }),
        { status: 400 }
      );
    }
    const validation = await validateBody({
      name: "name",
      description: "description"
    })(request);
    if (validation instanceof Response) {
      return validation;
    }
    const { body } = validation;
    const name = sanitizeInput(body.name);
    const description = sanitizeInput(body.description);
    const normalizedFileName = normalizeFileName(file.name);
    const userId = authUser.id;
    const filePath = `sounds/${userId}/${normalizedFileName}`;
    const { data, error } = await supabaseClient.from("sounds").insert([{
      name,
      description,
      file_path: filePath,
      user_id: userId
    }]);
    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(JSON.stringify({ success: false, error: "Failed to save sound metadata." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const blobResult = await put(filePath, file, {
      access: "public"
    });
    return new Response(JSON.stringify({
      success: true,
      blobUrl: blobResult.url,
      supabaseData: data
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to upload sound." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
