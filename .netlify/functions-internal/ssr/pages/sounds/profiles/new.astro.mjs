/* empty css                                       */
import { c as createComponent, r as renderTemplate, d as renderComponent, b as createAstro, m as maybeRenderHead } from '../../../chunks/astro/server_Dmwxy-zN.mjs';
import 'kleur/colors';
import 'html-escaper';
import { $ as $$Layout } from '../../../chunks/Layout_B9cyLK92.mjs';
import { $ as $$ProfileForm } from '../../../chunks/ProfileForm_CxDbWJVQ.mjs';
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro();
const $$New = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$New;
  const user = Astro2.locals.user;
  if (!user || user.role !== "admin") {
    return Astro2.redirect("/login");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "New Sound Profile | Story Mode" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gray-100 py-12"> <div class="max-w-3xl mx-auto px-4"> <h1 class="text-6xl font-editorial mb-12">New Sound Profile</h1> ${renderComponent($$result2, "ProfileForm", $$ProfileForm, { "mode": "create" })} </div> </main> ` })}`;
}, "C:/Users/samue/repos/StoryMode/src/pages/sounds/profiles/new.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/sounds/profiles/new.astro";
const $$url = "/sounds/profiles/new";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$New,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
