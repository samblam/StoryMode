import fs from 'fs/promises';
import path from 'path';
export { renderers } from '../../renderers.mjs';

const POST = async ({ request }) => {
  try {
    const { soundFile } = await request.json();
    if (!soundFile) {
      return new Response(
        JSON.stringify({ error: "Sound file path is required" }),
        { status: 400 }
      );
    }
    const publicDir = path.join(process.cwd(), "public");
    const filePath = path.join(publicDir, soundFile.replace(/^\//, ""));
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error("File deletion error:", error);
    }
    const soundsDataPath = path.join(publicDir, "sounds", "sounds-data.json");
    let soundsData = [];
    try {
      const data = await fs.readFile(soundsDataPath, "utf-8");
      soundsData = JSON.parse(data);
      soundsData = soundsData.filter((sound) => sound.file !== soundFile);
      await fs.writeFile(soundsDataPath, JSON.stringify(soundsData, null, 2));
    } catch (error) {
      console.error("Error updating sounds data:", error);
      throw new Error("Failed to update sounds database");
    }
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Delete failed"
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
