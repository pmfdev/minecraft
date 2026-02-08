const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const toolbar = document.getElementById("toolbar");
const blockCountEl = document.getElementById("block-count");
const modeEl = document.getElementById("mode");
const seedEl = document.getElementById("seed");
const regenBtn = document.getElementById("regen");
const clearBtn = document.getElementById("clear");

const worldWidth = 45;
const worldHeight = 27;
let tileSize = 20;
let camera = { x: 0, y: 0 };
let placeMode = true;

const blockTypes = [
  { id: "grass", name: "Hierba", color: "#6bcB3c" },
  { id: "dirt", name: "Tierra", color: "#a0623b" },
  { id: "stone", name: "Piedra", color: "#8d99ae" },
  { id: "wood", name: "Madera", color: "#c97c5d" },
  { id: "water", name: "Agua", color: "#4ea8de" },
  { id: "sand", name: "Arena", color: "#f1dca7" }
];

let selectedBlock = blockTypes[0].id;
let grid = [];
let seed = 0;

function rand(seedInput) {
  let s = seedInput % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function generateWorld() {
  seed = Math.floor(Math.random() * 1e6);
  const rng = rand(seed);
  grid = Array.from({ length: worldHeight }, () => Array(worldWidth).fill(null));

  for (let x = 0; x < worldWidth; x += 1) {
    const hill = Math.floor(rng() * 5);
    const ground = Math.floor(worldHeight * 0.55) + hill;
    for (let y = ground; y < worldHeight; y += 1) {
      grid[y][x] = y === ground ? "grass" : rng() > 0.8 ? "stone" : "dirt";
    }
  }

  for (let i = 0; i < 60; i += 1) {
    const x = Math.floor(rng() * worldWidth);
    const y = Math.floor(rng() * worldHeight * 0.5);
    if (!grid[y][x]) grid[y][x] = rng() > 0.7 ? "cloud" : null;
  }

  seedEl.textContent = seed;
  updateBlockCount();
}

function drawWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < worldHeight; y += 1) {
    for (let x = 0; x < worldWidth; x += 1) {
      const block = grid[y][x];
      if (!block || block === "cloud") continue;
      const type = blockTypes.find(b => b.id === block);
      if (!type) continue;

      ctx.fillStyle = type.color;
      ctx.fillRect(x * tileSize + camera.x, y * tileSize + camera.y, tileSize, tileSize);
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.strokeRect(x * tileSize + camera.x, y * tileSize + camera.y, tileSize, tileSize);
    }
  }
}

function updateBlockCount() {
  const count = grid.flat().filter(Boolean).length;
  blockCountEl.textContent = count;
}

function setMode(value) {
  placeMode = value;
  modeEl.textContent = placeMode ? "Colocar" : "Eliminar";
}

function renderToolbar() {
  toolbar.innerHTML = "";
  blockTypes.forEach((block, index) => {
    const item = document.createElement("button");
    item.className = "block" + (block.id === selectedBlock ? " active" : "");
    item.innerHTML = `
      <div class="swatch" style="background:${block.color}"></div>
      <strong>${block.name}</strong>
      <span>Tecla ${index + 1}</span>
    `;
    item.addEventListener("click", () => selectBlock(block.id));
    toolbar.appendChild(item);
  });
}

function selectBlock(id) {
  selectedBlock = id;
  renderToolbar();
}

function getGridPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((evt.clientX - rect.left - camera.x) / tileSize);
  const y = Math.floor((evt.clientY - rect.top - camera.y) / tileSize);
  return { x, y };
}

function applyBlock(x, y, type) {
  if (x < 0 || y < 0 || x >= worldWidth || y >= worldHeight) return;
  grid[y][x] = type;
  updateBlockCount();
  drawWorld();
}

canvas.addEventListener("click", (evt) => {
  const { x, y } = getGridPos(evt);
  if (placeMode) applyBlock(x, y, selectedBlock);
  else applyBlock(x, y, null);
});

canvas.addEventListener("contextmenu", (evt) => {
  evt.preventDefault();
  const { x, y } = getGridPos(evt);
  applyBlock(x, y, null);
});

window.addEventListener("keydown", (evt) => {
  if (evt.key === " ") {
    setMode(!placeMode);
  }
  if (evt.key.toLowerCase() === "r") {
    generateWorld();
    drawWorld();
  }
  const index = Number.parseInt(evt.key, 10);
  if (index >= 1 && index <= blockTypes.length) {
    selectBlock(blockTypes[index - 1].id);
  }
});

canvas.addEventListener("wheel", (evt) => {
  evt.preventDefault();
  tileSize = Math.min(32, Math.max(12, tileSize + (evt.deltaY > 0 ? -2 : 2)));
  drawWorld();
}, { passive: false });

regenBtn.addEventListener("click", () => {
  generateWorld();
  drawWorld();
});

clearBtn.addEventListener("click", () => {
  grid = grid.map(row => row.map(cell => (cell && cell !== "grass") ? null : cell));
  updateBlockCount();
  drawWorld();
});

renderToolbar();
setMode(true);
generateWorld();
drawWorld();
