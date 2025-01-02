/* empty css                                 */
import { c as createComponent, r as renderTemplate, m as maybeRenderHead, a as addAttribute, g as createAstro, d as renderComponent } from '../chunks/astro/server_COeGrUW_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_gjCW3zoU.mjs';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$BlogPost = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$BlogPost;
  const { title, date, excerpt, slug } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<article class="mb-12"> <h2 class="text-3xl font-editorial mb-2"> <a${addAttribute(`/blog/${slug}`, "href")} class="hover:text-blue-600">${title}</a> </h2> <p class="text-gray-600 mb-4">${date}</p> <p class="text-lg">${excerpt}</p> <a${addAttribute(`/blog/${slug}`, "href")} class="text-blue-600 hover:underline mt-4 inline-block">Read more →</a> </article>`;
}, "C:/Users/samue/repos/StoryMode/src/components/BlogPost.astro", void 0);

const $$Blog = createComponent(($$result, $$props, $$slots) => {
  const posts = [
    {
      title: "The Art of UI Sound Design",
      date: "February 15, 2024",
      excerpt: "How tiny sounds make a huge difference in user experience...",
      slug: "ui-sound-design"
    },
    {
      title: "Creating Sonic Identities",
      date: "February 1, 2024",
      excerpt: "What makes a brand sound as unique as it looks?",
      slug: "sonic-identities"
    },
    {
      title: "The Psychology of Sound",
      date: "January 15, 2024",
      excerpt: "Understanding how sound affects human behavior and emotion...",
      slug: "sound-psychology"
    }
  ];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Blog | Story Mode" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-white"> <div class="max-w-6xl mx-auto px-4 py-12"> <h1 class="text-6xl font-editorial mb-12">Blog</h1> <div class="max-w-4xl"> ${posts.map((post) => renderTemplate`${renderComponent($$result2, "BlogPost", $$BlogPost, { ...post })}`)} </div> </div> </main> ` })}`;
}, "C:/Users/samue/repos/StoryMode/src/pages/blog.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/blog.astro";
const $$url = "/blog";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Blog,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
