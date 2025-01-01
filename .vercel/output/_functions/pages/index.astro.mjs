/* empty css                                 */
import { c as createComponent, r as renderTemplate, d as renderComponent, f as renderScript, m as maybeRenderHead } from '../chunks/astro/server_CkexDsn7.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_Bk1nqY6S.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Story Mode | UX Sound Design" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-white"> <div class="max-w-6xl mx-auto px-4 py-24"> <div class="mb-24"> <h1 class="text-6xl font-editorial mb-8">
Story Mode is a <em class="italic">(very)</em> fun<br>
UX sound design studio in<br>
Montreal, Quebec.<br><br>
We specialize in making interactive audio unforgettable.
</h1> </div> <div class="grid grid-cols-1 md:grid-cols-2 gap-12"> <div> <h2 class="text-4xl font-editorial mb-8">We're extremely good at:</h2> <ul class="text-2xl space-y-4"> <li>- audio logos</li> <li>- UX sound design</li> <li>- experiential audio</li> <li>- original music composition</li> <li>- sonic identity discovery</li> <li>- singing in the shower</li> </ul> </div> <div class="flex items-center justify-center"> <img src="/logo.svg" alt="Story Mode Logo" class="w-48 h-48"> </div> </div> <div class="mt-24 text-center"> <h2 class="text-4xl font-editorial mb-8">
don't be shy... <a href="/contact" class="underline hover:text-blue-600">say hi :)</a> </h2> <button id="test-db" class="bg-green-400 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-500 transition-colors">
Test DB Connection
</button> <p id="db-status" class="mt-4 text-lg hidden"></p> </div> </div> </main> ` })} ${renderScript($$result, "C:/Users/samue/repos/StoryMode/src/pages/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/samue/repos/StoryMode/src/pages/index.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
