// src/games/tictactoe.js
// Tic Tac Toe with perfect AI (minimax + pruning) + 2 Player mode
// Integrates sounds + confetti + restart support

import { SoundManager } from '../core/soundManager.js';
import { toast, confettiBurst } from '../core/ui.js';

/**
 * Render TicTacToe game
 * @param {HTMLElement} container
 * @param {object} state {selectedMode, player1, player2}
 */
export function renderTicTacToe(container, state){
  container.innerHTML = '';
  const game = new TicTacToe(state);
  container.appendChild(game.root);
  game.start();
}

/* -------------------- CLASS -------------------- */
class TicTacToe {
  constructor(state){
    this.state = state;
    this.board = Array(9).fill('');
    this.current = 'X';          // 'X' always starts
    this.finished = false;
    this.humanSymbol = 'X';
    this.aiSymbol = 'O';
    if(this.state.selectedMode === 'friend'){
      // Player1 = X, Player2 = O
      this.humanSymbol = 'X';
      this.aiSymbol = 'O'; // naming only, second player
    }

    this.root = document.createElement('div');
    this.root.className = 'tt-wrap';
    this.root.innerHTML = `
      <div class="tt-head">Tic Tac Toe</div>
      <div class="tt-players">${this.state.player1} (X) vs ${this.state.player2} (O)</div>
      <div class="tt-status" id="ttStatus"></div>
      <div class="tt-grid" id="ttGrid"></div>
    `;

    this.statusEl = this.root.querySelector('#ttStatus');
    this.gridEl = this.root.querySelector('#ttGrid');

    this.renderGrid();
    this.updateStatus();
  }

  start(){
    // If AI is X (not in this design) then could open; here human always X when vs AI
  }

  renderGrid(){
    this.gridEl.innerHTML = '';
    for(let i=0;i<9;i++){
      const cell = document.createElement('div');
      cell.className='tt-cell';
      cell.dataset.idx = i;
      cell.addEventListener('click', () => this.handleCell(i, cell));
      this.gridEl.appendChild(cell);
    }
  }

  handleCell(index, el){
    if(this.finished) return;
    if(this.board[index] !== '') return;

    const isVsAI = this.state.selectedMode === 'ai';
    // Player turn conditions
    if(isVsAI){
      if(this.current !== this.humanSymbol) return; // not user's turn
    }

    // Human move
    this.place(index, this.current);
    SoundManager.play('move');

    // Check result
    if(this.checkEnd()) return;

    // Switch or AI move
    if(isVsAI){
      // AI turn
      setTimeout(()=>this.aiMove(), 300);
    } else {
      // Friend mode
      this.current = this.current==='X' ? 'O':'X';
      this.updateStatus();
    }
  }

  aiMove(){
    if(this.finished) return;
    // Perfect minimax
    const best = this.bestMove();
    this.place(best, this.aiSymbol);
    SoundManager.play('move');
    if(this.checkEnd()) return;
    this.current = this.humanSymbol;
    this.updateStatus();
  }

  place(index, symbol){
    this.board[index] = symbol;
    const cellEl = this.gridEl.querySelector(`.tt-cell[data-idx="${index}"]`);
    if(cellEl){
      cellEl.textContent = symbol;
      cellEl.style.transform='scale(.5)';
      requestAnimationFrame(()=>{
        cellEl.style.transition='0.35s cubic-bezier(.34,1.6,.64,1)';
        cellEl.style.transform='scale(1)';
      });
    }
  }

  updateStatus(msg=''){
    if(msg){
      this.statusEl.innerHTML = msg;
      return;
    }
    if(this.finished) return;
    if(this.state.selectedMode === 'ai'){
      if(this.current === this.humanSymbol){
        this.statusEl.innerHTML = `<span class="badge-turn">YOUR TURN</span> Place '${this.humanSymbol}'`;
      } else {
        this.statusEl.innerHTML = `<span class="badge-turn">AI THINKING...</span>`;
      }
    } else {
      const p = this.current==='X'? this.state.player1 : this.state.player2;
      this.statusEl.innerHTML = `<span class="badge-turn">${p}'s TURN</span> (${this.current})`;
    }
  }

  checkEnd(){
    const winner = this.findWinner(this.board);
    if(winner){
      this.finished = true;
      this.highlightWinner(winner.line);
      const wName = (this.state.selectedMode==='ai')
        ? (winner.symbol===this.humanSymbol ? this.state.player1 : 'AI')
        : (winner.symbol==='X'? this.state.player1 : this.state.player2);
      this.updateStatus(`<b>${wName} WINS!</b>`);
      SoundManager.play('win');
      confettiBurst();
      return true;
    }
    if(this.board.every(c=>c!=='')){
      this.finished = true;
      this.updateStatus(`<b>Draw!</b>`);
      SoundManager.play('win');
      confettiBurst(true);
      return true;
    }
    return false;
  }

  highlightWinner(line){
    line.forEach(i=>{
      const cell=this.gridEl.querySelector(`.tt-cell[data-idx="${i}"]`);
      if(cell) cell.classList.add('win');
    });
  }

  findWinner(b){
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for(const l of lines){
      const [a,b1,c]=l;
      if(b[a] && b[a]===b[b1] && b[a]===b[c]){
        return { symbol:b[a], line:l };
      }
    }
    return null;
  }

  emptyIndices(b){
    const out=[];
    for(let i=0;i<b.length;i++) if(!b[i]) out.push(i);
    return out;
  }

  bestMove(){
    // Minimax with alpha-beta
    const maximizingPlayer = this.aiSymbol; // AI symbol
    const minimizingPlayer = this.humanSymbol;
    let bestScore = -Infinity;
    let move = null;

    const empties = this.emptyIndices(this.board);
    // Small optimization: if center free, pick center early
    if(empties.includes(4) && empties.length===8) return 4;

    for(const idx of empties){
      this.board[idx] = maximizingPlayer;
      const score = this.minimax(this.board, 0, false, -Infinity, Infinity, maximizingPlayer, minimizingPlayer);
      this.board[idx] = '';
      if(score > bestScore){
        bestScore = score;
        move = idx;
      }
    }
    return move;
  }

  minimax(board, depth, isMaxTurn, alpha, beta, maxSym, minSym){
    const winObj = this.findWinner(board);
    if(winObj){
      // Score factoring depth to prefer quicker victory
      return winObj.symbol===maxSym ? 10 - depth : depth - 10;
    }
    if(board.every(c=>c!=='')) return 0; // draw

    const empties = this.emptyIndices(board);

    if(isMaxTurn){
      let best = -Infinity;
      for(const idx of empties){
        board[idx] = maxSym;
        const score = this.minimax(board, depth+1, false, alpha, beta, maxSym, minSym);
        board[idx] = '';
        best = Math.max(best, score);
        alpha = Math.max(alpha, best);
        if(beta <= alpha) break; // prune
      }
      return best;
    } else {
      let best = Infinity;
      for(const idx of empties){
        board[idx] = minSym;
        const score = this.minimax(board, depth+1, true, alpha, beta, maxSym, minSym);
        board[idx] = '';
        best = Math.min(best, score);
        beta = Math.min(beta, best);
        if(beta <= alpha) break;
      }
      return best;
    }
  }
}
