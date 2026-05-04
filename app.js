const viewer = new Marzipano.Viewer(document.getElementById('pano'));
const view = new Marzipano.RectilinearView();
const geometry = new Marzipano.EquirectGeometry([{ width: 8000 }]);

let scenes = [];
let currentIndex = 0;
let currentScene = null;

const timeline = document.getElementById("timeline");
const sidebarList = document.getElementById("sidebarList");
const floorplan = document.getElementById("floorplan");

/* LOAD */
fetch("rooms.json")
.then(res => res.json())
.then(data => {
  scenes = data;
  buildUI();
  buildFloorplan();
  init();
});

/* BUILD UI */
function buildUI() {
  scenes.forEach((scene, index) => {

    // sidebar
    const sideItem = document.createElement("div");
    sideItem.className = "item";
    sideItem.dataset.index = index;
    sideItem.textContent = scene.label;
    sidebarList.appendChild(sideItem);

    // timeline
    const item = document.createElement("div");
    item.className = "item";
    item.dataset.index = index;

    item.innerHTML =
      '<div class="dot"></div>' +
      '<div class="label">' + scene.label + '</div>';

    timeline.appendChild(item);
  });
}

/* FLOORPLAN */
function buildFloorplan() {
  scenes.forEach((scene, index) => {

    const dot = document.createElement("div");
    dot.className = "hotspot";
    dot.dataset.index = index;

    dot.style.left = scene.mapX + "%";
    dot.style.top = scene.mapY + "%";

    floorplan.appendChild(dot);
  });
}

/* INIT */
function init() {
  currentScene = createScene(0);
  currentScene.switchTo();

  attachEvents();
}

/* SCENE */
function createScene(index) {
  const source = Marzipano.ImageUrlSource.fromString("pano/" + scenes[index].file);
  return viewer.createScene({ source, geometry, view });
}

/* NAV */
function goTo(index) {
  if (index === currentIndex) return;

  const scene = createScene(index);
  scene.switchTo();

  currentScene = scene;
  currentIndex = index;

  updateUI(index);
}

/* UI */
function updateUI(index) {

  document.querySelectorAll(".item").forEach(el => {
    el.classList.toggle("active", parseInt(el.dataset.index) === index);
  });

  document.querySelectorAll(".hotspot").forEach(el => {
    el.classList.toggle("active", parseInt(el.dataset.index) === index);
  });
}

/* EVENTS */
function attachEvents() {

  document.querySelectorAll(".item").forEach(item => {
    item.onclick = () => goTo(parseInt(item.dataset.index));
  });

  document.querySelectorAll(".hotspot").forEach(h => {
    h.onclick = () => goTo(parseInt(h.dataset.index));
  });
}
