// ?shot= staging: drives the app from the URL so screenshots are exact and
// repeatable. Examples:
//   ?shot=cover&layout=vice-classic&grade=sunset&size=1920x1080
//       &caption=VICE%20CITY&sub=SUNSET%20HEIST
//       &photos=boulevard,pier,skyline,boulevard
//   ?shot=editor&photo=boulevard&caption=BOULEVARD%20QUEEN
// Cover mode hides every editor control and lets the poster fill the window;
// editor mode keeps the full UI with a photo loaded.

function readParams() {
  return new URLSearchParams(window.location.search);
}

function waitForEditor() {
  return new Promise((resolve) => {
    const tick = () => {
      if (window.__viceCover) resolve(window.__viceCover);
      else setTimeout(tick, 25);
    };
    tick();
  });
}

async function applyShot() {
  const params = readParams();
  const shot = params.get("shot");
  if (!shot) return;
  const app = await waitForEditor();

  if (params.get("layout")) app.setLayout(params.get("layout"));
  if (params.get("grade")) app.setGrade(params.get("grade"));
  if (params.get("size")) app.setSize(params.get("size"));
  if (params.get("caption") !== null) {
    app.setCaption(params.get("caption"), params.get("sub") || "");
  }
  const photos = params.get("photos");
  if (photos) {
    const list = photos.split(",");
    app.state.panels.forEach((panel, i) => {
      if (list[i]) panel.photo = list[i];
    });
    app.render();
  } else if (params.get("photo")) {
    app.applyPhoto(params.get("photo"));
  }

  if (shot === "cover") {
    document.body.classList.add("shot-cover");
    document.getElementById("dropHint").style.display = "none";
    app.render();
    document.title = "VICE COVER — exported cover";
  }
  document.documentElement.dataset.shotReady = "true";
}

applyShot();
