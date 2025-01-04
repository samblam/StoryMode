import{a as d}from"./audioManager.NZJ33dCK.js";import"./_commonjsHelpers.C4iS2aBk.js";document.querySelectorAll(".play-button").forEach(a=>{const e=a,o=e.getAttribute("data-sound"),n=e.getAttribute("data-sound-id");!o||!n||e.addEventListener("click",async()=>{try{e.disabled=!0,await d.play(o,n)}catch(t){console.error("Playback error:",t),alert("Failed to play sound. Please try again.")}finally{e.disabled=!1}})});document.querySelectorAll(".download-button").forEach(a=>{const e=a,o=e.getAttribute("data-sound-id"),n=e.getAttribute("data-filename")?.toLowerCase().replace(/[^a-z0-9]/g,"-")||"sound";e.addEventListener("click",async()=>{if(o)try{e.disabled=!0,e.textContent="Downloading...";const t=await fetch("/api/sounds/refresh-url",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({soundId:o})});if(!t.ok)throw new Error(`HTTP error! status: ${t.status}`);const{url:l}=await t.json(),s=await fetch(l);if(!s.ok)throw new Error(`HTTP error! status: ${s.status}`);const u=await s.blob(),i=window.URL.createObjectURL(u),r=document.createElement("a");r.style.display="none",r.href=i,r.download=`${n}.mp3`,document.body.appendChild(r),r.click(),window.URL.revokeObjectURL(i),document.body.removeChild(r)}catch(t){console.error("Download error:",t),alert("Failed to download sound. Please try again.")}finally{e.disabled=!1,e.textContent="Download"}})});document.querySelectorAll(".delete-button").forEach(a=>{const e=a,o=e.getAttribute("data-sound-id"),n=e.getAttribute("data-sound");e.addEventListener("click",async()=>{if(!(!o||!n)&&confirm("Are you sure you want to delete this sound?"))try{e.disabled=!0,e.textContent="Deleting...";const t=await fetch("/api/sounds/delete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:o,filePath:n})});if(!t.ok)throw new Error(`HTTP error! status: ${t.status}`);d.getCurrentSoundId()===n&&await d.pause(),e.closest(".border")?.remove()}catch(t){console.error("Delete error:",t),alert("Failed to delete sound. Please try again."),e.disabled=!1,e.textContent="Delete"}})});window.addEventListener("unload",()=>{d.cleanup()});