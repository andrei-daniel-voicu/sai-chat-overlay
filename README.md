# sai-chat-overlay

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![GitHub Release](https://img.shields.io/github/v/release/saitatter/sai-chat-overlay)
[![Issues](https://img.shields.io/github/issues/saitatter/sai-chat-overlay)](https://github.com/saitatter/sai-chat-overlay/issues)
![Made with JavaScript](https://img.shields.io/badge/Made%20with-JavaScript-yellow?logo=javascript)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![OBS Studio](https://img.shields.io/badge/OBS%20Studio-302E31?logo=obsstudio&logoColor=white)
![Streamer.bot Ready](https://img.shields.io/badge/Streamer.bot-Ready-blue)
![Google Fonts](https://img.shields.io/badge/Google%20Fonts-Supported-orange)

> Horizontal chat overlay for Twitch & YouTube via **Streamer.bot WebSocket**, packaged for **OBS Browser Source** (Docker).

*(Add a short demo gif here for instant context)*  
`https://github.com/saitatter/sai-chat-overlay/assets/XXXX/demo.gif`

---

## ✨ Features
- 🎨 Live customization: colors, fonts (Google Fonts), background opacity
- ⏱ Adjustable message fade time
- 🧼 Smooth, synchronized slide animations (overflow & auto-expire)
- 🔖 Badges rendering for users
- 🔌 Streamer.bot integration (Twitch `ChatMessage`, YouTube `Message`)
- 🐳 Docker image on GHCR (`latest` for amd64, version tags are multi-arch)

---

## 🚀 Quick Start

### Docker (recommended)
```bash
docker pull ghcr.io/saitatter/sai-chat-overlay:latest
docker run -d -p 8080:80 ghcr.io/saitatter/sai-chat-overlay:latest
```

Add a Browser Source in OBS pointing to:
```
http://localhost:8080/?edit=false&twitchColor=%239146FF&youtubeColor=%23FF0000&msgBgColor=%23000000&msgBgOpacity=0.6&fadeTime=8&fontFamily=Poppins
```

> 💡 Tip: Append `?edit=true` to open the in-page settings panel for live customization. Fonts are loaded via Google Fonts and must be in the internal allowlist.

---

## ⚙️ Configuration (URL params)

| Param          | Type    | Default   | Example                     | Notes |
|----------------|---------|-----------|-----------------------------|-------|
| `edit`         | bool    | `false`   | `true`                      | Shows settings panel |
| `twitchColor`  | hex     | `#9146FF` | `%239146FF`                 | URL-encode `#` as `%23` |
| `youtubeColor` | hex     | `#FF0000` | `%23FF0000`                 | — |
| `msgBgColor`   | hex     | `#000000` | `%23000000`                 | Combined with `msgBgOpacity` |
| `msgBgOpacity` | 0–1     | `0.6`     | `0.8`                       | Final bg: `rgba(color, opacity)` |
| `fadeTime`     | seconds | `8`       | `12`                        | Message lifetime |
| `fontFamily`   | string  | `Poppins` | `Roboto`                    | Must exist in the internal Google Fonts list |

---

## 🔌 Streamer.bot Setup

1. Enable **WebSocket** in Streamer.bot (default overlay code uses `ws://localhost:8080`).
2. The overlay subscribes to:
   - Twitch: `ChatMessage`
   - YouTube: `Message`
3. Ensure OBS can reach both the overlay and Streamer.bot WS endpoint.

---

## 🧪 Local Development

```bash
# Clone
git clone https://github.com/saitatter/sai-chat-overlay.git
cd sai-chat-overlay

# Serve statically
npm i -g serve
serve -l 8080 .
```

Then open:  
`http://localhost:8080/?edit=true`

---

## 🐳 Docker

### Local build
```bash
docker build -t ghcr.io/saitatter/sai-chat-overlay:dev .
docker run -d -p 8080:80 ghcr.io/saitatter/sai-chat-overlay:dev
```

### CI images (from GitHub Actions)
- `latest`: **amd64** (single-platform) → clean GHCR entry
- versioned tags (e.g. `1.0.3`): **multi-arch** (`amd64`, `arm64`)

```bash
docker pull ghcr.io/saitatter/sai-chat-overlay:1.0.3
```

---

## 🔄 Releases

Uses **semantic-release**.  
A release is created only when the commit message contains `release!`.  
All commits since the last tag are included in that release.

- Use Conventional Commits: `feat: ...`, `fix: ...`, `perf: ...`, `refactor: ...`
- Breaking changes:  
  ```
  BREAKING CHANGE: description...
  ```

---

## 🛠 Troubleshooting

- **Blank overlay in OBS** — Check URL and that container is reachable.
- **No messages appear** — Verify Streamer.bot is running and WS URL matches.
- **Fonts not applying** — Ensure family is in allowlist and Google Fonts is reachable.
- **Multiple `latest` entries in GHCR** — CI publishes single-platform `latest` and multi-arch only for version tags.

---

## 🤝 Contributing

PRs are welcome! Please:
- Keep commits small and conventional.
- Avoid squash merges if you want granular changelog entries.

---

## 📄 License

MIT © saitatter
