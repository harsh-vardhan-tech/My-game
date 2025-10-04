// src/games/snake.js
// Snake & Ladder (1–100). Supports: Player vs Player or Player vs AI.
// Board: 10x10. Snakes & ladders defined in map. First to reach 100 wins.
// Uses sounds + confetti + toast.

import { SoundManager } from '../core/soundManager.js';
import { toast, confettiBurst, rand, $ } from '../core/ui.js';

export function renderSnake(container, state){
  container.innerHTML = '';
  const game = new SnakeLadder(state);
  container.appendChild(game.root);
  game.init();
}

class SnakeLadder {
  constructor(state){
    this.state = state;
    this.positions = { p1: 1, p2: 1 };
    this.turn = 'p1'; // p1 always starts
    this.finished = false;
    this.snakes = {
      99: 54, 95: 72, 92: 51, 89: 53, 74: 41,
      62: 19, 64: 60, 49: 11, 46: 25, 16: 6
    };
    this.ladders = {
      2: 38, 7: 14, 8: 31, 15: 26, 21: 42,
      28: 84, 36: 44, 51: 67, 71: 91, 78: 98, 87: 94
    };
    this.root = document.createElement('div');
    this.root.className='snake-wrap';
    this.root.innerHTML = `
      <style>
        .snake-wrap{display:flex;flex-direction:column;gap:14px;align-items:center;margin-top:6px;}
        .snake-head{font-size:1.15rem;font-weight:700;background:linear-gradient(90deg,#ff5c7c,#56e6ff);-webkit-background-clip:text;color:transparent;}
        .snake-status{min-height:42px;font-size:.75rem;font-weight:600;letter-spacing:.6px;text-align:center;background:linear-gradient(145deg,#32254f,#47356a);border:1px solid rgba(255,255,255,.18);border-radius:16px;padding:10px 14px;width:100%;box-shadow:0 4px 14px -6px #000;}
        .board{display:grid;grid-template-columns:repeat(10,1fr);gap:3px;width:100%;background:#231a35;padding:6px;border-radius:16px;box-shadow:0 6px 18px -10px #000;max-width:480px;}
        .cell{position:relative;aspect-ratio:1;border-radius:10px;font-size:.55rem;font-weight:600;letter-spacing:.4px;display:flex;align-items:flex-start;justify-content:flex-end;padding:4px 5px;background:linear-gradient(145deg,#35264f,#49366c);border:1px solid rgba(255,255,255,.12);color:#ffffffaa;overflow:hidden;}
        .cell:nth-child(odd){background:linear-gradient(145deg,#3a2a56,#513870);}
        .cell.ladder{outline:2px solid #56e6ff;box-shadow:0 0 8px #56e6ffcc inset;}
        .cell.snake{outline:2px solid #ff5c7c;box-shadow:0 0 8px #ff5c7ccc inset;}
        .avatar{position:absolute;left:4px;bottom:4px;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.63rem;font-weight:700;color:#141d2b;}
        .avatar.p1{background:linear-gradient(145deg,#ffbe0b,#ff8f3c);box-shadow:0 0 10px #ffbe0bcc;}
        .avatar.p2{background:linear-gradient(145deg,#56e6ff,#06b6d4);box-shadow:0 0 10px #56e6ffbb;}
        @media(max-width:480px){.cell{font-size:.48rem;}}
        .dice-bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center;}
        .dice-btn{background:linear-gradient(145deg,#2f2349,#453364);border:1px solid rgba(255,255,255,.2);color:#fff;font-weight:700;letter-spacing:.6px;padding:14px 20px;border-radius:18px;cursor:pointer;box-shadow:0 4px 14px -6px #000;transition:.2s;font-size:.85rem;position:relative;overflow:hidden;}
        .dice-btn:before{content:'';position:absolute;inset:0;background:linear-gradient(110deg,rgba(255,255,255,.3),transparent 70%);opacity:0;transition:.5s;}
        .dice-btn:hover:before{opacity:1;}
        .dice-btn:hover{transform:translateY(-4px);}
        .dice-btn:active{transform:scale(.9);}
        .dice-btn:disabled{opacity:.35;cursor:not-allowed;transform:none;}
        .last-roll{font-size:.65rem;opacity:.65;letter-spacing:.5px;margin-top:2px;text-align:center;}
        .pulse-win{animation:pulseWin 1.4s infinite;}
      </style>
      <div class="snake-head">Snake & Ladder</div>
      <div class="snake-status" id="snStatus"></div>
      <div class="board" id="snBoard"></div>
      <div class="dice-bar">
        <button class="dice-btn" id="rollBtn">🎲 Roll</button>
      </div>
      <div class="last-roll" id="lastRoll">Ready.</div>
    `;
    this.statusEl = this.root.querySelector('#snStatus');
    this.boardEl  = this.root.querySelector('#snBoard');
    this.rollBtn  = this.root.querySelector('#rollBtn');
    this.lastRoll = this.root.querySelector('#lastRoll');
    this.isVsAI   = this.state.selectedMode === 'ai';
  }

  init(){
    this.buildBoard();
    this.updateStatus();
    this.rollBtn.onclick = () => this.playerRoll();
  }

  buildBoard(){
    // 10 rows of 10; numbering zigzag
    this.boardEl.innerHTML='';
    let cells=[];
    for(let row=9;row>=0;row--){
      const base = row*10;
      let rowNums = [];
      for(let i=1;i<=10;i++){
        rowNums.push(base+i);
      }
      if((9-row)%2===1){ // alternate reverse for proper snake-ladder pattern
        rowNums.reverse();
      }
      cells.push(...rowNums);
    }
    cells.forEach(num=>{
      const c=document.createElement('div');
      c.className='cell';
      c.dataset.num=num;
      c.textContent=num;
      if(this.ladders[num]) c.classList.add('ladder');
      if(this.snakes[num]) c.classList.add('snake');
      this.boardEl.appendChild(c);
    });
    this.paintAvatars();
  }

  paintAvatars(){
    // Clear existing avatars
    this.boardEl.querySelectorAll('.avatar').forEach(a=>a.remove());
    // Add for p1,p2
    Object.entries(this.positions).forEach(([key,pos])=>{
      const cell = this.boardEl.querySelector(`.cell[data-num="${pos}"]`);
      if(cell){
        const av=document.createElement('div');
        av.className='avatar '+key;
        av.textContent=(key==='p1'?'1':'2');
        cell.appendChild(av);
      }
    });
  }

  playerRoll(){
    if(this.finished) return;
    if(this.isVsAI && this.turn==='p2') return; // Wait AI
    this.doRoll();
  }

  doRoll(){
    this.rollBtn.disabled=true;
    const roll = rand(1,6);
    SoundManager.play('move');
    this.animateDice(roll, ()=>{
      this.advance(roll, ()=>{
        if(this.finished) return;
        if(this.isVsAI){
          if(this.turn==='p2'){
            setTimeout(()=>this.aiTurn(), 700);
          } else {
            this.rollBtn.disabled=false;
          }
        } else {
            this.rollBtn.disabled=false;
        }
      });
    });
  }

  animateDice(finalRoll, cb){
    let count=0;
    const tempSeq = setInterval(()=>{
      count++;
      const fake = rand(1,6);
      this.lastRoll.textContent='Rolling... '+fake;
      if(count>8){
        clearInterval(tempSeq);
        this.lastRoll.textContent='You rolled: '+finalRoll;
        cb();
      }
    },60);
  }

  advance(roll, after){
    let posKey = this.turn;
    let startPos = this.positions[posKey];
    let target = startPos + roll;
    if(target>100){
      // overshoot not allowed
      toast('Need exact to finish!');
      this.switchTurn();
      this.updateStatus();
      after();
      return;
    }
    this.positions[posKey] = target;
    this.paintAvatars();

    // Ladder or snake
    setTimeout(()=>{
      if(this.ladders[target]){
        const to = this.ladders[target];
        toast('Ladder! '+target+' → '+to);
        this.positions[posKey] = to;
        SoundManager.play('move');
        this.paintAvatars();
      } else if(this.snakes[target]){
        const to = this.snakes[target];
        toast('Snake! '+target+' → '+to);
        this.positions[posKey] = to;
        SoundManager.play('click');
        this.paintAvatars();
      }
      // Win check
      if(this.positions[posKey]===100){
        this.finishGame(posKey);
        return;
      }
      // Extra turn if roll == 6
      if(roll===6){
        toast('Extra turn!');
        this.updateStatus(true);
      } else {
        this.switchTurn();
        this.updateStatus();
      }
      after();
    }, 420);
  }

  aiTurn(){
    if(this.finished) return;
    if(this.turn!=='p2') return;
    this.lastRoll.textContent='AI thinking...';
    setTimeout(()=>{
      this.doRoll();
    }, 500);
  }

  switchTurn(){
    if(this.turn==='p1') this.turn='p2'; else this.turn='p1';
  }

  updateStatus(keepTurn=false){
    if(this.finished) return;
    const p1n = this.state.player1;
    const p2n = this.state.player2;
    let labelTurn;
    if(this.turn==='p1'){
      labelTurn = (this.isVsAI? p1n : p1n)+' TURN';
    } else {
      labelTurn = (this.isVsAI? 'AI' : p2n)+' TURN';
    }
    this.statusEl.innerHTML = `
      <span class="badge-turn">${labelTurn}</span><br>
      ${p1n}: <b>${this.positions.p1}</b> &nbsp; | &nbsp;
      ${this.isVsAI?'AI':p2n}: <b>${this.positions.p2}</b>
    `;
    if(this.isVsAI){
      if(this.turn==='p2' && !keepTurn){
        // AI auto proceed
        this.rollBtn.disabled=true;
        setTimeout(()=>this.aiTurn(), 600);
      } else {
        this.rollBtn.disabled=false;
      }
    }
  }

  finishGame(winnerKey){
    this.finished=true;
    SoundManager.play('win');
    confettiBurst();
    const name = (winnerKey==='p1') ? this.state.player1 : (this.isVsAI? 'AI' : this.state.player2);
    this.statusEl.innerHTML = `<b>${name} WINS! 🏆</b>`;
    this.statusEl.classList.add('pulse-win');
    this.rollBtn.disabled=true;
    this.lastRoll.textContent='Game Over.';
  }
}
