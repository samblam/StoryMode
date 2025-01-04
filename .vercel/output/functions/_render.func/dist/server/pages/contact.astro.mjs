/* empty css                                 */
import { c as createComponent, r as renderTemplate, f as renderScript, m as maybeRenderHead, d as renderComponent } from '../chunks/astro/server_COeGrUW_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_Y_cjXtYi.mjs';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$ContactForm = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderScript($$result, "C:/Users/samue/repos/StoryMode/src/components/ContactForm.astro?astro&type=script&index=0&lang.ts")} ${maybeRenderHead()}<div id="form-status" class="hidden absolute left-0 top-0 w-full h-full flex justify-center items-center bg-gray-500 bg-opacity-75"> <p class="success hidden text-green-500">Message sent successfully!</p> <p class="error hidden text-red-500"></p> </div> <form id="contact-form" class="space-y-6"> <div> <label for="name" class="block text-sm font-medium text-gray-700">Your Name</label> <div class="mt-1"> <input type="text" id="name" name="name" required class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"> </div> </div> <div> <label for="email" class="block text-sm font-medium text-gray-700">Your Email</label> <div class="mt-1"> <input type="email" id="email" name="email" required class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"> </div> </div> <div> <label for="message" class="block text-sm font-medium text-gray-700">Message</label> <div class="mt-1"> <textarea id="message" name="message" rows="5" required class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"></textarea> </div> </div> <div class="text-right"> <button type="submit" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
Send Message
</button> </div> </form>`;
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
