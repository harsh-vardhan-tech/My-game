# 0x Battle Hub

Multi-game offline-ready web app (PWA) with:
- Tic Tac Toe (Perfect AI)
- Snake & Ladder (AI / 2P)
- Dot Box (Smart AI / 2P)
- Settings (volume + custom sounds upload)
- Donate (UPI deep link) – `kk2112423@oksbi`
- Contact modal (GitHub + LinkedIn buttons)
- Sound effects + background loop
- Mobile responsive neon UI
- Works offline (service worker + cache)
- Add to Home Screen (PWA install)

---

## 🎮 Features Detail

| Feature | Description |
|---------|-------------|
| Multi-step Flow | Game → Mode → Names → Summary → Play |
| Strong AI | TicTacToe minimax (never loses) |
| Heuristic AI | Dot Box avoids giving boxes early |
| Snake & Ladder | Dice animation + snakes/ladders mapping |
| Sound Manager | Custom upload (localStorage), mute, volume |
| Donate | UPI deep link + copy button |
| Contact | GitHub + LinkedIn open new tab |
| Offline | Service Worker caches core assets |
| PWA | manifest + icons → Installable app |

---

## 🗂 Folder Structure

```
/
 index.html
 manifest.json
 service-worker.js
 src/
   style/
     base.css
     animations.css
   core/
     app.js
     state.js
     ui.js
     soundManager.js
   games/
     tictactoe.js
     snake.js
     dotbox.js
 assets/
   audio/
     click.mp3
     move.mp3
     win.mp3
     bg.mp3
 icons/
   icon-192.png
   icon-512.png
 README.md
 LICENSE
```

---

## 🔊 Custom Sounds

Settings panel → choose file → play.  
Stored only in `localStorage`. Clearing site data resets them.

Recommended:
- click.mp3 ( < 40 KB )
- move.mp3 ( < 60 KB )
- win.mp3 ( < 80 KB )
- bg.mp3  ( loop, < 300 KB )

---

## 💰 Donate (UPI)

UPI ID used: `kk2112423@oksbi`  
UPI link format:
```
upi://pay?pa=kk2112423@oksbi&pn=Harsh%20Vardhan&cu=INR&am=99
```

---

## 🚀 Run Locally (Manual)

1. Download ZIP or clone.
2. Double-click `index.html`.
3. For full PWA & service worker features use a local server (optional):
   - Python: `python -m http.server 8080`
   - Node (npx): `npx serve`
4. Open in browser → install / Add to Home Screen.

---

## 🌐 Deploy (GitHub Pages)

1. Repo → Settings → Pages.
2. Source: `main` (root).
3. Save → wait 1–2 min.
4. Open URL given (something like `https://<username>.github.io/<repo>/`).

---

## 🧪 Quick Test Checklist

| Test | Expected |
|------|----------|
| Select game | Card highlights + Next enabled |
| Select mode | Button highlight + Next enabled |
| Enter names | Summary enabled |
| Start game | Board renders |
| TicTacToe AI | Never loses |
| Snake & Ladder | Dice anim + snakes/ladders working |
| Dot Box AI | Avoids giving free boxes early |
| Restart | Same game resets |
| Home button | Flow screens return |
| Donate | Amount buttons fill input, UPI link opens UPI app (mobile) |
| Contact | Buttons open GitHub / LinkedIn in new tab |
| Settings → volume | Sounds softer/louder |
| Custom upload | Plays new sound |
| Offline reload | Still loads after first visit |
| PWA install | Install prompt / Add to Home Screen |

---

## 🛠 Extend Ideas

- Add leaderboard (localStorage)
- Add dark/light theme toggle
- Extra games (2048, Connect Four)
- Online multiplayer via WebRTC / Firebase

---

## 📝 License

MIT – see [LICENSE](LICENSE).

---

## 👤 Author

**Harsh Vardhan**  
GitHub: https://github.com/harsh-vardhan-tech  
(Replace LinkedIn placeholder in `app.js` with your actual link if needed.)

---

## ✅ Integrity Note

All code modular:  
- Core flow in `src/core/app.js`  
- Individual games in `src/games/`  
- Styles separated for maintainability.

Happy building! 🎉
