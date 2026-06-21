(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={sourceFile:null,originalData:null,currentData:null,width:0,height:0,format:`png`,quality:92,resizeWidth:0,resizeHeight:0,keepAspect:!0,filter:`none`,filterParams:{blur:2,brightness:100,contrast:100,saturate:100}},t=document.getElementById(`preview`),n=t.getContext(`2d`),r=`convert`,i=document.getElementById(`dropzone`),a=document.getElementById(`file-input`),o=document.getElementById(`toolbar`),s=document.getElementById(`editor`),c=document.getElementById(`controls-panel`),l=document.getElementById(`file-info`),u=document.getElementById(`file-size`),d=document.getElementById(`btn-download`),f=document.getElementById(`btn-reset`),p=document.getElementById(`palette-output`),m=document.getElementById(`palette-grid`),h=document.getElementById(`palette-copy`);i.addEventListener(`click`,()=>a.click()),i.addEventListener(`dragover`,e=>{e.preventDefault(),i.classList.add(`dragover`)}),i.addEventListener(`dragleave`,()=>i.classList.remove(`dragover`)),i.addEventListener(`drop`,e=>{e.preventDefault(),i.classList.remove(`dragover`),g(e.dataTransfer.files[0])}),a.addEventListener(`change`,()=>{a.files[0]&&g(a.files[0])});function g(r){if(!r||!r.type.match(/image\/(png|jpeg|webp|bmp|gif)/)){A(`Unsupported format`);return}e.sourceFile=r;let i=new Image;i.onload=()=>{e.width=i.naturalWidth,e.height=i.naturalHeight,t.width=e.width,t.height=e.height,n.drawImage(i,0,0),e.originalData=n.getImageData(0,0,e.width,e.height),e.currentData=null,e.resizeWidth=e.width,e.resizeHeight=e.height,_(),y(),D()},i.src=URL.createObjectURL(r)}function _(){i.classList.add(`has-image`),i.querySelector(`.dropzone-title`).textContent=e.sourceFile.name,i.querySelector(`.dropzone-sub`).textContent=`${e.width} × ${e.height}`,o.style.display=`flex`,s.style.display=`block`,l.textContent=`${e.sourceFile.name} · ${e.width}×${e.height}`,u.textContent=v(e.sourceFile.size)}function v(e){return e<1024?e+` B`:e<1048576?(e/1024).toFixed(1)+` KB`:(e/1048576).toFixed(1)+` MB`}document.querySelectorAll(`[data-tool]`).forEach(e=>{e.addEventListener(`click`,()=>{document.querySelectorAll(`.tool-btn`).forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),r=e.dataset.tool,y()})});function y(){switch(b(),r){case`convert`:x();break;case`compress`:S();break;case`resize`:C();break;case`filters`:w();break;case`palette`:O();break}}function b(){e.originalData&&(t.width=e.width,t.height=e.height,n.putImageData(e.originalData,0,0),e.currentData=null),p.style.display=`none`}function x(){let t=e.format;c.innerHTML=`
    <div class="control-group">
      <div class="control-label">Format</div>
      <div class="format-btns">
        ${[`png`,`jpeg`,`webp`,`bmp`].map(e=>`<div class="format-btn ${e===t?`active`:``}" data-fmt="${e}">${e.toUpperCase()}</div>`).join(``)}
      </div>
    </div>
    <div class="control-group">
      <div class="control-label">Info</div>
      <div style="font-size:12px;color:var(--text-dim);line-height:1.8">
        <div>Original: ${e.width}×${e.height}</div>
        <div>Size: ${v(e.sourceFile.size)}</div>
      </div>
    </div>
  `,c.querySelectorAll(`.format-btn`).forEach(t=>{t.addEventListener(`click`,()=>{c.querySelectorAll(`.format-btn`).forEach(e=>e.classList.remove(`active`)),t.classList.add(`active`),e.format=t.dataset.fmt,A(`Format: ${e.format.toUpperCase()}`)})})}function S(){c.innerHTML=`
    <div class="control-group">
      <div class="control-label">
        Quality <span id="quality-val">${e.quality}%</span>
      </div>
      <input type="range" id="quality-slider" min="1" max="100" value="${e.quality}" />
    </div>
    <div class="control-group">
      <div class="control-label">Estimated size</div>
      <div id="est-size" style="font-size:12px;color:var(--text-dim)"></div>
    </div>
  `;let n=c.querySelector(`#quality-slider`),r=c.querySelector(`#quality-val`),i=c.querySelector(`#est-size`);n.addEventListener(`input`,()=>{e.quality=parseInt(n.value),r.textContent=e.quality+`%`,a()}),a();async function a(){i.textContent=`~${v((await k(t,`image/jpeg`,e.quality/100)).size)} at ${e.quality}% quality`}}function C(){c.innerHTML=`
    <div class="control-group">
      <div class="control-label">Width <span id="rw-val">${e.resizeWidth}</span></div>
      <input type="range" id="rw-slider" min="1" max="${Math.min(e.width*2,4e3)}" value="${e.resizeWidth}" />
    </div>
    <div class="control-group">
      <div class="control-label">Height <span id="rh-val">${e.resizeHeight}</span></div>
      <input type="range" id="rh-slider" min="1" max="${Math.min(e.height*2,4e3)}" value="${e.resizeHeight}" />
    </div>
    <div class="control-group">
      <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-dim)">
        <input type="checkbox" id="keep-aspect" ${e.keepAspect?`checked`:``} /> Keep aspect ratio
      </label>
    </div>
    <div class="control-group">
      <div class="btn-row">
        <button class="btn btn-sm btn-secondary" data-preset="0.25">¼</button>
        <button class="btn btn-sm btn-secondary" data-preset="0.5">½</button>
        <button class="btn btn-sm btn-secondary" data-preset="0.75">¾</button>
        <button class="btn btn-sm btn-secondary" data-preset="2">2×</button>
        <button class="btn btn-sm btn-secondary" data-reset>Original</button>
      </div>
    </div>
  `;let r=c.querySelector(`#rw-slider`),i=c.querySelector(`#rh-slider`),a=c.querySelector(`#rw-val`),o=c.querySelector(`#rh-val`),s=c.querySelector(`#keep-aspect`);function l(){a.textContent=e.resizeWidth,o.textContent=e.resizeHeight;let r=document.createElement(`canvas`);r.width=e.resizeWidth,r.height=e.resizeHeight,r.getContext(`2d`).drawImage(t,0,0,e.resizeWidth,e.resizeHeight),t.width=e.resizeWidth,t.height=e.resizeHeight,n.drawImage(r,0,0)}r.addEventListener(`input`,()=>{e.resizeWidth=parseInt(r.value),e.keepAspect&&(e.resizeHeight=Math.round(e.resizeWidth*e.height/e.width),i.value=e.resizeHeight),l()}),i.addEventListener(`input`,()=>{e.resizeHeight=parseInt(i.value),e.keepAspect&&(e.resizeWidth=Math.round(e.resizeHeight*e.width/e.height),r.value=e.resizeWidth),l()}),s.addEventListener(`change`,()=>{e.keepAspect=s.checked}),c.querySelectorAll(`[data-preset]`).forEach(t=>{t.addEventListener(`click`,()=>{let n=parseFloat(t.dataset.preset);e.resizeWidth=Math.round(e.width*n),e.resizeHeight=Math.round(e.height*n),r.value=e.resizeWidth,i.value=e.resizeHeight,l()})}),c.querySelector(`[data-reset]`).addEventListener(`click`,()=>{e.resizeWidth=e.width,e.resizeHeight=e.height,r.value=e.resizeWidth,i.value=e.resizeHeight,r.max=Math.min(e.width*2,4e3),i.max=Math.min(e.height*2,4e3),l()})}function w(){let t=e.filter;c.innerHTML=`
    <div class="control-group">
      <div class="control-label">Filter</div>
      <div class="filter-grid">
        ${[`none`,`grayscale`,`sepia`,`invert`,`blur`,`brightness`,`contrast`,`saturate`].map(e=>`<div class="filter-btn ${e===t?`active`:``}" data-filter="${e}">${e}</div>`).join(``)}
      </div>
    </div>
    <div id="filter-params">
      <div class="control-group">
        <div class="control-label">Intensity <span id="fp-val">${e.filterParams.blur}</span></div>
        <input type="range" id="fp-slider" min="0" max="20" value="${e.filterParams.blur}" />
      </div>
    </div>
  `,c.querySelectorAll(`[data-filter]`).forEach(t=>{t.addEventListener(`click`,()=>{c.querySelectorAll(`[data-filter]`).forEach(e=>e.classList.remove(`active`)),t.classList.add(`active`),e.filter=t.dataset.filter,T(),E()})});let n=c.querySelector(`#fp-slider`),r=c.querySelector(`#fp-val`);n.addEventListener(`input`,()=>{r.textContent=n.value,T(),E()}),T(),E()}function T(){let t=e.filterParams,n=document.getElementById(`fp-slider`),r=document.getElementById(`fp-val`);if(n){switch(e.filter){case`blur`:n.max=20,n.value=Math.min(t.blur,20),r.textContent=t.blur;break;case`brightness`:n.max=200,n.value=t.brightness,r.textContent=t.brightness+`%`;break;case`contrast`:n.max=200,n.value=t.contrast,r.textContent=t.contrast+`%`;break;case`saturate`:n.max=300,n.value=t.saturate,r.textContent=t.saturate+`%`;break;default:n.max=10,n.value=5,r.textContent=`5`;break}e.filter===`none`?n.disabled=!0:n.disabled=!1}}function E(){if(!e.originalData)return;let t=n.getImageData(0,0,e.width,e.height),r=t.data;if(e.filter===`none`){n.putImageData(e.originalData,0,0),e.currentData=null;return}let i=document.getElementById(`fp-slider`),a=i?parseFloat(i.value):5;switch(e.filter){case`grayscale`:for(let e=0;e<r.length;e+=4){let t=.299*r[e]+.587*r[e+1]+.114*r[e+2];r[e]=r[e+1]=r[e+2]=t}break;case`sepia`:for(let e=0;e<r.length;e+=4){let t=r[e],n=r[e+1],i=r[e+2];r[e]=Math.min(255,t*.393+n*.769+i*.189),r[e+1]=Math.min(255,t*.349+n*.686+i*.168),r[e+2]=Math.min(255,t*.272+n*.534+i*.131)}break;case`invert`:for(let e=0;e<r.length;e+=4)r[e]=255-r[e],r[e+1]=255-r[e+1],r[e+2]=255-r[e+2];break;case`brightness`:for(let e=0;e<r.length;e+=4)r[e]=Math.min(255,r[e]*a/100),r[e+1]=Math.min(255,r[e+1]*a/100),r[e+2]=Math.min(255,r[e+2]*a/100);break;case`contrast`:for(let e=0;e<r.length;e+=4){let t=259*(a+255)/(255*(259-a));r[e]=Math.min(255,Math.max(0,t*(r[e]-128)+128)),r[e+1]=Math.min(255,Math.max(0,t*(r[e+1]-128)+128)),r[e+2]=Math.min(255,Math.max(0,t*(r[e+2]-128)+128))}break;case`saturate`:for(let e=0;e<r.length;e+=4){let t=.299*r[e]+.587*r[e+1]+.114*r[e+2],n=a/100;r[e]=Math.min(255,Math.max(0,t+(r[e]-t)*n)),r[e+1]=Math.min(255,Math.max(0,t+(r[e+1]-t)*n)),r[e+2]=Math.min(255,Math.max(0,t+(r[e+2]-t)*n))}break;case`blur`:let t=Math.min(10,Math.round(a));if(t>0){let i=e.width,o=e.height,s=n.getImageData(0,0,i,o).data;for(let e=0;e<o;e++)for(let n=0;n<i;n++){let a=0,c=0,l=0,u=0;for(let r=-t;r<=t;r++)for(let d=-t;d<=t;d++){let t=Math.min(i-1,Math.max(0,n+d)),f=(Math.min(o-1,Math.max(0,e+r))*i+t)*4;a+=s[f],c+=s[f+1],l+=s[f+2],u++}let d=(e*i+n)*4;r[d]=a/u,r[d+1]=c/u,r[d+2]=l/u}e.filterParams.blur=a,fpVal.textContent=a}break}n.putImageData(t,0,0),e.currentData=t}function D(){let n=e.width,r=e.height,i=document.createElement(`canvas`);i.width=n,i.height=r;let a=i.getContext(`2d`);a.drawImage(t,0,0);let o=a.getImageData(0,0,n,r).data,s=[],c=Math.max(1,Math.floor(Math.sqrt(n*r/2e3)));for(let e=0;e<r;e+=c)for(let t=0;t<n;t+=c){let r=(e*n+t)*4;s.push({r:o[r],g:o[r+1],b:o[r+2]})}let l={};for(let e of s){let t=`${Math.round(e.r/32)*32},${Math.round(e.g/32)*32},${Math.round(e.b/32)*32}`;l[t]=(l[t]||0)+1}e.palette=Object.entries(l).sort((e,t)=>t[1]-e[1]).slice(0,16).map(([e])=>{let[t,n,r]=e.split(`,`).map(Number),i=`#`+[t,n,r].map(e=>Math.min(255,e+16).toString(16).padStart(2,`0`)).join(``);return{r:Math.min(255,t+16),g:Math.min(255,n+16),b:Math.min(255,r+16),hex:i}})}function O(){(!e.palette||e.palette.length===0)&&D(),p.style.display=`block`,m.innerHTML=e.palette.map(e=>`<div class="palette-swatch" data-hex="${e.hex}">
      <div class="color-block" style="background:${e.hex}"></div>
      <div class="color-hex">${e.hex}</div>
    </div>`).join(``),m.querySelectorAll(`.palette-swatch`).forEach(e=>{e.addEventListener(`click`,()=>{navigator.clipboard.writeText(e.dataset.hex),A(`Copied ${e.dataset.hex}`)})})}h.addEventListener(`click`,()=>{if(!e.palette)return;let t=e.palette.map((e,t)=>`  --color-${t+1}: ${e.hex};`).join(`
`);navigator.clipboard.writeText(`:root {\n${t}\n}`),A(`CSS variables copied!`)}),d.addEventListener(`click`,async()=>{let n={png:`image/png`,jpeg:`image/jpeg`,webp:`image/webp`,bmp:`image/bmp`},r=e.format===`jpeg`?`jpg`:e.format,i=await k(t,n[e.format]||`image/png`,e.format===`png`?void 0:e.quality/100),a=URL.createObjectURL(i),o=document.createElement(`a`),s=e.sourceFile.name.replace(/\.[^.]+$/,``);o.href=a,o.download=`${s}-pixellab.${r}`,o.click(),URL.revokeObjectURL(a),A(`Downloaded ${v(i.size)}`)});function k(e,t,n){return new Promise(r=>e.toBlob(e=>r(e),t,n))}f.addEventListener(`click`,()=>{e.originalData&&(e.currentData=null,e.filter=`none`,e.resizeWidth=e.width,e.resizeHeight=e.height,t.width=e.width,t.height=e.height,n.putImageData(e.originalData,0,0),y(),A(`Reset to original`))});function A(e){let t=document.getElementById(`toast`);t.textContent=e,t.classList.add(`show`),setTimeout(()=>t.classList.remove(`show`),2e3)}