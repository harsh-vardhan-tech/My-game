// Central shallow state & helpers
export const GlobalState = {
  selectedGame: '',
  selectedMode: '',
  player1: '',
  player2: '',
  step: 0
};
export function resetState(){
  GlobalState.selectedGame='';
  GlobalState.selectedMode='';
  GlobalState.player1='';
  GlobalState.player2='';
  GlobalState.step=0;
}