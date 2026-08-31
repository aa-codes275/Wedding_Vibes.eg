/* Wedding_Vibes.eg — single-file app logic (fast mobile build) */
const CDN = "assets/";
const MEDIA = [
  { type: "video", src: CDN + "IMG_2602.MP4" },
  { type: "video", src: CDN + "IMG_2601.MP4" },
  { type: "video", src: CDN + "IMG_2605.MP4" },

  { type: "photo", src: CDN + "photographer.jpg" },
  { type: "video", src: CDN + "v2.mp4" },
  { type: "video", src: CDN + "v3.mp4" },
  { type: "photo", src: CDN + "shot1.jpg" },
  { type: "video", src: CDN + "v4.mp4" },
  { type: "photo", src: CDN + "shot2.jpg" },
  { type: "video", src: CDN + "v5.mp4" },
  { type: "video", src: CDN + "v6.mp4" },
];

/* ---------- device / network hints ---------- */
const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const SLOW_NET = !!conn && (/(^|-)2g$/.test(conn.effectiveType || "") || conn.saveData === true);
const IS_MOBILE = matchMedia("(max-width:760px)").matches;
const idle = (fn) => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 200));

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
  cam_kicker: "CINEMA LINE • 4K HDR",
  cam_title: "The camera that tells your story",
  cam_hint: "Drag to spin the camera 360° — tap once for the flash and shutter sound, double-tap to take a shot.",
  shot: "📸 Shot captured!",
  book_title: "Book your event",
  lb_name: "Name", lb_type: "Event type", lb_date: "Date", lb_place: "Location", lb_notes: "More details",
  op1: "Wedding", op2: "Engagement", op3: "Katb Ketab", op4: "Birthday", op5: "Photo session", op6: "Production / Ad",
  send_wa: "Send booking on WhatsApp", contact: "Contact us", qr_t: "Scan for the website",
};
const AR = {};
function cacheAR() {
  document.querySelectorAll("[data-i18n]").forEach((el) => { AR[el.dataset.i18n] = el.textContent; });
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
  stopAllTileVideos();
  window.scrollTo({ top: 0, behavior: "auto" });
  if (id === "page-work") idle(buildGalleryOnce);
}
window.addEventListener("hashchange", route);

/* ---------- hero video: بعد ظهور الصفحة، ومش على النت البطيء ---------- */
function initHero() {
  const hero = document.querySelector(".hero");
  const v = document.getElementById("heroVideo");
  const poster = document.getElementById("heroPoster");
  if (poster) poster.addEventListener("error", () => { poster.src = CDN + "shot1.jpg"; }, { once: true });
  if (!v) return;
  if (SLOW_NET) return; // نكتفي بالصورة على النت الضعيف
  const start = () => {
    if (v.dataset.loaded) return;
    v.dataset.loaded = "1";
    v.src = v.dataset.src;
    v.load();
    v.addEventListener("loadeddata", () => {
      v.classList.add("ready");
      hero.classList.add("video-on");
      v.play().catch(() => {});
    }, { once: true });
  };
  if (document.readyState === "complete") idle(start);
  else window.addEventListener("load", () => idle(start), { once: true });

  // وقف الفيديو لما نبعد عن الهيرو = بطارية وأداء أفضل
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => es.forEach((e) => {
      if (!v.dataset.loaded) return;
      e.isIntersecting ? v.play().catch(() => {}) : v.pause();
    }), { threshold: 0.05 }).observe(hero);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) v.pause();
    else if (v.dataset.loaded && document.getElementById("page-home").classList.contains("active")) v.play().catch(() => {});
  });
}

/* ---------- gallery ---------- */
let galleryBuilt = false;
function buildGalleryOnce() { if (!galleryBuilt) { galleryBuilt = true; buildGallery(); } }
function stopAllTileVideos() {
  document.querySelectorAll("#gallery video").forEach((v) => { v.pause(); v.muted = true; });
}
function buildGallery(filter = "all") {
  const g = document.getElementById("gallery");
  if (!g) return;
  g.innerHTML = "";
  MEDIA.filter((m) => filter === "all" || m.type === filter).forEach((m) => {
    const t = document.createElement("figure");
    t.className = "tile";
    if (m.type === "video") {
      // preload=none + بوستر: مفيش تحميل ثقيل عند فتح الصفحة
      t.innerHTML = `<video muted loop playsinline preload="none" data-src="${m.src}"
        poster="${CDN}shot1.jpg" width="480" height="854"></video><span class="tag">VIDEO</span>`;
      const v = t.querySelector("video");
      const load = () => {
        if (v.dataset.loaded) return;
        v.dataset.loaded = "1";
        v.src = v.dataset.src;
      };
      if (!IS_MOBILE) {
        t.addEventListener("mouseenter", () => { load(); v.play().catch(() => {}); });
        t.addEventListener("mouseleave", () => v.pause());
      }
      if (!SLOW_NET && "IntersectionObserver" in window) {
        const io = new IntersectionObserver((es) => es.forEach((x) => {
          if (x.isIntersecting) { load(); v.play().catch(() => {}); }
          else v.pause();
        }), { threshold: 0.6 });
        io.observe(t);
      }
    } else {
      t.innerHTML = `<img src="${m.src}" alt="Wedding Vibes work" loading="lazy" decoding="async" /><span class="tag">PHOTO</span>`;
    }
    t.addEventListener("click", () => openLightbox(m));
    g.appendChild(t);
  });
}

/* ---------- lightbox: الفيديو يفتح ميوت + زر للصوت + يسكت عند الخروج ---------- */
let lb;
function closeLightbox() {
  if (!lb) return;
  const v = lb.querySelector("video");
  if (v) { v.muted = true; v.pause(); v.removeAttribute("src"); v.load(); }
  lb.classList.remove("open");
  lb.querySelector(".lb-body").innerHTML = "";
  stopAllTileVideos();
}
function openLightbox(m) {
  stopAllTileVideos();
  if (!lb) {
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `<span class="close">×</span><div class="lb-body"></div>`;
    lb.addEventListener("click", (e) => {
      if (e.target === lb || e.target.classList.contains("close")) closeLightbox();
    });
    document.body.appendChild(lb);
  }
  const body = lb.querySelector(".lb-body");
  if (m.type === "video") {
    body.innerHTML = `<video src="${m.src}" controls autoplay playsinline muted preload="auto"></video>
      <button class="lb-sound" type="button">🔇 ${lang === "en" ? "Tap for sound" : "اضغط لتشغيل الصوت"}</button>`;
    const v = body.querySelector("video");
    const btn = body.querySelector(".lb-sound");
    v.muted = true;
    v.play().catch(() => {});
    const sync = () => {
      btn.textContent = v.muted
        ? (lang === "en" ? "🔇 Tap for sound" : "🔇 اضغط لتشغيل الصوت")
        : (lang === "en" ? "🔊 Mute" : "🔊 كتم الصوت");
    };
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      v.muted = !v.muted;
      if (!v.muted) { v.volume = 1; v.play().catch(() => {}); }
      sync();
    });
    v.addEventListener("volumechange", sync);
    sync();
  } else {
    body.innerHTML = `<img src="${m.src}" alt="" />`;
  }
  lb.classList.add("open");
}
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) closeLightbox(); });

/* ---------- 3D cinematic camera (drag to spin, tap for flash) ---------- */
function initCamera() {
  const stage = document.getElementById("camStage");
  const cam = document.getElementById("cam3d");
  const flash = document.getElementById("flashOverlay");
  const lamp = document.getElementById("camLamp");
  const toast = document.getElementById("shotToast");
  if (!stage || !cam) return;

  let ry = 24, rx = -10, vel = 0, dragging = false, px = 0, py = 0, moved = 0, raf = 0, manual = false;

  const apply = () => { cam.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; };

  function loop() {
    raf = 0;
    if (!dragging) {
      vel *= 0.94;
      if (Math.abs(vel) > 0.02) { ry += vel; apply(); raf = requestAnimationFrame(loop); return; }
    } else {
      raf = requestAnimationFrame(loop);
    }
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  cam.addEventListener("pointerdown", (e) => {
    dragging = true; moved = 0; manual = true;
    cam.classList.add("manual", "grabbing");
    px = e.clientX; py = e.clientY;
    cam.setPointerCapture?.(e.pointerId);
    apply();
    kick();
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - px, dy = e.clientY - py;
    px = e.clientX; py = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    ry += dx * 0.5;
    rx = Math.max(-40, Math.min(30, rx - dy * 0.25));
    vel = dx * 0.5;
    apply();
  }, { passive: true });
  window.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    cam.classList.remove("grabbing");
    kick();
  });

  // إضاءة/ميلان خفيف مع السكرول (إحساس إعلان أبل)
  if ("IntersectionObserver" in window) {
    let visible = false;
    new IntersectionObserver((es) => es.forEach((x) => (visible = x.isIntersecting)), { threshold: 0.15 }).observe(stage);
    window.addEventListener("scroll", () => {
      if (!visible || manual || dragging) return;
      const r = stage.getBoundingClientRect();
      const p = 1 - Math.min(1, Math.max(0, (r.top + r.height / 2) / innerHeight));
      cam.style.setProperty("--w", "");
      stage.style.setProperty("--glow", p.toFixed(2));
    }, { passive: true });
  }

  /* shutter sound (WebAudio) */
  let ctx;
  function shutter() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      const burst = (t, dur, gainV) => {
        const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
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
    lamp.classList.add("on");
    setTimeout(() => { flash.classList.remove("fire"); lamp.classList.remove("on"); }, 110);
  }

  cam.addEventListener("click", (e) => {
    e.preventDefault();
    if (moved > 12) return; // كانت سحب مش ضغطة
    fireFlash(); shutter();
  });
  cam.addEventListener("dblclick", (e) => {
    e.preventDefault();
    fireFlash(); shutter();
    setTimeout(() => { fireFlash(); shutter(); }, 140);
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1600);
  });
}

/* ---------- booking -> WhatsApp ---------- */
const PHONE = "201103668641";
document.addEventListener("submit", (e) => {
  if (e.target.id !== "bookForm") return;
  e.preventDefault();
  const f = new FormData(e.target);
  const msg =
    lang === "en"
      ? `New booking request%0AName: ${f.get("name")}%0AType: ${f.get("type")}%0ADate: ${f.get("date")}%0ALocation: ${f.get("place") || "-"}%0ANotes: ${f.get("notes") || "-"}`
      : `طلب حجز جديد%0Aالاسم: ${f.get("name")}%0Aالمناسبة: ${f.get("type")}%0Aالتاريخ: ${f.get("date")}%0Aالمكان: ${f.get("place") || "-"}%0Aتفاصيل: ${f.get("notes") || "-"}`;
  window.open(`https://wa.me/${PHONE}?text=${msg}`, "_blank");
});

/* ---------- boot ---------- */
function boot() {
  cacheAR();
  document.getElementById("yr").textContent = new Date().getFullYear();
  document.getElementById("langBtn").addEventListener("click", () => setLang(lang === "ar" ? "en" : "ar"));
  document.querySelectorAll(".filters .chip").forEach((c) =>
    c.addEventListener("click", () => {
      document.querySelectorAll(".filters .chip").forEach((o) => o.classList.remove("active"));
      c.classList.add("active");
      galleryBuilt = true;
      buildGallery(c.dataset.filter);
    })
  );
  route();
  initHero();
  idle(() => { buildGalleryOnce(); initCamera(); });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
