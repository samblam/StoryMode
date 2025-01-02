/* empty css                                    */
import { c as createComponent, r as renderTemplate } from '../../chunks/astro/server_Dmwxy-zN.mjs';
import 'kleur/colors';
import 'html-escaper';
import 'clsx';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<meta http-equiv="refresh" content="0;url=/sounds?tab=profiles">`;
}, "C:/Users/samue/repos/StoryMode/src/pages/sounds/profiles/index.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/sounds/profiles/index.astro";
const $$url = "/sounds/profiles";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
