// Single source of truth for the
// output/{level}.{lang}/{model}/html/{kind}_{name}.html path schema.

function _base(domain, level, lang, model) {
  const modelPart = model ? `${model}/` : ''
  return `${import.meta.env.BASE_URL}domains/${domain}/output/${level}.${lang}/${modelPart}html/`
}

// spl/tools.py's write_concept_html/build_book_index suffix every filename
// with "_{language}" except English — match that convention here, otherwise
// a guessed path for any non-English language points at a file that was
// never written (e.g. "concept_units.html" when spl actually wrote
// "concept_units_zh.html"). This guess is the fallback used when a node
// isn't yet in the catalog (content just generated this session, before
// the page's in-memory catalog snapshot has been refreshed) — see
// ContentPanel.js's resolveContent().
function _langSuffix(lang) {
  return lang && lang !== 'en' ? `_${lang}` : ''
}

export function conceptUrl(domain, level, lang, model, nodeId) {
  return `${_base(domain, level, lang, model)}concept_${encodeURIComponent(nodeId)}${_langSuffix(lang)}.html`
}

export function bookUrl(domain, level, lang, model, target) {
  return `${_base(domain, level, lang, model)}book_${encodeURIComponent(target)}${_langSuffix(lang)}.html`
}

// Parses an output/{level}.{lang}/{model}/html/{kind}_{name}.html-shaped
// relative file path (as stored in catalog.json) into its parts.
export function parseLevelLangModel(file) {
  const llMatch = file.match(/output\/([^.]+)\.([^/]+)\//)
  const level = llMatch ? llMatch[1] : 'college'
  const lang = llMatch ? llMatch[2] : 'en'
  const modelMatch = file.match(/output\/[^/]+\/([^/]+)\/html\//)
  const model = modelMatch ? modelMatch[1] : ''
  return { level, lang, model }
}
