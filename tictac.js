// Advanced, cool, funny Tic Tac Toe game for Game Hub
window.renderTicTacToe = function(container, mode, nameX, nameO) {
  container.innerHTML = `
    <div class="ttt-wrap" style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;">
      <h2 style="color:#ff5c7c;text-shadow:0 0 8px #ff5c7c,0 0 16px #56e6ff;font-size:2rem;margin-bottom:8px;">
        Tic Tac Toe ❌⭕
      </h2>
      <div id="tttPlayers" style="margin-bottom:8px;font-weight:700;">
        <span style="color:#7c3aed">${nameX}</span> vs <span style="color:#06b6d4">${nameO}</span>
      </div>
      <div id="tttGrid" style="display:grid;grid-template-columns:repeat(3,80px);gap:9px;margin:14px 0 10px 0;"></div>
      <div id="tttRoast" style="min-height:36px;text-align:center;font-weight:700;font-size:1.25rem;margin-bottom:6px;"></div>
      <button id="tttResetBtn" style="padding:8px 18px;background:linear-gradient(90deg,#7c3aed,#06b6d4);border:none;color:#fff;font-weight:700;border-radius:12px;cursor:pointer;transition:0.2s;margin-top:6px;font-size:1.1rem;">
        Restart Game 🔄
      </button>
      <button id="tttBackBtn" style="margin-top:10px;background:#ff5c7c;color:#fff;border:none;border-radius:12px;padding:7px 18px;cursor:pointer;font-weight:700;">⬅ Home</button>
    </div>
    <div id="tttConfetti" style="pointer-events:none;position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99;"></div>
  `;
  // Responsive grid
  function setGridSize() {
    const grid = container.querySelector("#tttGrid");
    if(window.innerWidth < 500) grid.style.gridTemplateColumns="repeat(3,55px)";
    else grid.style.gridTemplateColumns="repeat(3,80px)";
  }
  setGridSize(); window.addEventListener('resize',setGridSize);

  // Game logic
  let board = Array(9).fill(null);
  let turn = "X";
  let playerNames = {X: nameX, O: nameO};
  let running = true;
  const roastMsgs = [
    "😂 {name}, kya move tha!",
    "😜 {name}, next time better!",
    "🔥 {name}, plan fail!",
    "🤡 {name}, tutorial skip!",
    "😆 {name}, mast try!",
    "🥲 {name}, haar mat mano!",
    "🧠 {name}, dimaag lagao!",
    "👀 {name}, dekh ke khelo!",
    "💥 {name}, kya shot tha!",
    "🥳 {name}, ab to jeet lo!"
  ];
  function pickRandom(name) {
    return roastMsgs[Math.floor(Math.random()*roastMsgs.length)].replace('{name}', name);
  }
  const grid = container.querySelector("#tttGrid");
  const roast = container.querySelector("#tttRoast");
  const resetBtn = container.querySelector("#tttResetBtn");
  const backBtn = container.querySelector("#tttBackBtn");
  const confettiDiv = container.querySelector("#tttConfetti");

  function render() {
    grid.innerHTML = "";
    board.forEach((v,i) => {
      const cell = document.createElement("div");
      cell.className = "tttCell";
      cell.style = `
        width:100%;height:60px;background:rgba(255,255,255,0.08);
        display:flex;justify-content:center;align-items:center;font-size:2.6rem;font-weight:800;border-radius:10px;cursor:pointer;transition:all .15s;box-shadow:0 0 5px #7c3aed44;
      `;
      if(v) cell.classList.add(v === "X" ? "x" : "o");
      cell.textContent = v ? (v==="X"?"❌":"⭕") : "";
      cell.onclick = () => clickCell(i);
      if(!running) cell.style.pointerEvents="none";
      grid.appendChild(cell);
    });
  }
  function clickCell(i) {
    if(board[i]) return;
    board[i] = turn;
    roast.textContent = pickRandom(playerNames[turn]);
    render();
    if(checkWin()) {
      running = false;
      highlightWin();
      roast.textContent = playerNames[turn]+' jeet gaya! 🎉';
      showConfetti();
      return;
    }
    if(board.every(Boolean)) {
      running = false;
      roast.textContent = 'Draw! 🤝';
      showConfetti("draw");
      return;
    }
    turn = turn === "X" ? "O" : "X";
    if(mode === "AI" && turn === "O" && running) setTimeout(aiMove,300);
  }
  function aiMove() {
    const empty = board.map((v,i)=>v?null:i).filter(v=>v!==null);
    // Basic AI: win/stop win else random
    let move = null;
    // Try win
    for(let i of empty) {
      board[i]="O";
      if(checkWin()) { move=i; board[i]=null; break;}
      board[i]=null;
    }
    // Try block
    if(move===null) for(let i of empty) {
      board[i]="X";
      if(checkWin()) { move=i; board[i]=null; break;}
      board[i]=null;
    }
    if(move===null) move = empty[Math.floor(Math.random()*empty.length)];
    board[move] = "O";
    roast.textContent = pickRandom(playerNames["O"]);
    render();
    if(checkWin()) {
      running = false;
      highlightWin();
      roast.textContent = playerNames["O"]+' (AI) jeet gaya! 🤖';
      showConfetti();
      return;
    }
    if(board.every(Boolean)) {
      running = false;
      roast.textContent = 'Draw! 🤝';
      showConfetti("draw");
      return;
    }
    turn = "X";
  }
  const winLines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function checkWin() {
    return winLines.some(([a,b,c])=>board[a] && board[a]===board[b] && board[a]===board[c]);
  }
  function highlightWin() {
    winLines.forEach(([a,b,c])=>{
      if(board[a] && board[a]===board[b] && board[a]===board[c]){
        [a,b,c].forEach(i=>{
          grid.children[i].style.background="#ffbe0b";
          grid.children[i].style.boxShadow="0 0 18px #ffbe0b88";
          grid.children[i].style.transform="scale(1.18)";
          grid.children[i].style.transition="all .24s";
        });
      }
    });
  }
  function resetBoard() {
    board = Array(9).fill(null);
    turn = "X";
    running = true;
    roast.textContent = "Shuru karte hain! 🎮";
    grid.classList.remove("win");
    render();
    hideConfetti();
    if(mode==="AI" && turn==="O") setTimeout(aiMove,350);
  }
  function showConfetti(draw) {
    let emoji = draw?"🤝":"🎉";
    confettiDiv.innerHTML = "";
    let total = 36;
    for(let i=0;i<total;i++) {
      let span = document.createElement("span");
      span.textContent = emoji;
      span.style = `
        position:absolute;
        font-size:${Math.random()*20+24}px;
        left:${Math.random()*100}vw;
        top:${Math.random()*90}vh;
        animation:tttPop .8s cubic-bezier(.34,2,.6,1.5) ${Math.random()}s 1;
        pointer-events:none;
      `;
      confettiDiv.appendChild(span);
    }
  }
  function hideConfetti() {
    confettiDiv.innerHTML = "";
  }
  // Confetti animation
  const styleElem = document.createElement('style');
  styleElem.innerHTML = `
    @keyframes tttPop {
      0% {transform:scale(0.3) translateY(0);}
      80%{transform:scale(1.1) translateY(-60px);}
      100%{transform:scale(1) translateY(0);}
    }
  `;
  document.head.appendChild(styleElem);

  resetBtn.onclick = resetBoard;
  backBtn.onclick = () => {
    container.innerHTML = "";
    showScreen(0); // Home screen back
  };
  resetBoard();
};
