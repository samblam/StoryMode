/* empty css                                 */
import { c as createComponent, r as renderTemplate, m as maybeRenderHead, a as addAttribute, g as createAstro, d as renderComponent } from '../chunks/astro/server_COeGrUW_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_Y_cjXtYi.mjs';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$WorkCard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$WorkCard;
  const { title, client, description, imageUrl } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="bg-white rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105"> <img${addAttribute(imageUrl, "src")}${addAttribute(title, "alt")} class="w-full h-64 object-cover"> <div class="p-6"> <h3 class="text-2xl font-editorial mb-2">${title}</h3> <p class="text-lg text-gray-600 mb-2">${client}</p> <p class="text-gray-700">${description}</p> </div> </div>`;
}, "C:/Users/samue/repos/StoryMode/src/components/WorkCard.astro", void 0);

const $$Works = createComponent(($$result, $$props, $$slots) => {
  const works = [
    {
      title: "Sonic Brand Identity",
      client: "TechCorp Inc.",
      description: "Created a comprehensive audio branding package including logo sound, UI sounds, and ambient music.",
      imageUrl: "/works/techcorp.jpg"
    },
    {
      title: "Game Audio Design",
      client: "GameStudio XYZ",
      description: "Developed immersive sound effects and adaptive music system for their latest mobile game.",
      imageUrl: "/works/gamestudio.jpg"
    },
    {
      title: "Interactive Installation",
      client: "Modern Art Museum",
      description: "Sound design for an interactive art installation responding to visitor movements.",
      imageUrl: "/works/museum.jpg"
    }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Works | Story Mode" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-white"> <div class="max-w-6xl mx-auto px-4 py-12"> <h1 class="text-6xl font-editorial mb-12">Our Works</h1> <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"> ${works.map((work) => renderTemplate`${renderComponent($$result2, "WorkCard", $$WorkCard, { ...work })}`)} </div> </div> </main> ` })}`;
}, "C:/Users/samue/repos/StoryMode/src/pages/works.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/works.astro";
const $$url = "/works";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Works,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
