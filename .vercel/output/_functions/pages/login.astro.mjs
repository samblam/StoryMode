/* empty css                                 */
import { c as createComponent, r as renderTemplate, m as maybeRenderHead, f as renderScript, d as renderComponent, g as createAstro } from '../chunks/astro/server_COeGrUW_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_Y_cjXtYi.mjs';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$LoginForm = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<form id="login-form" class="w-full max-w-md mx-auto space-y-6"> <div class="text-center"> <h2 class="text-3xl font-editorial">Welcome Back</h2> <p class="text-gray-600 mt-2">Please sign in to continue</p> </div> <div> <label for="email" class="block text-lg mb-2">Email</label> <input type="email" id="email" name="email" data-rule="email" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400" placeholder="you@example.com" autocomplete="email"> </div> <div> <label for="password" class="block text-lg mb-2">Password</label> <input type="password" id="password" name="password" data-rule="password" required minlength="8" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400" placeholder="••••••••" autocomplete="current-password"> </div> <div id="form-status" class="hidden"> <p class="error hidden text-red-600 bg-red-50 p-3 rounded-lg"></p> </div> <div> <button type="submit" class="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75">
Sign In
</button> </div> <div class="text-sm text-gray-600 text-center"> <a href="/reset-password" class="hover:underline">Forgot your password?</a> </div> </form> ${renderScript($$result, "C:/Users/samue/repos/StoryMode/src/components/LoginForm.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/samue/repos/StoryMode/src/components/LoginForm.astro", void 0);

const $$Astro = createAstro();
const $$Login = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Login;
  const user = Astro2.locals.user;
  if (user) {
    return Astro2.redirect("/sounds");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Login | Story Mode" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gray-50 py-12"> <div class="max-w-6xl mx-auto px-4"> <div class="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)]"> <div class="mb-12 text-center"> <h1 class="text-5xl font-editorial mb-4">Story Mode</h1> <p class="text-xl text-gray-600">Audio Branding & UX Sound Design</p> </div> <div class="w-full max-w-md bg-white rounded-lg shadow-lg p-8"> ${renderComponent($$result2, "LoginForm", $$LoginForm, {})} </div> </div> </div> </main> ` })}`;
}, "C:/Users/samue/repos/StoryMode/src/pages/login.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
