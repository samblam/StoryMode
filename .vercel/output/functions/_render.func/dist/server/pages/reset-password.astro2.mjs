/* empty css                                 */
import { c as createComponent, r as renderTemplate, d as renderComponent, f as renderScript, g as createAstro, m as maybeRenderHead } from '../chunks/astro/server_COeGrUW_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_Y_cjXtYi.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$ResetPassword = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ResetPassword;
  const user = Astro2.locals.user;
  if (user) {
    return Astro2.redirect("/sounds");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Reset Password | Story Mode" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gray-50 py-12"> <div class="max-w-6xl mx-auto px-4"> <div class="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)]"> <div class="mb-12 text-center"> <h1 class="text-5xl font-editorial mb-4">Reset Password</h1> <p class="text-xl text-gray-600">Enter your email to receive a reset code</p> </div> <div class="w-full max-w-md bg-white rounded-lg shadow-lg p-8"> <form id="reset-form" class="space-y-6"> <div> <label for="email" class="block text-lg mb-2">Email</label> <input type="email" id="email" name="email" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400" placeholder="you@example.com"> </div> <div id="form-status" class="hidden"> <p class="success hidden text-green-600 bg-green-50 p-3 rounded-lg"></p> <p class="error hidden text-red-600 bg-red-50 p-3 rounded-lg"></p> </div> <button type="submit" class="w-full bg-green-400 text-white px-8 py-3 rounded-lg text-lg hover:bg-green-500 transition-colors">
Send Reset Code
</button> <div class="text-center"> <a href="/login" class="text-blue-600 hover:underline">Back to Login</a> </div> </form> </div> </div> </div> </main> ` })} ${renderScript($$result, "C:/Users/samue/repos/StoryMode/src/pages/reset-password.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/samue/repos/StoryMode/src/pages/reset-password.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/reset-password.astro";
const $$url = "/reset-password";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$ResetPassword,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
