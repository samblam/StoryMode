
			import { onRequest } from "C:/Users/samue/repos/StoryMode/.netlify/functions-internal/ssr/_astro-internal_middleware.mjs";
			import { createContext, trySerializeLocals } from 'astro/middleware';

			export default async (request, context) => {
				const ctx = createContext({ 
					request,
					params: {}
				});
				ctx.locals = { netlify: { context } }
				const next = () => {
					const { netlify, ...otherLocals } = ctx.locals;
					request.headers.set("x-astro-locals", trySerializeLocals(otherLocals));
					return context.next();
				};
			
				return onRequest(ctx, next);
			}

			export const config = {
				name: "Astro Middleware",
				generator: "@astrojs/netlify@4.1.1",
				path: "/*", excludedPath: ["/_astro/*", "/.netlify/images/*"]
			};
			