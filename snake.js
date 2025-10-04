// Snake & Ladder game for Game Hub (simple, clear UI, animated dice, phone-friendly)
window.renderSnakeLadder = function(container, mode, player1, player2) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;">
      <h2 style="color:#56e6ff;text-shadow:0 0 8px #56e6ff,0 0 16px #7c3aed;font-size:2rem;margin-bottom:8px;">
        🐍 Snake & Ladder
      </h2>
      <div style="margin-bottom:6px;font-weight:700;">
        <span style="color:#7c3aed">${player1}</span> vs <span style="color:#ff5c7c">${player2}</span>
      </div>
      <div id="snlBoard" style="margin-bottom:15px;"></div>
      <div id="snlInfo" style="font-weight:700;font-size:1.14rem;min-height:32px;margin-bottom:6px;"></div>
      <button id="snlDiceBtn" style="padding:10px 28px;background:linear-gradient(90deg,#ffbe0b,#ff5c7c);border:none;color:#222;font-weight:700;border-radius:14px;cursor:pointer;font-size:1.15rem;box-shadow:0 0 7px #ffbe0b66;">
        🎲 Roll Dice
      </button>
      <button id="snlResetBtn" style="margin-top:10px;background:#7c3aed;color:#fff;border:none;border-radius:12px;padding:7px 18px;cursor:pointer;font-weight:700;">Restart Game 🔄</button>
      <button id="snlBackBtn" style="margin-top:10px;background:#ff5c7c;color:#fff;border:none;border-radius:12px;padding:7px 18px;cursor:pointer;font-weight:700;">⬅ Home</button>
    </div>
  `;

  // Board design
  const boardDiv = container.querySelector('#snlBoard');
  const infoDiv = container.querySelector('#snlInfo');
  const diceBtn = container.querySelector('#snlDiceBtn');
  const resetBtn = container.querySelector('#snlResetBtn');
  const backBtn = container.querySelector('#snlBackBtn');
  // Board: 10x10
  let boardHtml = `<div style="display:grid;grid-template-columns:repeat(10,28px);gap:2px;">`;
  for(let i=100;i>=1;i--){
    boardHtml += `<div style="width:28px;height:28px;border-radius:6px;background:${i%2==0?'#56e6ff44':'#7c3aed44'};display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:700;position:relative;${i==100?'box-shadow:0 0 12px #ffbe0b':""}">
      <span>${i}</span>
      <span id="snlP${i}" style="position:absolute;top:2px;right:3px;font-size:1.13rem;"></span>
    </div>`;
  }
  boardHtml += `</div>`;
  boardDiv.innerHTML = boardHtml;

  // Snakes and ladders
  const snakes = {16:6,48:30,62:19,64:60,93:68,95:24,97:76,98:78};
  const ladders = {2:38,7:14,8:31,15:26,21:42,28:84,36:44,51:67,71:91,78:98,87:94};
  let pos = [1,1];
  let turn = 0; // 0: player1, 1: player2
  let running = true;
  function renderTokens(){
    for(let i=1;i<=100;i++){
      let el = boardDiv.querySelector(`#snlP${i}`);
      el.innerHTML = '';
    }
    for(let p=0;p<2;p++){
      let el = boardDiv.querySelector(`#snlP${pos[p]}`);
      if(el) el.innerHTML += p==0?`<span style="color:#7c3aed;">🔵</span>`:`<span style="color:#ff5c7c;">🔴</span>`;
    }
  }
  function showInfo(msg){infoDiv.textContent=msg;}
  function rollDiceAnim(cb){
    diceBtn.disabled = true;
    let roll = 1+Math.floor(Math.random()*6);
    let anim = 0;
    infoDiv.innerHTML = `<span style="font-size:2.2rem;">🎲</span> Rolling...`;
    let interval = setInterval(()=>{
      infoDiv.innerHTML=`<span style="font-size:2.2rem;">${['⚀','⚁','⚂','⚃','⚄','⚅'][Math.floor(Math.random()*6)]}</span>`;
      if(++anim>8){
        clearInterval(interval);
        cb(roll);
        diceBtn.disabled = false;
      }
    },80);
  }
  function movePlayer(steps){
    let old = pos[turn];
    pos[turn] += steps;
    if(pos[turn]>100) pos[turn]=old; // Can't go above 100
    showInfo(`${turn==0?player1:player2} got ${steps}!`);
    renderTokens();
    setTimeout(()=>{
      // Ladder
      if(ladders[pos[turn]]){
        showInfo(`🎉 Ladder! ${turn==0?player1:player2} jumps to ${ladders[pos[turn]]}`);
        pos[turn]=ladders[pos[turn]];
        renderTokens();
      }
      // Snake
      if(snakes[pos[turn]]){
        showInfo(`🦎 Snake! ${turn==0?player1:player2} slides to ${snakes[pos[turn]]}`);
        pos[turn]=snakes[pos[turn]];
        renderTokens();
      }
      // Win
      if(pos[turn]==100){
        showInfo(`🏆 ${turn==0?player1:player2} wins!`);
        running = false;
        diceBtn.disabled = true;
        return;
      }
      // Next turn
      turn = (turn+1)%2;
      showInfo(`Now: ${turn==0?player1:player2}`);
    },650);
  }
  diceBtn.onclick = () => {
    if(!running) return;
    rollDiceAnim(movePlayer);
  };
  resetBtn.onclick = () => {
    pos=[1,1]; turn=0; running=true; diceBtn.disabled=false;
    showInfo(`Start! ${player1} vs ${player2}`);
    renderTokens();
  };
  backBtn.onclick = () => {
    container.innerHTML = "";
    showScreen(0);
  };
  resetBtn.onclick();
};
