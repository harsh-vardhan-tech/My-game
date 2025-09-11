const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let score = 0;
let gameOver = false;
let level = 1;

let player = {x: 280, y: 350, width: 40, height: 20, speed: 5};
let bullets = [];
let enemies = [];
let keys = {};

document.addEventListener("keydown", e=>keys[e.key]=true);
document.addEventListener("keyup", e=>keys[e.key]=false);

canvas.addEventListener("click", shoot);
document.addEventListener("keydown", e=>{ if(e.key===" ") shoot(); });

function shoot(){
  if(gameOver) return;
  bullets.push({x:player.x+18, y:player.y-10, width:4, height:10, speed:5});
}

// Spawn enemies with random speed
function spawnEnemy(){
  if(gameOver) return;
  let enemySpeed = 2 + Math.random()*level;
  enemies.push({x: Math.random()*560, y: 0, width: 40, height: 20, speed: enemySpeed});
  let spawnTime = Math.max(500, 1500 - level*50); // faster spawn with level
  setTimeout(spawnEnemy, spawnTime); 
}
spawnEnemy();

// Restart function
function restartGame(){
  score = 0; level = 1; gameOver=false;
  bullets=[]; enemies=[];
  player.x=280;
  document.getElementById("score").innerText = "Score: 0";
  spawnEnemy();
  gameLoop();
}

// Game Loop
function gameLoop(){
  if(gameOver) return;
  
  // Player movement
  if(keys["ArrowLeft"] && player.x>0) player.x -= player.speed;
  if(keys["ArrowRight"] && player.x<560) player.x += player.speed;

  ctx.clearRect(0,0,600,400);
  
  // Draw player
  ctx.fillStyle="lime";
  ctx.fillRect(player.x, player.y, player.width, player.height);
  
  // Draw bullets
  ctx.fillStyle="yellow";
  bullets.forEach((b,i)=>{
    b.y -= b.speed;
    ctx.fillRect(b.x, b.y, b.width, b.height);
    enemies.forEach((e,j)=>{
      if(b.x < e.x+e.width && b.x+b.width>e.x && b.y<e.y+e.height && b.y+b.height>e.y){
        enemies.splice(j,1);
        bullets.splice(i,1);
        score += 1;
        if(score % 10 === 0) level += 1; // increase level
        document.getElementById("score").innerText = "Score: "+score;
      }
    });
  });
  
  // Draw enemies
  ctx.fillStyle="red";
  enemies.forEach((e,i)=>{
    e.y += e.speed;
    ctx.fillRect(e.x, e.y, e.width, e.height);
    if(e.y > 380){
      gameOver = true;
      alert("💀 Game Over! Final Score: "+score);
    }
  });
  
  requestAnimationFrame(gameLoop);
}
gameLoop();
