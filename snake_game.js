const WIDTH = 30, HEIGHT = 15, CELL_SIZE = 20;
let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let dirX = 1, dirY = 0;
let score = 0, lives = 3;
let head = {x: Math.floor(WIDTH/2), y: Math.floor(HEIGHT/2)};
let snake = [ {...head} ];
let questions = [], current_q = 0;
let rx = [], ry = [], gameInterval = null;

const scoreLivesEl = document.getElementById('scoreLives');
const questionAreaEl = document.getElementById('questionArea');
const messageEl = document.getElementById('message');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const overlay = document.getElementById('overlay');

function playSound(id) {
  const sound = document.getElementById(id);
  if (sound && sound.readyState >= 2) {
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }
}

function spawnAnswers() {
  rx = []; ry = [];
  for (let i=0;i<3;i++) {
    rx.push(Math.floor(Math.random()*WIDTH));
    ry.push(Math.floor(Math.random()*HEIGHT));
  }
}

function drawGrid() {
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  for (let x = 0; x <= canvas.width; x += CELL_SIZE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += CELL_SIZE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  ctx.shadowColor = "#00ffcc";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#00ffcc";
  for (let i=0; i<snake.length; i++) {
    ctx.fillRect(snake[i].x*CELL_SIZE, snake[i].y*CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }
  ctx.shadowBlur = 0;

  for (let i=0; i<rx.length; i++) {
    ctx.beginPath();
    ctx.arc(rx[i]*CELL_SIZE + CELL_SIZE/2, ry[i]*CELL_SIZE + CELL_SIZE/2, CELL_SIZE/2 - 2, 0, 2*Math.PI);
    ctx.fillStyle = "#ff4444";
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "bold 14px Orbitron";
    ctx.fillText(String.fromCharCode(65+i), rx[i]*CELL_SIZE + 6, ry[i]*CELL_SIZE + 16);
  }

  scoreLivesEl.textContent = `🧠 Score: ${score} | ❤️ Lives: ${lives}`;
  if (questions.length > 0) {
    let q = questions[current_q];
    questionAreaEl.innerHTML = `<strong>Q:</strong> ${q.question}<br>` +
      q.answers.map((a, i) => `${String.fromCharCode(65+i)}) ${a}`).join('<br>');
  }
}

function showMessage(msg, color = "#ff4444") {
  messageEl.textContent = msg;
  messageEl.style.color = color;
  messageEl.style.opacity = 1;
  setTimeout(() => { messageEl.style.opacity = 0; }, 2000);
}

function moveSnake() {
  let newHead = {x: head.x+dirX, y: head.y+dirY};
  if (newHead.x<0 || newHead.x>=WIDTH || newHead.y<0 || newHead.y>=HEIGHT || snake.some(s=>s.x===newHead.x && s.y===newHead.y)) {
    lives--;
    if (lives > 0) {
      showMessage("You lost a life!", "#ffaa00");
      playSound("wrongSound");
      resetSnake(); spawnAnswers();
    }
    return;
  }

  snake.unshift(newHead);
  head = newHead;

  if (questions.length > 0) {
    let ateAnswer = false;
    for (let i=0; i<rx.length; i++) {
      if (head.x === rx[i] && head.y === ry[i]) {
        ateAnswer = true;
        if (i === questions[current_q].correct) {
          score += 10;
          showMessage("Correct! 🎉", "#00ffcc");
          playSound("correctSound");
        } else {
          lives--;
          showMessage("Wrong answer! ❌", "#ff4444");
          if (lives > 0) {
            playSound("wrongSound");
            resetSnake();
          }
        }
        current_q = (current_q+1) % questions.length;
        spawnAnswers();
        break;
      }
    }
    if (!ateAnswer) snake.pop();
  } else {
    snake.pop();
  }
}

function resetSnake() {
  head = {x: Math.floor(WIDTH/2), y: Math.floor(HEIGHT/2)};
  snake = [ {...head} ];
  dirX = 1; dirY = 0;
}

function startGame() {
  score = 0; lives = 3; current_q = 0;
  resetSnake(); spawnAnswers(); draw();
  overlay.classList.add('hidden');
    retryBtn.style.display = 'none';
  startBtn.style.display = 'inline-block';
  gameInterval = setInterval(() => {
    if (lives <= 0) {
      clearInterval(gameInterval);
      showMessage("GAME OVER! Final score: " + score, "#ffaa00");
      playSound("gameOverSound");
      overlay.classList.remove('hidden');
      retryBtn.style.display = 'inline-block';
      startBtn.style.display = 'none';
    } else {
      moveSnake();
      draw();
    }
  }, 150);
}

startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' && dirY !== 1) { dirX = 0; dirY = -1; }
  if (e.key === 'ArrowDown' && dirY !== -1) { dirX = 0; dirY = 1; }
  if (e.key === 'ArrowLeft' && dirX !== 1) { dirX = -1; dirY = 0; }
  if (e.key === 'ArrowRight' && dirX !== -1) { dirX = 1; dirY = 0; }
});

fetch('questions.txt')
  .then(res => res.text())
  .then(data => {
    let lines = data.split('\n').map(l => l.trim()).filter(l => l !== '');
    for (let i=0; i<lines.length; i+=2) {
      let questionLine = lines[i];
      if (i+1 >= lines.length) break;
      let answersLine = lines[i+1];
      let parts = answersLine.split('|').map(p => p.trim());
      if (parts.length >= 2) {
        questions.push({
          question: questionLine,
          answers: parts.slice(0, parts.length-1),
          correct: parseInt(parts[parts.length-1])-1
        });
      }
    }
    draw(); 
  })
  .catch(err => showMessage("Error loading questions.txt: " + err));