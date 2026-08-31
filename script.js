/* Wedding_Vibes.eg — single-file app logic */
const CDN = "assets/";
const MEDIA = [
  { type: "video", src: CDN + "IMG_2602.MP4" },
  { type: "video", src: CDN + "IMG_2601.MP4" },
  { type: "video", src: CDN + "IMG_2605.MP4" },
  { type: "video", src: CDN + "IMG_2604.MP4" },
  { type: "video", src: CDN + "IMG_2603_(0).MP4" },

  { type: "photo", src: CDN + "photographer.jpg" },
  { type: "video", src: CDN + "v2.mp4" },
  { type: "video", src: CDN + "v3.mp4" },
  { type: "photo", src: CDN + "shot1.jpg" },
  { type: "video", src: CDN + "v4.mp4" },
  { type: "photo", src: CDN + "shot2.jpg" },
  { type: "video", src: CDN + "v5.mp4" },
  { type: "video", src: CDN + "v6.mp4" },
];

/* ---------- i18n ---------- */
const EN = {
  nav_home: "Home", nav_work: "Portfolio", nav_about: "About & Booking",
  kicker: "PHOTOGRAPHY • WEDDINGS • EVENTS • PRODUCTION",
  lede: "We tell the story of your day in image and sound — photography, cinematic video, editing and full production for every occasion.",
  cta_work: "View the work", cta_book: "Book on WhatsApp", scroll: "SCROLL",
  services_title: "Our Services",
  s1: "Wedding Coverage", s1d: "Katb ketab, wedding, henna and full-day coverage from start to finish.",
  s2: "Events", s2d: "Engagements, birthdays, graduations, conferences and corporate parties.",
  s3: "Cinematic Video", s3d: "Shot on Sony bodies and gimbals — smooth motion, cinematic color.",
  s4: "Art Production", s4d: "Ads, reels, social content and full creative direction.",
  s5: "Edit & Grading", s5d: "Fast turnaround, professional color grading and curated music.",
  s6: "Photo Sessions", s6d: "Outdoor or studio sessions, prints and premium albums.",
  work_title: "Portfolio", work_sub: "Selected videos and photos",
  f_all: "All", f_video: "Video", f_photo: "Photos",
  about_title: "About the Photographer",
  about_p1: "A photographer and videographer specialised in weddings, events and art production. Experienced in full-day coverage with professional cameras and gimbals, plus cinematic editing and grading that turns every frame into a memory.",
  about_p2: "My work is built on feeling before gear: I read the moment, wait for the real smile, and frame it so you come back to watch it every year.",
  st1: "Events", st2: "Years of experience", st3: "Capture quality",
  cam_title: "Try the camera",
  cam_hint: "Drag the camera anywhere — tap once for the flash and shutter sound, double-tap to take a shot.",
  shot: "📸 Shot captured!",
  book_title: "Book your event",
  lb_name: "Name", lb_type: "Event type", lb_date: "Date", lb_place: "Location", lb_notes: "More details",
  op1: "Wedding", op2: "Engagement", op3: "Katb Ketab", op4: "Birthday", op5: "Photo session", op6: "Production / Ad",
  send_wa: "Send booking on WhatsApp", contact: "Contact us", qr_t: "Scan for the website",
};
const AR = {};
function cacheAR() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    AR[el.dataset.i18n] = el.textContent;
  });
}
let lang = "ar";
function setLang(l) {
  lang = l;
  const dict = l === "en" ? EN : AR;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = dict[el.dataset.i18n];
    if (v) el.textContent = v;
  });
  document.documentElement.lang = l;
  document.documentElement.dir = l === "en" ? "ltr" : "rtl";
  document.getElementById("langBtn").textContent = l === "en" ? "ع" : "EN";
}

/* ---------- router ---------- */
const pages = { "/": "page-home", "/work": "page-work", "/about": "page-about" };
function route() {
  const path = (location.hash.replace("#", "") || "/").split("?")[0];
  const id = pages[path] || "page-home";
  document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === id));
  document.querySelectorAll(".links a").forEach((a) => a.classList.toggle("active", a.dataset.nav === path));
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}
window.addEventListener("hashchange", route);

/* ---------- gallery ---------- */
function buildGallery(filter = "all") {
  const g = document.getElementById("gallery");
  g.innerHTML = "";
  MEDIA.filter((m) => filter === "all" || m.type === filter).forEach((m) => {
    const t = document.createElement("figure");
    t.className = "tile";
    t.innerHTML =
      m.type === "video"
        ? `<video src="${m.src}" muted loop playsinline preload="metadata"></video><span class="tag">VIDEO</span>`
        : `<img src="${m.src}" alt="Wedding Vibes work" loading="lazy" /><span class="tag">PHOTO</span>`;
    if (m.type === "video") {
      const v = t.querySelector("video");
      t.addEventListener("mouseenter", () => v.play().catch(() => {}));
      t.addEventListener("mouseleave", () => v.pause());
      const io = new IntersectionObserver((e) => e.forEach((x) => (x.isIntersecting ? v.play().catch(() => {}) : v.pause())), { threshold: 0.5 });
      io.observe(t);
    }
    t.addEventListener("click", () => openLightbox(m));
    g.appendChild(t);
  });
}
function openLightbox(m) {
  let lb = document.querySelector(".lightbox");
  if (!lb) {
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `<span class="close">×</span><div class="lb-body"></div>`;
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.className === "close") lb.classList.remove("open"); });
    document.body.appendChild(lb);
  }
  lb.querySelector(".lb-body").innerHTML =
    m.type === "video"
      ? `<video src="${m.src}" controls autoplay playsinline></video>`
      : `<img src="${m.src}" alt="" />`;
  lb.classList.add("open");
}

/* ---------- interactive HD camera ---------- */
function initCamera() {
  const stage = document.getElementById("camStage");
  const cam = document.getElementById("cam");
  const flash = document.getElementById("flashOverlay");
  const flashLamp = cam.querySelector(".cam-flash");
  const toast = document.getElementById("shotToast");
  if (!stage || !cam) return;

  let x = 0, y = 0, vx = 0, vy = 0, tilt = 0, dragging = false, px = 0, py = 0;

  const apply = () => { cam.style.transform = `translate(${x}px, ${y}px) rotate(${tilt}deg)`; };

  const bounds = () => {
    const s = stage.getBoundingClientRect(), c = cam.getBoundingClientRect();
    return { maxX: (s.width - c.width) / 2 - 8, maxY: (s.height - c.height) / 2 - 8 };
  };

  function down(e) {
    dragging = true;
    const p = e.touches ? e.touches[0] : e;
    px = p.clientX; py = p.clientY;
    cam.setPointerCapture?.(e.pointerId);
  }
  function move(e) {
    if (!dragging) return;
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - px, dy = p.clientY - py;
    px = p.clientX; py = p.clientY;
    const b = bounds();
    x = Math.max(-b.maxX, Math.min(b.maxX, x + dx));
    y = Math.max(-b.maxY, Math.min(b.maxY, y + dy));
    vx = dx; vy = dy;
    tilt = Math.max(-24, Math.min(24, dx * 1.6));
    apply();
  }
  function up() { dragging = false; }

  cam.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", move, { passive: false });
  window.addEventListener("pointerup", up);

  // inertia + tilt easing
  (function loop() {
    if (!dragging) {
      const b = bounds();
      vx *= 0.92; vy *= 0.92;
      if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
        x = Math.max(-b.maxX, Math.min(b.maxX, x + vx));
        y = Math.max(-b.maxY, Math.min(b.maxY, y + vy));
      }
      tilt *= 0.9;
      apply();
    }
    requestAnimationFrame(loop);
  })();

  // shutter sound (WebAudio, no asset needed)
  let ctx;
  function shutter() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const burst = (t, dur, gainV) => {
        const b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
        const s = ctx.createBufferSource(); s.buffer = b;
        const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2600;
        const g = ctx.createGain(); g.gain.value = gainV;
        s.connect(f).connect(g).connect(ctx.destination);
        s.start(t);
      };
      burst(now, 0.045, 0.5);
      burst(now + 0.09, 0.06, 0.35);
    } catch (_) {}
  }

  function fireFlash() {
    flash.classList.add("fire");
    flashLamp.classList.add("on");
    setTimeout(() => { flash.classList.remove("fire"); flashLamp.classList.remove("on"); }, 110);
  }

  cam.addEventListener("click", (e) => { e.preventDefault(); fireFlash(); shutter(); });
  cam.addEventListener("dblclick", (e) => {
    e.preventDefault();
    fireFlash(); shutter();
    setTimeout(() => { fireFlash(); shutter(); }, 140);
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1600);
  });
}

/* ---------- booking -> WhatsApp ---------- */
const PHONE = "201002285305";
document.addEventListener("submit", (e) => {
  if (e.target.id !== "bookForm") return;
  e.preventDefault();
  const f = new FormData(e.target);
  const msg =
    (lang === "en"
      ? `New booking request%0AName: ${f.get("name")}%0AType: ${f.get("type")}%0ADate: ${f.get("date")}%0ALocation: ${f.get("place") || "-"}%0ANotes: ${f.get("notes") || "-"}`
      : `طلب حجز جديد%0Aالاسم: ${f.get("name")}%0Aالمناسبة: ${f.get("type")}%0Aالتاريخ: ${f.get("date")}%0Aالمكان: ${f.get("place") || "-"}%0Aتفاصيل: ${f.get("notes") || "-"}`);
  window.open(`https://wa.me/${PHONE}?text=${msg}`, "_blank");
});

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  cacheAR();
  document.getElementById("yr").textContent = new Date().getFullYear();
  document.getElementById("langBtn").addEventListener("click", () => setLang(lang === "ar" ? "en" : "ar"));
  document.querySelectorAll(".filters .chip").forEach((c) =>
    c.addEventListener("click", () => {
      document.querySelectorAll(".filters .chip").forEach((o) => o.classList.remove("active"));
      c.classList.add("active");
      buildGallery(c.dataset.filter);
    })
  );
  buildGallery();
  initCamera();
  route();

  // تشغيل فيديو الهيرو فوراً بدون أي تأخير
  const v = document.getElementById("heroVideo");
  v && v.play().catch(() => {});
});
