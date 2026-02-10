# VECTOR-ETH

Retro Star Fox style 3D Ethereum logo built with Three.js.

## Features

- 🎮 **Star Fox/SNES aesthetic** — Low poly geometry with flat shading
- 🌌 **Vertex jitter shader** — Authentic retro polygon wobble (PS1/SNES style)
- ✨ **Quantized lighting** — Color banding for that chunky retro look
- 🎯 **Locked pixel ratio** — Chunky pixels, no anti-aliasing
- 📺 **Scanline overlay** — CRT monitor effect

## Tech Stack

- **Three.js** — WebGL 3D library
- **Vite** — Fast dev server and build tool
- **Custom GLSL shaders** — Vertex snapping + quantized lighting

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Ethereum Logo Geometry

The logo is composed of two tetrahedrons (4-sided pyramids):
- Top pyramid pointing up (light purple-blue)
- Bottom pyramid pointing down (darker blue)

Both pyramids rotate in sync with a gentle floating animation.

## Retro Effects

1. **Vertex Snapping** — Vertices snap to a grid, creating polygon jitter
2. **Flat Shading** — No smooth gradients, just hard edges
3. **Quantized Brightness** — Lighting levels are reduced to 4 steps
4. **Pixel Ratio Lock** — Renderer locked to 1:1 for chunky pixels
5. **No Anti-aliasing** — Keeps edges sharp and retro

---

Built by [@its-applekid](https://github.com/its-applekid)
