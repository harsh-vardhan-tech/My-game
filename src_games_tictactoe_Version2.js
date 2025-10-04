import { $, confettiBurst } from '../core/ui.js';
import { SoundManager } from '../core/soundManager.js';
import { GlobalState } from '../core/state.js';

export function renderTicTacToe(container){
  const {player1, player2, selectedMode} = GlobalState;
  container.innerHTML=`
    <div class="tt-wrap">
      <div class="tt-head">Tic Tac Toe</div>
      <div class="tt-players">${player1} <span style="opacity:.6;">vs</span> ${player2}</div>
      <div class="tt-grid" id="ttGrid"></div>
      <div class="tt-status" id="ttStatus"></div>
    </div>`;
  const grid = $('#ttGrid'), status=$('#ttStatus');
  let board=Array(9).fill(null);
  let human='X', ai='O', turn='X', finished=false;
  const vsAI = selectedMode==='ai';

  function draw(){
    grid.innerHTML='';
    board.forEach((v,i)=>{
      const d=document.createElement('div');
      d.className='tt-cell';
      d.textContent=v? (v==='X'?'❌':'⭕') : '';
      d.onclick=()=> handle(i);
      if(finished) d.style.pointerEvents='none';
      grid.appendChild(d);
    });
    updateStatus();
  }
  function updateStatus(){
    if(finished) return;
    status.innerHTML=`<span class="badge-turn">TURN</span><br>${turn===human?player1:(vsAI&&turn===ai?'AI 🤖':player2)}`;
  }
  function handle(i){
    if(finished||board[i])return;
    if(vsAI && turn!==human)return;
    board[i]=turn;
    SoundManager.play('move');
    check();
    if(!finished){
      turn=turn==='X'?'O':'X';
      draw();
      if(vsAI && turn===ai) setTimeout(aiMove,230);
    }else draw();
  }
  const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function result(b){
    for(const [a,c,d] of lines){
      if(b[a] && b[a]===b[c] && b[a]===b[d]) return {w:b[a], line:[a,c,d]};
    }
    if(b.every(Boolean)) return {w:'draw'};
    return null;
  }
  function highlight(line){
    line.forEach(i=>grid.children[i].classList.add('win'));
  }
  function check(){
    const r=result(board);
    if(r){
      finished=true;
      if(r.w==='draw'){ status.innerHTML='<b>Draw 🤝</b>'; confettiBurst(true); }
      else {
        status.innerHTML=`<b>${r.w==='X'?player1:(vsAI && r.w==='O'?'AI 🤖':player2)} Wins! 🏆</b>`;
        highlight(r.line);
        SoundManager.play('win');
        confettiBurst();
      }
    }
  }
  function empties(b){return b.map((v,i)=>v?null:i).filter(v=>v!==null);}
  function minimax(b,depth,isMax){
    const r=result(b);
    if(r){
      if(r.w===ai) return 10-depth;
      if(r.w===human) return depth-10;
      if(r.w==='draw') return 0;
    }
    const e=empties(b);
    if(isMax){
      let best=-Infinity;
      for(const i of e){
        b[i]=ai;
        best=Math.max(best,minimax(b,depth+1,false));
        b[i]=null;
      }
      return best;
    } else {
      let best=Infinity;
      for(const i of e){
        b[i]=human;
        best=Math.min(best,minimax(b,depth+1,true));
        b[i]=null;
      }
      return best;
    }
  }
  function aiMove(){
    if(finished)return;
    let bestScore=-Infinity, move=null;
    for(const i of empties(board)){
      board[i]=ai;
      const score=minimax(board,0,false);
      board[i]=null;
      if(score>bestScore){bestScore=score;move=i;}
    }
    board[move]=ai;
    SoundManager.play('move');
    check();
    if(!finished){turn=human;draw();} else draw();
  }
  draw();
  if(vsAI && turn===ai) aiMove();
}