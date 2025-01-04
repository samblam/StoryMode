/* empty css                                 */
import { c as createComponent, r as renderTemplate, d as renderComponent, m as maybeRenderHead } from '../chunks/astro/server_COeGrUW_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_gjCW3zoU.mjs';
export { renderers } from '../renderers.mjs';

const $$About = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "About | Story Mode" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-white"> <div class="max-w-6xl mx-auto px-4 py-12"> <h1 class="text-6xl font-editorial mb-12">About Us</h1> <div class="grid grid-cols-1 md:grid-cols-2 gap-12"> <div> <p class="text-2xl mb-6">
We're a bunch of audio nerds who absolutely love what we do. Our mission? Making the digital world sound as amazing as it looks.
</p> <p class="text-xl mb-6">
Founded in Montreal, we've been crafting sonic experiences that make people smile, think, and feel something special.
</p> <p class="text-xl">
Whether it's a tiny notification sound or a full-blown audio identity, we pour our hearts (and ears) into every project.
</p> </div> <div class="space-y-8"> <h2 class="text-4xl font-editorial">Our Process</h2> <ul class="space-y-4 text-xl"> <li>1. We listen (obviously)</li> <li>2. We experiment (a lot)</li> <li>3. We iterate (until it's perfect)</li> <li>4. We deliver (on time)</li> <li>5. We celebrate (with coffee)</li> </ul> </div> </div> </div> </main> ` })}`;
}, "C:/Users/samue/repos/StoryMode/src/pages/about.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/about.astro";
const $$url = "/about";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$About,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };