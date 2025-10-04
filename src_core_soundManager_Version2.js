// Sound Manager with customizable local sounds
// fallback beep generation if base assets fail
export const SoundManager = {
  muted:false,
  storeKey:'battlehub_sounds_v1',
  sounds:{
    click:{src:'assets/audio/click.mp3', audio:null, loop:false},
    move:{src:'assets/audio/move.mp3', audio:null, loop:false},
    win:{src:'assets/audio/win.mp3', audio:null, loop:false},
    bg:{src:'assets/audio/bg.mp3', audio:null, loop:true}
  },
  load(){
    const saved = localStorage.getItem(this.storeKey);
    if(saved){
      try{
        const data=JSON.parse(saved);
        for(const k in data){
          if(this.sounds[k]) this.sounds[k].src=data[k];
        }
      }catch(e){}
    }
    for(const k in this.sounds){
      const a=new Audio();
      a.src=this.sounds[k].src;
      if(this.sounds[k].loop) a.loop=true;
      this.sounds[k].audio=a;
      a.onerror=()=>{ // fallback beep
        this.sounds[k].audio = this._fallbackNode(k);
      };
    }
  },
  _fallbackNode(name){
    return {
      play: ()=> this._beep(name),
      pause: ()=>{}
    };
  },
  _beep(name){
    if(this.muted) return;
    const ctx = this._ctx || (this._ctx = new (window.AudioContext||window.webkitAudioContext)());
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    let freq = 280;
    if(name==='move') freq=340;
    else if(name==='win') freq=520;
    else if(name==='bg') freq=140;
    o.type = name==='win'?'triangle': 'sine';
    o.frequency.value = freq;
    g.gain.value = name==='bg'?0.04:0.20;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime+(name==='bg'?2:0.18));
  },
  play(name){
    if(this.muted) return;
    const s=this.sounds[name];
    if(!s||!s.audio) return;
    if(name==='bg'){
      try{
        s.audio.currentTime=0;
        s.audio.play().catch(()=>{});
      }catch(e){}
    } else {
      try {
        if(s.audio.currentTime!=null) s.audio.currentTime=0;
        s.audio.play().catch(()=>{});
      }catch(e){}
    }
  },
  stop(name){
    const s=this.sounds[name];
    if(s&&s.audio&&s.audio.pause) s.audio.pause();
  },
  stopAll(){
    for(const k in this.sounds) this.stop(k);
  },
  toggleMute(btn){
    this.muted=!this.muted;
    if(this.muted){
      this.stop('bg');
      btn.classList.add('muted'); btn.textContent='🔇';
    }else{
      btn.classList.remove('muted'); btn.textContent='🔊';
      this.play('bg');
    }
  },
  setCustom(name, file){
    const reader=new FileReader();
    reader.onload=()=>{
      this.sounds[name].src=reader.result;
      this.sounds[name].audio.src=reader.result;
      this.persist();
    };
    reader.readAsDataURL(file);
  },
  persist(){
    const data={};
    for(const k in this.sounds) data[k]=this.sounds[k].src;
    localStorage.setItem(this.storeKey, JSON.stringify(data));
  },
  reset(){
    localStorage.removeItem(this.storeKey);
    this.stopAll();
    location.reload();
  }
};