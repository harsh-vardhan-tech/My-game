// UI helpers
export const $ = (s, r=document)=>r.querySelector(s);
export const $$ = (s, r=document)=>[...r.querySelectorAll(s)];

export function toast(msg,time=1700){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), time);
}

export function confettiBurst(draw=false){
  const c = $('#confetti');
  c.innerHTML='';
  const total = draw?20:38;
  for(let i=0;i<total;i++){
    const sp=document.createElement('span');
    sp.textContent = draw?'🤝':'🎉';
    const size = Math.random()*20+18;
    sp.style.cssText=`
      position:absolute;
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      font-size:${size}px;
      transform:translate(-50%,-50%) scale(.2);
      animation:burst .9s cubic-bezier(.34,1.6,.64,1) ${Math.random()*0.5}s both;
    `;
    c.appendChild(sp);
  }
}