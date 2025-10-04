// soundManager.js
// Handles: default sounds, custom uploads (stored in localStorage), play/mute, master volume, bg music loop

export const SoundManager = {
  storeKey: 'battlehub_sounds_v1',
  masterVolume: 0.8,       // 0..1
  muted: false,
  initialized: false,
  // Default (you will upload real files to assets/audio/)
  sounds: {
    click: { src: 'assets/audio/click.mp3', audio: null, loop: false },
    move:  { src: 'assets/audio/move.mp3',  audio: null, loop: false },
    win:   { src: 'assets/audio/win.mp3',   audio: null, loop: false },
    bg:    { src: 'assets/audio/bg.mp3',    audio: null, loop: true  }
  },

  load(){
    // Restore custom base64 (if any)
    const saved = localStorage.getItem(this.storeKey);
    if(saved){
      try{
        const data = JSON.parse(saved);
        for(const k in data){
          if(this.sounds[k]){
            this.sounds[k].src = data[k];
          }
        }
      }catch(e){}
    }
    // Create audio elements
    for(const key in this.sounds){
      const cfg = this.sounds[key];
      const a = new Audio();
      a.src = cfg.src;
      a.loop = !!cfg.loop;
      a.preload = 'auto';
      a.volume = key==='bg' ? this._bgVolume() : this._fxVolume();
      a.onerror = ()=> {
        // fallback beep oscillator
        cfg.audio = this._fallbackNode(key);
      };
      cfg.audio = a;
    }
    this.initialized = true;
    // Autoplay bg after user interaction only (policy)
    document.addEventListener('click', this._unlockOnce.bind(this), { once:true });
    document.addEventListener('touchstart', this._unlockOnce.bind(this), { once:true });
  },

  _unlockOnce(){
    if(this.muted) return;
    this.play('bg');
  },

  _fallbackNode(name){
    return {
      play: ()=>this._beep(name),
      pause: ()=>{}
    };
  },

  _beep(name){
    if(this.muted) return;
    const ctx = this._ctx || (this._ctx = new (window.AudioContext||window.webkitAudioContext)());
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    let f = 300;
    if(name==='move') f = 360;
    else if(name==='win') f = 540;
    else if(name==='bg') f = 180;
    osc.type = name==='win' ? 'triangle':'sine';
    osc.frequency.value = f;
    gain.gain.value = (name==='bg'? 0.05 : 0.25) * this.masterVolume * (this.muted?0:1);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (name==='bg'? 2.0 : 0.18));
  },

  _fxVolume(){
    return this.muted ? 0 : this.masterVolume;
  },
  _bgVolume(){
    return this.muted ? 0 : Math.min(0.35, this.masterVolume * 0.45);
  },

  setMasterVolume(v){
    // v expected 0..100
    this.masterVolume = Math.max(0, Math.min(1, v/100));
    for(const k in this.sounds){
      if(!this.sounds[k].audio || this.sounds[k].loop) continue;
      try{ this.sounds[k].audio.volume = this._fxVolume(); }catch(e){}
    }
    const bg = this.sounds.bg.audio;
    if(bg && bg.loop){
      try{ bg.volume = this._bgVolume(); }catch(e){}
    }
  },

  play(name){
    if(!this.initialized) return;
    const cfg = this.sounds[name];
    if(!cfg) return;
    const a = cfg.audio;
    if(!a) return;
    if(this.muted) return;

    // If fallback node
    if(!a.play){
      a.play && a.play();
      return;
    }

    try{
      a.volume = cfg.loop ? this._bgVolume() : this._fxVolume();
      if(!cfg.loop){
        // restart small fx
        if(a.currentTime !== undefined) a.currentTime = 0;
      }
      a.play().catch(()=>{ /* ignore autoplay restrictions */ });
    }catch(e){}
  },

  stop(name){
    const cfg = this.sounds[name];
    if(cfg && cfg.audio && cfg.audio.pause){
      try{ cfg.audio.pause(); }catch(e){}
    }
  },

  stopAll(){
    for(const k in this.sounds) this.stop(k);
  },

  toggleMute(musicBtn){
    this.muted = !this.muted;
    if(this.muted){
      this.stop('bg');
      musicBtn && musicBtn.classList.add('muted');
      if(musicBtn) musicBtn.textContent='🔇';
    } else {
      musicBtn && musicBtn.classList.remove('muted');
      if(musicBtn) musicBtn.textContent='🔊';
      this.play('bg');
    }
  },

  setCustom(name, file){
    if(!this.sounds[name]) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.sounds[name].src = reader.result;
      // Rebuild audio element
      const a = new Audio();
      a.src = reader.result;
      a.loop = !!this.sounds[name].loop;
      a.volume = name==='bg'? this._bgVolume(): this._fxVolume();
      this.sounds[name].audio = a;
      this.persist();
      this.play(name);
    };
    reader.readAsDataURL(file);
  },

  persist(){
    const out = {};
    for(const k in this.sounds){
      out[k] = this.sounds[k].src;
    }
    localStorage.setItem(this.storeKey, JSON.stringify(out));
  },

  reset(){
    localStorage.removeItem(this.storeKey);
    this.stopAll();
    location.reload();
  }
};
