/* empty css                                 */
import { c as createComponent, r as renderTemplate, d as renderComponent, m as maybeRenderHead } from '../chunks/astro/server_COeGrUW_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_gjCW3zoU.mjs';
import { $ as $$ProfileCard } from '../chunks/ProfileCard_DekPeNQx.mjs';
import { g as getSoundProfiles } from '../chunks/profileUtils_BmAPKBfM.mjs';
import { supabase } from '../chunks/supabase_D4M8dM3h.mjs';
export { renderers } from '../renderers.mjs';

async function getSounds() {
  const { data, error } = await supabase.from("sounds").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching sounds:", error);
    throw error;
  }
  return data?.map((sound) => ({
    id: sound.id,
    name: sound.name,
    description: sound.description,
    file: sound.file_path,
    profileId: sound.profile_id
  })) || [];
}

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const profiles = await getSoundProfiles();
  const sounds = await getSounds();
  const profilesWithSounds = profiles.map((profile) => ({
    ...profile,
    sounds: sounds.filter(
      (sound) => sound.profile?.toLowerCase() === profile.slug.toLowerCase()
    )
  }));
  const isAdmin = true;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Sound Library | Story Mode" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gray-100 py-12"> <div class="max-w-6xl mx-auto px-4"> <div class="flex justify-between items-center mb-12"> <h1 class="text-6xl font-editorial">Sound Library</h1> ${renderTemplate`<a href="/sounds/profiles/new" class="bg-green-400 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-500 transition-colors">
New Profile
</a>`} </div> <div class="space-y-8"> ${profilesWithSounds.map((profile) => renderTemplate`${renderComponent($$result2, "ProfileCard", $$ProfileCard, { "profile": profile, "isAdmin": isAdmin })}`)} </div> </div> </main> ` })}`;
}, "C:/Users/samue/repos/StoryMode/src/pages/sounds/index.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/sounds/index.astro";
const $$url = "/sounds";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
