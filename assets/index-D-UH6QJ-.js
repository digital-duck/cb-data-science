(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))l(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&l(r)}).observe(document,{childList:!0,subtree:!0});function o(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function l(a){if(a.ep)return;a.ep=!0;const n=o(a);fetch(a.href,n)}})();const $={};function A(t,e){$[t]=e}function re(t){window.location.hash=t}function Y(){var a,n;const t=window.location.hash.slice(1)||"/",e=t.match(/^\/domain\/([^?]+)/);if(e){(a=$["/domain/:id"])==null||a.call($,{id:decodeURIComponent(e[1])});return}const[o,l]=t.split("?");(n=$[o])==null||n.call($,Object.fromEntries(new URLSearchParams(l||"")))}function de(){window.addEventListener("hashchange",Y),Y()}let z=null;async function G(){if(z)return z;const t=await fetch("/cb-data-science/domains/catalog.json");if(!t.ok)throw new Error(`Failed to load catalog: ${t.status}`);return z=await t.json(),z}const Z={en:{"app.title":"ConceptBook","app.tagline":"Explore knowledge through concept graphs","nav.graph":"Graph","nav.content":"Content","nav.about":"About","nav.settings":"Settings","home.subtitle":"Choose a domain to explore","home.filter.all":"All","home.filter.level":"Level","card.nodes":"nodes","card.edges":"edges","card.explore":"Explore Concept-Graph","card.read":"Read book","domain.back":"← Back","domain.openFullscreen":"Open fullscreen","about.title":"About concept-book",loading:"Loading…"}};let X=localStorage.getItem("cb-lang")||"en";function T(t){return(Z[X]||Z.en)[t]??t}function pe(t){X=t,localStorage.setItem("cb-lang",t)}function oe(){return X}function ue(t){const e=document.createElement("article");e.className="cb-card";const o=(t.tags||[]).map(l=>`<span class="cb-tag" data-tag="${l}">${l}</span>`).join("");return e.innerHTML=`
    <div class="cb-card__header">
      <h2 class="cb-card__title">${t.name}</h2>
      <div class="cb-card__tags">${o}</div>
    </div>
    <p class="cb-card__stats">${t.nodes} nodes · ${t.edges} edges · ${t.primitives} primitives</p>
    <p class="cb-card__desc">${t.description}</p>
    <div class="cb-card__actions">
      <button class="cb-btn cb-btn--primary js-explore" ${t.has_navigator?"":"disabled"}>
        ${T("card.explore")}
      </button>
      <span class="cb-book-indicator" title="${t.has_book?"Book available":""}">${t.has_book?"📖":""}</span>
    </div>
  `,e.querySelector(".js-explore").addEventListener("click",()=>{re(`/domain/${t.id}`)}),e}const ae=[{code:"en",label:"English"},{code:"zh",label:"中文 (Chinese)"},{code:"es",label:"Español (Spanish)"},{code:"fr",label:"Français (French)"},{code:"de",label:"Deutsch (German)"},{code:"ja",label:"日本語 (Japanese)"},{code:"ko",label:"한국어 (Korean)"},{code:"pt",label:"Português (Portuguese)"},{code:"ar",label:"العربية (Arabic)"},{code:"hi",label:"हिन्दी (Hindi)"}];function me(){const t=document.createElement("select");t.className="cb-lang-picker",t.title="Content language";const e=oe();return ae.forEach(({code:o,label:l})=>{const a=document.createElement("option");a.value=o,a.textContent=l,o===e&&(a.selected=!0),t.appendChild(a)}),t.addEventListener("change",()=>pe(t.value)),t}function P({domainName:t=""}={}){const e=document.createElement("header");e.className="cb-header";const o=document.createElement("div");o.className="cb-header__top";const l=document.createElement("a");if(l.className="cb-header__logo",l.href="#/",l.textContent=T("app.title"),o.appendChild(l),t){const c=document.createElement("span");c.className="cb-header__sep",c.textContent="›",o.appendChild(c);const h=document.createElement("span");h.className="cb-header__domain",h.textContent=t,o.appendChild(h)}const a=document.createElement("span");a.className="cb-header__spacer",o.appendChild(a);const n=document.createElement("nav");n.className="cb-header__nav";const r=document.createElement("a");r.href="#/graph",r.textContent=T("nav.graph"),n.appendChild(r);const m=document.createElement("a");m.href="#/book",m.textContent=T("nav.content"),n.appendChild(m);const s=document.createElement("a");s.href="#/settings",s.textContent=T("nav.settings"),n.appendChild(s),n.appendChild(me());const d=document.createElement("a");return d.href="#/about",d.textContent=T("nav.about"),n.appendChild(d),o.appendChild(n),e.appendChild(o),e}async function be(t){t.innerHTML="",t.appendChild(P());const e=document.createElement("main");e.className="cb-home",e.innerHTML=`<p class="cb-loading">${T("loading")}</p>`,t.appendChild(e);let o;try{o=await G()}catch(s){e.innerHTML=`<p class="cb-error">Could not load domains. ${s.message}</p>`;return}const l=[...new Set(o.flatMap(s=>s.tags))].sort(),a=["intro","core","college","research"];let n="all",r="all";function m(){let s=o;n!=="all"&&(s=s.filter(c=>c.tags.includes(n))),r!=="all"&&(s=s.filter(c=>c.default_level===r)),e.innerHTML=`
      <div class="cb-home__filters">
        <span class="cb-filter-group">
          <span class="cb-filter-label">Subject</span>
          <button class="cb-filter-btn ${n==="all"?"active":""}" data-tag="all">All</button>
          ${l.map(c=>`<button class="cb-filter-btn ${n===c?"active":""}" data-tag="${c}">${c}</button>`).join("")}
        </span>
        <span class="cb-filter-right">
          <span class="cb-filter-label">Level</span>
          <select class="cb-level-select" id="cb-level-filter">
            <option value="all" ${r==="all"?"selected":""}>All</option>
            ${a.map(c=>`<option value="${c}" ${r===c?"selected":""}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`).join("")}
          </select>
        </span>
      </div>
      <div class="cb-card-grid"></div>
    `;const d=e.querySelector(".cb-card-grid");s.forEach(c=>d.appendChild(ue(c))),e.querySelectorAll(".cb-filter-btn[data-tag]").forEach(c=>{c.addEventListener("click",()=>{n=c.dataset.tag,m()})}),e.querySelector("#cb-level-filter").addEventListener("change",c=>{r=c.target.value,m()})}m()}const fe=[{code:"en",label:"English"},{code:"zh",label:"中文"},{code:"es",label:"Español"},{code:"fr",label:"Français"},{code:"de",label:"Deutsch"},{code:"ja",label:"日本語"},{code:"ko",label:"한국어"},{code:"pt",label:"Português"},{code:"ar",label:"العربية"},{code:"hi",label:"हिन्दी"}],he=["intro","core","college","research"];function ge(t,e){const o={};(e||[]).forEach(a=>{if(!a.name||!a.file)return;const n=o[a.name];(!n||n.model&&!a.model)&&(o[a.name]={file:a.file,model:a.model})});const l={};return Object.keys(o).forEach(a=>{l[a]=`/cb-data-science/domains/${t}/${o[a].file}`}),l}function ve(t,{level:e="intro",lang:o="en"}={}){const{id:l,books:a=[],generated_concepts:n=[],capstone:r}=t,m=document.createElement("div");m.className="cb-graph-viewer";const s=document.createElement("iframe");return s.className="cb-graph-viewer__frame",s.src=`/cb-data-science/domains/${l}/output/graph.html`,s.title=`${l} concept graph`,s.setAttribute("allowfullscreen",""),s.addEventListener("load",()=>{var d;try{const c=s.contentWindow;if(!c)return;c.eval("window.__cb_RAW = RAW; window.__cb_nodeIndex = nodeIndex"),c.__cb_CONCEPTS_BASE=`/cb-data-science/domains/${l}/output/${e}.${o}/html/`,c.__cb_CONCEPT_URLS=ge(l,n);const h=(((d=c.__cb_RAW)==null?void 0:d.nodes)||[]).map(b=>({id:b.id,label:b.label,kind:b.kind,tier:b.tier??0}));window.dispatchEvent(new CustomEvent("cb:graphLoaded",{detail:{concepts:h}}));const _=c.handleSelect;c.handleSelect=function(b){var p;_.call(c,b);const v=(p=c.__cb_nodeIndex)==null?void 0:p[b];v&&window.dispatchEvent(new CustomEvent("cb:nodeSelected",{detail:{nodeId:b,node:v}}))},ye(c,s.contentDocument),xe(c,s.contentDocument,l,a,n,e,o),_e(c,s.contentDocument,l,r,e,o,a)}catch{}}),m.appendChild(s),m.selectNode=d=>{var c,h;try{(h=(c=s.contentWindow)==null?void 0:c.selectNode)==null||h.call(c,d)}catch{}},m}function ye(t,e){if(e.querySelector("#cb-sidebar-theme"))return;const o=e.createElement("style");o.id="cb-sidebar-theme",o.textContent=`
    .app { grid-template-columns: 260px 1fr 220px !important; }
    #path-sidebar {
      background: #1e3a5f !important;
      color: #e8f0fe !important;
      border-right-color: rgba(255,255,255,0.12) !important;
    }
    #path-header { border-bottom-color: rgba(255,255,255,0.12) !important; }
    #path-header h1 { color: #90b4e8 !important; }
    #path-header .domain-name { color: #a8c8f0 !important; }
    #path-count { color: #90b4e8 !important; }
    #path-steps .hint { color: #90b4e8 !important; }
    .step-item:hover { background: rgba(255,255,255,0.07) !important; }
    .step-item.active { background: rgba(74,144,217,0.25) !important; border-left-color: #60a5fa !important; }
    .step-item.target { background: rgba(76,175,80,0.18) !important; border-left-color: #4caf50 !important; }
    .step-label { color: #e8f0fe !important; }
    .step-def { color: #90b4e8 !important; }
    .step-num { color: #90b4e8 !important; }
    .step-item.target .step-num { color: #6fcf73 !important; }
    /* Fix node-type badge colors to match the graph */
    .primitive-k { background: #fffde7 !important; color: #795548 !important; }
    .concept-k   { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .application-k { background: #fce4ec !important; color: #c62828 !important; }
    /* Notes sidebar — match the dark theme applied to #path-sidebar above;
       the generated graph.html ships it light/cream by default. */
    #notes-sidebar {
      background: #1e3a5f !important;
      color: #e8f0fe !important;
      border-left-color: rgba(255,255,255,0.12) !important;
    }
    #notes-header { border-bottom-color: rgba(255,255,255,0.12) !important; }
    #notes-header h2 { color: #90b4e8 !important; }
    #notes-node-label { color: #a8c8f0 !important; }
    .nb-btn {
      background: rgba(255,255,255,0.1) !important;
      border-color: rgba(255,255,255,0.25) !important;
      color: #cfe0f7 !important;
    }
    .nb-btn:hover { background: rgba(255,255,255,0.18) !important; color: #fff !important; }
    #notes-textarea { background: #1e3a5f !important; color: #e8f0fe !important; }
    #notes-textarea::placeholder { color: #6f93bf !important; }
    #notes-with-entries { border-top-color: rgba(255,255,255,0.12) !important; }
    .note-entry { border-bottom-color: rgba(255,255,255,0.08) !important; }
    .note-entry:hover { background: rgba(255,255,255,0.07) !important; }
    .note-entry .note-node { color: #e8f0fe !important; }
    .note-entry .note-ts { color: #90b4e8 !important; }
    .note-entry .note-preview { color: #90b4e8 !important; }
  `,e.head.appendChild(o);const l=e.querySelector("#path-steps");if(l&&!e.querySelector("#cb-node-legend")){const a=e.createElement("div");a.id="cb-node-legend",a.style.cssText="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0",a.innerHTML=`
      <div style="font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:#90b4e8;font-weight:700;margin-bottom:6px">Node Types</div>
      <div style="display:flex;flex-direction:row;flex-wrap:wrap;gap:8px">
        <span style="display:flex;align-items:center;gap:5px;font-size:10px;color:#e8f0fe">
          <span style="display:inline-block;width:16px;height:10px;background:#fffde7;border:1px solid #795548;border-radius:2px;flex-shrink:0"></span>Primitive
        </span>
        <span style="display:flex;align-items:center;gap:5px;font-size:10px;color:#e8f0fe">
          <span style="display:inline-block;width:16px;height:10px;background:#e8f5e9;border:1px solid #2e7d32;border-radius:50%;flex-shrink:0"></span>Concept
        </span>
        <span style="display:flex;align-items:center;gap:5px;font-size:10px;color:#e8f0fe">
          <span style="display:inline-block;width:16px;height:10px;background:#fce4ec;border:1px solid #c62828;border-radius:2px;flex-shrink:0"></span>Application
        </span>
      </div>
    `,l.insertAdjacentElement("beforebegin",a)}}const ee=["flex:1","min-width:0","padding:5px 6px","border:1px solid rgba(255,255,255,0.3)","border-radius:5px","background:#fff","color:#2a2a2a","font-size:12px","font-family:system-ui,sans-serif","box-sizing:border-box"].join(";"),V=["flex-shrink:0","padding:5px 10px","background:#2563eb","color:#fff","border:none","border-radius:5px","font-size:12px","cursor:pointer","font-family:system-ui,sans-serif"].join(";"),j=V+";opacity:.4;cursor:default",te="display:flex;gap:6px;align-items:center;margin-bottom:10px",ne=["font-size:10px","letter-spacing:.06em","text-transform:uppercase","color:#90b4e8","font-weight:700","margin-bottom:4px"].join(";"),le="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.1);flex-shrink:0;background:#1e3a5f",se="font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#90b4e8;font-weight:700;margin-bottom:8px";function B(t,e,o,l=""){return l&&/output\/[^/]+\/[^/]+\/html\//.test(t)?t.replace(/output\/[^/]+\/[^/]+\/html\//,`output/${e}.${o}/${l}/html/`):t.replace(/output\/[^/]+\/html\//,`output/${e}.${o}/html/`)}function xe(t,e,o,l,a,n,r){const m=e.querySelector("#path-header");if(!m||e.querySelector("#cb-read"))return;const s=[...l].sort((i,f)=>i.target.localeCompare(f.target)),d=[...a].sort((i,f)=>i.label.localeCompare(f.label)),c="margin-top:4px;font-size:11px;color:#fca5a5;display:none",h=new Set(s.map(i=>i.model).filter(Boolean)),_=new Set(d.map(i=>i.model).filter(Boolean)),b=h.size>1,v=_.size>1,p=s.length>0?`
    <div style="${ne}">TOC Index</div>
    <div style="${te}">
      <select id="cb-book-sel" style="${ee}">
        <option value="">Select book…</option>
        ${s.map(i=>{const f=i.target.replace(/_/g," ")+(b&&i.model?` (${i.model})`:"");return`<option value="${B(i.file,n,r,i.model||"")}" data-orig="${i.file}" data-model="${i.model||""}">${f}</option>`}).join("")}
      </select>
      <button id="cb-book-btn" disabled style="${j}">Open</button>
    </div>
    <div id="cb-book-warn" style="${c}"></div>
  `:"",u=d.length>0?`
    <div style="${ne}">Concept</div>
    <div style="${te}">
      <select id="cb-cpt-sel" style="${ee}">
        <option value="">Select concept…</option>
        ${d.map(i=>{const f=i.label+(v&&i.model?` (${i.model})`:"");return`<option value="${B(i.file,n,r,i.model||"")}" data-orig="${i.file}" data-model="${i.model||""}">${f}</option>`}).join("")}
      </select>
      <button id="cb-cpt-btn" disabled style="${j}">Open</button>
    </div>
    <div id="cb-cpt-warn" style="${c}"></div>
  `:"",g=e.createElement("div");g.id="cb-read",g.style.cssText=le,g.innerHTML=`
    <div style="${se}">Concept Books</div>
    ${p}
    ${u}
  `,m.insertAdjacentElement("afterend",g);function x(i,f){i.textContent=f,i.style.display="block"}async function y(i){try{const f=await fetch(i);if(!f.ok)return!1;const C=await f.text();return C.includes("spl-credit")||C.includes("Generated by")}catch{return!1}}function E(i,f){const C=`/cb-data-science/domains/${o}/${i}`;y(C).then(w=>{w?window.location.hash=`/book?domain=${o}&file=${encodeURIComponent(i)}`:x(f,"No content available for this level/language combination.")})}if(e.addEventListener("cb:settings-change",({detail:{level:i,lang:f}})=>{g.querySelectorAll("#cb-book-sel option[data-orig]").forEach(C=>{C.value=B(C.dataset.orig,i,f,C.dataset.model)}),g.querySelectorAll("#cb-cpt-sel option[data-orig]").forEach(C=>{C.value=B(C.dataset.orig,i,f,C.dataset.model)}),e.querySelector("#cb-book-warn")&&(e.querySelector("#cb-book-warn").style.display="none"),e.querySelector("#cb-cpt-warn")&&(e.querySelector("#cb-cpt-warn").style.display="none")}),s.length>0){const i=g.querySelector("#cb-book-sel"),f=g.querySelector("#cb-book-btn"),C=g.querySelector("#cb-book-warn");i.addEventListener("change",()=>{f.disabled=!i.value,f.style.cssText=i.value?V:j,C.style.display="none"}),f.addEventListener("click",()=>{i.value&&E(i.value,C)})}if(d.length>0){const i=g.querySelector("#cb-cpt-sel"),f=g.querySelector("#cb-cpt-btn"),C=g.querySelector("#cb-cpt-warn");i.addEventListener("change",()=>{f.disabled=!i.value,f.style.cssText=i.value?V:j,C.style.display="none"}),f.addEventListener("click",()=>{i.value&&E(i.value,C)})}}function _e(t,e,o,l,a,n,r=[]){var M;const m=e.querySelector("#path-header");if(!m||e.querySelector("#cb-gen"))return;const s=["width:100%","padding:5px 8px","border:1px solid rgba(255,255,255,0.3)","border-radius:5px","background:#fff","color:#2a2a2a","font-size:12px","margin-bottom:6px","font-family:system-ui,sans-serif"].join(";"),d=e.createElement("div");d.id="cb-gen",d.style.cssText=le,d.innerHTML=`
    <div style="${se}">Generate Book</div>
    <select id="cb-target-sel" style="${s}">
      <option value="">Select target concept…</option>
    </select>
    <select id="cb-model-sel" style="${s}">
      <option value="gemma3">gemma3 — local (Ollama)</option>
      <option value="gemma4">gemma4 — local (Ollama)</option>
      <option value="sonnet" selected>sonnet — premium, default (Claude API)</option>
      <option value="haiku">haiku — fast, premium (Claude API)</option>
      <option value="opus">opus — best quality (Claude API)</option>
    </select>
    <div style="display:flex;gap:6px;margin-bottom:6px">
      <select id="cb-level-sel" style="flex:1;padding:5px 6px;border:1px solid rgba(255,255,255,0.3);border-radius:5px;background:#fff;color:#2a2a2a;font-size:12px;font-family:system-ui,sans-serif">
        ${he.map(k=>`<option value="${k}" ${k===a?"selected":""}>${k.charAt(0).toUpperCase()+k.slice(1)}</option>`).join("")}
      </select>
      <select id="cb-lang-sel" style="flex:1;padding:5px 6px;border:1px solid rgba(255,255,255,0.3);border-radius:5px;background:#fff;color:#2a2a2a;font-size:12px;font-family:system-ui,sans-serif">
        ${fe.map(k=>`<option value="${k.code}" ${k.code===n?"selected":""}>${k.label}</option>`).join("")}
      </select>
    </div>
    <label style="display:flex;align-items:center;gap:5px;font-size:11px;color:#90b4e8;margin-bottom:6px;font-family:system-ui,sans-serif;cursor:pointer">
      <input type="checkbox" id="cb-skip-cache"> Skip cache
    </label>
    <div style="display:flex;gap:6px">
      <button id="cb-gen-btn" disabled
        style="flex:1;padding:6px 10px;background:#2563eb;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif">
        Generate
      </button>
      <button id="cb-pdf-btn" disabled
        style="flex:1;padding:6px 10px;background:#16a34a;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;font-family:system-ui,sans-serif">
        PDF
      </button>
    </div>
    <div id="cb-pdf-result" style="display:none;gap:6px;margin-top:6px"></div>
    <div style="position:relative">
      <pre id="cb-gen-log"
        style="display:none;margin-top:8px;font-size:10px;line-height:1.5;color:#e8f0fe;background:rgba(0,0,0,0.3);padding:8px;border-radius:4px;max-height:160px;overflow-y:auto;white-space:pre-wrap;font-family:Menlo,Consolas,monospace"></pre>
      <button id="cb-gen-copy"
        style="display:none;position:absolute;top:12px;right:4px;padding:2px 8px;font-size:10px;background:#2563eb;border:none;border-radius:3px;cursor:pointer;font-family:system-ui,sans-serif;color:#fff">Copy</button>
    </div>
  `,m.insertAdjacentElement("afterend",d);const c=d.querySelector("#cb-target-sel"),h=d.querySelector("#cb-model-sel"),_=d.querySelector("#cb-level-sel"),b=d.querySelector("#cb-lang-sel"),v=d.querySelector("#cb-skip-cache"),p=d.querySelector("#cb-gen-btn"),u=d.querySelector("#cb-pdf-btn"),g=d.querySelector("#cb-pdf-result"),x=d.querySelector("#cb-gen-log"),y=d.querySelector("#cb-gen-copy");function E(){e.dispatchEvent(new CustomEvent("cb:settings-change",{detail:{level:_.value,lang:b.value}}))}_.addEventListener("change",E),b.addEventListener("change",E),y.addEventListener("click",()=>{navigator.clipboard.writeText(x.textContent).then(()=>{y.textContent="Copied!",setTimeout(()=>{y.textContent="Copy"},1500)})});const i=`cb_gen_target_${o}`,f=(((M=t.__cb_RAW)==null?void 0:M.nodes)||[]).filter(k=>k.kind!=="primitive").sort((k,L)=>k.label.localeCompare(L.label)),C=sessionStorage.getItem(i),w=C&&f.some(k=>k.id===C)?C:l;f.forEach(k=>{const L=e.createElement("option");L.value=k.id,L.textContent=k.label,k.id===w&&(L.selected=!0),c.appendChild(L)}),c.value&&(p.disabled=!1,u.disabled=!1),c.addEventListener("change",()=>{c.value&&sessionStorage.setItem(i,c.value),p.disabled=!c.value,u.disabled=!c.value,u.textContent="PDF",u.style.background="#16a34a",g.style.display="none",g.innerHTML=""}),u.addEventListener("click",async()=>{const k=c.value;if(!k)return;const L=_.value,F=b.value;u.disabled=!0,u.textContent="Generating…",u.style.background="#ea580c";try{const I=`/api/pdf?domain=${encodeURIComponent(o)}&target=${encodeURIComponent(k)}&level=${encodeURIComponent(L)}&language=${encodeURIComponent(F)}`,O=await fetch(I),R=await O.json();if(!O.ok)throw new Error(R.detail||"PDF generation failed");const q=`/cb-data-science/domains/${o}/${R.file}`;u.textContent="PDF ✓",u.disabled=!1,g.innerHTML=`
        <a href="${q}" download
           style="flex:1;padding:6px 10px;background:#16a34a;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;text-align:center;text-decoration:none;font-family:system-ui,sans-serif">
          ⬇ Download
        </a>
        <a href="${q}" target="_blank"
           style="flex:1;padding:6px 10px;background:#0369a1;color:#fff;border:none;border-radius:5px;font-size:12px;cursor:pointer;text-align:center;text-decoration:none;font-family:system-ui,sans-serif">
          ↗ Open
        </a>
      `,g.style.display="flex"}catch(I){u.textContent="Error",u.style.background="#dc2626",u.title=I.message,setTimeout(()=>{u.textContent="PDF",u.style.background="#16a34a",u.disabled=!1},3e3)}}),p.addEventListener("click",()=>{const k=c.value;if(!k)return;sessionStorage.setItem(i,k);const L=h.value,F=_.value,I=b.value,O=v.checked;p.disabled=!0,p.textContent="Generating…",p.style.background="#ea580c",x.style.display="block",y.style.display="block",x.textContent=`▶ target: ${k}  model: ${L}
`;const R=`/api/generate?domain=${encodeURIComponent(o)}&target=${encodeURIComponent(k)}&level=${encodeURIComponent(F)}&language=${encodeURIComponent(I)}&model=${encodeURIComponent(L)}${O?"&skip_cache=true":""}`,S=new t.EventSource(R);S.addEventListener("log",q=>{const{message:ie}=JSON.parse(q.data);x.textContent+=ie+`
`,x.scrollTop=x.scrollHeight}),S.addEventListener("done",()=>{S.close(),x.textContent+=`
✓ Done — reloading…`,setTimeout(()=>t.parent.location.reload(),1200)}),S.addEventListener("gen_error",q=>{S.close(),x.textContent+=`
✗ ${JSON.parse(q.data).message}`,p.disabled=!1,p.textContent="Retry",p.style.background="#dc2626"}),S.onerror=()=>{S.readyState!==t.EventSource.CLOSED&&(S.close(),x.textContent+=`
✗ API not reachable.
  Run: bash scripts/start-api.sh`,p.disabled=!1,p.textContent="Retry",p.style.background="#dc2626")}})}function Ce(){return oe()}const U={claude_cli:{label:"Claude CLI",models:[{value:"claude-sonnet-4-6",label:"Sonnet 4.6"},{value:"claude-haiku-4-5-20251001",label:"Haiku 4.5"},{value:"claude-opus-4-8",label:"Opus 4.8"}]},openrouter:{label:"OpenRouter",models:[{value:"anthropic/claude-sonnet-4-6",label:"Claude Sonnet 4.6"},{value:"anthropic/claude-haiku-4-5-20251001",label:"Claude Haiku 4.5"},{value:"anthropic/claude-opus-4-8",label:"Claude Opus 4.8"},{value:"google/gemini-2.5-pro",label:"Gemini 2.5 Pro"},{value:"google/gemini-2.5-flash",label:"Gemini 2.5 Flash"},{value:"google/gemini-3.5-flash",label:"Gemini 3.5 Flash"},{value:"openai/gpt-4.1",label:"GPT-4.1"},{value:"openai/gpt-5.4-mini",label:"GPT 5.4 Mini"},{value:"openai/o3-mini",label:"o3-mini"},{value:"deepseek/deepseek-r1",label:"DeepSeek R1"},{value:"meta-llama/llama-4-maverick",label:"Llama 4 Maverick"},{value:"z-ai/glm-5.2",label:"GLM 5.2"},{value:"qwen/qwen3.5-35b-a3b",label:"Qwen 3.5 35B"},{value:"qwen/qwen3.6-35b-a3b",label:"Qwen 3.6 35B"},{value:"nvidia/nemotron-3-ultra-550b-a55b:free",label:"Nemotron 3 Ultra 550B"},{value:"moonshotai/kimi-k2.6",label:"Kimi 2.6"}]},ollama:{label:"Ollama (local)",models:null}};async function W(t,e){const o=U[t.value];if(e.innerHTML="",!o)return;let l=o.models;if(t.value==="ollama"&&!l){try{const a=await fetch("/api/settings/ollama-models");a.ok&&(l=await a.json())}catch{}if(!l||l.length===0){const a=document.createElement("option");a.value="",a.textContent="(ollama not available)",e.appendChild(a);return}U.ollama.models=l}for(const a of l){const n=document.createElement("option");n.value=a.value,n.textContent=a.label,e.appendChild(n)}}function K(t){if(t===0)return"never expires";if(t<1)return`${Math.round(t*60)} min`;if(t===1)return"1 hour";if(t<24)return`${t} hours`;const e=t/24;return Number.isInteger(e)?`${e} day${e>1?"s":""}`:`${t} hours`}async function ke(t){t.innerHTML="",t.appendChild(P());const e=document.createElement("main");e.className="cb-settings",e.innerHTML=`
    <h2>Settings</h2>
    <section class="cb-settings__section">
      <div class="cb-settings__section-title">SPL Adapter and Model Configuration</div>
      <div class="cb-settings__pair">
        <div class="cb-settings__field">
          <label class="cb-settings__label">Adapter</label>
          <select id="cb-adapter" class="cb-settings__select">
            ${Object.entries(U).map(([p,u])=>`<option value="${p}">${u.label}</option>`).join("")}
          </select>
        </div>
        <div class="cb-settings__field cb-settings__field--grow">
          <label class="cb-settings__label">Model</label>
          <select id="cb-model" class="cb-settings__select"></select>
        </div>
      </div>
      <div class="cb-settings__row" style="margin-top:16px">
        <button id="cb-settings-save" class="cb-btn">Save</button>
        <span id="cb-settings-status" class="cb-settings__status"></span>
      </div>
      <div class="cb-settings__current" id="cb-current-llm"></div>
    </section>
    <section class="cb-settings__section">
      <div class="cb-settings__section-title">SPL Execution Limits</div>
      <div class="cb-settings__pair">
        <div class="cb-settings__field">
          <label class="cb-settings__label">While Max Iterations</label>
          <input id="cb-while-max-iter" type="number" min="1" step="1" value="50"
            class="cb-settings__select" style="width:100px"
            title="SPL_WHILE_MAX_ITER — max loop iterations before abort (default 15).">
        </div>
        <div class="cb-settings__field">
          <label class="cb-settings__label">Max LLM Calls</label>
          <input id="cb-max-llm-calls" type="number" min="1" step="1" value="50"
            class="cb-settings__select" style="width:100px"
            title="SPL_MAX_LLM_CALLS — max LLM GENERATE calls per workflow run.">
        </div>
      </div>
      <div class="cb-settings__row" style="margin-top:16px">
        <button id="cb-spl-limits-save" class="cb-btn">Save</button>
        <span id="cb-spl-limits-status" class="cb-settings__status"></span>
      </div>
    </section>
    <section class="cb-settings__section">
      <div class="cb-settings__section-title">AI Semantic Compare Cache</div>
      <div class="cb-settings__pair">
        <div class="cb-settings__field">
          <label class="cb-settings__label">TTL (hours)</label>
          <input id="cb-cache-ttl" type="number" min="0" step="1" value="24"
            class="cb-settings__select" style="width:100px"
            title="How long a cached comparison result is reused. 0 = never expire.">
        </div>
        <div class="cb-settings__field" style="align-self:flex-end;padding-bottom:4px">
          <span id="cb-cache-ttl-hint" style="font-size:0.82rem;color:#6b7280"></span>
        </div>
      </div>
      <div class="cb-settings__row" style="margin-top:16px">
        <button id="cb-cache-save" class="cb-btn">Save</button>
        <span id="cb-cache-status" class="cb-settings__status"></span>
      </div>
    </section>
  `,t.appendChild(e);const o=e.querySelector("#cb-adapter"),l=e.querySelector("#cb-model"),a=e.querySelector("#cb-settings-save"),n=e.querySelector("#cb-settings-status"),r=e.querySelector("#cb-current-llm");o.addEventListener("change",()=>W(o,l)),await W(o,l);const m=e.querySelector("#cb-while-max-iter"),s=e.querySelector("#cb-max-llm-calls"),d=e.querySelector("#cb-spl-limits-save"),c=e.querySelector("#cb-spl-limits-status"),h=e.querySelector("#cb-cache-ttl"),_=e.querySelector("#cb-cache-ttl-hint"),b=e.querySelector("#cb-cache-save"),v=e.querySelector("#cb-cache-status");h.addEventListener("input",()=>{const p=Number(h.value);_.textContent=isNaN(p)||p<0?"":K(p)});try{const p=await fetch("/api/settings");if(p.ok){const u=await p.json();r.textContent=`Current: ${u.llm}`;const[g,...x]=u.llm.split(":"),y=x.join(":");U[g]&&(o.value=g,await W(o,l),[...l.options].some(i=>i.value===y)&&(l.value=y)),u.spl_while_max_iter&&(m.value=u.spl_while_max_iter),u.spl_max_llm_calls&&(s.value=u.spl_max_llm_calls);const E=Math.round(u.compare_cache_ttl/3600);h.value=E,_.textContent=K(E)}}catch{n.textContent="API not reachable — run the backend to change settings",n.style.color="#dc2626"}a.addEventListener("click",async()=>{const p=`${o.value}:${l.value}`;try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({llm:p})})).ok?(r.textContent=`Current: ${p}`,n.textContent="Saved",n.style.color="#16a34a"):(n.textContent="Save failed",n.style.color="#dc2626")}catch{n.textContent="API not reachable",n.style.color="#dc2626"}setTimeout(()=>{n.textContent=""},3e3)}),d.addEventListener("click",async()=>{const p=Number(m.value),u=Number(s.value);if(!Number.isInteger(p)||p<1||!Number.isInteger(u)||u<1){c.textContent="Enter valid integers ≥ 1",c.style.color="#dc2626",setTimeout(()=>{c.textContent=""},3e3);return}try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({spl_while_max_iter:p,spl_max_llm_calls:u})})).ok?(c.textContent="Saved",c.style.color="#16a34a"):(c.textContent="Save failed",c.style.color="#dc2626")}catch{c.textContent="API not reachable",c.style.color="#dc2626"}setTimeout(()=>{c.textContent=""},3e3)}),b.addEventListener("click",async()=>{const p=Number(h.value);if(isNaN(p)||p<0){v.textContent="Enter a valid number ≥ 0",v.style.color="#dc2626",setTimeout(()=>{v.textContent=""},3e3);return}const u=Math.round(p*3600);try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({compare_cache_ttl:u})})).ok?(_.textContent=K(p),v.textContent="Saved",v.style.color="#16a34a"):(v.textContent="Save failed",v.style.color="#dc2626")}catch{v.textContent="API not reachable",v.style.color="#dc2626"}setTimeout(()=>{v.textContent=""},3e3)})}async function ce(t,{id:e}={}){t.innerHTML="";const o=Symbol();t._renderKey=o;let l=null,a=[];try{a=await G(),e&&(l=a.find(b=>b.id===e)??{id:e,name:e,has_book:!1,books:[],generated_concepts:[],capstone:null})}catch{}if(t._renderKey!==o)return;const n=document.createElement("div");n.style.cssText="display:flex;flex-direction:column;height:100vh;overflow:hidden",t.appendChild(n),n.appendChild(P({domainName:(l==null?void 0:l.name)||""}));const r=document.createElement("div");r.className="cb-domain-picker-bar";const m=document.createElement("span");m.className="cb-domain-picker-bar__label",m.textContent="Domain",r.appendChild(m);const s=document.createElement("select");s.className="cb-domain-picker-bar__select";const d=document.createElement("option");if(d.value="",d.textContent="Select domain…",s.appendChild(d),[...a].sort((b,v)=>b.id.localeCompare(v.id,"zh")).forEach(b=>{const v=document.createElement("option");v.value=b.id,v.textContent=b.name||b.id,b.id===e&&(v.selected=!0),s.appendChild(v)}),s.addEventListener("change",()=>{s.value&&(window.location.hash=`/domain/${encodeURIComponent(s.value)}`)}),r.appendChild(s),n.appendChild(r),!e||!l)return;if(l.source){const b=document.createElement("div");b.className="cb-attribution",b.innerHTML=`Source: <a href="${l.source.url}" target="_blank">${l.source.title}</a> by ${l.source.authors} (${l.source.license}). ${l.source.attribution}`,n.appendChild(b)}const c=document.createElement("main");c.className="cb-domain";const h=l.default_level||"intro",_=Ce();c.appendChild(ve(l,{level:h,lang:_})),n.appendChild(c)}function Ee(t){t.innerHTML="",t.appendChild(P());const e=document.createElement("main");e.className="cb-about",e.innerHTML=`
    <h1>About concept-book</h1>
    <p>
      <strong>concept-book</strong> is an open portal that lets any learner explore a knowledge
      domain through its <em>concept graph</em> — a directed acyclic graph (DAG) where nodes
      are concepts (primitive, concept, application) and edges are prerequisite relationships.
    </p>

    <h2>How to use it</h2>
    <ol>
      <li>Pick a domain from the home page</li>
      <li>Click any concept node in the interactive graph</li>
      <li>The left sidebar shows the ordered learning path — the exact sequence of concepts you must master first</li>
      <li>Read the concept-book section for each concept in the path</li>
    </ol>

    <h2>The founding use-case: Chinese Characters</h2>
    <p>
      Chinese characters share the same structure as chemical elements — a small set of
      elemental radicals (primitives) combine to form hundreds of compound characters.
      Learning the ~12 elementals unlocks the ability to decode characters by structure alone.
      The concept graph makes that derivation visible and navigable.
    </p>

    <h2>The content engine</h2>
    <p>
      All domain graphs and concept-book text are generated by
      <a href="https://github.com/digital-duck/SPL.py" target="_blank" rel="noopener">SPL.py</a>
      — a structured programming language for LLM-driven content generation with math verification.
      concept-book is the web-app layer that hosts and presents what SPL.py produces.
    </p>

    <h2>Open source</h2>
    <p>
      concept-book is open source under the Apache 2.0 license.
      Source and contribution guide at
      <a href="https://github.com/digital-duck/concept-book" target="_blank" rel="noopener">github.com/digital-duck/concept-book</a>.
    </p>
  `,t.appendChild(e)}const we=["intro","core","college","research"],Le=[{value:"",label:"— default —"},{value:"gemma3",label:"gemma3 (Ollama)"},{value:"gemma4",label:"gemma4 (Ollama)"},{value:"sonnet",label:"sonnet (Claude)"},{value:"haiku",label:"haiku (Claude)"},{value:"opus",label:"opus (Claude)"}];function Se(t){const e=t.match(/output\/([^.]+)\.([^/]+)\//);return e?{level:e[1],lang:e[2]}:{level:"college",lang:"en"}}function D(t){const e=t.match(/output\/[^/]+\/([^/]+)\/html\//);return e?e[1]:""}function Q(t){return t.replace(/^.*\//,"")}function $e(t,e,o,l,a){const n=Q(e),r=a?`${a}/`:"";return`/cb-data-science/domains/${t}/output/${o}.${l}/${r}html/${n}`}const N=new Map;function Te(t,e){e.forEach(o=>{const l=`/cb-data-science/domains/${encodeURIComponent(t)}/${o.file}`;N.set(l,!0)})}async function Ne(t){if(N.has(t))return N.get(t);try{const e=await fetch(t);if(!e.ok)return N.set(t,!1),!1;const o=await e.text(),l=o.includes("spl-credit")||o.includes("Generated by");return N.set(t,l),l}catch{return N.set(t,!1),!1}}function Me(){N.clear()}function qe(t,e,o,l){const a=decodeURIComponent(t).replace(/^(?:concept|book)_/,"").replace(/_/g," ").replace(/\.html$/,"");return`<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:48px 40px;color:#374151;background:#fafafa;min-height:100vh">
    <h2 style="color:#1e3a5f;margin:0 0 16px;font-size:1.3rem">Content Not Available</h2>
    <p style="margin:0 0 12px;font-size:0.9rem;color:#6b7280">No page exists for this combination:</p>
    <div style="background:#fff;border:1px solid #e0e3e8;border-radius:8px;padding:16px 20px;margin-bottom:24px;display:inline-block">
      <div style="margin-bottom:6px"><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Model:</span><span style="color:#2563eb">${e||"default"}</span></div>
      <div style="margin-bottom:6px"><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Level:</span><span style="color:#2563eb">${l}</span></div>
      <div><span style="font-weight:600;color:#374151;min-width:80px;display:inline-block">Language:</span><span style="color:#2563eb">${o}</span></div>
    </div>
    <p style="color:#6b7280;font-size:0.88rem;line-height:1.6">Please generate the concept book for <strong style="color:#1e3a5f">${a}</strong> first via the Concept-Graph page.</p>
  </body></html>`}function J(t,e,o){const l=document.createElement("select");return l.className=o,t.forEach(({value:a,label:n})=>{const r=document.createElement("option");r.value=a,r.textContent=n,a===e&&(r.selected=!0),l.appendChild(r)}),l}function Ae(t,e,o,l){const a=document.createElement("div");a.className="cb-book-pane__controls";const n=J(Le,e.model,"cb-book-pane__select");n.title="Model",n.addEventListener("change",()=>o("model",n.value)),a.appendChild(n);const r=J(we.map(s=>({value:s,label:s.charAt(0).toUpperCase()+s.slice(1)})),e.level,"cb-book-pane__select");r.title="Level",r.addEventListener("change",()=>o("level",r.value)),a.appendChild(r);const m=J(ae.map(s=>({value:s.code,label:s.label})),e.lang,"cb-book-pane__select");if(m.title="Language",m.addEventListener("change",()=>o("lang",m.value)),a.appendChild(m),l){const s=document.createElement("button");s.type="button",s.className="cb-book-pane__refresh",s.title="Refresh — re-check for content that just finished generating",s.textContent="🔄",s.addEventListener("click",l),a.appendChild(s)}return a}function He(t,e,{onConceptClick:o}){t.innerHTML="";try{const l=e.contentDocument,a=l==null?void 0:l.querySelector("nav.toc");if(!a){t.innerHTML='<div style="color:#90b4e8;font-size:11px;padding:4px 0">No table of contents for this page.</div>';return}const n=document.createElement("div");n.style.cssText="font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#90b4e8;margin-bottom:14px;font-family:system-ui,sans-serif;font-weight:700",n.textContent="Contents",t.appendChild(n);const r=a.querySelector("ol");if(r){const s=document.createElement("ol");s.style.cssText="list-style:decimal inside;padding:0;margin:0;flex:1",r.querySelectorAll("li").forEach(d=>{const c=d.querySelector("a");if(!c)return;const h=d.classList.contains("toc-target"),_=document.createElement("li");_.style.cssText=`margin-bottom:7px;font-size:.85rem;line-height:1.4;font-family:system-ui,sans-serif${h?";font-weight:700":""}`;const b=document.createElement("a");b.textContent=c.textContent,b.href="#",b.style.cssText=`text-decoration:none;color:${h?"#fff":"#a8c8f0"}`,b.addEventListener("mouseover",()=>{b.style.color="#fff"}),b.addEventListener("mouseout",()=>{b.style.color=h?"#fff":"#a8c8f0"}),b.addEventListener("click",v=>{v.preventDefault(),o(c.getAttribute("href"))}),_.appendChild(b),s.appendChild(_)}),t.appendChild(s)}if(a.querySelector(".spl-credit")){const s=document.createElement("div");s.style.cssText="margin-top:auto;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15);font-size:11px;color:#90b4e8;font-family:system-ui,sans-serif",s.textContent="Generated by SPL",t.appendChild(s)}}catch{}}function Ie(t){try{const e=t.contentDocument;if(!e)return;const o=e.createElement("style");o.textContent="nav.toc { display: none !important; } .page { grid-template-columns: 1fr !important; } h1.book-title + section > h2:first-child { display: none !important; }",e.head.appendChild(o)}catch{}}async function Pe(){try{return(await G()).map(e=>e.id)}catch{return[]}}async function Oe(t){try{const o=(await G()).find(n=>n.id===t)??{},l=(o.books||[]).map(n=>({file:n.file,label:n.target.replace(/_/g," ").trim()||n.target,model:n.model||D(n.file)})),a=(o.generated_concepts||[]).map(n=>({file:n.file,label:n.label,model:n.model||D(n.file)}));return Te(t,[...l,...a]),{books:l,concepts:a}}catch{return{books:[],concepts:[]}}}function Re(t,e){const o=document.createElement("nav");o.className="cb-book-nav";const l=document.createElement("div");l.className="cb-book-nav__title",l.textContent="Concept Books",o.appendChild(l);function a(x){const y=document.createElement("div");return y.className="cb-book-nav__label",y.textContent=x,y}o.appendChild(a("Domain"));const n=document.createElement("select");n.className="cb-book-nav__select",o.appendChild(n),o.appendChild(a("Model"));const r=document.createElement("select");r.className="cb-book-nav__select",r.innerHTML='<option value="">— all —</option>',o.appendChild(r),o.appendChild(a("TOC Index"));const m=document.createElement("select");m.className="cb-book-nav__select",o.appendChild(m),o.appendChild(a("Concept"));const s=document.createElement("select");s.className="cb-book-nav__select",o.appendChild(s);const d=document.createElement("button");d.textContent="Open",d.disabled=!0,d.className="cb-book-nav__open",o.appendChild(d);function c(){d.disabled=!n.value||!m.value&&!s.value}let h=[],_=[];function b(){const x=r.value,y=x?h.filter(i=>!i.model||i.model===x):h,E=x?_.filter(i=>!i.model||i.model===x):_;m.innerHTML='<option value="">Select book…</option>',s.innerHTML='<option value="">Select concept…</option>',y.forEach(i=>{const f=document.createElement("option");f.value=i.file,f.textContent=i.label,i.file===e&&(f.selected=!0),m.appendChild(f)}),E.forEach(i=>{const f=document.createElement("option");f.value=i.file,f.textContent=i.label,i.file===e&&(f.selected=!0),s.appendChild(f)}),c()}async function v(x){m.innerHTML='<option value="">Loading…</option>',s.innerHTML='<option value="">Loading…</option>',r.innerHTML='<option value="">Loading…</option>',c();const{books:y,concepts:E}=await Oe(x);h=y,_=E;const i=new Set;y.forEach(w=>{w.model&&i.add(w.model)}),E.forEach(w=>{w.model&&i.add(w.model)});const f=[...i].sort();r.innerHTML='<option value="">— all —</option>',f.forEach(w=>{const M=document.createElement("option");M.value=w,M.textContent=w,r.appendChild(M)});const C=e?D(e):"";C&&i.has(C)?r.value=C:i.has("sonnet")&&(r.value="sonnet"),b()}async function p(){n.innerHTML='<option value="">Loading…</option>',m.innerHTML='<option value="">—</option>',s.innerHTML='<option value="">—</option>',c();const x=await Pe();n.innerHTML='<option value="">Select domain…</option>',[...x].sort((y,E)=>y.localeCompare(E,"zh")).forEach(y=>{const E=document.createElement("option");E.value=y,E.textContent=y,y===t&&(E.selected=!0),n.appendChild(E)}),n.value?await v(n.value):c()}n.addEventListener("change",()=>{n.value?v(n.value):(m.innerHTML='<option value="">—</option>',s.innerHTML='<option value="">—</option>',r.innerHTML='<option value="">— all —</option>',h=[],_=[],c())}),r.addEventListener("change",b),m.addEventListener("change",()=>{m.value&&(s.value=""),c()}),s.addEventListener("change",()=>{s.value&&(m.value=""),c()}),d.addEventListener("click",()=>{const x=m.value||s.value,y=n.value;x&&y&&(window.location.hash=`/book?domain=${encodeURIComponent(y)}&file=${encodeURIComponent(x)}`)});const u=document.createElement("div");u.style.cssText="border-top:1px solid rgba(255,255,255,0.15);margin:10px 0 8px;flex-shrink:0",o.appendChild(u);const g=document.createElement("div");return g.style.cssText="flex:1;overflow-y:auto;min-height:0;display:flex;flex-direction:column",g.innerHTML='<div style="color:#90b4e8;font-size:11px;padding:4px 0">Open a book to see contents.</div>',o.appendChild(g),o.tocSection=g,p(),o}function ze(t,e){const{domain:o,file:l}=e||{};t.innerHTML="",t.style.cssText="",t.className="cb-book-page",t.appendChild(P());const a=document.createElement("div");a.style.cssText="display:flex;flex:1;overflow:hidden",t.appendChild(a);const n=Re(o||"",l||"");a.appendChild(n);const r=document.createElement("div");if(r.style.cssText="flex:1;display:flex;overflow:hidden;min-width:0",a.appendChild(r),!o||!l)return;const m=Se(l);let s=l;const d={level:m.level,lang:m.lang,model:D(l)},c=document.createElement("div");c.style.cssText="flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0",r.appendChild(c),c.appendChild(Ae(null,d,(p,u)=>{d[p]=u,v()},()=>{Me(),v()}));const h=document.createElement("iframe");h.style.cssText="flex:1;width:100%;border:none;display:block",c.appendChild(h);let _=!1;const b=p=>{var u,g;if(p){if(p.startsWith("#")){try{(g=(u=h.contentDocument)==null?void 0:u.querySelector(p))==null||g.scrollIntoView({behavior:"smooth"})}catch{}return}s=s.replace(/[^/]+\.html$/,p),v()}};h.addEventListener("load",()=>{var u,g,x;if(_)return;try{const y=(g=(u=h.contentWindow)==null?void 0:u.location)==null?void 0:g.href;if(y&&!y.startsWith("about:")){const E=decodeURIComponent(y.replace(/.*\/html\//,""));E&&!E.includes("://")&&E!==Q(s)&&(s=s.replace(/[^/]+\.html$/,E))}}catch{}Ie(h);let p=!1;try{p=!!((x=h.contentDocument)!=null&&x.querySelector("nav.toc"))}catch{}p&&He(n.tocSection,h,{onConceptClick:b})});function v(){const p=$e(o,s,d.level,d.lang,d.model);Ne(p).then(u=>{_=!u,u?h.src=p:(h.removeAttribute("src"),h.srcdoc=qe(Q(s),d.model,d.lang,d.level))})}v()}const H=document.getElementById("app");A("/",()=>be(H));A("/about",()=>Ee(H));A("/settings",()=>ke(H));A("/domain/:id",t=>ce(H,t));A("/graph",()=>ce(H,{}));A("/book",t=>ze(H,t));de();
