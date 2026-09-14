import './style.css'
import { register, start } from './router.js'
import { Home } from './pages/Home.js'
import { Domain } from './pages/Domain.js'
import { About } from './pages/About.js'
import { Settings } from './pages/Settings.js'

const app = document.getElementById('app')

register('/', () => Home(app))
register('/about', () => About(app))
register('/settings', () => Settings(app))
register('/domain/:id', (params) => Domain(app, params))

start()
