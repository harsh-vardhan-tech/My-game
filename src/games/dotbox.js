// src/games/dotbox.js
// Dot Box (Dots & Boxes) - 4x4 boxes = 5x5 dots grid
// Supports Player vs Player OR Player vs AI (heuristic: avoids giving 3rd side until forced)
// Scoring: claim box => one more move. All boxes filled => winner.
// Integrates sounds + confetti + toast.

import { SoundManager } from '../core/soundManager.js';
import { toast, confettiBurst, rand } from '../core/ui.js';

/**
 * Render Dot Box game
 * @param {HTMLElement} container
 * @param {object} state GlobalState (player1, player2, selectedMode)
 */
export function renderDotBox(container, state){
  container.innerHTML = '';
  const game = new DotBoxGame(state);
  container.appendChild(game.root);
  game.init();
}

class DotBoxGame {
  constructor(state){
    this.state = state;
    this.size = 5; // 5x5 dots => 4x4 boxes
    this.hLines = this._makeMatrix(this.size, this.size-1, false); // horizontal edges
    this.vLines = this._makeMatrix(this.size-1, this.size, false); // vertical edges
    this.boxes  = this._makeMatrix(this.size-1, this.size-1, null); // stores owner symbol 'P1'/'P2'
    this.turn = 'p1'; // p1 starts
    this.finished = false;
    this.isVsAI = this.state.selectedMode === 'ai';
    this.scores = { p1:0, p2:0 };

    this.root = document.createElement('div');
    this.root.className = 'dotbox-wrap';
    this.root.innerHTML = `
      <style>
        .dotbox-wrap{display:flex;flex-direction:column;gap:10px;align-items:center;margin-top:4px;}
        .db-head{font-size:1.05rem;font-weight:700;background:linear-gradient(90deg,#ff5c7c,#56e6ff);-webkit-background-clip:text;color:transparent;letter-spacing:.6px;}
        .db-status{min-height:46px;font-size:.72rem;font-weight:600;padding:10px 14px;text-align:center;border-radius:16px;background:linear-gradient(145deg,#32254f,#47356a);border:1px solid rgba(255,255,255,.18);letter-spacing:.55px;line-height:1.35;box-shadow:0 4px 14px -6px #000;}
        .db-board{position:relative;display:inline-block;padding:14px 16px 18px;background:#231a35;border-radius:20px;box-shadow:0 6px 22px -10px #000;}
        .db-grid{position:relative;}
        .db-dot{width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 0 6px #fff8,0 0 10px -4px #000;position:absolute;transform:translate(-50%,-50%);}
        .db-line-h,.db-line-v{position:absolute;background:linear-gradient(145deg,#3a2a57,#533875);cursor:pointer;transition:.2s;border-radius:8px;box-shadow:0 4px 12px -6px #000;}
        .db-line-h:hover,.db-line-v:hover{background:linear-gradient(145deg,#56e6ff,#06b6d4);box-shadow:0 0 10px #56e6ffbb;}
        .db-line-h.active,.db-line-v.active{background:linear-gradient(145deg,#ffbe0b,#ff8f3c);box-shadow:0 0 14px #ffbe0bcc,0 4px 14px -6px #000;}
        .db-box{position:absolute;display:flex;align-items:center;justify-content:center;font-size:.9rem;font-weight:700;color:#ffbe0b;transition:.25s;opacity:0;transform:scale(.6);}
        .db-box.claimed{opacity:1;transform:scale(1);}
        .db-score-bar{display:flex;gap:14px;font-size:.7rem;letter-spacing:.6px;font-weight:600;flex-wrap:wrap;justify-content:center;margin-top:4px;}
        .db-score-bar span{background:linear-gradient(145deg,#32254f,#49356d);padding:8px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.15);box-shadow:0 4px 12px -6px #000;}
        .badge-turn{background:linear-gradient(145deg,#ffbe0b,#ff8f3c);color:#222;padding:4px 8px;border-radius:10px;font-size:.55rem;font-weight:800;letter-spacing:1px;display:inline-block;margin-bottom:4px;}
        @media (max-width:520px){
          .db-board{transform:scale(.92);}
        }
        @media (max-width:420px){
          .db-board{transform:scale(.84);}
        }
      </style>
      <div class="db-head">Dot Box</div>
      <div class="db-status" id="dbStatus"></div>
      <div class="db-board">
        <div class="db-grid" id="dbGrid"></div>
      </div>
      <div class="db-score-bar" id="dbScore"></div>
    `;

    this.statusEl = this.root.querySelector('#dbStatus');
    this.scoreEl  = this.root.querySelector('#dbScore');
    this.gridEl   = this.root.querySelector('#dbGrid');
  }

  _makeMatrix(rows, cols, fill){
    const m=[];
    for(let r=0;r<rows;r++){
      const row=[];
      for(let c=0;c<cols;c++) row.push(typeof fill==='function'?fill():fill);
      m.push(row);
    }
    return m;
  }

  init(){
    this.buildBoard();
    this.updateStatus();
    if(this.isVsAI && this.turn==='p2'){
      setTimeout(()=>this.aiTurn(), 500);
    }
  }

  buildBoard(){
    // Layout constants
    const gap = 70; // distance between dots
    const offset = 10;

    // Size container
    const pixelSize = (this.size-1)*gap + offset*2;
    this.gridEl.style.width = pixelSize+'px';
    this.gridEl.style.height = pixelSize+'px';
    this.gridEl.style.position='relative';

    // Render dots
    for(let r=0;r<this.size;r++){
      for(let c=0;c<this.size;c++){
        const d=document.createElement('div');
        d.className='db-dot';
        d.style.left = (offset + c*gap)+'px';
        d.style.top  = (offset + r*gap)+'px';
        this.gridEl.appendChild(d);
      }
    }

    // Horizontal lines (r:0..size-1, c:0..size-2)
    for(let r=0;r<this.size;r++){
      for(let c=0;c<this.size-1;c++){
        const line=document.createElement('div');
        line.className='db-line-h';
        line.style.width=(gap-14)+'px';
        line.style.height='14px';
        line.style.left=(offset + c*gap + 7)+'px';
        line.style.top =(offset + r*gap - 7)+'px';
        line.dataset.type='h';
        line.dataset.r=r;
        line.dataset.c=c;
        line.onclick=()=>this.handleLine(line);
        this.gridEl.appendChild(line);
      }
    }

    // Vertical lines (r:0..size-2, c:0..size-1)
    for(let r=0;r<this.size-1;r++){
      for(let c=0;c<this.size;c++){
        const line=document.createElement('div');
        line.className='db-line-v';
        line.style.width='14px';
        line.style.height=(gap-14)+'px';
        line.style.left=(offset + c*gap -7)+'px';
        line.style.top =(offset + r*gap +7)+'px';
        line.dataset.type='v';
        line.dataset.r=r;
        line.dataset.c=c;
        line.onclick=()=>this.handleLine(line);
        this.gridEl.appendChild(line);
      }
    }

    // Box placeholders
    for(let r=0;r<this.size-1;r++){
      for(let c=0;c<this.size-1;c++){
        const bx=document.createElement('div');
        bx.className='db-box';
        bx.style.left=(offset + c*gap + gap/2)+'px';
        bx.style.top =(offset + r*gap + gap/2)+'px';
        bx.style.width=(gap-22)+'px';
        bx.style.height=(gap-22)+'px';
        bx.style.transform='translate(-50%,-50%) scale(.6)';
        this.gridEl.appendChild(bx);
      }
    }
  }

  handleLine(lineEl){
    if(this.finished) return;
    const r=+lineEl.dataset.r;
    const c=+lineEl.dataset.c;
    const type=lineEl.dataset.type;

    // If AI turn (in vs AI mode) ignore user
    if(this.isVsAI && this.turn==='p2') return;

    if(type==='h'){
      if(this.hLines[r][c]) return;
      this.hLines[r][c]=true;
    } else {
      if(this.vLines[r][c]) return;
      this.vLines[r][c]=true;
    }

    lineEl.classList.add('active');
    SoundManager.play('move');

    // Check if a box completes
    const gained = this.checkBoxes(type,r,c);
    if(gained>0){
      this.scores[this.turn]+=gained;
      this.paintBoxes();
      this.updateStatus(`${this._pName(this.turn)} gained ${gained} box${gained>1?'es':''}!`);
      SoundManager.play('win');
      if(this.isGameOver()){
        this.finish();
        return;
      }
      // Same player continues
      return;
    } else {
      // Switch turn
      this.turn = this.turn==='p1'?'p2':'p1';
      this.updateStatus();
    }

    if(this.isVsAI && this.turn==='p2'){
      setTimeout(()=>this.aiTurn(), 520);
    }
  }

  checkBoxes(type,r,c){
    let gained=0;
    // For each line placed see which adjacent boxes could be completed
    if(type==='h'){
      // Top or bottom of a box
      if(r>0){
        if(this._hasBoxComplete(r-1,c)) gained++;
      }
      if(r < this.size-1){
        if(this._hasBoxComplete(r,c)) gained++;
      }
    } else {
      // Vertical: left or right
      if(c>0){
        if(this._hasBoxComplete(r,c-1)) gained++;
      }
      if(c < this.size-1){
        if(this._hasBoxComplete(r,c)) gained++;
      }
    }
    return gained;
  }

  _hasBoxComplete(br, bc){
    // Box at boxes[br][bc]
    if(this.boxes[br][bc]) return false;
    // Need: top h=br, bottom h=br+1, left v=br, right v=br (with indices)
    const top    = this.hLines[br][bc];
    const bottom = this.hLines[br+1][bc];
    const left   = this.vLines[br][bc];
    const right  = this.vLines[br][bc+1];
    if(top && bottom && left && right){
      this.boxes[br][bc] = this.turn;
      return true;
    }
    return false;
  }

  paintBoxes(){
    // Update visual boxes
    const boxEls=[...this.gridEl.querySelectorAll('.db-box')];
    let idx=0;
    for(let r=0;r<this.size-1;r++){
      for(let c=0;c<this.size-1;c++){
        const owner=this.boxes[r][c];
        const el=boxEls[idx++];
        if(owner && !el.classList.contains('claimed')){
          el.textContent = owner==='p1'?'1':'2';
          el.classList.add('claimed');
          el.style.color = owner==='p1' ? '#ffbe0b' : '#56e6ff';
        }
      }
    }
  }

  aiTurn(){
    if(this.finished) return;
    if(this.turn!=='p2') return;
    // AI heuristic:
    // 1. If can complete a box safely (create 4th side) -> do it.
    // 2. Else pick a line that doesn't create a 3-side box for player.
    // 3. Else forced: pick random available line.

    const moves = this._allAvailableLines();
    if(!moves.length) return;

    // Step 1: completing lines
    const finishing = [];
    moves.forEach(m=>{
      if(this._wouldCompleteBoxes(m.type,m.r,m.c)>0) finishing.push(m);
    });
    if(finishing.length){
      const best = finishing[rand(0,finishing.length-1)];
      this._applyAIMove(best);
      return;
    }

    // Step 2: safe lines (avoid making a 3-side box)
    const safe = moves.filter(m=>!this._createsThreeSide(m));
    if(safe.length){
      const pick = safe[rand(0,safe.length-1)];
      this._applyAIMove(pick);
      return;
    }

    // Step 3: forced
    const forced = moves[rand(0,moves.length-1)];
    this._applyAIMove(forced);
  }

  _applyAIMove(move){
    const selector = `.db-line-${move.type==='h'?'h':'v'}[data-r="${move.r}"][data-c="${move.c}"]`;
    const lineEl = this.gridEl.querySelector(selector);
    if(!lineEl) return;
    if(move.type==='h') this.hLines[move.r][move.c]=true;
    else this.vLines[move.r][move.c]=true;
    lineEl.classList.add('active');
    SoundManager.play('move');

    const gained = this.checkBoxes(move.type, move.r, move.c);
    if(gained>0){
      this.scores.p2+=gained;
      this.paintBoxes();
      this.updateStatus(`AI gained ${gained} box${gained>1?'es':''}!`);
      SoundManager.play('win');
      if(this.isGameOver()){ this.finish(); return; }
      // AI continues
      setTimeout(()=>this.aiTurn(), 420);
    } else {
      this.turn='p1';
      this.updateStatus();
    }
  }

  _wouldCompleteBoxes(type,r,c){
    let count=0;
    if(type==='h'){
      if(r>0 && this._virtComplete(r-1,c)) count++;
      if(r < this.size-1 && this._virtComplete(r,c)) count++;
    } else {
      if(c>0 && this._virtComplete(r,c-1)) count++;
      if(c < this.size-1 && this._virtComplete(r,c)) count++;
    }
    return count;
  }

  _virtComplete(br,bc){
    if(this.boxes[br][bc]) return false;
    const top    = this.hLines[br][bc];
    const bottom = this.hLines[br+1][bc];
    const left   = this.vLines[br][bc];
    const right  = this.vLines[br][bc+1];
    // A "virtual" check for existing edges count, but we are analyzing if adding an edge triggers final
    return top && bottom && left && right;
  }

  _createsThreeSide(move){
    // Playing this line – does it create a box with exactly 3 sides (i.e. gift next box)?
    // Actually we want to avoid lines that turn a box from 2 -> 3 sides (since opponent then closes for free).
    // We'll check adjacency boxes and see if after adding it they have 3 sides (not 4).
    let danger=false;
    const checkBox=(br,bc)=>{
      if(br<0||bc<0||br>=this.size-1||bc>=this.size-1) return;
      if(this.boxes[br][bc]) return; // already claimed
      // count existing sides + this hypothetical new line
      let sides=0;
      const top    = this.hLines[br][bc] || (move.type==='h' && move.r===br   && move.c===bc);
      const bottom = this.hLines[br+1][bc] || (move.type==='h' && move.r===br+1 && move.c===bc);
      const left   = this.vLines[br][bc] || (move.type==='v' && move.r===br   && move.c===bc);
      const right  = this.vLines[br][bc+1] || (move.type==='v' && move.r===br && move.c===bc+1);
      if(top) sides++;
      if(bottom) sides++;
      if(left) sides++;
      if(right) sides++;
      if(sides===3) danger=true;
    };

    if(move.type==='h'){
      checkBox(move.r-1, move.c);
      checkBox(move.r, move.c);
    } else {
      checkBox(move.r, move.c-1);
      checkBox(move.r, move.c);
    }
    return danger;
  }

  _allAvailableLines(){
    const arr=[];
    // h lines
    for(let r=0;r<this.size;r++){
      for(let c=0;c<this.size-1;c++){
        if(!this.hLines[r][c]) arr.push({type:'h',r,c});
      }
    }
    // v lines
    for(let r=0;r<this.size-1;r++){
      for(let c=0;c<this.size;c++){
        if(!this.vLines[r][c]) arr.push({type:'v',r,c});
      }
    }
    return arr;
  }

  isGameOver(){
    const totalBoxes = (this.size-1)*(this.size-1); // 16
    return (this.scores.p1 + this.scores.p2) === totalBoxes;
  }

  finish(){
    this.finished=true;
    SoundManager.play('win');
    const p1=this.scores.p1;
    const p2=this.scores.p2;
    let msg;
    if(p1>p2) msg=`${this.state.player1} WINS! 🏆`;
    else if(p2>p1) msg=`${this.isVsAI?'AI':this.state.player2} WINS! 🏆`;
    else msg='Draw!';
    this.statusEl.innerHTML = `<b>${msg}</b><br>${this.state.player1}: ${p1} | ${this.isVsAI?'AI':this.state.player2}: ${p2}`;
    confettiBurst(p1===p2);
    toast('Game Over');
  }

  updateStatus(extra=''){
    if(this.finished) return;
    const p1n=this.state.player1;
    const p2n=this.isVsAI?'AI':this.state.player2;
    const turnName = (this.turn==='p1'?p1n:p2n);
    this.statusEl.innerHTML = `
      <span class="badge-turn">${turnName}'s TURN</span>
      ${extra?'<br>'+extra:''}
      <br>${p1n}: <b>${this.scores.p1}</b> &nbsp; | &nbsp; ${p2n}: <b>${this.scores.p2}</b>
    `;
  }

  _pName(t){return t==='p1'?this.state.player1:(this.isVsAI?'AI':this.state.player2);}
}
