
// app.js
// Main controller: flow (select game -> mode -> names -> summary -> play), settings, donate, contact,
// service worker registration, game loader, restart/back handling, sound + volume integration.

import { $, $$, toast, confettiBurst, clearNode } from './ui.js';
import { GlobalState, resetState } from './state.js';
import { SoundManager } from './soundManager.js';

// Game renderers (will be provided in next files)
import { renderTicTacToe } from '../games/tictactoe.js';
import { renderSnake } from '../games/snake.js';
import { renderDotBox } from '../games/dotbox.js';

document.addEventListener('DOMContentLoaded', () => {
  SoundManager.load();
  initFlow();
  initSettings();
  initDonate();
  initContact();
  bindGlobalButtons();
  registerServiceWorker();
  console.log('%c[0x Battle Hub] Ready','background:#56e6ff;color:#141d2b;padding:4px 10px;border-radius:6px;font-weight:700;');
});

/* ------------ FLOW MANAGEMENT ------------ */
function showStep(n){
  GlobalState.step = n;
  $$('#flow .screen').forEach(sc => sc.classList.toggle('active', +sc.dataset.step === n));
  $('#gameStage').classList.remove('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

function initFlow(){
  const toModeBtn = $('#toMode');
  const toNamesBtn = $('#toNames');
  const toSummaryBtn = $('#toSummary');
  const summaryBox = $('#summaryBox');

  // Game selection
  $('#gameGrid').addEventListener('click', e=>{
    const card = e.target.closest('.game-card');
    if(!card) return;
    $$('.game-card').forEach(c=>c.classList.remove('selected'));
    card.classList.add('selected');
    GlobalState.selectedGame = card.dataset.game;
    toModeBtn.disabled = !GlobalState.selectedGame;
    SoundManager.play('click');
  });

  // Step 0 -> 1
  toModeBtn.onclick = () => {
    if(!GlobalState.selectedGame) return;
    SoundManager.play('click');
    showStep(1);
  };
  $('#backGame').onclick = () => { SoundManager.play('click'); showStep(0); };

  // Mode select
  $$('.mode-btn').forEach(btn=>{
    btn.onclick=()=>{
      $$('.mode-btn').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      GlobalState.selectedMode = btn.dataset.mode;
      toNamesBtn.disabled = false;
      SoundManager.play('click');
    };
  });

  // Step 1 -> 2
  toNamesBtn.onclick=()=>{
    SoundManager.play('click');
    buildNameInputs();
    showStep(2);
  };
  $('#backMode').onclick=()=>{ SoundManager.play('click'); showStep(1); };

  function buildNameInputs(){
    const zone = $('#nameZone');
    clearNode(zone);
    if(GlobalState.selectedMode === 'ai'){
      zone.innerHTML = `<input id="p1" placeholder="Your Name"> <div class="small">Opponent: AI 🤖</div>`;
    } else {
      zone.innerHTML = `<input id="p1" placeholder="Player 1 Name"><input id="p2" placeholder="Player 2 Name">`;
    }
    const p1=$('#p1');
    const p2=$('#p2');
    const validate=()=>{
      if(GlobalState.selectedMode==='ai'){
        GlobalState.player1 = p1.value.trim();
        GlobalState.player2 = 'AI';
        toSummaryBtn.disabled = !GlobalState.player1;
      } else {
        GlobalState.player1 = p1.value.trim();
        GlobalState.player2 = p2.value.trim();
        toSummaryBtn.disabled = !(GlobalState.player1 && GlobalState.player2);
      }
    };
    [p1,p2].filter(Boolean).forEach(i=>i.addEventListener('input',validate));
    validate();
  }

  // Step 2 -> 3
  toSummaryBtn.onclick=()=>{
    SoundManager.play('click');
    summaryBox.innerHTML = `
      <b>Game:</b> ${prettyGame(GlobalState.selectedGame)}<br>
      <b>Mode:</b> ${GlobalState.selectedMode==='ai'?'AI vs Player':'Player vs Player'}<br>
      <b>Players:</b> ${GlobalState.player1} vs ${GlobalState.player2}
    `;
    showStep(3);
  };
  $('#backNames').onclick=()=>{ SoundManager.play('click'); showStep(2); };

  // Start Game
  $('#startGame').onclick=()=>{
    SoundManager.play('move');
    launchGame();
  };

  // Home & Restart
  $('#homeBtn').onclick=()=>{
    SoundManager.play('click');
    resetState();
    showStep(0);
    $('#gameContainer').innerHTML='';
  };
  $('#restartBtn').onclick=()=>{
    SoundManager.play('click');
    launchGame(true); // soft restart
  };
}

function launchGame(isRestart=false){
  $('#gameStage').classList.add('active');
  $$('#flow .screen').forEach(sc=>sc.classList.remove('active'));
  const container = $('#gameContainer');
  if(!isRestart) container.innerHTML = '';
  switch(GlobalState.selectedGame){
    case 'tictac': renderTicTacToe(container, GlobalState); break;
    case 'snake': renderSnake(container, GlobalState); break;
    case 'dotbox': renderDotBox(container, GlobalState); break;
    default:
      container.innerHTML = `<div style="padding:20px;text-align:center;">Unknown game.</div>`;
  }
}

/* ---------- PRETTY NAME ---------- */
function prettyGame(k){
  switch(k){
    case 'tictac': return 'Tic Tac Toe';
    case 'snake': return 'Snake & Ladder';
    case 'dotbox': return 'Dot Box';
    default: return k;
  }
}

/* ------------ SETTINGS PANEL ------------ */
function initSettings(){
  const panel = $('#settingsPanel');
  const openBtn = $('#settingsBtn');
  const closeBtn = $('#closeSettings');
  const masterVol = $('#masterVolume');
  const musicBtn = $('#musicBtn');
  const toggleMusicBtn = $('#toggleMusic');
  const muteAllBtn = $('#muteAll');
  const resetSoundsBtn = $('#resetSounds');

  openBtn.onclick=()=>{ SoundManager.play('click'); panel.classList.add('active'); };
  closeBtn.onclick=()=>{ SoundManager.play('click'); panel.classList.remove('active'); };

  // Outside click close
  panel.addEventListener('click',e=>{
    if(e.target===panel){ panel.classList.remove('active'); SoundManager.play('click'); }
  });

  musicBtn.onclick=()=>SoundManager.toggleMute(musicBtn);
  toggleMusicBtn.onclick=()=>{ SoundManager.play('click'); SoundManager.play('bg'); };
  muteAllBtn.onclick=()=>{ SoundManager.toggleMute(musicBtn); };
  resetSoundsBtn.onclick=()=>{ SoundManager.play('click'); SoundManager.reset(); };

  masterVol.addEventListener('input', e=>{
    SoundManager.setMasterVolume(+e.target.value);
  });

  // File inputs for custom sounds
  const fileMap = {
    sndClick:'click',
    sndMove :'move',
    sndWin  :'win',
    sndBg   :'bg'
  };
  Object.keys(fileMap).forEach(id=>{
    const input = $('#'+id);
    input && input.addEventListener('change', e=>{
      const f = e.target.files && e.target.files[0];
      if(!f) return;
      if(f.size > 1024*1024){
        toast('File too large (max 1MB)');
        return;
      }
      SoundManager.setCustom(fileMap[id], f);
      toast('Sound updated');
      SoundManager.play(fileMap[id]);
    });
  });

  // Play buttons
  $$('.test-btn[data-play]').forEach(btn=>{
    btn.onclick=()=>{
      const t=btn.dataset.play;
      SoundManager.play(t);
    };
  });
}

/* ------------ DONATE MODAL ------------ */
function initDonate(){
  const modal = $('#donateModal');
  const openBtn = $('#donateBtn');
  const closeBtn = $('#closeDonate');
  const copyBtn = $('#copyUpi');
  const amtInput = $('#donateAmount');
  const payBtn = $('#payNowBtn');

  openBtn.onclick=()=>{ SoundManager.play('click'); modal.classList.add('active'); };
  closeBtn.onclick=()=>{ SoundManager.play('click'); modal.classList.remove('active'); };
  modal.addEventListener('click', e=>{
    if(e.target===modal){ modal.classList.remove('active'); SoundManager.play('click'); }
  });

  // Quick amounts
  $$('.amount-btn').forEach(b=>{
    b.onclick=()=>{
      SoundManager.play('click');
      amtInput.value = b.dataset.amt;
    };
  });

  copyBtn.onclick=()=>{
    SoundManager.play('click');
    const upi = 'kk2112423@oksbi';
    if(navigator.clipboard){
      navigator.clipboard.writeText(upi).then(()=>toast('UPI copied'));
    } else {
      toast('Copy manually: '+upi);
    }
  };

  payBtn.onclick=()=>{
    SoundManager.play('move');
    const val = amtInput.value.trim();
    const amt = parseInt(val||'');
    if(!amt || amt<=0){ toast('Enter amount'); return; }
    const upiId='kk2112423@oksbi';
    const url=`upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Harsh Vardhan')}&cu=INR&am=${amt}`;
    // Try open
    window.location.href=url;
    toast('Opening UPI app...');
  };
}

/* ------------ CONTACT MODAL ------------ */
function initContact(){
  const modal=$('#contactModal');
  const openBtn=$('#contactBtn');
  const closeBtn=$('#closeContact');
  const ghBtn=$('#githubProfile');
  const liBtn=$('#linkedinProfile');

  openBtn.onclick=()=>{ SoundManager.play('click'); modal.classList.add('active'); };
  closeBtn.onclick=()=>{ SoundManager.play('click'); modal.classList.remove('active'); };
  modal.addEventListener('click',e=>{
    if(e.target===modal){ modal.classList.remove('active'); SoundManager.play('click'); }
  });

  ghBtn.onclick=()=>{
    SoundManager.play('move');
    window.open('https://github.com/harsh-vardhan-tech','_blank','noopener');
  };
  liBtn.onclick=()=>{
    SoundManager.play('move');
    window.open('https://www.linkedin.com','_blank','noopener'); // Replace with your actual LinkedIn URL if needed
  };
}

/* ------------ GLOBAL BUTTONS SOUND FEEDBACK ------------ */
function bindGlobalButtons(){
  document.body.addEventListener('click', e=>{
    const el = e.target;
    if(el.closest('.btn, .icon-btn, .amount-btn, .mode-btn, .contact-btn')){
      // Avoid double for some that already call play
      if(!el.dataset.manualSound){
        SoundManager.play('click');
      }
    }
  });
}

/* ------------ SERVICE WORKER ------------ */
function registerServiceWorker(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('service-worker.js')
      .then(()=>console.log('[SW] Registered'))
      .catch(err=>console.warn('[SW] Register failed', err));
  }
}

/* ------------ OPTIONAL: GLOBAL ERROR HANDLER ------------ */
window.addEventListener('error', e=>{
  console.warn('Runtime error:', e.message);
});

/* ------------ EXPORT (if needed) ------------ */
export {};
