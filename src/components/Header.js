import { t } from '../i18n.js'
import { appConfig } from '../config.js'
import { LanguagePicker } from './LanguagePicker.js'

export function Header({ domainName = '' } = {}) {
  const el = document.createElement('header')
  el.className = 'cb-header'

  const topRow = document.createElement('div')
  topRow.className = 'cb-header__top'

  const logo = document.createElement('a')
  logo.className = 'cb-header__logo'
  logo.href = '#/'
  if (appConfig.logoImage) {
    const img = document.createElement('img')
    img.src = appConfig.logoImage
    img.alt = t('app.title')
    logo.appendChild(img)
  } else {
    logo.textContent = t('app.title')
  }
  topRow.appendChild(logo)

  if (domainName) {
    const sep = document.createElement('span')
    sep.className = 'cb-header__sep'
    sep.textContent = '›'
    topRow.appendChild(sep)

    const dn = document.createElement('span')
    dn.className = 'cb-header__domain'
    dn.textContent = domainName
    topRow.appendChild(dn)
  }

  const spacer = document.createElement('span')
  spacer.className = 'cb-header__spacer'
  topRow.appendChild(spacer)

  const nav = document.createElement('nav')
  nav.className = 'cb-header__nav'

  const settingsLink = document.createElement('a')
  settingsLink.href = '#/settings'
  settingsLink.textContent = t('nav.settings')
  nav.appendChild(settingsLink)

  nav.appendChild(LanguagePicker())

  const aboutLink = document.createElement('a')
  aboutLink.href = '#/about'
  aboutLink.textContent = t('nav.about')
  nav.appendChild(aboutLink)

  topRow.appendChild(nav)

  el.appendChild(topRow)

  return el
}
