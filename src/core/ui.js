// ui.js
// Small DOM helper utilities + toast + confetti effects

// Shortcuts
export const $  = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

/**
 * Show toast message
 * @param {string} msg
 * @param {number} time
 */
export function toast(msg, time=1800){
  let el = $('#toast');
  if(!el){
    el = document.createElement('div');
    el.id='toast';
    el.className='toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(()=>el.classList.remove('show'), time);
}

/**
 * Confetti / celebration
 * @param {boolean} draw If true uses 🤝 else 🎉
 */
export function confettiBurst(draw=false){
  const el = $('#confetti');
  if(!el) return;
  el.innerHTML = '';
  const total = draw ? 22 : 42;
  for(let i=0;i<total;i++){
    const s = document.createElement('span');
    s.textContent = draw ? '🤝' : (Math.random()<0.33?'🎉':(Math.random()<0.66?'✨':'💥'));
    const size = Math.random()*18 + 16;
    const x = Math.random()*100;
    const y = Math.random()*100;
    const delay = (Math.random()*0.5).toFixed(2);
    s.style.cssText = `
      position:absolute;
      left:${x}%;
      top:${y}%;
      font-size:${size}px;
      transform:translate(-50%,-50%) scale(.2);
      animation:burst .9s cubic-bezier(.34,1.6,.64,1) ${delay}s both;
      pointer-events:none;
      filter:drop-shadow(0 0 4px #000);
    `;
    el.appendChild(s);
  }
}

/**
 * Fade container swap helper (optional future use)
 * @param {HTMLElement} node
 */
export function flash(node){
  if(!node) return;
  node.style.animation='none';
  // Force reflow
  void node.offsetWidth;
  node.style.animation='fade .45s';
}

/**
 * Simple copy to clipboard helper
 */
export function copyText(txt){
  if(navigator.clipboard){
    navigator.clipboard.writeText(txt).then(()=>toast('Copied!'));
  } else {
    const ta=document.createElement('textarea');
    ta.value=txt;
    document.body.appendChild(ta);
    ta.select();
    try{ document.execCommand('copy'); toast('Copied!'); }catch(e){}
    ta.remove();
  }
}

/**
 * Random helper (for dice etc.)
 */
export const rand = (min,max)=>Math.floor(Math.random()*(max-min+1))+min;

/**
 * Utility to safely clear a node
 */
export function clearNode(node){
  if(!node) return;
  while(node.firstChild) node.removeChild(node.firstChild);
}
