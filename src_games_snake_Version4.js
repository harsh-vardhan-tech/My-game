import { $, confettiBurst, toast } from '../core/ui.js';
import { SoundManager } from '../core/soundManager.js';
import { GlobalState } from '../core/state.js';

export function renderSnake(container){
  const {player1, player2} = GlobalState;
  container.innerHTML=`
    <div class="snl-wrap">
      <div class="snl-head">
        <div class="snl-title">🐍 Snake & Ladder</div>
        <div class="snl-players">${player1} <span class="vs">vs</span> ${player2}</div>
      </div>
      <div id="snlBoard" class="snl-board"></div>
      <div class="snl-panel">
        <div id="snlStatus" class="snl-status"></div>
        <div class="snl-dice-row">
          <div id="snlDiceFace" class="snl-dice">🎲</div>
          <button id="snlRollBtn" class="snl-roll">Roll Dice</button>
        </div>
        <div class="snl-note">Exact 100 required to win</div>
      </div>
    </div>`;
  injectSnakeStylesOnce();

  const snakes={16:6,48:30,62:19,64:60,93:68,95:24,97:76,98:78};
  const ladders={2:38,7:14,8:31,15:26,21:42,28:84,36:44,51:67,71:91,78:98,87:94};
  let pos=[1,1], turn=0, finished=false;
  const boardEl=$('#snlBoard'), statusEl=$('#snlStatus'), diceFace=$('#snlDiceFace'), rollBtn=$('#snlRollBtn');

  buildBoard(); renderTokens(); updateStatus();

  rollBtn.onclick=()=>{
    if(finished) return;
    rollBtn.disabled=true;
    animateDice(()=>{
      const r=rnd(1,6);
      displayDice(r);
      move(r);
    });
  };

  function buildBoard(){
    boardEl.innerHTML='';
    let dir=1;
    for(let row=9;row>=0;row--){
      for(let col=0;col<10;col++){
        const num=row*10+(dir===1?col+1:10-col);
        const cell=document.createElement('div');
        cell.className='snl-cell';
        cell.dataset.num=num;
        cell.innerHTML=`
          <span class="n">${num}</span>
          <div class="zone" id="snlP${num}"></div>
          ${snakes[num]?'<span class="snake">🐍</span>':''}
          ${ladders[num]?'<span class="ladder">🪜</span>':''}`;
        boardEl.appendChild(cell);
      }
      dir*=-1;
    }
  }
  function renderTokens(){
    for(let i=1;i<=100;i++){
      const z=$('#snlP'+i); if(z) z.innerHTML='';
    }
    $('#snlP'+pos[0])?.insertAdjacentHTML('beforeend','<span class="tk tk-a">🔵</span>');
    $('#snlP'+pos[1])?.insertAdjacentHTML('beforeend','<span class="tk tk-b">🔴</span>');
  }
  function updateStatus(){
    if(finished) return;
    statusEl.innerHTML=`<span class="badge-turn">TURN</span><br>${turn===0?player1:player2}`;
  }
  function rnd(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
  function animateDice(done){
    let c=0; const it=setInterval(()=>{
      displayDice(rnd(1,6));
      c++; if(c>=8){clearInterval(it);done();}
    },80);
  }
  function displayDice(n){diceFace.textContent=['⚀','⚁','⚂','⚃','⚄','⚅'][n-1];}
  function move(r){
    let current=pos[turn], target=current+r;
    if(target>100){
      toast('Exact roll needed');
      rollBtn.disabled=false; updateStatus(); return;
    }
    let step=current;
    function advance(){
      if(step<target){
        step++; pos[turn]=step; renderTokens(); SoundManager.play('move');
        setTimeout(advance,110);
      }else{
        setTimeout(()=>{
          if(ladders[step]){pos[turn]=ladders[step];renderTokens();toast('Ladder!');SoundManager.play('move');}
          else if(snakes[step]){pos[turn]=snakes[step];renderTokens();toast('Snake!');SoundManager.play('move');}
          check();
        },260);
      }
    }
    advance();
  }
  function check(){
    if(pos[turn]===100){
      finished=true;
      statusEl.innerHTML=`<b>${turn===0?player1:player2} Wins! 🏆</b>`;
      SoundManager.play('win');
      confettiBurst();
      rollBtn.disabled=true;
      return;
    }
    turn=(turn+1)%2;
    rollBtn.disabled=false;
    updateStatus();
  }
}

function injectSnakeStylesOnce(){
  if(document.getElementById('snlStyles')) return;
  const st=document.createElement('style'); st.id='snlStyles';
  st.textContent=`
  .snl-wrap{display:flex;flex-direction:column;align-items:center;width:100%;gap:12px;margin-top:6px;}
  .snl-head{text-align:center;}
  .snl-title{font-size:1.15rem;font-weight:700;letter-spacing:.6px;background:linear-gradient(90deg,#ff5c7c,#56e6ff);-webkit-background-clip:text;color:transparent;}
  .snl-players{font-size:.66rem;opacity:.7;margin-top:-4px;text-transform:uppercase;letter-spacing:.6px;}
  .snl-board{display:grid;grid-template-columns:repeat(10,1fr);gap:5px;width:100%;aspect-ratio:1;background:rgba(255,255,255,.08);padding:10px;border-radius:26px;box-shadow:0 0 18px #7c3aed44;position:relative;}
  .snl-cell{position:relative;background:rgba(255,255,255,.1);border-radius:12px;display:flex;align-items:flex-start;justify-content:flex-start;padding:4px;font-size:.55rem;font-weight:600;color:#fff;overflow:hidden;}
  .snl-cell .n{opacity:.55;}
  .snl-cell .snake,.snl-cell .ladder{position:absolute;bottom:2px;font-size:.9rem;opacity:.85;filter:drop-shadow(0 0 4px #000);}
  .snl-cell .snake{right:4px;}
  .snl-cell .ladder{left:4px;}
  .snl-cell .zone{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:4px;font-size:1.15rem;z-index:2;}
  .tk{filter:drop-shadow(0 0 4px #000);}
  .snl-panel{width:100%;background:rgba(255,255,255,.1);padding:16px 18px 20px;border-radius:22px;display:flex;flex-direction:column;align-items:center;gap:12px;box-shadow:0 0 16px #06b6d455;}
  .snl-status{font-size:.9rem;font-weight:600;min-height:34px;text-align:center;}
  .snl-dice-row{display:flex;align-items:center;gap:12px;}
  .snl-dice{width:68px;height:68px;background:linear-gradient(145deg,#2d2145,#483166);border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;box-shadow:0 0 14px #7c3aed55;user-select:none;}
  .snl-roll{background:linear-gradient(90deg,#7c3aed,#06b6d4);border:none;color:#fff;font-weight:700;letter-spacing:.5px;padding:14px 24px;border-radius:18px;font-size:.85rem;cursor:pointer;box-shadow:0 0 16px #06b6d455;transition:.2s;}
  .snl-roll:active{transform:scale(.9);}
  .snl-note{font-size:.58rem;opacity:.6;letter-spacing:.5px;}
  `;
  document.head.appendChild(st);
}