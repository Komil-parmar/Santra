// Santra website: the live santra wheel, the hero fruit, entrances, FAQ cards, and download links.
// No libraries, no network requests. Everything still reads without script; the demo needs it.
(() => {
  "use strict";

  const SVG = "http://www.w3.org/2000/svg";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Wheel geometry in a 384 x 384 viewBox, the same proportions as the app's wheel.
  const C = 192, INNER = 60, OUTER = 156, PITH = 7, PEEL = 13, LIFT = 8;

  const ACTIONS = ["Share", "Float", "Copy", "Move", "Copy path", "Terminal"];
  const ACTION_NOTES = {
    Share: "opens the Windows share sheet, with Nearby Share",
    Float: "waits in an always-on-top tray until you drag it out",
    Copy: "is copied; paste it into any folder",
    Move: "goes to whichever folder you pick",
    "Copy path": "full path is on the clipboard",
    Terminal: "folder opens in Windows Terminal",
  };

  // Sample files. Window tools open their editor; quick tools save straight away.
  const FILES = [
    {
      name: "sunset.jpg", size: "2.4 MB", thumb: "media/sunset.jpg", kind: "photo",
      convert: ["PNG", "WEBP", "AVIF", "TIFF", "BMP", "GIF", "ICO", "PDF", "TXT", "DOCX"],
      tools: ["Compress", "Metadata", "Edit", "Annotate", "Add BG", "Crop", "Redact", "Read QR"],
      quick: { "Read QR": "has no QR code in it, so nothing was copied" },
    },
    {
      name: "evening.mp4", size: "18 MB", thumb: "media/evening.jpg", kind: "video",
      convert: ["MOV", "MKV", "WEBM", "AVI", "WMV", "GIF", "MP3", "M4A", "WAV"],
      tools: ["Compress", "Metadata", "Mute", "Trim", "Crop", "Speed", "Snapshot", "Split", "Redact"],
      quick: { Mute: "saved as evening Muted.mp4" },
    },
    {
      name: "podcast.m4a", size: "9.1 MB", thumb: null, kind: "audio",
      convert: ["MP3", "WAV", "FLAC", "OGG", "OPUS", "AIFF", "WMA"],
      tools: ["Compress", "Metadata", "Normalize", "Visualize", "Trim", "Channels", "Bleep"],
      quick: {},
    },
    {
      name: "notes.pdf", size: "640 KB", thumb: null, kind: "pdf",
      convert: ["DOCX", "PPTX", "XLSX", "JPG", "PNG", "EPUB", "TXT", "MD", "HTML"],
      tools: ["Compress", "Metadata", "Split", "Organize"],
      quick: { Split: "saved every page in a new folder, notes Pages" },
    },
    {
      name: "captions.srt", size: "4 KB", thumb: null, kind: "text",
      convert: ["VTT", "TXT"], tools: [], quick: {},
    },
  ];

  const WINDOW_NAMES = {
    Compress: "Compress", Metadata: "Metadata", Edit: "Edit Photo", Annotate: "Annotate Photo", "Add BG": "Add Background",
    Crop: "Crop", Redact: "Redact", Trim: "Trim", Speed: "Change Video Speed", Snapshot: "Video Snapshots", Split: "Split Video",
    Normalize: "Normalize Volume", Visualize: "Audio Visualizer", Channels: "Audio Channels", Bleep: "Bleep Audio", Organize: "Organize PDF",
  };

  const MODES = ["convert", "tools", "actions"];
  const KEY_FOR_MODE = { convert: "Shift", tools: "Control", actions: "Alt" };

  // ---------------------------------------------------------------------------------------------------------- drawing

  const el = (name, attrs = {}, parent) => {
    const node = document.createElementNS(SVG, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (parent) parent.appendChild(node);
    return node;
  };

  const rad = (deg) => (deg * Math.PI) / 180;
  const polar = (r, deg) => [C + r * Math.sin(rad(deg)), C - r * Math.cos(rad(deg))];
  const at = (radial, perp, deg) => [
    C + radial * Math.sin(rad(deg)) + perp * Math.cos(rad(deg)),
    C - radial * Math.cos(rad(deg)) + perp * Math.sin(rad(deg)),
  ];
  const pt = (p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;

  // One segment: straight membranes, the rind arc, and a rounded inner tip (a circle touching both membranes).
  function segmentPath(start, end, tip, outer, membrane) {
    const half = rad((end - start) / 2), d = membrane / 2;
    const rim = Math.sqrt(outer * outer - d * d);
    const large = end - start > 180 ? 1 : 0;
    let path = `M ${pt(at(rim, d, start))} A ${outer} ${outer} 0 ${large} 1 ${pt(at(rim, -d, end))}`;
    const s = (tip - d) / (1 - Math.sin(half));
    const a = s * Math.sin(half) - d;
    const foot = s * Math.cos(half);
    if (half < Math.PI / 2 && foot < outer - 24 && a > 4) {
      path += ` L ${pt(at(foot, -d, end))} A ${a.toFixed(2)} ${a.toFixed(2)} 0 0 1 ${pt(at(foot, d, start))} Z`;
    } else {
      const inner = Math.sqrt(tip * tip + d * d);
      path += ` L ${pt(at(tip, -d, end))} A ${inner.toFixed(2)} ${inner.toFixed(2)} 0 ${large} 0 ${pt(at(tip, d, start))} Z`;
    }
    return path;
  }

  // Deterministic randomness so every visit draws the same fruit.
  function random(seed) {
    let t = seed >>> 0;
    return () => {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Juice sacs: slim radial streaks inside a segment, clipped to it.
  function sacs(group, start, end, seed, clipId) {
    const rnd = random(seed * 7919 + 17);
    const span = end - start;
    const count = Math.round(Math.min(110, Math.max(30, span * 2.6)));
    const layer = el("g", { "clip-path": `url(#${clipId})`, class: "sacs" }, group);
    for (let i = 0; i < count; i++) {
      const r = INNER + 8 + Math.sqrt(rnd()) * (OUTER - INNER - 14);
      const margin = (6 / r) * (180 / Math.PI);
      const angle = start + margin + rnd() * Math.max(0.1, span - 2 * margin);
      const [x, y] = polar(r, angle);
      const len = 3.5 + rnd() * 8 * (r / OUTER);
      el("ellipse", {
        cx: x.toFixed(1), cy: y.toFixed(1), rx: (0.8 + rnd() * 1.1).toFixed(2), ry: len.toFixed(2),
        transform: `rotate(${angle.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})`,
        class: rnd() < 0.72 ? "sac" : "sac sac-dark",
      }, layer);
    }
  }

  let wheelCount = 0;

  /** Draws a santra wheel into an <svg>. Returns segments so callers can light one up. */
  function drawFruit(svg, labels, { id, labelled = true } = {}) {
    const uid = `w${id ?? wheelCount++}`;
    svg.replaceChildren();
    svg.setAttribute("viewBox", "0 0 384 384");
    const defs = el("defs", {}, svg);
    const peelR = OUTER + PITH + PEEL, pithR = OUTER + PITH;

    el("circle", { cx: C, cy: C, r: peelR, class: "peel" }, svg);
    const glands = el("g", { class: "glands" }, svg);
    const rnd = random(4242);
    for (let i = 0; i < 160; i++) {
      const [x, y] = polar(pithR + 1.5 + rnd() * (PEEL - 3), rnd() * 360);
      el("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: (0.5 + rnd() * 0.9).toFixed(2), class: rnd() < 0.62 ? "gland" : "gland gland-dark" }, glands);
    }
    el("circle", { cx: C, cy: C, r: pithR, class: "pith" }, svg);
    const fibres = el("g", { class: "fibres" }, svg);
    for (let i = 0; i < 30; i++) {
      const a = i * 12 + (rnd() * 6 - 3);
      const [x1, y1] = polar(INNER * (0.15 + rnd() * 0.2), a), [x2, y2] = polar(INNER * (0.75 + rnd() * 0.25), a);
      el("line", { x1, y1, x2, y2 }, fibres);
    }

    const n = Math.max(labels.length, 1);
    const span = 360 / n;
    const segments = [];
    const layer = el("g", { class: "segments" }, svg);
    for (let i = 0; i < labels.length; i++) {
      const start = i * span - span / 2, end = start + span, mid = start + span / 2;
      const g = el("g", { class: "segment" }, layer);
      const d = segmentPath(start, end, INNER + 2, OUTER, 4.5);
      const clip = el("clipPath", { id: `${uid}c${i}` }, defs);
      el("path", { d }, clip);
      el("path", { d, class: "flesh" }, g);
      sacs(g, start, end, i, `${uid}c${i}`);
      if (labelled) {
        const [x, y] = polar((INNER + OUTER) / 2, mid);
        const text = el("text", { x: x.toFixed(1), y: y.toFixed(1), class: n > 8 ? "label dense" : "label" }, g);
        text.textContent = labels[i];
      }
      const [dx, dy] = polar(LIFT, mid);
      segments.push({ g, mid, dx: dx - C, dy: dy - C });
    }
    if (!labels.length) {
      el("path", { d: `M ${C} ${C - OUTER + 2} A ${OUTER - 2} ${OUTER - 2} 0 1 1 ${C - 0.01} ${C - OUTER + 2} Z M ${C} ${C - INNER - 4} A ${INNER + 4} ${INNER + 4} 0 1 0 ${C + 0.01} ${C - INNER - 4} Z`, class: "flesh flesh-empty", "fill-rule": "evenodd" }, layer);
    }
    return segments;
  }

  function light(segments, index) {
    segments.forEach((s, i) => {
      const on = i === index;
      s.g.classList.toggle("lit", on);
      s.g.style.transform = on ? `translate(${s.dx.toFixed(2)}px, ${s.dy.toFixed(2)}px)` : "";
    });
  }

  function hitTest(svg, event, count) {
    if (!count) return -1;
    const box = svg.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * 384 - C;
    const y = ((event.clientY - box.top) / box.height) * 384 - C;
    const r = Math.hypot(x, y);
    if (r < INNER - 6 || r > OUTER + 24) return -1;
    const angle = ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
    const span = 360 / count;
    return Math.floor(((angle + span / 2) % 360) / span) % count;
  }

  // ------------------------------------------------------------------------------------------------------------- hero

  function hero() {
    const svg = document.querySelector("[data-hero-fruit]");
    if (!svg) return;
    const segments = drawFruit(svg, Array(10).fill(""), { id: "hero", labelled: false });
    let lit = 1;
    light(segments, lit);
    if (reduceMotion) return;
    // The signature move: the light drifts slowly from segment to segment, like a slice being offered.
    let timer = setInterval(step, 5600);
    function step() {
      lit = (lit + 3) % segments.length;
      light(segments, lit);
    }
    document.addEventListener("visibilitychange", () => {
      clearInterval(timer);
      if (!document.hidden) timer = setInterval(step, 5600);
    });
  }

  // ------------------------------------------------------------------------------------------------------------- demo

  function demo() {
    const root = document.querySelector("[data-demo]");
    if (!root) return;
    root.classList.add("live");
    const svg = root.querySelector("[data-wheel]");
    const hubImage = root.querySelector("[data-hub-image]");
    const hubGlyph = root.querySelector("[data-hub-glyph]");
    const hubSize = root.querySelector("[data-hub-size]");
    const caption = root.querySelector("[data-caption]");
    const fact = root.querySelector("[data-fact]");
    const result = root.querySelector("[data-result]");
    const fileButtons = [...root.querySelectorAll("[data-file]")];
    const modeButtons = [...root.querySelectorAll("[data-mode]")];

    const state = { file: 0, mode: "convert", lit: -1, segments: [], items: [] };

    function itemsFor(file, mode) {
      if (mode === "convert") return file.convert;
      if (mode === "tools") return file.tools;
      return ACTIONS;
    }

    function render() {
      const file = FILES[state.file];
      state.items = itemsFor(file, state.mode);
      state.segments = drawFruit(svg, state.items, { id: "demo" });
      state.lit = -1;
      fileButtons.forEach((b, i) => b.setAttribute("aria-pressed", String(i === state.file)));
      modeButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode)));
      hubImage.hidden = !file.thumb;
      if (file.thumb) hubImage.setAttribute("href", file.thumb);
      hubGlyph.textContent = file.thumb ? "" : file.name.split(".").pop().toUpperCase();
      hubSize.textContent = file.size;
      fact.textContent = `${file.convert.length} formats · ${file.tools.length || "no"} tools · ${ACTIONS.length} actions`;
      svg.setAttribute("aria-label", `${file.name}: ${state.mode} wheel with ${state.items.length || "no"} choices`);
      setCaption();
    }

    function setCaption() {
      const file = FILES[state.file];
      if (!state.items.length) {
        caption.textContent = `No ${state.mode} for ${file.name}. Tap Shift for Convert.`;
        return;
      }
      if (state.lit < 0) {
        caption.textContent = { convert: "Pick a format", tools: "Pick a tool", actions: "Pick an action" }[state.mode];
        return;
      }
      const item = state.items[state.lit];
      caption.textContent = state.mode === "convert" ? `Convert to ${item}` : WINDOW_NAMES[item] || item;
    }

    function highlight(index) {
      if (index === state.lit) return;
      state.lit = index;
      light(state.segments, index);
      setCaption();
    }

    function apply(index) {
      if (index < 0 || !state.items.length) return;
      highlight(index);
      const file = FILES[state.file], item = state.items[index];
      const stem = file.name.replace(/\.[^.]+$/, "");
      let text;
      if (state.mode === "convert") {
        const ext = item.toLowerCase();
        text = ext === file.name.split(".").pop() ? `${file.name} is already ${item}` : `Saved ${stem}.${ext === "jpg" && file.kind === "pdf" ? "jpg (one image per page)" : ext} next to ${file.name}`;
      } else if (state.mode === "tools") {
        text = file.quick[item] ? `${file.name} ${file.quick[item]}` : `The ${WINDOW_NAMES[item] || item} window opens for ${file.name}`;
      } else {
        text = item === "Copy path" ? `${file.name}'s ${ACTION_NOTES[item]}` : `${file.name} ${ACTION_NOTES[item]}`;
      }
      result.textContent = text;
      result.classList.remove("pop");
      void result.offsetWidth; // restart the little entrance
      result.classList.add("pop");
    }

    function setMode(mode) {
      if (mode === state.mode) return;
      state.mode = mode;
      render();
      if (root.contains(document.activeElement) && state.items.length) highlight(0);
    }

    fileButtons.forEach((b, i) => b.addEventListener("click", () => {
      state.file = i;
      render();
      result.textContent = "";
    }));
    modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

    svg.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") highlight(hitTest(svg, e, state.items.length)); });
    svg.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") highlight(-1); });
    svg.addEventListener("click", (e) => apply(hitTest(svg, e, state.items.length)));
    svg.addEventListener("keydown", (e) => {
      const n = state.items.length;
      if (!n) return;
      if (["ArrowRight", "ArrowDown"].includes(e.key)) { highlight((state.lit + 1 + n) % n); e.preventDefault(); }
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) { highlight((state.lit - 1 + n) % n); e.preventDefault(); }
      if (e.key === "Enter" || e.key === " ") { apply(Math.max(0, state.lit)); e.preventDefault(); }
      if (e.key === "Escape") highlight(-1);
    });
    svg.addEventListener("focus", () => { if (state.lit < 0 && state.items.length) highlight(0); });

    // A tap of Shift, Ctrl or Alt (pressed and released alone) switches wheels while the demo is in use.
    let pending = null, over = false;
    root.addEventListener("pointerenter", () => { over = true; });
    root.addEventListener("pointerleave", () => { over = false; });
    const active = () => over || root.contains(document.activeElement);
    addEventListener("keydown", (e) => {
      if (e.code === "Space" && e.ctrlKey && e.shiftKey) {
        // The real shortcut: jump to the demo with the wheel ready for the keyboard.
        e.preventDefault();
        root.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        svg.focus({ preventScroll: true });
        pending = null;
        return;
      }
      pending = ["Shift", "Control", "Alt"].includes(e.key) && !e.repeat ? e.key : null;
      if (e.key === "Alt" && active()) e.preventDefault();
    });
    addEventListener("keyup", (e) => {
      if (e.key !== pending) return;
      pending = null;
      if (!active()) return;
      if (e.key === "Alt") e.preventDefault();
      const mode = Object.keys(KEY_FOR_MODE).find((m) => KEY_FOR_MODE[m] === e.key);
      if (mode) setMode(mode);
    });

    render();
  }

  // -------------------------------------------------------------------------------------------------------- the rest

  // The video poster links to YouTube; pressing it swaps in the privacy-enhanced player, so nothing loads from
  // YouTube until someone chooses to watch.
  function video() {
    const link = document.querySelector("[data-youtube]");
    if (!link) return;
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const frame = document.createElement("iframe");
      frame.src = `https://www.youtube-nocookie.com/embed/${link.dataset.youtube}?autoplay=1&rel=0`;
      frame.title = "Santra in one minute";
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      link.replaceWith(frame);
      frame.focus();
    });
  }

  function entrances() {
    const targets = document.querySelectorAll("[data-enter]");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("in"));
      return;
    }
    document.documentElement.classList.add("motion");
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -12% 0px" });
    targets.forEach((t) => io.observe(t));
  }

  // Download links fetch the installer from this repository's latest GitHub release; the others point at the repo. On <owner>.github.io/<repo> they work
  // out the repository by themselves; on a custom domain set data-repo="owner/repo" on <html>.
  function links() {
    let repo = document.documentElement.dataset.repo || "";
    const host = location.hostname;
    if (host.endsWith(".github.io")) {
      const owner = host.split(".")[0];
      const first = location.pathname.split("/").filter(Boolean)[0];
      repo = `${owner}/${first || host}`;
    }
    if (!repo || repo.startsWith("OWNER/")) return;
    for (const a of document.querySelectorAll("[data-link]")) {
      const kind = a.dataset.link;
      a.href = `https://github.com/${repo}${kind === "download" ? "/releases/latest/download/Santra-win-Setup.exe" : kind === "issues" ? "/issues" : ""}`;
    }
  }

  hero();
  demo();
  video();
  entrances();
  links();
})();
