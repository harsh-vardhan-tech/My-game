import { $, $$ } from './ui.js';
import { GlobalState, resetState } from './state.js';
import { SoundManager } from './soundManager.js';
import { renderTicTacToe } from '../games/tictactoe.js';
import { renderSnake } from '../games/snake.js';
import { renderDotBox } from '../games/dotbox.js';
import { toast } from './ui.js';

// ----- INIT -----
document.addEventListener('DOMContentLoaded', () => {
  SoundManager.load();
  SoundManager.play('bg');
  bindFlow();
  bindSettings();
  bindDonate();
  console.log('%c[0x Battle Hub] App Ready','background:#ffbe0b;color:#222;padding:4px 8px;border-radius:6px;font-weight:bold;');
  registerServiceWorker();
});

// ----- Multi Step Flow -----
function showStep(n){
  GlobalState.step=n;
  $$('#flow .screen').forEach(sc=>sc.classList.toggle('active', +sc.dataset.step===n));
  $('#gameStage').classList.remove('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

function bindFlow(){
  const gameGrid = $('#gameGrid');
  const toModeBtn = $('#toMode');
  const toNamesBtn = $('#toNames');
  const toSummaryBtn = $('#toSummary');
  const summaryBox = $('#summaryBox');

  gameGrid.addEventListener('click', e=>{
    const card = e.target.closest('.game-card');
    if(!card) return;
    $$('.game-card').forEach(c=>c.classList.remove('selected'));
    card.classList.add('selected');
    GlobalState.selectedGame = card.dataset.game;
    toModeBtn.disabled = !GlobalState.selectedGame;
    SoundManager.play('click');
  });

  $('#toMode').onclick=()=>{
    if(!GlobalState.selectedGame) return;
    SoundManager.play('click');
    showStep(1);
  };
  $('#backGame').onclick=()=>{ SoundManager.play('click'); showStep(0); };

  $$('.mode-btn').forEach(btn=>{
    btn.onclick=()=>{
      $$('.mode-btn').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      GlobalState.selectedMode=btn.dataset.mode;
      toNamesBtn.disabled=false;
      SoundManager.play('click');
    };
  });

  toNamesBtn.onclick=()=>{
    buildNameInputs();
    SoundManager.play('click');
    showStep(2);
  };
  $('#backMode').onclick=()=>{ SoundManager.play('click'); showStep(1); };

  function buildNameInputs(){
    const zone = $('#nameZone'); zone.innerHTML='';
    if(GlobalState.selectedMode==='ai'){
      zone.innerHTML=`
        <input id="p1" placeholder="Your Name">
        <div class="small">Opponent: AI 🤖 (strong)</div>`;
    }else{
      zone.innerHTML=`
        <input id="p1" placeholder="Player 1 Name">
        <input id="p2" placeholder="Player 2 Name">`;
    }
    const inputs = zone.querySelectorAll('input');
    inputs.forEach(inp=>inp.addEventListener('input',validate));
    validate();
    function validate(){
      if(GlobalState.selectedMode==='ai'){
        GlobalState.player1 = $('#p1').value.trim();
        GlobalState.player2 = 'AI';
        toSummaryBtn.disabled = !GlobalState.player1;
      } else {
        GlobalState.player1 = $('#p1').value.trim();
        GlobalState.player2 = $('#p2').value.trim();
        toSummaryBtn.disabled = !(GlobalState.player1 && GlobalState.player2);
      }
    }
  }

  toSummaryBtn.onclick=()=>{
    SoundManager.play('click');
    summaryBox.innerHTML=`
      <b>Game:</b> ${gameName(GlobalState.selectedGame)}<br>
      <b>Mode:</b> ${GlobalState.selectedMode==='ai'?'AI vs You':'Friend vs Friend'}<br>
      <b>Players:</b> ${GlobalState.player1} vs ${GlobalState.player2}`;
    showStep(3);
  };
  $('#backNames').onclick=()=>{ SoundManager.play('click'); showStep(2); };
  $('#startGame').onclick=()=>{ SoundManager.play('click'); startGame(); };
  $('#homeBtn').onclick=()=>{ SoundManager.play('click'); resetFlow(); };
  $('#restartBtn').onclick=()=>{ SoundManager.play('click'); rerenderGame(); };
}

function gameName(id){
  return {tictac:'Tic Tac Toe', snake:'Snake & Ladder', dotbox:'Dot Box'}[id] || id;
}

function startGame(){
  $$('#flow .screen').forEach(s=>s.classList.remove('active'));
  $('#gameStage').classList.add('active');
  rerenderGame();
  SoundManager.play('bg');
}

function rerenderGame(){
  const container = $('#gameContainer');
  if(GlobalState.selectedGame==='tictac') renderTicTacToe(container);
  else if(GlobalState.selectedGame==='snake') renderSnake(container);
  else if(GlobalState.selectedGame==='dotbox') renderDotBox(container);
  else container.innerHTML='<div style="padding:30px;text-align:center;">Unknown Game</div>';
}

function resetFlow(){
  resetState();
  $('#toMode').disabled=true;
  $('#toNames').disabled=true;
  $('#toSummary').disabled=true;
  $$('.game-card').forEach(c=>c.classList.remove('selected'));
  $$('.mode-btn').forEach(c=>c.classList.remove('selected'));
  $('#gameContainer').innerHTML='';
  showStep(0);
}

// ----- Settings Panel -----
function bindSettings(){
  const panel = $('#settingsPanel');
  $('#settingsBtn').onclick=()=>{panel.classList.add('active');SoundManager.play('click');};
  $('#closeSettings').onclick=()=>{panel.classList.remove('active');SoundManager.play('click');};
  panel.addEventListener('click', e=>{
    if(e.target===panel){panel.classList.remove('active');SoundManager.play('click');}
  });
  $('#musicBtn').onclick=()=>SoundManager.toggleMute($('#musicBtn'));
  $('#toggleMusic').onclick=()=>SoundManager.toggleMute($('#musicBtn'));
  $('#muteAll').onclick=()=>{
    if(!SoundManager.muted) SoundManager.toggleMute($('#musicBtn'));
    toast('Muted');
  };
  $('#resetSounds').onclick=()=>{ if(confirm('Reset all custom sounds?')) SoundManager.reset(); };

  // custom uploads
  $('#sndClick').addEventListener('change',e=>{const f=e.target.files[0]; if(f) SoundManager.setCustom('click',f);});
  $('#sndMove').addEventListener('change',e=>{const f=e.target.files[0]; if(f) SoundManager.setCustom('move',f);});
  $('#sndWin').addEventListener('change',e=>{const f=e.target.files[0]; if(f) SoundManager.setCustom('win',f);});
  $('#sndBg').addEventListener('change',e=>{const f=e.target.files[0]; if(f) SoundManager.setCustom('bg',f);});
  $$('.test-btn[data-play]').forEach(btn=>{
    btn.onclick=()=>SoundManager.play(btn.dataset.play);
  });
}

// ----- Donate -----
function bindDonate(){
  const modal=$('#donateModal');
  $('#donateBtn').onclick=()=>{modal.classList.add('active');SoundManager.play('click');};
  $('#closeDonate').onclick=()=>{modal.classList.remove('active');SoundManager.play('click');};
  modal.addEventListener('click',e=>{
    if(e.target===modal){modal.classList.remove('active');SoundManager.play('click');}
  });
  $$('.amount-btn').forEach(b=>{
    b.onclick=()=>{$('#donateAmount').value=b.dataset.amt;SoundManager.play('click');};
  });
  $('#copyUpi').onclick=()=>{
    navigator.clipboard.writeText('kk2112423@oksbi').then(()=>toast('UPI Copied'));
    SoundManager.play('click');
  };
  $('#payNowBtn').onclick=()=>{
    SoundManager.play('click');
    const amt=($('#donateAmount').value||'').trim();
    let uri=`upi://pay?pa=kk2112423@oksbi&pn=Harsh%20Vardhan&tn=Support%20Game&cu=INR`;
    if(amt && !isNaN(+amt)) uri+=`&am=${encodeURIComponent(amt)}`;
    window.location.href=uri;
    toast('Opening UPI...');
  };
}

// ----- Service Worker / PWA -----
function registerServiceWorker(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  }
}

// Keyboard ESC close modals
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    const s=$('#settingsPanel'), d=$('#donateModal');
    if(s.classList.contains('active')) s.classList.remove('active');
    if(d.classList.contains('active')) d.classList.remove('active');
  }
});