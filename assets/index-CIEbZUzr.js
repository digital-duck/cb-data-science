(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))l(n);new MutationObserver(n=>{for(const a of n)if(a.type==="childList")for(const d of a.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&l(d)}).observe(document,{childList:!0,subtree:!0});function o(n){const a={};return n.integrity&&(a.integrity=n.integrity),n.referrerPolicy&&(a.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?a.credentials="include":n.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function l(n){if(n.ep)return;n.ep=!0;const a=o(n);fetch(n.href,a)}})();const H={};function F(e,t){H[e]=t}function de(e){window.location.hash=e}function ee(){var n,a;const e=window.location.hash.slice(1)||"/",t=e.match(/^\/domain\/([^?]+)/);if(t){(n=H["/domain/:id"])==null||n.call(H,{id:decodeURIComponent(t[1])});return}const[o,l]=e.split("?");(a=H[o])==null||a.call(H,Object.fromEntries(new URLSearchParams(l||"")))}function pe(){window.addEventListener("hashchange",ee),ee()}let U=null;function ue(){U=null}async function Q(){if(U)return U;const e=await fetch("/cb-data-science/domains/catalog.json");if(!e.ok)throw new Error(`Failed to load catalog: ${e.status}`);return U=await e.json(),U}const te={en:{"app.title":"ConceptBook","app.tagline":"Explore knowledge through concept graphs","nav.about":"About","nav.settings":"Settings","home.subtitle":"Choose a domain to explore","home.filter.all":"All","home.filter.level":"Level","card.nodes":"nodes","card.edges":"edges","card.explore":"Explore Concept-Graph","card.read":"Read book","domain.back":"← Back","domain.openFullscreen":"Open fullscreen","about.title":"About concept-book",loading:"Loading…"}};let Y=localStorage.getItem("cb-lang")||"en";function j(e){return(te[Y]||te.en)[e]??e}function me(e){Y=e,localStorage.setItem("cb-lang",e)}function le(){return Y}function be(e){const t=document.createElement("article");t.className="cb-card";const o=(e.tags||[]).map(l=>`<span class="cb-tag" data-tag="${l}">${l}</span>`).join("");return t.innerHTML=`
    <div class="cb-card__header">
      <h2 class="cb-card__title">${e.name}</h2>
      <div class="cb-card__tags">${o}</div>
    </div>
    <p class="cb-card__stats">${e.nodes} nodes · ${e.edges} edges · ${e.primitives} primitives</p>
    <p class="cb-card__desc">${e.description}</p>
    <div class="cb-card__actions">
      <button class="cb-btn cb-btn--primary js-explore" ${e.has_navigator?"":"disabled"}>
        ${j("card.explore")}
      </button>
      <span class="cb-book-indicator" title="${e.has_book?"Book available":""}">${e.has_book?"📖":""}</span>
    </div>
  `,t.querySelector(".js-explore").addEventListener("click",()=>{de(`/domain/${e.id}`)}),t}const ce=[{code:"en",label:"English"},{code:"zh",label:"中文 (Chinese)"},{code:"es",label:"Español (Spanish)"},{code:"fr",label:"Français (French)"},{code:"de",label:"Deutsch (German)"},{code:"ja",label:"日本語 (Japanese)"},{code:"ko",label:"한국어 (Korean)"},{code:"pt",label:"Português (Portuguese)"},{code:"ar",label:"العربية (Arabic)"},{code:"hi",label:"हिन्दी (Hindi)"}];function he(){const e=document.createElement("select");e.className="cb-lang-picker",e.title="Content language";const t=le();return ce.forEach(({code:o,label:l})=>{const n=document.createElement("option");n.value=o,n.textContent=l,o===t&&(n.selected=!0),e.appendChild(n)}),e.addEventListener("change",()=>me(e.value)),e}function K({domainName:e=""}={}){const t=document.createElement("header");t.className="cb-header";const o=document.createElement("div");o.className="cb-header__top";const l=document.createElement("a");if(l.className="cb-header__logo",l.href="#/",l.textContent=j("app.title"),o.appendChild(l),e){const u=document.createElement("span");u.className="cb-header__sep",u.textContent="›",o.appendChild(u);const m=document.createElement("span");m.className="cb-header__domain",m.textContent=e,o.appendChild(m)}const n=document.createElement("span");n.className="cb-header__spacer",o.appendChild(n);const a=document.createElement("nav");a.className="cb-header__nav";const d=document.createElement("a");d.href="#/settings",d.textContent=j("nav.settings"),a.appendChild(d),a.appendChild(he());const c=document.createElement("a");return c.href="#/about",c.textContent=j("nav.about"),a.appendChild(c),o.appendChild(a),t.appendChild(o),t}async function ge(e){e.innerHTML="",e.appendChild(K());const t=document.createElement("main");t.className="cb-home",t.innerHTML=`<p class="cb-loading">${j("loading")}</p>`,e.appendChild(t);let o;try{o=await Q()}catch(u){t.innerHTML=`<p class="cb-error">Could not load domains. ${u.message}</p>`;return}const l=[...new Set(o.flatMap(u=>u.tags))].sort(),n=["intro","core","college","research"];let a="all",d="all";function c(){let u=o;a!=="all"&&(u=u.filter(r=>r.tags.includes(a))),d!=="all"&&(u=u.filter(r=>r.default_level===d)),t.innerHTML=`
      <div class="cb-home__filters">
        <span class="cb-filter-group">
          <span class="cb-filter-label">Subject</span>
          <button class="cb-filter-btn ${a==="all"?"active":""}" data-tag="all">All</button>
          ${l.map(r=>`<button class="cb-filter-btn ${a===r?"active":""}" data-tag="${r}">${r}</button>`).join("")}
        </span>
        <span class="cb-filter-right">
          <span class="cb-filter-label">Level</span>
          <select class="cb-level-select" id="cb-level-filter">
            <option value="all" ${d==="all"?"selected":""}>All</option>
            ${n.map(r=>`<option value="${r}" ${d===r?"selected":""}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`).join("")}
          </select>
        </span>
      </div>
      <div class="cb-card-grid"></div>
    `;const m=t.querySelector(".cb-card-grid");u.forEach(r=>m.appendChild(be(r))),t.querySelectorAll(".cb-filter-btn[data-tag]").forEach(r=>{r.addEventListener("click",()=>{a=r.dataset.tag,c()})}),t.querySelector("#cb-level-filter").addEventListener("change",r=>{d=r.target.value,c()})}c()}function fe(e,{level:t="intro",lang:o="en"}={}){const{id:l}=e,n=document.createElement("div");n.className="cb-graph-viewer";const a=document.createElement("div");a.className="cb-graph-topbar";const d=document.createElement("div");d.className="cb-graph-topbar__search";const c=document.createElement("input");c.type="text",c.placeholder="Search node…",c.className="cb-graph-topbar__input";const u=document.createElement("button");u.type="button",u.textContent="Search",u.className="cb-btn cb-graph-topbar__search-btn",d.append(c,u);const m=document.createElement("div");m.className="cb-graph-topbar__view-controls";const r=document.createElement("button");r.type="button",r.textContent="Zoom −",r.title="Zoom out",r.className="cb-btn cb-graph-topbar__zoom";const k=document.createElement("button");k.type="button",k.textContent="Zoom +",k.title="Zoom in",k.className="cb-btn cb-graph-topbar__zoom";const x=document.createElement("button");x.type="button",x.textContent="Re-Center",x.className="cb-btn cb-graph-topbar__recenter",m.append(r,k,x),a.append(d,m),n.appendChild(a);const E=document.createElement("iframe");E.className="cb-graph-viewer__frame",E.src=`/cb-data-science/domains/${l}/output/graph.html`,E.title=`${l} concept graph`,E.setAttribute("allowfullscreen","");function M(){var v,I,L,A;const p=c.value.trim().toLowerCase();if(!p)return;const s=E.contentWindow,h=(((v=s==null?void 0:s.__cb_RAW)==null?void 0:v.nodes)||[]).find(T=>T.label.toLowerCase().includes(p)||T.id.toLowerCase().includes(p));c.classList.remove("cb-graph-topbar__input--notfound"),h?((I=s.selectNode)==null||I.call(s,h.id),(A=(L=s.__cb_network)==null?void 0:L.focus)==null||A.call(L,h.id,{scale:1,animation:{duration:400,easingFunction:"easeInOutQuad"}})):(c.classList.add("cb-graph-topbar__input--notfound"),setTimeout(()=>c.classList.remove("cb-graph-topbar__input--notfound"),1200))}u.addEventListener("click",M),c.addEventListener("keydown",p=>{p.key==="Enter"&&(p.preventDefault(),M())}),x.addEventListener("click",()=>{var p,s;try{(s=(p=E.contentWindow)==null?void 0:p.reCenterGraph)==null||s.call(p)}catch{}});const _=.1,g=4;function b(p){var s;try{const i=(s=E.contentWindow)==null?void 0:s.__cb_network;if(!i)return;const h=Math.min(g,Math.max(_,i.getScale()*p));i.moveTo({scale:h,animation:{duration:150,easingFunction:"easeInOutQuad"}})}catch{}}return k.addEventListener("click",()=>b(1.25)),r.addEventListener("click",()=>b(.8)),E.addEventListener("load",()=>{var p;try{const s=E.contentWindow;if(!s)return;s.eval("window.__cb_RAW = RAW; window.__cb_nodeIndex = nodeIndex; window.__cb_network = network");const i=(((p=s.__cb_RAW)==null?void 0:p.nodes)||[]).map(v=>({id:v.id,label:v.label,kind:v.kind,tier:v.tier??0}));window.dispatchEvent(new CustomEvent("cb:graphLoaded",{detail:{concepts:i}}));const h=s.handleSelect;s.handleSelect=function(v){var L;h.call(s,v);const I=(L=s.__cb_nodeIndex)==null?void 0:L[v];I&&window.dispatchEvent(new CustomEvent("cb:nodeSelected",{detail:{nodeId:v,node:I}}))},ve(E.contentDocument)}catch{}}),n.appendChild(E),n.selectNode=p=>{var s,i;try{(i=(s=E.contentWindow)==null?void 0:s.selectNode)==null||i.call(s,p)}catch{}},n.getPath=p=>{var s;try{const i=E.contentWindow,h=(s=i==null?void 0:i.__cb_nodeIndex)==null?void 0:s[p];if(!h)return null;const I=(i.getAncestors?[...i.getAncestors(p)]:[]).map(L=>i.__cb_nodeIndex[L]).filter(Boolean);return{nodeId:p,node:h,path:I}}catch{return null}},n}function ve(e){if(e.querySelector("#cb-ide-layout"))return;const t=e.createElement("style");t.id="cb-ide-layout",t.textContent=`
    #path-sidebar, #explain-panel, .graph-recenter-btn { display: none !important; }
    .app {
      display: flex !important;
      flex-direction: column !important;
      height: 100vh !important;
    }
    #graph-panel { flex: 0 0 80%; min-height: 0; }
    #notes-sidebar {
      flex: 1;
      min-height: 0;
      width: 100% !important;
      border-left: none !important;
      border-top: 1px solid rgba(0,0,0,0.12) !important;
      overflow-y: auto !important;
      display: flex;
      flex-direction: column;
    }
    /* graph.html's own #notes-textarea is a fixed 100px tall, sized for the
       standalone page's roomy right-column layout — inside this bottom
       drawer (now a much shorter horizontal strip) that alone ate most of
       the available height, squeezing the notes history list below it down
       to one or two visible rows. Shrink the entry box to a single line so
       the history list gets the space instead. */
    #notes-textarea {
      flex: 0 0 auto !important;
      height: 32px !important;
      padding: 6px 12px !important;
    }
    .cb-notes-gutter {
      height: 6px; flex-shrink: 0; cursor: row-resize;
      background: rgba(0,0,0,0.1); touch-action: none;
      transition: background 0.15s;
    }
    .cb-notes-gutter:hover, .cb-notes-gutter:active { background: #60a5fa; }
  `,e.head.appendChild(t);const o=e.querySelector("#graph-panel"),l=e.querySelector("#notes-sidebar"),n=e.querySelector(".app");if(o&&l&&n&&!e.querySelector(".cb-notes-gutter")){const a=e.createElement("div");a.className="cb-notes-gutter",a.title="Drag to resize",o.insertAdjacentElement("afterend",a),_e(a,o,n)}}function _e(e,t,o){e.addEventListener("pointerdown",a=>{a.preventDefault(),e.setPointerCapture(a.pointerId);const d=u=>{const m=o.getBoundingClientRect(),r=Math.min(.92,Math.max(.3,(u.clientY-m.top)/m.height));t.style.flex=`0 0 ${(r*100).toFixed(2)}%`},c=u=>{e.releasePointerCapture(u.pointerId),e.removeEventListener("pointermove",d),e.removeEventListener("pointerup",c),e.removeEventListener("pointercancel",c)};e.addEventListener("pointermove",d),e.addEventListener("pointerup",c),e.addEventListener("pointercancel",c)})}function ye(e,t,o,l){const n=l?`${l}/`:"";return`/cb-data-science/domains/${e}/output/${t}.${o}/${n}html/`}function Ce(e){return e&&e!=="en"?`_${e}`:""}function Ee(e,t,o,l,n){return`${ye(e,t,o,l)}concept_${encodeURIComponent(n)}${Ce(o)}.html`}function ke(e){const t=e.match(/output\/([^.]+)\.([^/]+)\//),o=t?t[1]:"college",l=t?t[2]:"en",n=e.match(/output\/[^/]+\/([^/]+)\/html\//),a=n?n[1]:"";return{level:o,lang:l,model:a}}const B=new Map;async function xe(e){if(B.has(e))return B.get(e);try{const t=await fetch(e);if(!t.ok)return B.set(e,!1),!1;const o=await t.text(),l=o.includes("spl-credit")||o.includes("Generated by");return B.set(e,l),l}catch{return B.set(e,!1),!1}}function ne(){B.clear()}const Le=["intro","core","college","research"],we={application:"🌸",primitive:"🌱"},Se=[{value:"gemma3",label:"gemma3 (Ollama)"},{value:"gemma4",label:"gemma4 (Ollama)"},{value:"sonnet",label:"sonnet (Claude)"},{value:"haiku",label:"haiku (Claude)"},{value:"opus",label:"opus (Claude)"}];function Z(e,t,o,l){const n=document.createElement("select");return n.className=o,l&&(n.title=l),e.forEach(({value:a,label:d})=>{const c=document.createElement("option");c.value=a,c.textContent=d,a===t&&(c.selected=!0),n.appendChild(c)}),n}function ae(e,t){e.clear(),(t.generated_concepts||[]).forEach(o=>{if(!o.name||!o.file)return;const{level:l,lang:n,model:a}=ke(o.file),d=e.get(o.name)||[];d.push({file:o.file,level:l,lang:n,model:o.model??a}),e.set(o.name,d)})}function $e(e,{level:t="intro",lang:o="en",graphViewer:l,signal:n}={}){const a=document.createElement("aside");a.className="cb-content-panel";const d=new Map;ae(d,e);const c={model:"sonnet",level:t,lang:o};let u=null,m=null,r=null,k=0,x=!1;function E(f){const y=(d.get(f)||[]).filter(w=>w.level===c.level&&w.lang===c.lang);if(!y.length)return null;const S=y.find(w=>w.model===c.model);return S||x?S||null:y.find(w=>!w.model)||y[0]}const M=document.createElement("div");M.className="cb-book-pane__controls";const _=Z(Se,c.model,"cb-book-pane__select","Model"),g=Z(Le.map(f=>({value:f,label:f[0].toUpperCase()+f.slice(1)})),c.level,"cb-book-pane__select","Level"),b=Z(ce.map(f=>({value:f.code,label:f.label})),c.lang,"cb-book-pane__select","Language"),p=document.createElement("button");p.type="button",p.className="cb-book-pane__refresh",p.title="Refresh — re-check for content that just finished generating",p.textContent="🔄";const s=document.createElement("button");s.type="button",s.className="cb-btn cb-btn--primary cb-ide-gen-btn",s.textContent="Generate",s.disabled=!0;const i=document.createElement("button");i.type="button",i.className="cb-btn cb-ide-pdf-btn",i.textContent="Export PDF",i.disabled=!0;const h=document.createElement("label");h.className="cb-ide-skip-cache";const v=document.createElement("input");v.type="checkbox",h.appendChild(v),h.appendChild(document.createTextNode("Skip cache")),M.append(_,g,b,p,s,h,i),a.appendChild(M);const I=document.createElement("div");I.className="cb-ide-body";const L=document.createElement("nav");L.className="cb-ide-toc",L.innerHTML='<p class="cb-panel__hint">Click any node in the graph to see its details.</p>';const A=document.createElement("div");A.className="cb-ide-content",A.innerHTML='<p class="cb-panel__hint">Click any node in the graph to see its details.</p>',I.append(L,A),a.appendChild(I);const T=document.createElement("div");T.className="cb-ide-log-wrap",T.style.display="none";const P=document.createElement("pre");P.className="cb-ide-log";const O=document.createElement("button");O.type="button",O.className="cb-ide-log-copy",O.textContent="Copy",O.addEventListener("click",()=>{navigator.clipboard.writeText(P.textContent).then(()=>{O.textContent="Copied!",setTimeout(()=>{O.textContent="Copy"},1500)})}),T.append(P,O),a.appendChild(T);function X(){c.model=_.value,c.level=g.value,c.lang=b.value,D()}_.addEventListener("change",()=>{x=!0,X()}),g.addEventListener("change",X),b.addEventListener("change",X),p.addEventListener("click",()=>{ne(),D()});function se(f){var $;if(!u){L.innerHTML='<p class="cb-panel__hint">Click any node in the graph to see its details.</p>';return}const y=($=l==null?void 0:l.getPath)==null?void 0:$.call(l,u),S=[...(y==null?void 0:y.path)||[],f].filter(Boolean),w=new Set,N=S.filter(C=>!w.has(C.id)&&w.add(C.id)).sort((C,q)=>C.label.localeCompare(q.label));if(!N.length){L.innerHTML='<p class="cb-panel__hint">No concepts found on this path.</p>';return}L.innerHTML="";const R=document.createElement("ul");R.className="cb-ide-toc__list",N.forEach(C=>{const q=document.createElement("li"),G=document.createElement("a");G.href="#";const V=we[C.kind];G.textContent=V?`${V} ${C.label}`:C.label,G.dataset.nodeId=C.id,C.id===m&&(G.className="cb-ide-toc__current"),G.addEventListener("click",re=>{re.preventDefault(),m=C.id,r=C,T.style.display="none",ie(),D()}),q.appendChild(G),R.appendChild(q)}),L.appendChild(R)}function ie(){L.querySelectorAll(".cb-ide-toc__list a").forEach(f=>{f.classList.toggle("cb-ide-toc__current",f.dataset.nodeId===m)})}async function D(){if(!m||!r)return;const f=++k;A.innerHTML='<p class="cb-panel__hint">Loading…</p>';const y=E(m);let S;y?(S=`/cb-data-science/domains/${e.id}/${y.file}`,!x&&y.model!==c.model&&(c.model=y.model,_.value=y.model)):S=Ee(e.id,c.level,c.lang,c.model,m);const w=y?!0:await xe(S);if(f===k)if(w){s.disabled=!1,s.textContent="Generate",i.disabled=!1,A.innerHTML="";const N=document.createElement("iframe");N.className="cb-ide-content__frame",N.src=S,N.addEventListener("load",()=>{try{const R=N.contentDocument;if(!R)return;const $=R.createElement("style");$.textContent="nav.toc{display:none!important} .page{display:block!important}",R.head.appendChild($)}catch{}}),A.appendChild(N)}else s.disabled=!1,s.textContent="Generate",i.disabled=!0,A.innerHTML=`
        <div class="cb-ide-empty">
          <h3>${r.label}</h3>
          ${r.defines?`<p>${r.defines}</p>`:""}
          <p>⚠️ Missing content for model=<strong>${c.model}</strong>, level=<strong>${c.level}</strong>, language=<strong>${c.lang}</strong>, click <strong>Generate</strong> button to create</p>
        </div>
      `}return s.addEventListener("click",()=>{if(!m)return;const f=m,y=c.model,S=c.level,w=c.lang,N=v.checked;s.disabled=!0,s.textContent="Generating…",T.style.display="block",P.textContent=`▶ target: ${f}  model: ${y||"default"}  level: ${S}  language: ${w}
`;const R=`/api/generate?domain=${encodeURIComponent(e.id)}&target=${encodeURIComponent(f)}&level=${encodeURIComponent(S)}&language=${encodeURIComponent(w)}&model=${encodeURIComponent(y)}${N?"&skip_cache=true":""}`,$=new EventSource(R);$.addEventListener("log",C=>{const{message:q}=JSON.parse(C.data);P.textContent+=q+`
`,P.scrollTop=P.scrollHeight}),$.addEventListener("done",async()=>{$.close(),P.textContent+=`
✓ Done`,ne(),s.disabled=!1,s.textContent="Generate";try{ue();const C=(await Q()).find(q=>q.id===e.id);C&&(e.generated_concepts=C.generated_concepts,e.books=C.books,e.has_book=C.has_book,ae(d,e))}catch{}D()}),$.addEventListener("gen_error",C=>{$.close(),P.textContent+=`
✗ ${JSON.parse(C.data).message}`,s.disabled=!1,s.textContent="Retry"}),$.onerror=()=>{$.close(),P.textContent+=`
✗ Connection to the API dropped or is unreachable.
  Check the API terminal for errors, or run: bash scripts/start-api.sh`,s.disabled=!1,s.textContent="Retry"}}),i.addEventListener("click",async()=>{if(!m)return;const f=m;i.disabled=!0,i.textContent="Exporting…";try{const y=`/api/pdf?domain=${encodeURIComponent(e.id)}&target=${encodeURIComponent(f)}&level=${encodeURIComponent(c.level)}&language=${encodeURIComponent(c.lang)}&model=${encodeURIComponent(c.model)}`,S=await fetch(y),w=await S.json();if(!S.ok)throw new Error(w.detail||"PDF generation failed");const N=`/cb-data-science/domains/${e.id}/${w.file}`;i.textContent="Export PDF ✓",i.disabled=!1,window.open(N,"_blank","noopener")}catch(y){i.textContent="Error",i.title=y.message,setTimeout(()=>{i.textContent="Export PDF",i.disabled=!1},3e3)}}),window.addEventListener("cb:nodeSelected",f=>{u=f.detail.nodeId,m=f.detail.nodeId,r=f.detail.node,T.style.display="none",se(f.detail.node),D()},{signal:n}),a}function Ne(){return le()}const oe=new Set(["anthropic","openai","google","openrouter"]),z={claude_cli:{label:"Claude CLI",models:[{value:"claude-sonnet-5",label:"Sonnet 5"},{value:"claude-haiku-4-5-20251001",label:"Haiku 4.5"},{value:"claude-opus-4-8",label:"Opus 4.8"}]},anthropic:{label:"Anthropic",models:[{value:"claude-sonnet-5",label:"Claude Sonnet 5"},{value:"claude-haiku-4-5-20251001",label:"Claude Haiku 4.5"},{value:"claude-opus-4-8",label:"Claude Opus 4.8"}]},openai:{label:"OpenAI",models:[{value:"gpt-4.1",label:"GPT-4.1"},{value:"gpt-5.4-mini",label:"GPT 5.4 Mini"},{value:"o3-mini",label:"o3-mini"}]},google:{label:"Gemini",models:[{value:"gemini-2.5-pro",label:"Gemini 2.5 Pro"},{value:"gemini-2.5-flash",label:"Gemini 2.5 Flash"},{value:"gemini-3.5-flash",label:"Gemini 3.5 Flash"}]},openrouter:{label:"OpenRouter",models:[{value:"anthropic/claude-sonnet-5",label:"Claude Sonnet 5"},{value:"anthropic/claude-haiku-4-5-20251001",label:"Claude Haiku 4.5"},{value:"anthropic/claude-opus-4-8",label:"Claude Opus 4.8"},{value:"google/gemini-2.5-pro",label:"Gemini 2.5 Pro"},{value:"google/gemini-2.5-flash",label:"Gemini 2.5 Flash"},{value:"google/gemini-3.5-flash",label:"Gemini 3.5 Flash"},{value:"openai/gpt-4.1",label:"GPT-4.1"},{value:"openai/gpt-5.4-mini",label:"GPT 5.4 Mini"},{value:"openai/o3-mini",label:"o3-mini"},{value:"deepseek/deepseek-r1",label:"DeepSeek R1"},{value:"meta-llama/llama-4-maverick",label:"Llama 4 Maverick"},{value:"z-ai/glm-5.2",label:"GLM 5.2"},{value:"qwen/qwen3.5-35b-a3b",label:"Qwen 3.5 35B"},{value:"qwen/qwen3.6-35b-a3b",label:"Qwen 3.6 35B"},{value:"nvidia/nemotron-3-ultra-550b-a55b:free",label:"Nemotron 3 Ultra 550B"},{value:"moonshotai/kimi-k2.6",label:"Kimi 2.6"}]},ollama:{label:"Ollama (local)",models:null}};async function J(e,t){const o=z[e.value];if(t.innerHTML="",!o)return;let l=o.models;if(e.value==="ollama"&&!l){try{const n=await fetch("/api/settings/ollama-models");n.ok&&(l=await n.json())}catch{}if(!l||l.length===0){const n=document.createElement("option");n.value="",n.textContent="(ollama not available)",t.appendChild(n);return}z.ollama.models=l}for(const n of l){const a=document.createElement("option");a.value=n.value,a.textContent=n.label,t.appendChild(a)}}async function Me(e){e.innerHTML="",e.appendChild(K());const t=document.createElement("main");t.className="cb-settings",t.innerHTML=`
    <h2>Settings</h2>
    <section class="cb-settings__section">
      <div class="cb-settings__section-title">SPL Adapter and Model Configuration</div>
      <div class="cb-settings__pair">
        <div class="cb-settings__field">
          <label class="cb-settings__label">Adapter</label>
          <select id="cb-adapter" class="cb-settings__select">
            ${Object.entries(z).map(([g,b])=>`<option value="${g}">${b.label}</option>`).join("")}
          </select>
        </div>
        <div class="cb-settings__field cb-settings__field--grow">
          <label class="cb-settings__label">Model</label>
          <select id="cb-model" class="cb-settings__select"></select>
        </div>
      </div>
      <div class="cb-settings__pair" id="cb-api-key-row" style="margin-top:12px">
        <div class="cb-settings__field cb-settings__field--grow">
          <label class="cb-settings__label">API Key</label>
          <input id="cb-api-key" type="password" class="cb-settings__select"
            placeholder="Enter your API key" autocomplete="off" style="width:100%">
          <span id="cb-api-key-hint" style="font-size:0.78rem;color:#6b7280"></span>
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
  `,e.appendChild(t);const o=t.querySelector("#cb-adapter"),l=t.querySelector("#cb-model"),n=t.querySelector("#cb-settings-save"),a=t.querySelector("#cb-settings-status"),d=t.querySelector("#cb-current-llm"),c=t.querySelector("#cb-api-key-row"),u=t.querySelector("#cb-api-key"),m=t.querySelector("#cb-api-key-hint");let r={};function k(){const g=o.value,b=oe.has(g);c.style.display=b?"":"none",u.value="",m.textContent=b&&r[g]?"A key is already saved — enter a new one to replace it, or leave blank to keep it.":""}o.addEventListener("change",()=>{J(o,l),k()}),await J(o,l),k();const x=t.querySelector("#cb-while-max-iter"),E=t.querySelector("#cb-max-llm-calls"),M=t.querySelector("#cb-spl-limits-save"),_=t.querySelector("#cb-spl-limits-status");try{const g=await fetch("/api/settings");if(g.ok){const b=await g.json();d.textContent=`Current: ${b.llm}`;const[p,...s]=b.llm.split(":"),i=s.join(":");z[p]&&(o.value=p,await J(o,l),[...l.options].some(h=>h.value===i)&&(l.value=i)),r={anthropic:b.anthropic_api_key_set,google:b.gemini_api_key_set,openai:b.openai_api_key_set,openrouter:b.openrouter_api_key_set},k(),b.spl_while_max_iter&&(x.value=b.spl_while_max_iter),b.spl_max_llm_calls&&(E.value=b.spl_max_llm_calls)}}catch{a.textContent="API not reachable — run the backend to change settings",a.style.color="#dc2626"}n.addEventListener("click",async()=>{const g=o.value,b=`${g}:${l.value}`,p={llm:b};if(oe.has(g)&&u.value.trim()){const s=g==="google"?"gemini_api_key":`${g}_api_key`;p[s]=u.value.trim()}try{const s=await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});if(s.ok){const i=await s.json();r={anthropic:i.anthropic_api_key_set,google:i.gemini_api_key_set,openai:i.openai_api_key_set,openrouter:i.openrouter_api_key_set},k(),d.textContent=`Current: ${b}`,a.textContent="Saved",a.style.color="#16a34a"}else a.textContent="Save failed",a.style.color="#dc2626"}catch{a.textContent="API not reachable",a.style.color="#dc2626"}setTimeout(()=>{a.textContent=""},3e3)}),M.addEventListener("click",async()=>{const g=Number(x.value),b=Number(E.value);if(!Number.isInteger(g)||g<1||!Number.isInteger(b)||b<1){_.textContent="Enter valid integers ≥ 1",_.style.color="#dc2626",setTimeout(()=>{_.textContent=""},3e3);return}try{(await fetch("/api/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({spl_while_max_iter:g,spl_max_llm_calls:b})})).ok?(_.textContent="Saved",_.style.color="#16a34a"):(_.textContent="Save failed",_.style.color="#dc2626")}catch{_.textContent="API not reachable",_.style.color="#dc2626"}setTimeout(()=>{_.textContent=""},3e3)})}async function Ie(e,{id:t}={}){var i;(i=e._abortController)==null||i.abort();const o=new AbortController;e._abortController=o,e.innerHTML="";const l=Symbol();e._renderKey=l;let n=null,a=[];try{a=await Q(),t&&(n=a.find(h=>h.id===t)??{id:t,name:t,has_book:!1,books:[],generated_concepts:[],capstone:null})}catch{}if(e._renderKey!==l)return;const d=document.createElement("div");d.style.cssText="display:flex;flex-direction:column;height:100vh;overflow:hidden",e.appendChild(d),d.appendChild(K({domainName:(n==null?void 0:n.name)||""}));const c=document.createElement("div");c.className="cb-domain-picker-bar";const u=document.createElement("span");u.className="cb-domain-picker-bar__label",u.textContent="Domain",c.appendChild(u);const m=document.createElement("select");m.className="cb-domain-picker-bar__select";const r=document.createElement("option");r.value="",r.textContent="Select domain…",m.appendChild(r),[...a].sort((h,v)=>h.id.localeCompare(v.id,"zh")).forEach(h=>{const v=document.createElement("option");v.value=h.id,v.textContent=h.name||h.id,h.id===t&&(v.selected=!0),m.appendChild(v)});function k(){m.value&&(window.location.hash=`/domain/${encodeURIComponent(m.value)}`)}m.addEventListener("change",k),c.appendChild(m);const x=document.createElement("button");if(x.type="button",x.className="cb-btn cb-btn--primary cb-domain-picker-bar__load",x.textContent="Load",x.addEventListener("click",k),c.appendChild(x),d.appendChild(c),!t||!n)return;if(n.source){const h=document.createElement("div");h.className="cb-attribution",h.innerHTML=`Source: <a href="${n.source.url}" target="_blank">${n.source.title}</a> by ${n.source.authors} (${n.source.license}). ${n.source.attribution}`,d.appendChild(h)}const E=n.default_level||"intro",M=Ne(),_=document.createElement("main");_.className="cb-ide-layout";const g=document.createElement("div");g.className="cb-ide-left";const b=fe(n,{level:E,lang:M});g.appendChild(b);const p=document.createElement("div");p.className="cb-ide-gutter",p.title="Drag to resize";const s=document.createElement("div");s.className="cb-ide-right",s.appendChild($e(n,{level:E,lang:M,graphViewer:b,signal:o.signal})),_.append(g,p,s),d.appendChild(_),Ae(p,g,_,o.signal)}function Ae(e,t,o,l){e.addEventListener("pointerdown",d=>{d.preventDefault(),e.setPointerCapture(d.pointerId),document.body.style.cursor="col-resize",document.body.style.userSelect="none";const c=m=>{const r=o.getBoundingClientRect(),k=Math.min(.82,Math.max(.18,(m.clientX-r.left)/r.width));t.style.flex=`0 0 ${(k*100).toFixed(2)}%`},u=m=>{e.releasePointerCapture(m.pointerId),document.body.style.cursor="",document.body.style.userSelect="",e.removeEventListener("pointermove",c),e.removeEventListener("pointerup",u),e.removeEventListener("pointercancel",u)};e.addEventListener("pointermove",c,{signal:l}),e.addEventListener("pointerup",u,{signal:l}),e.addEventListener("pointercancel",u,{signal:l})},{signal:l})}function Te(e){e.innerHTML="",e.appendChild(K());const t=document.createElement("main");t.className="cb-about",t.innerHTML=`
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

    <h2>Content source</h2>
    <p>
      Source: <a href="https://openstax.org/details/books/principles-data-science" target="_blank" rel="noopener">Principles of Data Science</a>
      by OpenStax (CC BY 4.0). Access for free at openstax.org.
    </p>

    <p>
      This concept-book is a companion to the original text, not a replacement for it.
      The graph and generated sections here help you see how the ideas connect and where
      to start, but the full depth — proofs, worked examples, exercises, nuance — lives in
      the source. Follow the link above to read it directly; that is where deep mastery
      actually happens.
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

    <h2>The founding use-case: Chinese Characters</h2>
    <p>
      Chinese characters share the same structure as chemical elements — a small set of
      elemental radicals (primitives) combine to form hundreds of compound characters.
      Learning the ~12 elementals unlocks the ability to decode characters by structure alone.
      The concept graph makes that derivation visible and navigable. See <a href="https://github.com/digital-duck/cb-zinets" target="_blank" rel="noopener">cb-zinets</a> — a concept-book fully built out around this founding use-case — if you'd like to dig deeper.
    </p>
  `,e.appendChild(t)}const W=document.getElementById("app");F("/",()=>ge(W));F("/about",()=>Te(W));F("/settings",()=>Me(W));F("/domain/:id",e=>Ie(W,e));pe();
