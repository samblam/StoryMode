import { c as createComponent, r as renderTemplate, a as addAttribute, f as renderHead, d as renderComponent, g as renderSlot, b as createAstro, F as Fragment } from './astro/server_Dmwxy-zN.mjs';
import 'kleur/colors';
import 'html-escaper';
/* empty css                         */

const $$Astro = createAstro();
const $$Layout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title } = Astro2.props;
  const user = Astro2.locals.user;
  const isAdmin = user?.role === "admin";
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title}</title><meta name="description" content="Story Mode is a cutting edge audio branding and UX sound design studio in Montreal, Canada."><link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700&display=swap" rel="stylesheet">${renderHead()}</head> <body> <header class="fixed w-full top-0 z-50 bg-green-400 text-white"> <nav class="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center"> <a href="/" class="text-3xl font-editorial">Story Mode</a> <div class="space-x-8"> <a href="/works" class="hover:underline">Works</a> <a href="/about" class="hover:underline">About</a> <a href="/blog" class="hover:underline">Blog</a> <a href="/contact" class="hover:underline">Contact</a> ${user ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <a href="/sounds" class="hover:underline">Sounds</a> ${isAdmin && renderTemplate`<a href="/create-user" class="hover:underline">Create User</a>`}<button id="logout-button" class="hover:underline text-white bg-transparent border-none cursor-pointer font-inherit" type="button">
Logout (${user.email})
</button> ` })}` : renderTemplate`<a href="/login" class="hover:underline">Login</a>`} </div> </nav> </header> <div class="h-20"></div> ${renderSlot($$result, $$slots["default"])} <footer class="bg-indigo-500 text-white py-4"> <div class="max-w-6xl mx-auto px-4 text-center"> <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} Story Mode</p> </div> </footer>  </body> </html>`;
}, "C:/Users/samue/repos/StoryMode/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
