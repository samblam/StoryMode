import{a as o}from"./audioManager.NZJ33dCK.js";import"./_commonjsHelpers.C4iS2aBk.js";class i{volumeSlider;volumePercentage;volumeMute;volumeIcon;previousVolume;constructor(){if(this.volumeSlider=document.getElementById("volume-slider"),this.volumePercentage=document.getElementById("volume-percentage"),this.volumeMute=document.getElementById("volume-mute"),this.volumeIcon=document.getElementById("volume-icon"),this.previousVolume=o.getVolume(),!this.validateElements())throw new Error("Required volume control elements not found");this.initializeEventListeners(),this.updateVolumeIcon(this.previousVolume)}validateElements(){return!!(this.volumeSlider&&this.volumePercentage&&this.volumeMute&&this.volumeIcon)}updateVolumeIcon(e){e===0?this.volumeIcon.setAttribute("d","M4 9h3.5L12 6v12l-4.5-3H4V9z"):e<.5?this.volumeIcon.setAttribute("d","M15.536 8.464a5 5 0 010 7.072M12 6L7.5 9H4v6h3.5L12 18V6z"):this.volumeIcon.setAttribute("d","M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 6L7.5 9H4v6h3.5L12 18V6z")}handleVolumeChange=e=>{try{o.setVolume(e),this.volumePercentage.textContent=`${Math.round(e*100)}%`,this.updateVolumeIcon(e)}catch(t){console.error("Error updating volume:",t)}};handleSliderInput=e=>{const t=parseInt(e.target.value)/100;this.handleVolumeChange(t)};handleMuteClick=()=>{try{const e=o.getVolume();e>0?(this.previousVolume=e,this.setVolume(0)):this.setVolume(this.previousVolume)}catch(e){console.error("Error toggling mute:",e)}};setVolume(e){this.volumeSlider.value=String(e*100),this.handleVolumeChange(e)}initializeEventListeners(){this.volumeSlider.addEventListener("input",this.handleSliderInput),this.volumeMute.addEventListener("click",this.handleMuteClick),window.addEventListener("unload",()=>{this.volumeSlider.removeEventListener("input",this.handleSliderInput),this.volumeMute.removeEventListener("click",this.handleMuteClick)})}}document.addEventListener("DOMContentLoaded",()=>{try{new i}catch(l){console.error("Failed to initialize volume controller:",l)}});
