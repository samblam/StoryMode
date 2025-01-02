/* empty css                                          */
import { c as createComponent, r as renderTemplate, d as renderComponent, g as createAstro, m as maybeRenderHead } from '../../../../chunks/astro/server_CkexDsn7.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../../../chunks/Layout_Bk1nqY6S.mjs';
import { $ as $$ProfileForm } from '../../../../chunks/ProfileForm_CiLKqjrz.mjs';
import { g as getSoundProfiles } from '../../../../chunks/profileUtils_BmAPKBfM.mjs';
export { renderers } from '../../../../renderers.mjs';

const $$Astro = createAstro();
const $$Edit = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Edit;
  const { id } = Astro2.params;
  const profiles = await getSoundProfiles();
  const profile = profiles.find((p) => p.id === id);
  if (!profile) {
    return Astro2.redirect("/sounds");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Edit Sound Profile | Story Mode" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gray-100 py-12"> <div class="max-w-3xl mx-auto px-4"> <h1 class="text-6xl font-editorial mb-12">Edit Sound Profile</h1> ${renderComponent($$result2, "ProfileForm", $$ProfileForm, { "mode": "edit", "profile": profile })} </div> </main> ` })}`;
}, "C:/Users/samue/repos/StoryMode/src/pages/sounds/profiles/[id]/edit.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/sounds/profiles/[id]/edit.astro";
const $$url = "/sounds/profiles/[id]/edit";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Edit,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
