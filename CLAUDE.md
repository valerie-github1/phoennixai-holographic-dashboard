# CLAUDE.md — PhoennixAI · phoennixai-holographic-dashboard
> Claude Code reads this file every session. Do not delete. Last updated: 2026-04-13.

---

## 01 · Brand

| | |
|---|---|
| **Brand name** | PhoennixAI |
| **Tagline** | AI-powered app development agency |
| **Location** | London, UK |
| **Website** | phoennixai.com |
| **Tone** | Futuristic, premium, cinematic — sci-fi HUD aesthetic |

### Colours
```
primary   : #06b6d4   (Cyan 500 — main UI elements)
secondary : #3b82f6   (Blue 500 — supporting elements)
accent    : #f43f5e   (Rose 500 — alerts / warnings)
bg        : #0f172a   (Slate 900 — scene background)
```

### Typography
- **Display / headings:** `Cormorant Garamond` (serif, elegant)
- **Body / UI:** `DM Sans` (sans-serif, clean)
- **HUD numbers / data:** monospace system font

---

## 02 · Project — holographic-dashboard

**What it is:** A real-time holographic EV (electric vehicle) telemetry dashboard. Full 3D scene built with Three.js / React Three Fiber, with a live HUD overlay showing speed, battery, RPM, range, temperature, and drive modes.

**Drive modes:** ECO · SPORT · HYPER (each affects physics simulation)

**Key components:**
- `App.tsx` — root: simulation loop, state, audio controller
- `components/Scene` — Three.js 3D scene
- `components/HUDOverlay` — transparent data overlay
- `utils/AudioController` — Web Audio API engine sounds
- `constants.ts` — theme colours, MAX_SPEED (240), MAX_RANGE (500), MAX_RPM (12000)
- `types.ts` — `TelemetryData`, `DriveMode` enums

---

## 03 · Stack

| Layer | Technology | Version |
|---|---|---|
| UI framework | React | 18.2.0 |
| 3D engine | Three.js | 0.165.0 |
| React 3D bindings | @react-three/fiber | 8.16.8 |
| 3D helpers | @react-three/drei | 9.108.0 |
| Post-processing | postprocessing + @react-three/postprocessing | 6.36.0 / 2.16.2 |
| Icons | lucide-react | 0.395.0 |
| Language | TypeScript | ~5.8.2 |
| Build tool | Vite | ^6.2.0 |
| Deployment | Vercel |

---

## 04 · GitHub

```
Org / owner : valerie-github1
Repo        : phoennixai-holographic-dashboard
Main branch : main
Dev branch  : claude/setup-remote-control-qpnp8
```

### Push workflow (3 commands)
```bash
git add -p                                    # stage changes
git commit -m "feat: <description>"
git push -u origin claude/setup-remote-control-qpnp8
```

---

## 05 · Vercel

```
Project name  : phoennixai-holographic-dashboard
Framework     : Vite
Build command : npm run build
Output dir    : dist
Node version  : 20.x
Domain        : phoennixai.com  (or .vercel.app subdomain)
```

### Environment variables (Vercel dashboard)
```
# None required for this project currently.
# Add ANTHROPIC_API_KEY here if AI features are added.
```

---

## 06 · Supabase

```
# Not yet integrated in this project.
# When adding: store telemetry sessions or user preferences.
# Table suggestion: holo_sessions (session_id, drive_mode, avg_speed, max_speed, duration)
```

---

## 07 · Contacts & Email

| Role | Email |
|---|---|
| Owner / Ops | valerie@phoennixai.com |
| Tech / Dev | dilpreet@phoennixai.com |
| Remote Control | phoenixdigitec3@gmail.com |

---

## 08 · Claude Remote Control

```
Auto-connect email : phoenixdigitec3@gmail.com
Setup script       : .claude/setup-remote-control.sh
SessionStart hook  : .claude/settings.json
```

```bash
# Run once to install (or auto-runs on SessionStart)
bash .claude/setup-remote-control.sh
```

---

## 09 · Dev Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
npm run preview  # preview production build
```

---

## 10 · Rules for Claude Code

1. **Theme colours only** — use `THEME_COLORS` from `constants.ts`; never hardcode hex values in components
2. **Simulation interval is 50ms** — do not slow it down; physics runs in `setInterval` in `App.tsx`
3. **Three drive modes are fixed** — ECO / SPORT / HYPER; do not add or rename modes
4. **TypeScript strict** — all new code must pass `tsc` with no errors
5. **No unnecessary re-renders** — use `useCallback` and `useMemo` where appropriate; the 3D scene is expensive
6. **Post-processing** — bloom and other effects live in the Scene component; keep them performant
7. **Audio is opt-in** — `isAudioMuted` defaults to `true`; never auto-play audio
8. **Commit to dev branch** first (`claude/setup-remote-control-qpnp8`), never force-push to `main`
9. **graphify** — run `/graphify .` after major code changes to rebuild the knowledge graph
10. **Constants** — update `MAX_SPEED`, `MAX_RANGE`, `MAX_RPM` only in `constants.ts`, never inline
