import { c as createComponent, r as renderTemplate, m as maybeRenderHead, a as addAttribute, b as createAstro, d as renderComponent } from './astro/server_Dmwxy-zN.mjs';
import 'kleur/colors';
import 'html-escaper';
import 'clsx';

const $$Astro$3 = createAstro();
const $$VolumeControl = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$VolumeControl;
  const { initialVolume = 1 } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="flex items-center space-x-2"> <button id="volume-mute" class="text-gray-600 hover:text-gray-800 p-2 focus:outline-none focus:ring-2 focus:ring-green-400 rounded-lg" aria-label="Toggle mute"> <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path id="volume-icon" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 6L7.5 9H4v6h3.5L12 18V6z"></path> </svg> </button> <input type="range" id="volume-slider" min="0" max="100"${addAttribute(initialVolume * 100, "value")} class="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400" aria-label="Volume control"> <span id="volume-percentage" class="text-sm text-gray-600 min-w-[3ch]"> ${Math.round(initialVolume * 100)}%
</span> </div> `;
}, "C:/Users/samue/repos/StoryMode/src/components/VolumeControl.astro", void 0);

const $$Astro$2 = createAstro();
const $$AudioProgress = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$AudioProgress;
  const { soundId, soundFile } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="flex flex-col w-full space-y-2"${addAttribute(soundId, "data-component-id")}> <div class="flex items-center space-x-4"> <span class="current-time text-sm text-gray-600 w-12">0:00</span> <div class="relative flex-grow h-2 bg-gray-200 rounded cursor-pointer progress-bar group"${addAttribute(soundId, "data-sound-id")}${addAttribute(soundFile, "data-sound-file")}> <div class="absolute h-full bg-green-400 rounded progress-fill" style="width: 0%"></div> <div class="absolute top-1/2 -mt-2 -ml-2 w-4 h-4 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing handle transition-opacity duration-200" style="left: 0%"></div> </div> <span class="duration text-sm text-gray-600 w-12">0:00</span> </div> </div> `;
}, "C:/Users/samue/repos/StoryMode/src/components/AudioProgress.astro", void 0);

const $$Astro$1 = createAstro();
const $$SoundList = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$SoundList;
  const { sounds, isAdmin } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="space-y-4"> <div class="flex justify-end mb-4"> ${renderComponent($$result, "VolumeControl", $$VolumeControl, { "initialVolume": 0.75 })} </div> ${sounds.map((sound) => renderTemplate`<div class="border rounded-lg p-4 hover:bg-gray-50 transition-colors"> <div class="flex flex-col space-y-4"> <div class="flex items-center justify-between"> <div> <h4 class="text-lg font-semibold mb-1">${sound.name}</h4> <p class="text-sm text-gray-500">${sound.description}</p> </div> <div class="flex space-x-2"> <button class="play-button bg-green-400 text-white px-4 py-2 rounded-lg hover:bg-green-500 transition-colors"${addAttribute(sound.file, "data-sound")}${addAttribute(sound.id, "data-sound-id")}>
Play
</button> <button class="download-button bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"${addAttribute(sound.file, "data-sound")}${addAttribute(sound.id, "data-sound-id")}${addAttribute(sound.name, "data-filename")}>
Download
</button> ${isAdmin && renderTemplate`<button class="delete-button bg-red-400 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"${addAttribute(sound.file, "data-sound")}${addAttribute(sound.id, "data-sound-id")}>
Delete
</button>`} </div> </div> ${renderComponent($$result, "AudioProgress", $$AudioProgress, { "soundId": sound.id, "soundFile": sound.file })} </div> </div>`)} </div> `;
}, "C:/Users/samue/repos/StoryMode/src/components/SoundList.astro", void 0);

const $$Astro = createAstro();
const $$ProfileCard = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ProfileCard;
  const { profile, isAdmin } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="bg-white rounded-lg shadow-lg p-6 mb-8"> <div class="flex justify-between items-start mb-6"> <div> <h3 class="text-2xl font-editorial mb-2">${profile.title}</h3> <p class="text-gray-600">${profile.description}</p> </div> <div class="flex space-x-2"> <button class="download-all-button bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"${addAttribute(profile.id, "data-profile-id")}${addAttribute(JSON.stringify(profile.sounds), "data-sounds")}${addAttribute(profile.title, "data-profile-title")}>
Download All Sounds
</button> ${isAdmin && renderTemplate`<div class="flex space-x-2"> <a${addAttribute(`/sounds/profiles/${profile.id}/edit`, "href")} class="bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors">
Edit Profile
</a> <button class="delete-profile bg-red-400 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"${addAttribute(profile.id, "data-profile-id")}${addAttribute(profile.sounds.length, "data-sound-count")}>
Delete Profile
</button> </div>`} </div> </div> ${profile.sounds.length > 0 ? renderTemplate`${renderComponent($$result, "SoundList", $$SoundList, { "sounds": profile.sounds, "isAdmin": isAdmin })}` : renderTemplate`<p class="text-gray-600 italic">No sounds added to this profile yet.</p>`} </div> `;
}, "C:/Users/samue/repos/StoryMode/src/components/ProfileCard.astro", void 0);

export { $$ProfileCard as $, $$SoundList as a };
