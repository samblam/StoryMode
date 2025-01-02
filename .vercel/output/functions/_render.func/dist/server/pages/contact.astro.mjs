/* empty css                                 */
import { c as createComponent, r as renderTemplate, m as maybeRenderHead, f as renderScript, d as renderComponent } from '../chunks/astro/server_COeGrUW_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_gjCW3zoU.mjs';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$ContactForm = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<form id="contact-form" class="space-y-6"> <div> <label for="name" class="block text-lg mb-2">Name</label> <input type="text" id="name" name="name" required minlength="2" maxlength="100" placeholder="Your name (2-100 characters)" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"> <p class="text-sm text-gray-600 mt-1">Must be between 2 and 100 characters</p> </div> <div> <label for="email" class="block text-lg mb-2">Email</label> <input type="email" id="email" name="email" required placeholder="your.email@example.com" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"> <p class="text-sm text-gray-600 mt-1">Please enter a valid email address</p> </div> <div> <label for="message" class="block text-lg mb-2">Message</label> <textarea id="message" name="message" required minlength="10" maxlength="1000" rows="6" placeholder="Your message (10-1000 characters)" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"></textarea> <p class="text-sm text-gray-600 mt-1">Must be between 10 and 1000 characters</p> </div> <button type="submit" class="bg-green-400 text-white px-8 py-3 rounded-lg text-lg hover:bg-green-500 transition-colors">
Send Message
</button> <div id="form-status" class="hidden p-4 rounded-lg"> <p class="success hidden text-green-600 bg-green-50 p-3 rounded-lg">Thanks for your message! We'll get back to you soon.</p> <p class="error hidden text-red-600 bg-red-50 p-3 rounded-lg"></p> </div> </form> ${renderScript($$result, "C:/Users/samue/repos/StoryMode/src/components/ContactForm.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Users/samue/repos/StoryMode/src/components/ContactForm.astro", void 0);

const $$Contact = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Contact | Story Mode" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-white"> <div class="max-w-6xl mx-auto px-4 py-12"> <h1 class="text-6xl font-editorial mb-12">Let's Chat</h1> <div class="grid grid-cols-1 md:grid-cols-2 gap-12"> <div> <p class="text-2xl mb-6">
Got a project in mind? Want to make your product sound amazing? Or just want to say hi?
</p> <p class="text-xl mb-8">
Drop us a line and we'll get back to you faster than you can say "sonic branding"!
</p> <div class="space-y-4"> <p class="text-xl"> <strong>Email:</strong> <a href="mailto:info@storymode.ca" class="text-blue-600 hover:underline">
info@storymode.ca
</a> </p> <p class="text-xl"> <strong>Location:</strong> Montreal, Quebec
</p> </div> </div> <div> ${renderComponent($$result2, "ContactForm", $$ContactForm, {})} </div> </div> </div> </main> ` })}`;
}, "C:/Users/samue/repos/StoryMode/src/pages/contact.astro", void 0);

const $$file = "C:/Users/samue/repos/StoryMode/src/pages/contact.astro";
const $$url = "/contact";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Contact,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
