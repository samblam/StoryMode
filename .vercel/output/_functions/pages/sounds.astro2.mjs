/* empty css                                 */
import { c as createComponent, r as renderTemplate, m as maybeRenderHead, a as addAttribute, d as renderComponent, f as renderScript, g as createAstro } from '../chunks/astro/server_CkexDsn7.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_Bk1nqY6S.mjs';
import { a as $$SoundList, $ as $$ProfileCard } from '../chunks/ProfileCard_BYgvrZHK.mjs';
import { supabaseAdmin } from '../chunks/supabase_D4M8dM3h.mjs';
/* empty css                                  */
export { renderers } from '../renderers.mjs';

const $$Astro$1 = createAstro();
const $$SoundProfile = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$SoundProfile;
  const { title, description, sounds, profileId, isAdmin } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="bg-white rounded-lg shadow-lg p-6 mb-8"> <div class="flex justify-between items-start mb-6"> <div> <h3 class="text-2xl font-editorial mb-2">${title}</h3> <p class="text-gray-600">${description}</p> </div> <div class="flex space-x-2"> <button class="download-all-button bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"${addAttribute(title, "data-profile-name")}${addAttribute(JSON.stringify(sounds), "data-sounds")}>
Download All Sounds
</button> ${isAdmin && renderTemplate`<button class="delete-profile bg-red-400 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"${addAttribute(profileId, "data-profile-id")}${addAttribute(sounds.length, "data-sound-count")}>
Delete Profile
</button>`} </div> </div> ${sounds.length > 0 ? renderTemplate`${renderComponent($$result, "SoundList", $$SoundList, { "sounds": sounds, "profileId": profileId, "isAdmin": isAdmin })}` : renderTemplate`<p class="text-gray-600 italic">No sounds added to this profile yet.</p>`} </div> ${renderScript($$result, "C:/Users/samue/repos/StoryMode/src/components/SoundProfile.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/samue/repos/StoryMode/src/components/SoundProfile.astro", void 0);

async function getAccessibleSoundProfiles(user) {
  if (!user) {
    return [];
  }
  try {
    let query = supabaseAdmin.from("sound_profiles").select(`
        *,
        client:clients(*),
        sounds(*)
      `).order("created_at", { ascending: false });
    if (user.role === "client" && user.clientId) {
      query = query.eq("client_id", user.clientId);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching sound profiles:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching sound profiles:", error);
    return [];
  }
}
function organizeProfilesByClient(profiles) {
  return profiles.reduce((acc, profile) => {
    const clientName = profile.client?.name || "No Client";
    if (!acc[clientName]) {
      acc[clientName] = [];
    }
    acc[clientName].push(profile);
    return acc;
  }, {});
}

const $$Astro = createAstro();
const $$Sounds = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Sounds;
  const user = Astro2.locals.user;
  if (!user) {
    return Astro2.redirect("/login");
  }
  const isAdmin = user?.role === "admin";
  const success = Astro2.url.searchParams.get("success");
  const error = Astro2.url.searchParams.get("error");
  Astro2.url.searchParams.get("tab") || "library";
  const selectedClientId = Astro2.url.searchParams.get("client") || "all";
  let clients = [];
  if (isAdmin) {
    const { data: clientsData } = await supabaseAdmin.from("clients").select("id, name, company").eq("active", true).order("name");
    clients = clientsData || [];
  }
  const profiles = await getAccessibleSoundProfiles(user);
  const filteredProfiles = selectedClientId === "all" ? profiles : profiles.filter((p) => p.client_id === selectedClientId);
  const profilesByClient = organizeProfilesByClient(filteredProfiles);
  console.log("Sounds page - profiles:", profiles);
  console.log("Sounds page - filteredProfiles:", filteredProfiles);
  console.log("Sounds page - profilesByClient:", profilesByClient);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Sound Library | Story Mode", "data-astro-cid-ztl5yhde": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gray-100 py-12" data-astro-cid-ztl5yhde> <div class="max-w-6xl mx-auto px-4" data-astro-cid-ztl5yhde> <!-- Header --> <div class="flex flex-col space-y-4 mb-8" data-astro-cid-ztl5yhde> <div class="flex justify-between items-center" data-astro-cid-ztl5yhde> <h1 class="text-6xl font-editorial" data-astro-cid-ztl5yhde>Sound Library</h1> ${isAdmin && renderTemplate`<div class="flex space-x-4" data-astro-cid-ztl5yhde> <a href="/sounds/upload" class="bg-blue-400 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-500 transition-colors" data-astro-cid-ztl5yhde>
Upload Sound
</a> <a href="/sounds/profiles/new" class="bg-green-400 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-500 transition-colors" data-astro-cid-ztl5yhde>
New Profile
</a> </div>`} </div> ${isAdmin && renderTemplate`<div class="flex items-center space-x-4" data-astro-cid-ztl5yhde> <label for="clientFilter" class="text-lg font-medium" data-astro-cid-ztl5yhde>Filter by Client:</label> <select id="clientFilter" class="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" data-astro-cid-ztl5yhde> <option value="all" data-astro-cid-ztl5yhde>All Clients</option> ${clients.map((client) => renderTemplate`<option${addAttribute(client.id, "value")}${addAttribute(selectedClientId === client.id, "selected")} data-astro-cid-ztl5yhde> ${client.name} ${client.company ? `(${client.company})` : ""} </option>`)} </select> </div>`} </div> <!-- Status Messages --> ${success && renderTemplate`<div class="mb-8 p-4 bg-green-50 text-green-600 rounded-lg" id="success-message" data-astro-cid-ztl5yhde> ${decodeURIComponent(success)} </div>`} ${error && renderTemplate`<div class="mb-8 p-4 bg-red-50 text-red-600 rounded-lg" id="error-message" data-astro-cid-ztl5yhde> ${decodeURIComponent(error)} </div>`} <!-- Tab Navigation --> <div class="flex space-x-4 mb-8 border-b border-gray-200" data-astro-cid-ztl5yhde> <button class="tab-button px-6 py-3 text-lg font-medium rounded-t-lg focus:outline-none" data-tab="library" data-astro-cid-ztl5yhde>
Sound Library
</button> <button class="tab-button px-6 py-3 text-lg font-medium rounded-t-lg focus:outline-none" data-tab="profiles" data-astro-cid-ztl5yhde>
Sound Profiles
</button> </div> <!-- Tab Content --> <div class="tab-content" data-content="library" data-astro-cid-ztl5yhde> <div class="space-y-12" id="library-content" data-astro-cid-ztl5yhde> ${Object.entries(profilesByClient).map(([clientName, clientProfiles]) => renderTemplate`<div class="space-y-8" data-astro-cid-ztl5yhde> <h2 class="text-3xl font-editorial text-gray-700" data-astro-cid-ztl5yhde>${clientName}</h2> ${clientProfiles.map((profile) => renderTemplate`${renderComponent($$result2, "SoundProfile", $$SoundProfile, { "title": profile.title, "description": profile.description, "sounds": profile.sounds.map((sound) => ({
    id: sound.id,
    name: sound.name,
    description: sound.description,
    file: sound.file_path,
    profileId: sound.profile_id
  })), "profileId": profile.id, "isAdmin": isAdmin, "data-astro-cid-ztl5yhde": true })}`)} </div>`)} </div> </div> <div class="tab-content hidden" data-content="profiles" data-astro-cid-ztl5yhde> <div class="space-y-12" id="profiles-content" data-astro-cid-ztl5yhde> ${Object.entries(profilesByClient).map(([clientName, clientProfiles]) => renderTemplate`<div class="space-y-8" data-astro-cid-ztl5yhde> <h2 class="text-3xl font-editorial text-gray-700" data-astro-cid-ztl5yhde>${clientName}</h2> ${clientProfiles.map((profile) => renderTemplate`${renderComponent($$result2, "ProfileCard", $$ProfileCard, { "profile": {
    id: profile.id,
    title: profile.title,
    description: profile.description,
    slug: profile.slug,
    sounds: profile.sounds.map((sound) => ({
      id: sound.id,
      name: sound.name,
      description: sound.description,
      file: sound.file_path,
      profileId: sound.profile_id
    }))
  }, "isAdmin": isAdmin, "data-astro-cid-ztl5yhde": true })}`)} </div>`)} </div> </div> </div> </main> ` })}  ${renderScript($$result, "C:/Users/samue/repos/StoryMode/src/pages/sounds.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/samue/repos/StoryMode/src/pages/sounds.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/sounds.astro";
const $$url = "/sounds";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Sounds,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
