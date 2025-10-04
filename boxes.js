// Dot Box Game for Game Hub (simple, animated, phone-friendly)
window.renderDotBox = function(container, mode, player1, player2) {
  // Settings
  const SIZE = 5; // 5x5 grid (can change size for bigger/smaller game)
  let lines = {}; // key: "r_c_dir" (dir: h/v). Value: player id (0/1)
  let boxes = {}; // key: "r_c". Value: player id (0/1)
  let turn = 0; // 0: player1, 1: player2
  let running = true;
  let playerNames = [player1, player2];
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;">
      <h2 style="color:#ffbe0b;text-shadow:0 0 8px #ffbe0b,0 0 16px #56e6ff;font-size:2rem;margin-bottom:8px;">
        🟦 Dot Box Game
      </h2>
      <div style="margin-bottom:6px;font-weight:700;">
        <span style="color:#7c3aed">${player1}</span> vs <span style="color:#ff5c7c">${player2}</span>
      </div>
      <div id="dbGrid" style="margin-bottom:17px;"></div>
      <div id="dbMsg" style="font-weight:700;font-size:1.13rem;min-height:32px;margin-bottom:6px;"></div>
      <button id="dbResetBtn" style="background:linear-gradient(90deg,#7c3aed,#06b6d4);margin-top:10px;color:#fff;border:none;border-radius:12px;padding:7px 18px;cursor:pointer;font-weight:700;">Restart Game 🔄</button>
      <button id="dbBackBtn" style="margin-top:10px;background:#ff5c7c;color:#fff;border:none;border-radius:12px;padding:7px 18px;cursor:pointer;font-weight:700;">⬅ Home</button>
    </div>
  `;
  // Grid render
  const gridDiv = container.querySelector('#dbGrid');
  const msgDiv = container.querySelector('#dbMsg');
  const resetBtn = container.querySelector('#dbResetBtn');
  const backBtn = container.querySelector('#dbBackBtn');
  function renderGrid() {
    let html = '';
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        html += `<div style="position:relative;display:inline-block;width:36px;height:36px;">
          <div style="width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 0 6px #7c3aed44;position:absolute;top:12px;left:12px;"></div>
          ${c<SIZE-1?renderLineBtn(r,c,'h'):''}
          ${r<SIZE-1?renderLineBtn(r,c,'v'):''}
          ${r<SIZE-1&&c<SIZE-1?renderBox(r,c):''}
        </div>`;
      }
      html += '<br>';
    }
    gridDiv.innerHTML = html;
    // Add events
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        if(c<SIZE-1){
          addLineEvent(r,c,'h');
        }
        if(r<SIZE-1){
          addLineEvent(r,c,'v');
        }
      }
    }
  }
  function renderLineBtn(r,c,dir){
    let key = `${r}_${c}_${dir}`;
    let color = lines[key]==null?"#fff":"#"+(lines[key]==0?"7c3aed":"ff5c7c");
    let style = dir=='h'?`top:18px;left:26px;width:26px;height:7px;`:`top:26px;left:18px;width:7px;height:26px;`;
    return `<div class="dbLine" id="dbLine_${key}" style="position:absolute;${style}background:${color};border-radius:6px;box-shadow:0 0 4px #7c3aed44;cursor:${lines[key]==null&&running?'pointer':'default'};transition:.18s;"></div>`;
  }
  function renderBox(r,c){
    let key = `${r}_${c}`;
    if(boxes[key]==null) return `<div id="dbBox_${key}" style="position:absolute;top:22px;left:22px;width:16px;height:16px;"></div>`;
    let color = boxes[key]==0?"#7c3aed":"#ff5c7c";
    return `<div id="dbBox_${key}" style="position:absolute;top:22px;left:22px;width:16px;height:16px;border-radius:5px;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:1rem;box-shadow:0 0 8px ${color};font-weight:700;">
      ${playerNames[boxes[key]][0].toUpperCase()}
    </div>`;
  }
  function addLineEvent(r,c,dir){
    let key = `${r}_${c}_${dir}`;
    let el = gridDiv.querySelector(`#dbLine_${key}`);
    if(!el) return;
    if(lines[key]!=null||!running) return;
    el.onclick = ()=>{
      if(lines[key]!=null||!running) return;
      lines[key] = turn;
      el.style.background = turn==0?"#7c3aed":"#ff5c7c";
      let scored = checkBoxMade(r,c,dir);
      renderGrid();
      if(scored){
        msgDiv.textContent = `🎉 ${playerNames[turn]} made a box!`;
      }else{
        turn = 1-turn;
        msgDiv.textContent = `Now: ${playerNames[turn]}`;
        if(mode=="AI"&&turn==1&&running) setTimeout(aiMove,300);
      }
      checkGameEnd();
    };
  }
  function checkBoxMade(r,c,dir){
    let scored = false;
    let boxCoords=[];
    if(dir=='h'){
      if(r>0&&isBox(r-1,c)){
        boxes[`${r-1}_${c}`]=turn;
        scored=true;boxCoords.push([r-1,c]);
      }
      if(r<SIZE-1&&isBox(r,c)){
        boxes[`${r}_${c}`]=turn;
        scored=true;boxCoords.push([r,c]);
      }
    }else if(dir=='v'){
      if(c>0&&isBox(r,c-1)){
        boxes[`${r}_${c-1}`]=turn;
        scored=true;boxCoords.push([r,c-1]);
      }
      if(c<SIZE-1&&isBox(r,c)){
        boxes[`${r}_${c}`]=turn;
        scored=true;boxCoords.push([r,c]);
      }
    }
    return scored;
  }
  function isBox(r,c){
    return lines[`${r}_${c}_h`]!=null &&
           lines[`${r}_${c}_v`]!=null &&
           lines[`${r+1}_${c}_h`]!=null &&
           lines[`${r}_${c+1}_v`]!=null &&
           boxes[`${r}_${c}`]==null;
  }
  function aiMove(){
    // Simple AI: random available line
    let available=[];
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        if(c<SIZE-1&&!lines[`${r}_${c}_h`]) available.push([r,c,'h']);
        if(r<SIZE-1&&!lines[`${r}_${c}_v`]) available.push([r,c,'v']);
      }
    }
    if(available.length==0) return;
    let move = available[Math.floor(Math.random()*available.length)];
    let el = gridDiv.querySelector(`#dbLine_${move[0]}_${move[1]}_${move[2]}`);
    el && el.click();
  }
  function checkGameEnd(){
    let totalBoxes = (SIZE-1)*(SIZE-1);
    let filled = Object.keys(boxes).length;
    if(filled==totalBoxes){
      running = false;
      let p0=Object.values(boxes).filter(x=>x==0).length;
      let p1=Object.values(boxes).filter(x=>x==1).length;
      let winner = p0>p1?playerNames[0]:p1>p0?playerNames[1]:"Draw";
      msgDiv.textContent = winner=="Draw"?"🤝 Draw!":`🏆 ${winner} Wins!`;
    }
  }
  resetBtn.onclick = () => {
    lines={}; boxes={}; turn=0; running=true;
    msgDiv.textContent = `Start! ${playerNames[0]} vs ${playerNames[1]}`;
    renderGrid();
  };
  backBtn.onclick = () => {
    container.innerHTML = "";
    showScreen(0);
  };
  resetBtn.onclick();
};
