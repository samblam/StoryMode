/* empty css                                 */
import { c as createComponent, r as renderTemplate, m as maybeRenderHead, d as renderComponent, b as createAstro } from '../chunks/astro/server_Dmwxy-zN.mjs';
import 'kleur/colors';
import 'html-escaper';
import { $ as $$Layout } from '../chunks/Layout_B9cyLK92.mjs';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$UserCreationForm = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<form id="user-creation-form" class="w-full max-w-md mx-auto space-y-6"> <div> <label for="email" class="block text-sm font-medium mb-2">Email</label> <input type="email" id="email" name="email" required class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="user@example.com"> </div> <div> <label for="password" class="block text-sm font-medium mb-2">Password</label> <input type="password" id="password" name="password" required minlength="8" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Minimum 8 characters"> </div> <div> <label for="role" class="block text-sm font-medium mb-2">Role</label> <select id="role" name="role" required class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"> <option value="">Select a role</option> <option value="client">Client</option> <option value="admin">Admin</option> </select> </div> <!-- Client-specific fields --> <div id="client-fields" class="hidden space-y-6"> <div> <label for="clientName" class="block text-sm font-medium mb-2">Client Name *</label> <input type="text" id="clientName" name="name" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Full name"> <p class="text-xs text-gray-500 mt-1">Required for client accounts</p> </div> <div> <label for="companyName" class="block text-sm font-medium mb-2">Company Name *</label> <input type="text" id="companyName" name="company" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-400" placeholder="Company or organization name"> <p class="text-xs text-gray-500 mt-1">Required for client accounts</p> </div> </div> <div id="form-status" class="hidden"> <p class="error hidden text-red-600 bg-red-50 p-3 rounded-lg"></p> <p class="success hidden text-green-600 bg-green-50 p-3 rounded-lg"></p> </div> <button type="submit" class="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
Create User
</button> </form> `;
}, "C:/Users/samue/repos/StoryMode/src/components/UserCreationForm.astro", void 0);

const $$Astro = createAstro();
const $$CreateUser = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$CreateUser;
  const user = Astro2.locals.user;
  if (!user || user.role !== "admin") {
    return Astro2.redirect("/");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Create User | Story Mode" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gray-50 py-12"> <div class="max-w-6xl mx-auto px-4"> <div class="flex flex-col items-center justify-center min-h-[calc(100vh-16rem)]"> <div class="mb-12 text-center"> <h1 class="text-5xl font-editorial mb-4">Create New User</h1> <p class="text-xl text-gray-600">Add a new admin or client user</p> </div> <div class="w-full max-w-md bg-white rounded-lg shadow-lg p-8"> ${renderComponent($$result2, "UserCreationForm", $$UserCreationForm, {})} </div> </div> </div> </main> ` })}`;
}, "C:/Users/samue/repos/StoryMode/src/pages/create-user.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/create-user.astro";
const $$url = "/create-user";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$CreateUser,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
