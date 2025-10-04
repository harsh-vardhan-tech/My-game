# 0x Battle Hub

Multi-game mobile-friendly hub made by Harsh Vardhan.

Included:
- Tic Tac Toe (Perfect AI)
- Snake & Ladder
- Dot Box (Smart turn AI)
- Custom sounds (local only)
- UPI Donate modal
- PWA (installable + offline basic)
- Strong modular structure

## Folder Structure
```
index.html
manifest.json
service-worker.js
src/
  core/ (app, state, ui, soundManager)
  games/ (tictactoe, snake, dotbox)
  style/ (base + animations)
assets/
  audio/ (put click.mp3, move.mp3, win.mp3, bg.mp3)
icons/
  icon-192.png
  icon-512.png
```

## Custom Sounds
Settings panel → upload. Stored as base64 in localStorage per device.

## UPI Donate
Uses universal intent link:
`upi://pay?pa=kk2112423@oksbi&pn=Harsh%20Vardhan...`

## Build / Obfuscation (Later)
You can later minify with any bundler (esbuild / rollup) if needed.

## License
See LICENSE (MIT).