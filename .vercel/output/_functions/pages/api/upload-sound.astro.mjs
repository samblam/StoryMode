import { createClient } from '@supabase/supabase-js';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("sound");
    const profile = formData.get("profile");
    const name = formData.get("name");
    const description = formData.get("description");
    if (!file || !profile || !name || !description) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }
    const allowedTypes = ["audio/mpeg", "audio/wav", "audio/ogg"];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: "Invalid file type. Please upload MP3, WAV, or OGG files only." }),
        { status: 400 }
      );
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: "File size exceeds 5MB limit." }),
        { status: 400 }
      );
    }
    const supabase = createClient(
      "https://iubzudsaueifxrwrqfjw.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1Ynp1ZHNhdWVpZnhyd3JxZmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3Njc2NzQsImV4cCI6MjA0OTM0MzY3NH0.SNXX_0_NMSJqOKSMMxM5WP6sfR3zokgCgdJkH4s-xfg"
    );
    const extension = file.type.split("/")[1];
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const filePath = `${profile}/${safeName}.${extension}`;
    const { data: uploadData, error: uploadError } = await supabase.storage.from("sounds").upload(filePath, file);
    if (uploadError) {
      return new Response(
        JSON.stringify({ error: uploadError.message }),
        { status: 500 }
      );
    }
    const { data: urlData } = supabase.storage.from("sounds").getPublicUrl(filePath);
    const { error: dbError } = await supabase.from("sounds").insert({
      profile,
      name,
      description,
      file_path: filePath,
      url: urlData.publicUrl
    });
    if (dbError) {
      return new Response(
        JSON.stringify({ error: dbError.message }),
        { status: 500 }
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        url: urlData.publicUrl
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Upload failed"
      }),
      { status: 500 }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
