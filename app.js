const viewer = new Marzipano.Viewer(
  document.getElementById('pano')
);

const view = new Marzipano.RectilinearView({
  fov: 1.6
});

const geometry = new Marzipano.EquirectGeometry([
  { width: 8000 }
]);

let scenes = [];
let currentIndex = 0;
let currentScene = null;

/* ACTIVE FLOOR */

let currentFloor = "ground";

const sidebarList =
  document.getElementById("sidebarList");

const floorplan =
  document.getElementById("floorplan");

const floorplanWrapper =
  document.getElementById("floorplanWrapper");

const floorplanImage =
  document.getElementById("floorplanImage");

/* FLOORPLANS */

const floorplans = {
  ground: "floorplan-maa.png",
  floor1: "floorplan-1.png",
  floor2: "floorplan-2.png",
  floor3: "floorplan-3.png"
};

/* LOAD */

fetch("rooms.json")
.then(res => res.json())
.then(data => {

  scenes = data;

  buildUI();
  buildFloorplan();

  init();

});

/* BUILD SIDEBAR */

function buildUI() {

  scenes.forEach((scene, index) => {

    const sideItem =
      document.createElement("div");

    sideItem.className = "item";
    sideItem.dataset.index = index;

    sideItem.textContent = scene.label;

    sidebarList.appendChild(sideItem);

  });

}

/* BUILD FLOORPLAN */

function buildFloorplan() {

  floorplanWrapper
    .querySelectorAll(".hotspot")
    .forEach(h => h.remove());

  scenes.forEach((scene, index) => {

    /* SHOW ONLY ACTIVE FLOOR */

    if (scene.floor !== currentFloor) return;

    const dot =
      document.createElement("div");

    dot.className = "hotspot";
    dot.dataset.index = index;

    dot.style.left = scene.mapX + "%";
    dot.style.top = scene.mapY + "%";

    dot.onclick = () => goTo(index);

    floorplanWrapper.appendChild(dot);

  });

  updateUI(currentIndex);

}

/* INIT */

function init() {

  currentScene = createScene(0);

  currentScene.switchTo({
    transitionDuration: 700
  });

  updateUI(0);

  attachEvents();

}

/* CREATE SCENE */

function createScene(index) {

  const source =
    Marzipano.ImageUrlSource.fromString(
      "pano/" + scenes[index].file
    );

  return viewer.createScene({
    source,
    geometry,
    view
  });

}

/* NAVIGATION */

function goTo(index) {

  if (index === currentIndex) return;

  const scene = createScene(index);

  scene.switchTo({
    transitionDuration: 700
  });

  currentScene = scene;
  currentIndex = index;

  updateUI(index);

}

/* UPDATE UI */

function updateUI(index) {

  document
    .querySelectorAll("#sidebarList .item")
    .forEach(el => {

      el.classList.toggle(
        "active",
        parseInt(el.dataset.index) === index
      );

    });

  document
    .querySelectorAll(".hotspot")
    .forEach(el => {

      el.classList.toggle(
        "active",
        parseInt(el.dataset.index) === index
      );

    });

}

/* EVENTS */

function attachEvents() {

  /* SIDEBAR */

  document
    .querySelectorAll("#sidebarList .item")
    .forEach(item => {

      item.onclick = () =>
        goTo(parseInt(item.dataset.index));

    });

  /* FLOOR BUTTONS */

  document
    .querySelectorAll(".floorBtn")
    .forEach(btn => {

      btn.addEventListener("click", () => {

        const clickedFloor =
          btn.dataset.floor;

        /* TOGGLE CLOSE */

        if (
          floorplan.classList.contains("open") &&
          currentFloor === clickedFloor
        ) {

          floorplan.classList.remove("open");

          btn.classList.remove("active");

          return;
        }

        /* SET ACTIVE FLOOR */

        currentFloor = clickedFloor;

        /* OPEN FLOORPLAN */

        floorplan.classList.add("open");

        /* CHANGE IMAGE */

        floorplanImage.src =
          floorplans[currentFloor] +
          "?v=" + Date.now();

        /* REBUILD HOTSPOTS */

        buildFloorplan();

        /* ACTIVE BUTTONS */

        document
          .querySelectorAll(".floorBtn")
          .forEach(b => {
            b.classList.remove("active");
          });

        btn.classList.add("active");

      });

    });

  /* CLOSE FLOORPLAN */

  document.addEventListener("click", (e) => {

    const clickedInsideFloorplan =
      floorplan.contains(e.target);

    const clickedButton =
      e.target.closest(".floorBtn");

    if (
      !clickedInsideFloorplan &&
      !clickedButton
    ) {

      floorplan.classList.remove("open");

      document
        .querySelectorAll(".floorBtn")
        .forEach(b => {
          b.classList.remove("active");
        });

    }

  });

}

/* COORDINATE HELPER */

floorplanWrapper.addEventListener("click", (e) => {

  const rect =
    floorplanWrapper.getBoundingClientRect();

  const x =
    ((e.clientX - rect.left) / rect.width) * 100;

  const y =
    ((e.clientY - rect.top) / rect.height) * 100;

  console.log(
    `mapX: ${x.toFixed(1)}, mapY: ${y.toFixed(1)}`
  );

});
