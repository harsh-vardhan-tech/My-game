// Global lightweight state holder for the multi‑step flow and game context
export const GlobalState = {
  selectedGame: '',    // 'tictac' | 'snake' | 'dotbox'
  selectedMode: '',    // 'ai' | 'friend'
  player1: '',         // name player 1
  player2: '',         // name player 2 or 'AI'
  step: 0              // current flow step (0..3)
};

// Reset everything (used when returning Home)
export function resetState(){
  GlobalState.selectedGame = '';
  GlobalState.selectedMode = '';
  GlobalState.player1 = '';
  GlobalState.player2 = '';
  GlobalState.step = 0;
}
