let viewer = null;

/* VIEW */

const view =
  new Marzipano.RectilinearView({
    yaw: 0,
    pitch: 0,
    fov: 1.5
  });

/* GEOMETRY */

const geometry =
  new Marzipano.EquirectGeometry([
    { width: 8000 }
  ]);

let scenes = [];
let currentIndex = 0;
let currentScene = null;

/* ACTIVE FLOOR */

let currentFloor = "ground";

/* ELEMENTS */

const sidebarList =
  document.getElementById("sidebarList");

const floorplan =
  document.getElementById("floorplan");

const floorplanWrapper =
  document.getElementById("floorplanWrapper");

const floorplanImage =
  document.getElementById("floorplanImage");

const floorplanInner =
  document.getElementById("floorplanInner");

/* FLOORPLANS */

const floorplans = {
  ground: "floorplan-maa.png",
  floor1: "floorplan-1.png"
};

/* FORCE RESIZE */

function forceResize() {

  window.dispatchEvent(
    new Event("resize")
  );

}

/* WAIT UNTIL PANO IS VISIBLE */

function waitForVisible() {

  const pano =
    document.getElementById("pano");

  const rect =
    pano.getBoundingClientRect();

  if (
    rect.width > 0 &&
    rect.height > 0
  ) {

    setTimeout(() => {

      init();

    }, 300);

  } else {

    requestAnimationFrame(
      waitForVisible
    );

  }

}

/* LOAD ROOMS */

fetch("rooms.json")

.then(res => {

  if (!res.ok) {

    throw new Error(
      "rooms.json not found"
    );

  }

  return res.json();

})

.then(data => {

  scenes = data;

  buildUI();
  buildFloorplan();

  waitForVisible();

})

.catch(err => {

  console.error(
    "ROOMS LOAD ERROR:",
    err
  );

});

/* BUILD SIDEBAR */

function buildUI() {

  scenes.forEach((scene, index) => {

    const sideItem =
      document.createElement("div");

    sideItem.className = "item";

    sideItem.dataset.index =
      index;

    sideItem.textContent =
      scene.label;

    sidebarList.appendChild(
      sideItem
    );

  });

}

/* BUILD FLOORPLAN */

function buildFloorplan() {

  floorplanInner
    .querySelectorAll(".hotspot")
    .forEach(h => h.remove());

  scenes.forEach((scene, index) => {

    if (
      scene.floor !== currentFloor
    ) return;

    const dot =
      document.createElement("div");

    dot.className = "hotspot";

    dot.dataset.index =
      index;

    dot.style.left =
      scene.mapX + "%";

    dot.style.top =
      scene.mapY + "%";

    dot.onclick = () =>
      goTo(index);

    floorplanInner.appendChild(
      dot
    );

  });

  updateUI(currentIndex);

}

/* INIT */

function init() {

  const panoElement =
    document.getElementById("pano");

  viewer =
    new Marzipano.Viewer(
      panoElement
    );

  currentScene =
    createScene(0);

  currentScene.switchTo({
    transitionDuration: 700
  });

  currentIndex = 0;

  updateUI(0);

  attachEvents();

  setTimeout(
    forceResize,
    300
  );

  setTimeout(
    forceResize,
    1000
  );

}

/* CREATE SCENE */

function createScene(index) {

  const panoPath =
    "pano/" +
    scenes[index].file;

  console.log(
    "LOADING:",
    panoPath
  );

  const source =
    Marzipano.ImageUrlSource
      .fromString(panoPath);

  return viewer.createScene({
    source,
    geometry,
    view
  });

}

/* NAVIGATION */

function goTo(index) {

  if (
    index === currentIndex
  ) return;

  const scene =
    createScene(index);

  scene.switchTo({
    transitionDuration: 700
  });

  currentScene = scene;
  currentIndex = index;

  updateUI(index);

  setTimeout(
    forceResize,
    100
  );

}

/* UPDATE UI */

function updateUI(index) {

  document
    .querySelectorAll(
      "#sidebarList .item"
    )
    .forEach(el => {

      el.classList.toggle(
        "active",
        parseInt(
          el.dataset.index
        ) === index
      );

    });

  document
    .querySelectorAll(
      ".hotspot"
    )
    .forEach(el => {

      el.classList.toggle(
        "active",
        parseInt(
          el.dataset.index
        ) === index
      );

    });

}

/* EVENTS */

function attachEvents() {

  /* SIDEBAR */

  document
    .querySelectorAll(
      "#sidebarList .item"
    )
    .forEach(item => {

      item.onclick = () =>
        goTo(
          parseInt(
            item.dataset.index
          )
        );

    });

  /* FLOOR BUTTONS */

  document
    .querySelectorAll(
      ".floorBtn"
    )
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          const clickedFloor =
            btn.dataset.floor;

          /* CLOSE SAME FLOOR */

          if (
            floorplan.classList.contains("open") &&
            currentFloor === clickedFloor
          ) {

            floorplan.classList.remove(
              "open"
            );

            btn.classList.remove(
              "active"
            );

            return;

          }

          currentFloor =
            clickedFloor;

          floorplan.classList.add(
            "open"
          );

          floorplanImage.src =
            floorplans[currentFloor] +
            "?v=" +
            Date.now();

          buildFloorplan();

          document
            .querySelectorAll(
              ".floorBtn"
            )
            .forEach(b => {

              b.classList.remove(
                "active"
              );

            });

          btn.classList.add(
            "active"
          );

          setTimeout(
            forceResize,
            300
          );

        }
      );

    });

  /* CLOSE FLOORPLAN OUTSIDE CLICK */

  document.addEventListener(
    "click",
    (e) => {

      const clickedInsideFloorplan =
        floorplan.contains(
          e.target
        );

      const clickedButton =
        e.target.closest(
          ".floorBtn"
        );

      if (
        !clickedInsideFloorplan &&
        !clickedButton
      ) {

        floorplan.classList.remove(
          "open"
        );

        document
          .querySelectorAll(
            ".floorBtn"
          )
          .forEach(b => {

            b.classList.remove(
              "active"
            );

          });

      }

    }
  );

}

/* COORDINATE HELPER */

floorplanImage.addEventListener(
  "click",
  (e) => {

    const rect =
      floorplanImage
        .getBoundingClientRect();

    const x =
      (
        (
          e.clientX -
          rect.left
        ) /
        rect.width
      ) * 100;

    const y =
      (
        (
          e.clientY -
          rect.top
        ) /
        rect.height
      ) * 100;

    navigator.clipboard.writeText(
      `"mapX": ${x.toFixed(1)}, "mapY": ${y.toFixed(1)}`
    );

    console.log(
      `COPIED → mapX: ${x.toFixed(1)}, mapY: ${y.toFixed(1)}`
    );

  }
);

/* RESIZE OBSERVER */

const resizeObserver =
  new ResizeObserver(() => {

    clearTimeout(
      window.__resizeTimer
    );

    window.__resizeTimer =
      setTimeout(() => {

        forceResize();

      }, 100);

  });

resizeObserver.observe(
  document.getElementById("pano")
);

/* MOBILE FIXES */

window.addEventListener(
  "load",
  () => {

    setTimeout(
      forceResize,
      300
    );

    setTimeout(
      forceResize,
      1000
    );

  }
);

window.addEventListener(
  "orientationchange",
  () => {

    setTimeout(
      forceResize,
      500
    );

  }
);
