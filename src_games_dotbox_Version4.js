import { $, confettiBurst, toast } from '../core/ui.js';
import { SoundManager } from '../core/soundManager.js';
import { GlobalState } from '../core/state.js';

export function renderDotBox(container){
  const SIZE=5;
  let lines={}, boxes={}, turn=0, finished=false;
  const { player1, player2, selectedMode } = GlobalState;
  const vsAI = selectedMode==='ai';

  container.innerHTML=`
    <div class="db-wrap">
      <div class="db-header">
        <div class="db-title">🟦 Dot Box</div>
        <div class="db-players">${player1} <span class="vs">vs</span> ${player2}</div>
      </div>
      <div id="dbBoard" class="db-board"></div>
      <div class="db-panel">
        <div id="dbStatus" class="db-status"></div>
        <div class="db-score" id="dbScore"></div>
        <div class="db-note">Most boxes wins</div>
      </div>
    </div>`;
  injectDbStylesOnce();
  drawBoard(); updateStatus(); renderScores();

  if(vsAI && turn===1) setTimeout(aiMove,500);

  function drawBoard(){
    const board = $('#dbBoard');
    board.innerHTML='';
    // Build a conceptual grid of dot/line/box cells using absolute approach:
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        // Dot
        const dot=document.createElement('div');
        dot.className='db-dot';
        board.appendChild(dot);

        if(c<SIZE-1){
          const hKey=`${r}_${c}_h`;
          const h=document.createElement('div');
          h.className='db-line db-h';
          h.dataset.key=hKey;
            applyLine(h,hKey);
          h.onclick=()=>lineClick(hKey,h);
          board.appendChild(h);
        }
        if(r<SIZE-1){
          const vKey=`${r}_${c}_v`;
          const v=document.createElement('div');
          v.className='db-line db-v';
          v.dataset.key=vKey;
          applyLine(v,vKey);
          v.onclick=()=>lineClick(vKey,v);
          board.appendChild(v);
        }
        if(r<SIZE-1 && c<SIZE-1){
          const bKey=`${r}_${c}`;
          const bx=document.createElement('div');
          bx.className='db-box';
          bx.id='dbBox_'+bKey;
          if(boxes[bKey]!=null){
            bx.classList.add('owned');
            bx.style.setProperty('--owner-color', boxes[bKey]===0?'#7c3aed':'#ff5c7c');
            bx.textContent=(boxes[bKey]===0?player1:player2).charAt(0).toUpperCase();
          }
          board.appendChild(bx);
        }
      }
    }
  }

  function applyLine(el,key){
    if(lines[key]!=null){
      el.classList.add(lines[key]===0?'p0':'p1');
      el.style.pointerEvents='none';
    }
  }

  function lineClick(key,el){
    if(finished) return;
    if(vsAI && turn===1) return;
    if(lines[key]!=null) return;
    placeLine(key);
  }

  function placeLine(key){
    lines[key]=turn;
    SoundManager.play('move');
    let gained=evaluateBoxes(key);
    drawBoard();
    renderScores();
    if(isComplete()){ finish(); return; }
    if(!gained){
      turn=(turn+1)%2;
    }
    updateStatus();
    if(vsAI && turn===1 && !finished) setTimeout(aiMove,420);
  }

  function evaluateBoxes(key){
    const [r,c,d]=key.split('_');
    let row=+r, col=+c;
    let scored=false;
    if(d==='h'){
      if(row>0 && boxComplete(row-1,col)){claim(row-1,col);scored=true;}
      if(row<SIZE-1 && boxComplete(row,col)){claim(row,col);scored=true;}
    }else{
      if(col>0 && boxComplete(row,col-1)){claim(row,col-1);scored=true;}
      if(col<SIZE-1 && boxComplete(row,col)){claim(row,col);scored=true;}
    }
    return scored;
  }

  function boxComplete(r,c){
    return lines[`${r}_${c}_h`]!=null &&
           lines[`${r}_${c}_v`]!=null &&
           lines[`${r+1}_${c}_h`]!=null &&
           lines[`${r}_${c+1}_v`]!=null &&
           boxes[`${r}_${c}`]==null;
  }

  function claim(r,c){
    boxes[`${r}_${c}`]=turn;
    const bx=$('#dbBox_'+`${r}_${c}`);
    if(bx){
      bx.classList.add('owned');
      bx.style.setProperty('--owner-color', turn===0?'#7c3aed':'#ff5c7c');
      bx.textContent=(turn===0?player1:player2).charAt(0).toUpperCase();
    }
  }

  function updateStatus(){
    if(finished)return;
    $('#dbStatus').innerHTML=`<span class="badge-turn">TURN</span><br>${turn===0?player1:(vsAI?'AI 🤖':player2)}`;
  }
  function renderScores(){
    const p0=Object.values(boxes).filter(v=>v===0).length;
    const p1=Object.values(boxes).filter(v=>v===1).length;
    $('#dbScore').innerHTML=`
      <span style="color:#7c3aed;font-weight:600;">${player1}:</span> ${p0} |
      <span style="color:#ff5c7c;font-weight:600;">${player2}:</span> ${p1}
    `;
  }
  function isComplete(){
    return Object.keys(boxes).length===(SIZE-1)*(SIZE-1);
  }
  function finish(){
    finished=true;
    const p0=Object.values(boxes).filter(v=>v===0).length;
    const p1=Object.values(boxes).filter(v=>v===1).length;
    if(p0===p1){ $('#dbStatus').innerHTML='<b>Draw 🤝</b>'; confettiBurst(true); }
    else if(p0>p1){ $('#dbStatus').innerHTML=`<b>${player1} Wins! 🏆</b>`; SoundManager.play('win'); confettiBurst(); }
    else { $('#dbStatus').innerHTML=`<b>${vsAI?'AI 🤖':player2} Wins! 🏆</b>`; SoundManager.play('win'); confettiBurst(); }
  }

  // AI logic
  function aiMove(){
    if(finished) return;
    let available = collectLines();
    if(!available.length) return;

    function wouldCompleteLine(k){
      const [r,c,d]=k.split('_'); const row=+r, col=+c;
      if(d==='h'){
        if(row>0 && wouldBox(row-1,col,k)) return true;
        if(row<SIZE-1 && wouldBox(row,col,k)) return true;
      }else{
        if(col>0 && wouldBox(row,col-1,k)) return true;
        if(col<SIZE-1 && wouldBox(row,col,k)) return true;
      }
      return false;
    }
    function wouldBox(r,c,k){
      if(r<0||c<0||r>=SIZE-1||c>=SIZE-1) return false;
      if(boxes[`${r}_${c}`]!=null) return false;
      lines[k]='tmp';
      const comp = boxComplete(r,c);
      delete lines[k];
      return comp;
    }
    // 1 finish
    const fin = available.filter(wouldCompleteLine);
    if(fin.length){ placeLine(fin[Math.floor(Math.random()*fin.length)]); return; }

    // 2 Avoid giving 3rd side
    function risky(k){
      const [r,c,d]=k.split('_'); const row=+r,col=+c;
      lines[k]='tmp';
      function sideCount(R,C){
        if(R<0||C<0||R>=SIZE-1||C>=SIZE-1) return -1;
        if(boxes[`${R}_${C}`]!=null) return -1;
        let ct=0;
        if(lines[`${R}_${C}_h`]!=null) ct++;
        if(lines[`${R}_${C}_v`]!=null) ct++;
        if(lines[`${R+1}_${C}_h`]!=null) ct++;
        if(lines[`${R}_${C+1}_v`]!=null) ct++;
        return ct;
      }
      let risk=false;
      if(d==='h'){
        if(row>0 && sideCount(row-1,col)===3) risk=true;
        if(row<SIZE-1 && sideCount(row,col)===3) risk=true;
      }else{
        if(col>0 && sideCount(row,col-1)===3) risk=true;
        if(col<SIZE-1 && sideCount(row,col)===3) risk=true;
      }
      delete lines[k];
      return risk;
    }
    const safe = available.filter(k=>!risky(k));
    if(safe.length){ placeLine(safe[Math.floor(Math.random()*safe.length)]); return; }

    // 3 fallback
    placeLine(available[Math.floor(Math.random()*available.length)]);
  }

  function collectLines(){
    const arr=[];
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        if(c<SIZE-1){
          const hk=`${r}_${c}_h`;
          if(lines[hk]==null) arr.push(hk);
        }
        if(r<SIZE-1){
          const vk=`${r}_${c}_v`;
          if(lines[vk]==null) arr.push(vk);
        }
      }
    }
    return arr;
  }
}

function injectDbStylesOnce(){
  if(document.getElementById('dbStyles')) return;
  const st=document.createElement('style');
  st.id='dbStyles';
  st.textContent=`
  .db-wrap{display:flex;flex-direction:column;align-items:center;width:100%;gap:12px;margin-top:6px;}
  .db-header{text-align:center;}
  .db-title{font-size:1.15rem;font-weight:700;letter-spacing:.6px;background:linear-gradient(90deg,#ff5c7c,#56e6ff);-webkit-background-clip:text;color:transparent;}
  .db-players{font-size:.66rem;opacity:.7;margin-top:-4px;text-transform:uppercase;letter-spacing:.6px;}
  .db-board{
    position:relative;width:100%;max-width:480px;aspect-ratio:1;
    background:rgba(255,255,255,.08);border-radius:24px;padding:16px;
    display:grid;grid-template-columns:repeat(calc((5*2)-1),1fr);gap:4px;
  }
  .db-dot{width:14px;height:14px;background:#fff;border-radius:50%;box-shadow:0 0 6px #7c3aed55;position:relative;z-index:2;}
  .db-line{position:relative;background:rgba(255,255,255,.16);border-radius:12px;cursor:pointer;box-shadow:0 0 10px #7c3aed33;transition:.18s;}
  .db-line:hover{background:rgba(255,255,255,.25);}
  .db-line:active{transform:scale(.9);}
  .db-line.p0{background:#7c3aed;box-shadow:0 0 14px #7c3aedaa;}
  .db-line.p1{background:#ff5c7c;box-shadow:0 0 14px #ff5c7caa;}
  .db-h{height:14px;}
  .db-v{width:14px;}
  .db-box{
    background:rgba(255,255,255,.1);
    border-radius:16px;
    display:flex;align-items:center;justify-content:center;
    font-weight:700;font-size:.9rem;position:relative;color:#fff;transition:.25s;
  }
  .db-box.owned{background:var(--owner-color,rgba(255,255,255,.35));color:#fff;box-shadow:0 0 14px var(--owner-color,#fff5);animation:boxPop .45s;}
  @keyframes boxPop{0%{transform:scale(.5);opacity:0;}70%{transform:scale(1.1);opacity:1;}100%{transform:scale(1);}}
  .db-panel{width:100%;background:rgba(255,255,255,.1);padding:16px 18px 20px;border-radius:20px;display:flex;flex-direction:column;align-items:center;gap:10px;box-shadow:0 0 16px #06b6d455;}
  .db-status{font-size:.9rem;font-weight:600;min-height:34px;text-align:center;}
  .db-score{font-size:.72rem;letter-spacing:.5px;opacity:.85;}
  .db-note{font-size:.58rem;opacity:.6;letter-spacing:.5px;}
  @media (max-width:520px){.db-board{padding:12px;}}
  `;
  document.head.appendChild(st);
}