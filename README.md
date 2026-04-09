# AniMc

Minecraft profile picture and pixel mascot generator with a built-in public render API.

Live site: [animc.d4vrock.xyz](https://animc.d4vrock.xyz)  
API docs: [animc.d4vrock.xyz/api](https://animc.d4vrock.xyz/api)

## Overview

AniMc started as a Minecraft PFP generator and now also supports pixel mascot renders, animated mascot GIF exports, skin uploads, cosmetic styling, and a public API that other apps can call directly.

The app is built with SvelteKit and includes both:

- a user-facing generator at `/generate`
- an image API for bots, dashboards, Discord commands, and other integrations

## Features

- Classic Minecraft profile picture generation
- Pixel mascot rendering with animated idle GIF export
- Java username input and direct skin upload support
- Background presets, custom gradients, uploaded images, and transparent exports
- Mascot styling controls:
  - ornaments
  - frames
  - capes
  - held items
  - hat / helmet layer toggle
  - scale, rotation, and position controls
  - separate item and ornament position adjustment
- Public API with CORS enabled
- PNG and mascot GIF rendering endpoints
- Upload-based API rendering via `POST /api/render`
- Responsive UI for desktop and mobile

## API Highlights

Current API supports:

- `GET /api/render/[username].png`
- `GET /api/render/[username].gif`
- `POST /api/render`
- `GET /api/pfp/[username].png`

Useful query/body options include:

- `style=classic|mascot`
- `animation=none|idle`
- `background=gradient|transparent|image`
- `gradient=84fab0-8fd3f4`
- `frame=none|pixel|glass|studio`
- `ornament=none|sparkles|halo|crown`
- `cape=none|classic|royal`
- `item=none|sword|wand|pickaxe`
- `hat=true|false`
- `scale`, `rotate`, `x`, `y`
- `itemX`, `itemY`, `ornamentX`, `ornamentY`

Important:

- GIF output is mascot-only
- classic renders should be requested as PNG

Example requests:

```txt
https://animc.d4vrock.xyz/api/render/devrock14.png?style=classic&background=transparent
https://animc.d4vrock.xyz/api/render/devrock14.png?style=mascot&frame=pixel&ornament=sparkles
https://animc.d4vrock.xyz/api/render/devrock14.gif?style=mascot&animation=idle&item=sword
```

## Local Development

### Requirements

- Node.js 20
- npm

### Setup

```bash
git clone https://github.com/devrock07/AniMc.git
cd AniMc
npm install
npm run dev
```

Open the local app at the URL printed by Vite, usually:

```txt
http://localhost:5173
```

## Scripts

```bash
npm run dev
npm run check
npm run build
npm run preview
npm run format
npm run lint
```

## Tech Stack

- SvelteKit
- Svelte
- TypeScript
- Vite
- Sass
- `@napi-rs/canvas`
- `gifenc`
- Vercel adapter

## Project Status

Current shipped work includes:

- Java username and upload support
- backgrounds, gradients, and image uploads
- mobile support
- hat layer toggle
- ornaments, frames, capes, and held items
- pose and accessory position controls
- public PNG and mascot GIF API

Still open for future polish:

- deeper 3D character rendering
- more item and ornament presets
- more scene/background themes
- rate limiting or API key controls for public usage

## Contributing

Issues and pull requests are welcome.

If you want to contribute, a good flow is:

```bash
npm install
npm run check
npm run build
```

## License

MIT. See [LICENSE](LICENSE).
