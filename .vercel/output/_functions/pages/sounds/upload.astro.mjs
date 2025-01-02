/* empty css                                    */
import { c as createComponent, r as renderTemplate, m as maybeRenderHead, a as addAttribute, f as renderScript, d as renderComponent, g as createAstro } from '../../chunks/astro/server_COeGrUW_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_gjCW3zoU.mjs';
import 'clsx';
import { g as getSoundProfiles } from '../../chunks/profileUtils_BDqZCIHa.mjs';
export { renderers } from '../../renderers.mjs';

const $$SoundUploader = createComponent(async ($$result, $$props, $$slots) => {
  const profiles = await getSoundProfiles();
  return renderTemplate`${maybeRenderHead()}<div class="bg-white rounded-lg shadow-lg p-6 mb-8"> <h3 class="text-2xl font-editorial mb-4">Upload New Sound</h3> <form id="upload-form" class="space-y-4"> <div> <label for="profileId" class="block text-lg mb-2">Sound Profile</label> <select id="profileId" name="profileId" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"> <option value="">Select a profile</option> ${profiles.map((profile) => renderTemplate`<option${addAttribute(profile.id, "value")}${addAttribute(profile.slug, "data-slug")}> ${profile.title} </option>`)} </select> <p class="text-sm text-gray-600 mt-1">Choose which profile this sound belongs to</p> </div> <div> <label for="name" class="block text-lg mb-2">Sound Name</label> <input type="text" id="name" name="name" required minlength="2" maxlength="50" pattern="[A-Za-z0-9\s\-]+" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="e.g., Bubble Pop"> <p class="text-sm text-gray-600 mt-1">2-50 characters, letters, numbers, spaces, and hyphens only</p> </div> <div> <label for="description" class="block text-lg mb-2">Description</label> <textarea id="description" name="description" required minlength="10" maxlength="200" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Brief description of the sound"></textarea> <p class="text-sm text-gray-600 mt-1">10-200 characters</p> </div> <div> <label for="sound" class="block text-lg mb-2">Sound File</label> <input type="file" id="sound" name="sound" accept="audio/mpeg,audio/wav,audio/ogg" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"> <p class="text-sm text-gray-600 mt-1">MP3, WAV, or OGG format only, max 50MB</p> </div> <div class="flex space-x-4"> <button type="submit" class="bg-green-400 text-white px-8 py-3 rounded-lg text-lg hover:bg-green-500 transition-colors">
Upload Sound
</button> <a href="/sounds" class="bg-gray-400 text-white px-8 py-3 rounded-lg text-lg hover:bg-gray-500 transition-colors">
Cancel
</a> </div> </form> <div id="upload-progress" class="mt-4 hidden"> <div class="w-full bg-gray-200 rounded-full h-2.5"> <div class="bg-green-400 h-2.5 rounded-full" style="width: 0%"></div> </div> <p class="text-sm text-gray-600 mt-1">Uploading: <span>0%</span></p> </div> </div> ${renderScript($$result, "C:/Users/samue/repos/StoryMode/src/components/SoundUploader.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/samue/repos/StoryMode/src/components/SoundUploader.astro", void 0);

const $$Astro = createAstro();
const $$Upload = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Upload;
  const user = Astro2.locals.user;
  if (!user || user.role !== "admin") {
    return Astro2.redirect("/login");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Upload Sound | Story Mode" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gray-100 py-12"> <div class="max-w-3xl mx-auto px-4"> <h1 class="text-6xl font-editorial mb-12">Upload New Sound</h1> ${renderComponent($$result2, "SoundUploader", $$SoundUploader, {})} </div> </main> ` })}`;
}, "C:/Users/samue/repos/StoryMode/src/pages/sounds/upload.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/sounds/upload.astro";
const $$url = "/sounds/upload";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Upload,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
