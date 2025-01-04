/* empty css                                 */
import { c as createComponent, r as renderTemplate, d as renderComponent, f as renderScript, m as maybeRenderHead } from '../chunks/astro/server_COeGrUW_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_Y_cjXtYi.mjs';
export { renderers } from '../renderers.mjs';

const $$Error = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Oops! | Story Mode" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-white"> <div class="max-w-6xl mx-auto px-4 py-24 text-center"> <h1 class="text-6xl font-editorial mb-8">Uh oh...</h1> <p class="text-2xl mb-12">
Looks like something went a little haywire.<br>
It's like when you try to make toast and the smoke alarm goes off, but worse.
</p> <button id="reload-page" class="bg-blue-400 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-500 transition-colors inline-block">
Try to Reload
</button> <div class="mt-8 text-gray-600"> <p>If the problem persists, please contact us.</p> </div> </div> </main> ` })} ${renderScript($$result, "C:/Users/samue/repos/StoryMode/src/pages/error.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/samue/repos/StoryMode/src/pages/error.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/error.astro";
const $$url = "/error";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Error,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
