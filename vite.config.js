import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// GitHub Pages serves each repo at https://<org>.github.io/<repo-name>/, so
// `base` must equal the repo's own folder name. Deriving it from this file's
// own directory (not cwd) makes it correct for any clone automatically —
// forks never need to remember to edit this, unlike a hardcoded string that
// silently keeps the template's name (see scripts/init-app.sh, which fixes
// the one thing that CAN'T be auto-derived: package.json's "name" field).
const repoName = path.basename(path.dirname(fileURLToPath(import.meta.url)))

export default defineConfig({
  base: `/${repoName}/`,
  server: {
    proxy: {
      '/api': 'http://localhost:8200',
    },
  },
})
