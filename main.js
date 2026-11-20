const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Runs draw(t) at ~30 fps while the canvas is on screen and the tab is visible.
function animate(canvas, draw) {
  let visible = false, last = 0, raf = 0;
  const tick = t => {
    raf = 0;
    if (!visible || document.hidden) return;
    if (t - last > 33) { last = t; draw(t / 1000); }
    raf = requestAnimationFrame(tick);
  };
  const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(canvas);
  document.addEventListener("visibilitychange", start);
}

function fit(canvas, scale) {
  const w = Math.max(1, Math.round(canvas.clientWidth / scale));
  const h = Math.max(1, Math.round(canvas.clientHeight / scale));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  return [w, h];
}

// Tinsel curtain behind the hero TV
function tinsel(canvas) {
  const ctx = canvas.getContext("2d");
  const strands = Array.from({ length: 140 }, () => ({
    x: Math.random(), hue: Math.random() * 360, phase: Math.random() * 6.28, speed: .5 + Math.random(),
  }));
  const draw = t => {
    const [w, h] = fit(canvas, 2);
    ctx.clearRect(0, 0, w, h);
    for (const s of strands) {
      const sway = Math.sin(t * s.speed + s.phase) * 3;
      ctx.strokeStyle = `hsl(${s.hue} 90% 60%)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 0; y <= h; y += 8) {
        const x = s.x * w + sway * (y / h) + Math.sin(y * .05 + s.phase) * 1.5;
        y ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      if (Math.random() < .25) {
        const y = Math.random() * h;
        ctx.fillStyle = "#fff";
        ctx.fillRect(s.x * w + sway * (y / h) - 1, y - 1, 2, 2);
      }
    }
  };
  if (still) { fit(canvas, 2); draw(0); } else animate(canvas, draw);
}

// TV static during power-on
function snow(canvas) {
  const ctx = canvas.getContext("2d");
  canvas.width = 160; canvas.height = 90;
  const img = ctx.createImageData(160, 90);
  let frames = 0;
  const step = () => {
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    if (++frames < 60) requestAnimationFrame(step);
  };
  step();
}

// Game screens cycle while on screen: loading picture, flashing border, gameplay, repeat
function loadable(el) {
  const shot = new Image();
  shot.className = "shot";
  shot.alt = "Gameplay";
  shot.src = el.dataset.shot;
  el.append(shot);
  const frame = el.closest(".game__screen");
  if (still) { el.classList.add("loaded"); return; }
  const steps = [
    [1500, () => el.classList.remove("loaded")],
    [1600, () => frame.classList.add("loading")],
    [5000, () => { frame.classList.remove("loading"); el.classList.add("loaded"); }],
  ];
  let i = 0, timer = 0;
  const run = () => {
    const [ms, apply] = steps[i];
    apply();
    i = (i + 1) % steps.length;
    timer = setTimeout(run, ms);
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !timer) run();
    if (!e.isIntersecting && timer) { clearTimeout(timer); timer = 0; }
  }, { threshold: .6 }).observe(el);
}

// Big play button over the promo; native controls take over once it plays
document.querySelectorAll(".screen--video").forEach(screen => {
  const video = screen.querySelector("video");
  screen.querySelector(".play-btn").addEventListener("click", () => video.play().catch(() => {}));
  video.addEventListener("play", () => screen.classList.add("playing"));
});

document.querySelectorAll(".tinsel").forEach(tinsel);
if (!still) document.querySelectorAll(".snow").forEach(snow);
document.querySelectorAll(".loadable").forEach(loadable);
