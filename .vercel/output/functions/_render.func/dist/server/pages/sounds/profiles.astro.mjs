/* empty css                                    */
import { c as createComponent, r as renderTemplate, f as renderScript } from '../../chunks/astro/server_CkexDsn7.mjs';
import 'kleur/colors';
import 'clsx';
export { renderers } from '../../renderers.mjs';

const prerender = false;
const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`<meta http-equiv="refresh" content="0;url=/sounds?tab=profiles">${renderScript($$result, "C:/Users/samue/repos/StoryMode/src/pages/sounds/profiles/index.astro?astro&type=script&index=0&lang.ts")}`;
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
