import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_Bjtit7E_.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/api/auth/admin-reset-password.astro.mjs');
const _page3 = () => import('./pages/api/auth/create-user.astro.mjs');
const _page4 = () => import('./pages/api/auth/login.astro.mjs');
const _page5 = () => import('./pages/api/auth/logout.astro.mjs');
const _page6 = () => import('./pages/api/auth/reset-password.astro.mjs');
const _page7 = () => import('./pages/api/auth/send-reset-code.astro.mjs');
const _page8 = () => import('./pages/api/auth/test-token.astro.mjs');
const _page9 = () => import('./pages/api/auth/verify-reset-code.astro.mjs');
const _page10 = () => import('./pages/api/auth/verify-session.astro.mjs');
const _page11 = () => import('./pages/api/delete-sound.astro.mjs');
const _page12 = () => import('./pages/api/send-email.astro.mjs');
const _page13 = () => import('./pages/api/sound-profiles/_id_.astro.mjs');
const _page14 = () => import('./pages/api/sound-profiles.astro.mjs');
const _page15 = () => import('./pages/api/sounds/delete.astro.mjs');
const _page16 = () => import('./pages/api/sounds/refresh-url.astro.mjs');
const _page17 = () => import('./pages/api/sounds/upload.astro.mjs');
const _page18 = () => import('./pages/api/test-connection.astro.mjs');
const _page19 = () => import('./pages/api/upload-sound.astro.mjs');
const _page20 = () => import('./pages/blog.astro.mjs');
const _page21 = () => import('./pages/contact.astro.mjs');
const _page22 = () => import('./pages/create-user.astro.mjs');
const _page23 = () => import('./pages/error.astro.mjs');
const _page24 = () => import('./pages/login.astro.mjs');
const _page25 = () => import('./pages/reset-password/confirm.astro.mjs');
const _page26 = () => import('./pages/reset-password/verify.astro.mjs');
const _page27 = () => import('./pages/reset-password.astro.mjs');
const _page28 = () => import('./pages/reset-password.astro2.mjs');
const _page29 = () => import('./pages/sounds/profiles/new.astro.mjs');
const _page30 = () => import('./pages/sounds/profiles/_id_/edit.astro.mjs');
const _page31 = () => import('./pages/sounds/profiles.astro.mjs');
const _page32 = () => import('./pages/sounds/upload.astro.mjs');
const _page33 = () => import('./pages/sounds.astro.mjs');
const _page34 = () => import('./pages/sounds.astro2.mjs');
const _page35 = () => import('./pages/works.astro.mjs');
const _page36 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/api/auth/admin-reset-password.ts", _page2],
    ["src/pages/api/auth/create-user.ts", _page3],
    ["src/pages/api/auth/login.ts", _page4],
    ["src/pages/api/auth/logout.ts", _page5],
    ["src/pages/api/auth/reset-password.ts", _page6],
    ["src/pages/api/auth/send-reset-code.ts", _page7],
    ["src/pages/api/auth/test-token.ts", _page8],
    ["src/pages/api/auth/verify-reset-code.ts", _page9],
    ["src/pages/api/auth/verify-session.ts", _page10],
    ["src/pages/api/delete-sound.ts", _page11],
    ["src/pages/api/send-email.ts", _page12],
    ["src/pages/api/sound-profiles/[id].ts", _page13],
    ["src/pages/api/sound-profiles/index.ts", _page14],
    ["src/pages/api/sounds/delete.ts", _page15],
    ["src/pages/api/sounds/refresh-url.ts", _page16],
    ["src/pages/api/sounds/upload.ts", _page17],
    ["src/pages/api/test-connection.ts", _page18],
    ["src/pages/api/upload-sound.ts", _page19],
    ["src/pages/blog.astro", _page20],
    ["src/pages/contact.astro", _page21],
    ["src/pages/create-user.astro", _page22],
    ["src/pages/error.astro", _page23],
    ["src/pages/login.astro", _page24],
    ["src/pages/reset-password/confirm.astro", _page25],
    ["src/pages/reset-password/verify.astro", _page26],
    ["src/pages/reset-password/index.astro", _page27],
    ["src/pages/reset-password.astro", _page28],
    ["src/pages/sounds/profiles/new.astro", _page29],
    ["src/pages/sounds/profiles/[id]/edit.astro", _page30],
    ["src/pages/sounds/profiles/index.astro", _page31],
    ["src/pages/sounds/upload.astro", _page32],
    ["src/pages/sounds/index.astro", _page33],
    ["src/pages/sounds.astro", _page34],
    ["src/pages/works.astro", _page35],
    ["src/pages/index.astro", _page36]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: undefined
});
const _args = undefined;
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
