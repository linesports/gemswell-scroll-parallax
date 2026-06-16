# Gemswell Society Scroll Build

React/Vite prototype for the Gemswell Society scroll-driven logo and surfboard sequence.

## Local Development

```bash
npm install
npm run dev
```

The local dev server runs on `http://localhost:5173/`.

## Build

```bash
npm run build
```

GitHub Pages deploys the generated `dist` folder through `.github/workflows/pages.yml`.

## Key Files

- `src/App.jsx`: scroll timeline, Three.js surfboard scene, logo SVG reveal, text timing.
- `src/styles.css`: layout, responsive styling, fade and motion timing variables.
- `files/SurfBoard.obj`: surfboard model.
- `files/gemswell-aerial-background.jpg`: aerial background image.

