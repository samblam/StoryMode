import { c as createComponent, r as renderTemplate, m as maybeRenderHead, a as addAttribute, b as createAstro } from './astro/server_Dmwxy-zN.mjs';
import 'kleur/colors';
import 'html-escaper';
import 'clsx';
import { supabaseAdmin } from './supabase_BytQILit.mjs';

const $$Astro = createAstro();
const $$ProfileForm = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ProfileForm;
  const { profile, mode } = Astro2.props;
  const user = Astro2.locals.user;
  const isAdmin = user?.role === "admin";
  console.log("ProfileForm Debug:", {
    isAdmin,
    user,
    profileData: profile
  });
  let clients = [];
  if (isAdmin) {
    const { data, error } = await supabaseAdmin.from("clients").select("id, name, company, email, active, created_at").eq("active", true).order("name");
    if (error) {
      console.error("Error fetching clients:", error);
    } else {
      clients = data.map((client) => ({
        id: client.id,
        name: client.name,
        company: client.company,
        email: client.email,
        active: client.active,
        created_at: client.created_at
      }));
      console.log("Fetched clients:", clients);
    }
  }
  return renderTemplate`${maybeRenderHead()}<form id="profile-form" class="space-y-6 bg-white rounded-lg shadow-lg p-8"> <input type="hidden" name="id"${addAttribute(profile?.id || "", "value")}> ${isAdmin && renderTemplate`<div> <label for="clientId" class="block text-lg mb-2">Client</label> <select id="clientId" name="clientId" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"> <option value="">-- Select a client (optional) --</option> ${clients.map((client) => renderTemplate`<option${addAttribute(client.id, "value")}${addAttribute(profile?.clientId === client.id, "selected")}> ${client.name} ${client.company ? `(${client.company})` : ""} </option>`)} </select> <p class="text-sm text-gray-600 mt-1">Associate this profile with a specific client</p> </div>`} <div> <label for="title" class="block text-lg mb-2">Profile Title</label> <input type="text" id="title" name="title"${addAttribute(profile?.title || "", "value")} required minlength="2" maxlength="50" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="e.g., Professional & Clean"> <p class="text-sm text-gray-600 mt-1">2-50 characters</p> </div> <div> <label for="description" class="block text-lg mb-2">Description</label> <textarea id="description" name="description" required minlength="10" maxlength="200" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 h-32" placeholder="Brief description of this sound profile">${profile?.description || ""}</textarea> <p class="text-sm text-gray-600 mt-1">10-200 characters</p> </div> <div class="flex space-x-4"> <button type="submit" class="bg-green-400 text-white px-8 py-3 rounded-lg text-lg hover:bg-green-500 transition-colors"> ${mode === "create" ? "Create Profile" : "Update Profile"} </button> <a href="/sounds" class="bg-gray-400 text-white px-8 py-3 rounded-lg text-lg hover:bg-gray-500 transition-colors inline-flex items-center">
Cancel
</a> </div> <div id="form-status" class="hidden"> <p class="error hidden text-red-600 bg-red-50 p-3 rounded-lg"></p> </div> </form> `;
}, "C:/Users/samue/repos/StoryMode/src/components/ProfileForm.astro", void 0);

export { $$ProfileForm as $ };
