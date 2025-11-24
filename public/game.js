// === Canvas / Dünya Ayarları ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dünya (side scroller)
const worldWidth = 2000;
const groundY = canvas.height - 80;

// Kamera
let cameraX = 0;

// === Klavye Kontrolleri ===
const keys = {
  left: false,
  right: false,
  up: false
};

window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') {
    keys.up = true;
  }
  if (e.code === 'KeyJ') {
    startAttack();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') {
    keys.up = false;
  }
});

// === Oyuncu(Sprite + Animasyon) ===

// player.png -> 1 satırda 4 kare, her kare 32x32 varsayıyoruz
const PLAYER_FRAME_WIDTH = 32;
const PLAYER_FRAME_HEIGHT = 32;
const PLAYER_RUN_FRAMES = 4;

// Sprite yükleme
const playerSprite = new Image();
playerSprite.src = 'player.png.webp';
let playerSpriteLoaded = false;
playerSprite.onload = () => {
  playerSpriteLoaded = true;
};

const player = {
  x: 100,
  y: groundY - 64,   // boyuna göre ayarladım
  width: 48,         // ekranda gözükecek ölçek
  height: 64,
  vx: 0,
  vy: 0,
  speed: 4,
  jumpStrength: 12,
  onGround: true,
  facing: 1,          // 1: sağ, -1: sol
  isAttacking: false,
  isFlyingKick: false,
  attackTimer: 0,
  attackDuration: 12,
  animFrame: 0,
  animTimer: 0,
  animSpeed: 6       // ne kadar hızlı frame değişsin (düşerse hızlanır)
};

const gravity = 0.6;
const maxFallSpeed = 15;

// === Düşmanlar ===
const enemies = [
  { x: 550,  y: groundY - 50, width: 36, height: 48, color: '#ff3333', alive: true },
  { x: 900,  y: groundY - 50, width: 36, height: 48, color: '#ff3333', alive: true },
  { x: 1300, y: groundY - 50, width: 36, height: 48, color: '#ff3333', alive: true }
];

// Level sonu (prenses/kule)
const goal = {
  x: 1800,
  y: groundY - 120,
  width: 60,
  height: 120
};

let levelComplete = false;

// Basit dikdörtgen çarpışma
function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Saldırı başlat
function startAttack() {
  if (player.isAttacking) return;

  player.isAttacking = true;
  player.attackTimer = player.attackDuration;

  if (!player.onGround) {
    player.isFlyingKick = true;
    player.vx += player.facing * 3;
  } else {
    player.isFlyingKick = false;
  }
}

// Saldırı hitbox ve düşmana vurma
function handleAttackHit() {
  let attackBox;

  if (player.isFlyingKick) {
    attackBox = {
      x: player.x,
      y: player.y,
      width: player.width,
      height: player.height
    };
  } else {
    const attackWidth = 30;
    attackBox = {
      x: player.facing === 1 ? player.x + player.width : player.x - attackWidth,
      y: player.y + 8,
      width: attackWidth,
      height: player.height - 16
    };
  }

  enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    if (rectsOverlap(attackBox, enemy)) {
      enemy.alive = false;
      console.log('Düşman vuruldu!');
    }
  });
}

// Animasyon state'i basit tutuyoruz:
// - Yerde ve hareket ediyorsa: run animasyonu (frame 0-3 döner)
// - Diğer durumlarda: frame 0 (idle gibi)
function updateAnimation() {
  const isMoving = Math.abs(player.vx) > 0.1 && player.onGround;

  if (isMoving) {
    player.animTimer++;
    if (player.animTimer >= player.animSpeed) {
      player.animTimer = 0;
      player.animFrame = (player.animFrame + 1) % PLAYER_RUN_FRAMES;
    }
  } else {
    player.animFrame = 0;
    player.animTimer = 0;
  }
}

// === Güncelleme ===
function update() {
  if (levelComplete) return;

  // Sağ/sol
  player.vx = 0;
  if (keys.left) {
    player.vx = -player.speed;
    player.facing = -1;
  }
  if (keys.right) {
    player.vx = player.speed;
    player.facing = 1;
  }

  // Zıplama
  if (keys.up && player.onGround) {
    player.vy = -player.jumpStrength;
    player.onGround = false;
  }

  // Yerçekimi
  player.vy += gravity;
  if (player.vy > maxFallSpeed) player.vy = maxFallSpeed;

  // Pozisyon
  player.x += player.vx;
  player.y += player.vy;

  // Zemin
  if (player.y + player.height >= groundY) {
    player.y = groundY - player.height;
    player.vy = 0;
    player.onGround = true;
    player.isFlyingKick = false;
  }

  // Dünya sınırları
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > worldWidth) {
    player.x = worldWidth - player.width;
  }

  // Saldırı
  if (player.isAttacking) {
    player.attackTimer--;
    if (player.attackTimer <= 0) {
      player.isAttacking = false;
      player.isFlyingKick = false;
    } else {
      handleAttackHit();
    }
  }

  // Kamera
  cameraX = player.x - canvas.width / 2;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > worldWidth - canvas.width) {
    cameraX = worldWidth - canvas.width;
  }

  // Level sonu
  if (rectsOverlap(player, goal)) {
    levelComplete = true;
  }

  // Animasyon güncelle
  updateAnimation();
}

// Oyuncu çizimi (sprite ile)
function drawPlayer() {
  const screenX = player.x - cameraX;
  const screenY = player.y;

  if (!playerSpriteLoaded) {
    // Sprite daha yüklenmediyse eskisi gibi kutu çiz
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(screenX, screenY, player.width, player.height);
    return;
  }

  const sx = player.animFrame * PLAYER_FRAME_WIDTH;
  const sy = 0;
  const sw = PLAYER_FRAME_WIDTH;
  const sh = PLAYER_FRAME_HEIGHT;

  ctx.save();
  ctx.translate(screenX + player.width / 2, screenY + player.height / 2);

  // sola bakıyorsa sprite'ı yatay çevir
  if (player.facing === -1) {
    ctx.scale(-1, 1);
  }

  ctx.drawImage(
    playerSprite,
    sx, sy, sw, sh,
    -player.width / 2, -player.height / 2,
    player.width,
    player.height
  );

  ctx.restore();
}

// === Çizim ===
function draw() {
  // Arka plan
  ctx.fillStyle = '#1b2632';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Uzak arka plan şerit
  ctx.fillStyle = '#111820';
  ctx.fillRect(-cameraX * 0.3, canvas.height - 200, worldWidth, 200);

  // Zemin
  ctx.fillStyle = '#444';
  ctx.fillRect(-cameraX, groundY, worldWidth, canvas.height - groundY);

  // Düşmanlar (kırmızı kutu)
  enemies.forEach((enemy) => {
    if (!enemy.alive) return;
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x - cameraX, enemy.y, enemy.width, enemy.height);
  });

  // Level sonu kule
  ctx.fillStyle = '#6666ff';
  ctx.fillRect(goal.x - cameraX, goal.y, goal.width, goal.height);

  // Oyuncu (sprite)
  drawPlayer();

  // Saldırı hitbox'ını görmek için (debug, istersen silebilirsin)
  if (player.isAttacking) {
    let attackBox;
    if (player.isFlyingKick) {
      attackBox = {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height
      };
    } else {
      const attackWidth = 30;
      attackBox = {
        x: player.facing === 1 ? player.x + player.width : player.x - attackWidth,
        y: player.y + 8,
        width: attackWidth,
        height: player.height - 16
      };
    }
    ctx.strokeStyle = '#00ff00';
    ctx.strokeRect(
      attackBox.x - cameraX,
      attackBox.y,
      attackBox.width,
      attackBox.height
    );
  }

  // UI
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px Arial';
  ctx.fillText('A/D veya ←/→: Yürü  |  W/↑/Space: Zıpla  |  J: Yumruk/Uçan Tekme', 20, 30);

  if (levelComplete) {
    ctx.font = '32px Arial';
    ctx.fillText('LEVEL COMPLETE!', canvas.width / 2 - 130, 80);
  }
}

// === Oyun Döngüsü ===
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
