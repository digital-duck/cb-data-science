import { loadCatalog } from '../data/catalog.js'
import { Header } from '../components/Header.js'
import { GraphViewer } from '../components/GraphViewer.js'
import { ContentPanel } from '../components/ContentPanel.js'
import { getContentLang } from './Settings.js'

export async function Domain(container, { id } = {}) {
  container._abortController?.abort()
  const abortController = new AbortController()
  container._abortController = abortController

  container.innerHTML = ''
  const renderKey = Symbol()
  container._renderKey = renderKey

  let domain = null
  let catalog = []
  try {
    catalog = await loadCatalog()
    if (id) domain = catalog.find(d => d.id === id) ?? { id, name: id, has_book: false, books: [], generated_concepts: [], capstone: null }
  } catch (_) {}

  if (container._renderKey !== renderKey) return

  const page = document.createElement('div')
  page.style.cssText = 'display:flex;flex-direction:column;height:100vh;overflow:hidden'
  container.appendChild(page)

  page.appendChild(Header({ domainName: domain?.name || '' }))

  const pickerBar = document.createElement('div')
  pickerBar.className = 'cb-domain-picker-bar'

  const lbl = document.createElement('span')
  lbl.className = 'cb-domain-picker-bar__label'
  lbl.textContent = 'Domain'
  pickerBar.appendChild(lbl)

  const sel = document.createElement('select')
  sel.className = 'cb-domain-picker-bar__select'

  const ph = document.createElement('option')
  ph.value = ''
  ph.textContent = 'Select domain…'
  sel.appendChild(ph)

  ;[...catalog].sort((a, b) => (a.id).localeCompare(b.id, 'zh')).forEach(d => {
    const opt = document.createElement('option')
    opt.value = d.id
    opt.textContent = d.name || d.id
    if (d.id === id) opt.selected = true
    sel.appendChild(opt)
  })

  function _load() {
    if (sel.value) window.location.hash = `/domain/${encodeURIComponent(sel.value)}`
  }
  sel.addEventListener('change', _load)
  pickerBar.appendChild(sel)

  const loadBtn = document.createElement('button')
  loadBtn.type = 'button'
  loadBtn.className = 'cb-btn cb-btn--primary cb-domain-picker-bar__load'
  loadBtn.textContent = 'Load'
  loadBtn.addEventListener('click', _load)
  pickerBar.appendChild(loadBtn)

  page.appendChild(pickerBar)

  if (!id || !domain) return

  if (domain.source) {
    const attr = document.createElement('div')
    attr.className = 'cb-attribution'
    attr.innerHTML = `Source: <a href="${domain.source.url}" target="_blank">${domain.source.title}</a> by ${domain.source.authors} (${domain.source.license}). ${domain.source.attribution}`
    page.appendChild(attr)
  }

  const level = domain.default_level || 'intro'
  const lang = getContentLang()

  const layout = document.createElement('main')
  layout.className = 'cb-ide-layout'

  const left = document.createElement('div')
  left.className = 'cb-ide-left'
  const graphViewer = GraphViewer(domain, { level, lang })
  left.appendChild(graphViewer)

  const gutter = document.createElement('div')
  gutter.className = 'cb-ide-gutter'
  gutter.title = 'Drag to resize'

  const right = document.createElement('div')
  right.className = 'cb-ide-right'
  right.appendChild(ContentPanel(domain, { level, lang, graphViewer, signal: abortController.signal }))

  layout.append(left, gutter, right)
  page.appendChild(layout)

  _wireResize(gutter, left, layout, abortController.signal)
}

// Drag the gutter to resize the graph/content split. Left panel gets an
// explicit flex-basis (%) once dragged; right panel just fills what's left.
//
// Uses Pointer Events + setPointerCapture rather than window-level
// mousemove/mouseup: the left panel contains a cross-document <iframe>
// (the graph), and plain mousemove/mouseup listeners on `window` stop
// firing the instant the cursor moves over that iframe (events go to the
// iframe's own document instead) — which made dragging left "lose" the
// drag partway and drop the mouseup too. Pointer capture redirects all
// pointer events for this pointer to `gutter` regardless of what's
// visually underneath, so it keeps tracking correctly over the iframe.
function _wireResize(gutter, left, layout, signal) {
  const MIN = 0.18
  const MAX = 0.82

  gutter.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    gutter.setPointerCapture(e.pointerId)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (moveEvent) => {
      const rect = layout.getBoundingClientRect()
      const pct = Math.min(MAX, Math.max(MIN, (moveEvent.clientX - rect.left) / rect.width))
      left.style.flex = `0 0 ${(pct * 100).toFixed(2)}%`
    }
    const onUp = (upEvent) => {
      gutter.releasePointerCapture(upEvent.pointerId)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      gutter.removeEventListener('pointermove', onMove)
      gutter.removeEventListener('pointerup', onUp)
      gutter.removeEventListener('pointercancel', onUp)
    }
    gutter.addEventListener('pointermove', onMove, { signal })
    gutter.addEventListener('pointerup', onUp, { signal })
    gutter.addEventListener('pointercancel', onUp, { signal })
  }, { signal })
}
