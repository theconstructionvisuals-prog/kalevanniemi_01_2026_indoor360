const panoElement = document.getElementById('pano');
const viewer = new Marzipano.Viewer(panoElement);

const view = new Marzipano.RectilinearView();
const geometry = new Marzipano.EquirectGeometry([{ width: 8000 }]);

let scenes = [];
let currentIndex = 0;
let currentScene = null;

const timeline = document.getElementById("timeline");
const sidebarList = document.getElementById("sidebarList");

let leftSpacer, rightSpacer;

/* 🔥 PRELOAD */
const imageCache = {};

function preloadImage(index) {
if (index < 0 || index >= scenes.length) return;
if (imageCache[index]) return;

const img = new Image();
img.src = "pano/" + scenes[index].file;

imageCache[index] = img;
}

function preloadAround(index) {
preloadImage(index);
preloadImage(index - 1);
preloadImage(index - 2);
preloadImage(index + 1);
preloadImage(index + 2);
}

// LOAD
fetch("rooms.json")
.then(res => res.json())
.then(data => {
scenes = data;
buildUI();
init();
});

// BUILD
function buildUI() {

leftSpacer = document.createElement("div");
rightSpacer = document.createElement("div");

leftSpacer.style.flex = "0 0 auto";
rightSpacer.style.flex = "0 0 auto";

timeline.appendChild(leftSpacer);

scenes.forEach((scene, index) => {

const sideItem = document.createElement("div");
sideItem.className = "item";
sideItem.dataset.index = index;
sideItem.textContent = scene.label;
sidebarList.appendChild(sideItem);

const item = document.createElement("div");
item.className = "item";
item.dataset.index = index;

item.innerHTML =
  '<div class="dot"></div>' +
  '<div class="label">' + scene.label + '</div>';

timeline.appendChild(item);

});

timeline.appendChild(rightSpacer);
}

// INIT
function init() {
updateSpacers();

currentScene = createScene(0);
currentScene.switchTo();

attachEvents();

preloadAround(0);

requestAnimationFrame(() => {
centerItem(0);
centerSidebar(0);
});
}

// SPACERS
function updateSpacers() {
const first = document.querySelector("#timeline .item");
if (!first) return;

const itemWidth = first.offsetWidth;
const spacerWidth = (window.innerWidth / 2) - (itemWidth / 2);

leftSpacer.style.width = spacerWidth + "px";
rightSpacer.style.width = spacerWidth + "px";
}

// SCENE
function createScene(index) {
const source = Marzipano.ImageUrlSource.fromString("pano/" + scenes[index].file);

return viewer.createScene({
source,
geometry,
view
});
}

// NAV (🔥 fix mukana)
function goTo(index, fromAuto = false) {
if (index === currentIndex) return;

/* 🔥 STOP vain jos käyttäjä klikkaa */
if (!fromAuto && playing) {
  playing = false;
  clearInterval(interval);
  playBtn.innerHTML = "▶";
}

const scene = createScene(index);
scene.switchTo();

currentScene = scene;
currentIndex = index;

updateUI(index);
centerItem(index);
centerSidebar(index);

preloadAround(index);
}

// UI
function updateUI(index) {
document.querySelectorAll(".item").forEach(el => {
el.classList.toggle("active", parseInt(el.dataset.index) === index);
});
}

// TIMELINE CENTER
function centerItem(index) {

const item = document.querySelector('#timeline .item[data-index="' + index + '"]');
if (!item) return;

const target =
item.offsetLeft - (timeline.clientWidth / 2) + (item.offsetWidth / 2);

timeline.scrollTo({
left: target,
behavior: "smooth"
});
}

// SIDEBAR CENTER
function centerSidebar(index) {

const item = document.querySelector('#sidebarList .item[data-index="' + index + '"]');
if (!item) return;

const target =
item.offsetTop - (sidebarList.clientHeight / 2) + (item.offsetHeight / 2);

sidebarList.scrollTo({
top: target,
behavior: "smooth"
});
}

// EVENTS
function attachEvents() {

document.querySelectorAll(".item").forEach(item => {
item.onclick = () => {
goTo(parseInt(item.dataset.index));
};
});

// TIMELINE DRAG
let isDown = false;
let startX;
let scrollLeft;

timeline.addEventListener("mousedown", e => {
isDown = true;
startX = e.pageX;
scrollLeft = timeline.scrollLeft;
});

timeline.addEventListener("mouseup", () => isDown = false);
timeline.addEventListener("mouseleave", () => isDown = false);

timeline.addEventListener("mousemove", e => {
if (!isDown) return;
timeline.scrollLeft = scrollLeft - (e.pageX - startX);
});

// SIDEBAR DRAG
let isDownSidebar = false;
let startY;
let scrollTopStart;

sidebarList.addEventListener("mousedown", e => {
isDownSidebar = true;
startY = e.pageY;
scrollTopStart = sidebarList.scrollTop;
});

sidebarList.addEventListener("mouseup", () => isDownSidebar = false);
sidebarList.addEventListener("mouseleave", () => isDownSidebar = false);

sidebarList.addEventListener("mousemove", e => {
if (!isDownSidebar) return;
sidebarList.scrollTop = scrollTopStart - (e.pageY - startY);
});

window.addEventListener("resize", () => {
updateSpacers();
centerItem(currentIndex);
centerSidebar(currentIndex);
});
}

/* =========================
   🔥 PLAY / PAUSE (fixattu)
========================= */

let playing = false;
let interval = null;
let playBtn = null;

window.addEventListener("DOMContentLoaded", () => {

playBtn = document.getElementById("playBtn");

playBtn.addEventListener("click", () => {

  playing = !playing;

  if (playing) {
    playBtn.innerHTML = "❚❚";

    interval = setInterval(() => {
      let next = currentIndex + 1;

      if (next >= scenes.length) {
        next = 0;
      }

      goTo(next, true);

    }, 4000);

  } else {
    playBtn.innerHTML = "▶";
    clearInterval(interval);
  }

});

});
