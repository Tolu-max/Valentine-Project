const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  name: "",
  status: "",
  to: "",
  msg: "",
};

const bound = {
  generator: false,
  receiver: false,
  theme: false,
  intro: false,
  bgParallax: false,
};

function isLowPerfDevice() {
  const cores = Number(navigator.hardwareConcurrency || 8);
  const mem = Number(navigator.deviceMemory || 8);
  const isCoarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  return mem <= 4 || cores <= 4 || (isCoarse && (mem <= 6 || cores <= 6));
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function safeText(value, fallback = "") {
  const v = (value ?? "").toString().trim();
  return v.length ? v : fallback;
}

function clampLen(str, max) {
  const s = (str ?? "").toString();
  return s.length > max ? s.slice(0, max) : s;
}

function setHidden(el, hidden) {
  if (!el) return;
  el.hidden = hidden;
  el.setAttribute("aria-hidden", hidden ? "true" : "false");
}

function showToast(text) {
  const toast = qs("#toast");
  if (!toast) return;
  toast.textContent = text;
  setHidden(toast, false);
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => setHidden(toast, true), 1600);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("von.theme", theme);
  } catch {}
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme || "dark";
  setTheme(current === "dark" ? "light" : "dark");
}

function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem("von.theme");
  } catch {}
  if (saved === "light" || saved === "dark") {
    setTheme(saved);
    return;
  }
  const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  setTheme(prefersLight ? "light" : "dark");
}

function buildFloatingHearts() {
  const host = qs("#hearts");
  if (!host) return;
  host.innerHTML = "";

  const count = prefersReducedMotion() ? 8 : isLowPerfDevice() ? 12 : 18;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "heart";
    const size = `${10 + Math.random() * (isLowPerfDevice() ? 20 : 28)}px`;
    const x = `${Math.random() * 100}vw`;
    const o = (0.18 + Math.random() * 0.5).toFixed(2);
    const rot = `${-25 + Math.random() * 50}deg`;
    const dur = `${(isLowPerfDevice() ? 12 : 9) + Math.random() * 10}s`;
    const delay = `${-(Math.random() * 12)}s`;
    const blur = `${isLowPerfDevice() ? 0 : Math.random() * 1.2}px`;

    el.style.setProperty("--size", size);
    el.style.setProperty("--x", x);
    el.style.setProperty("--o", o);
    el.style.setProperty("--rot", rot);
    el.style.setProperty("--dur", dur);
    el.style.setProperty("--delay", delay);
    el.style.setProperty("--blur", blur);
    host.appendChild(el);
  }
}

function setActiveScreen(name) {
  const current = qs(".screen.is-active");
  const next = qs(`.screen[data-screen="${name}"]`);
  if (!next) return;
  if (current && current === next) {
    updateProgress(name);
    return;
  }

  const all = qsa(".screen");
  if (prefersReducedMotion()) {
    for (const s of all) {
      const isTarget = s === next;
      s.classList.toggle("is-active", isTarget);
      s.classList.remove("is-exiting", "is-entering");
      s.setAttribute("aria-hidden", isTarget ? "false" : "true");
    }
    updateProgress(name);
    return;
  }

  for (const s of all) {
    if (s !== next && s !== current) {
      s.classList.remove("is-active", "is-exiting", "is-entering");
      s.setAttribute("aria-hidden", "true");
    }
  }

  if (current) {
    current.classList.add("is-exiting");
    current.classList.remove("is-entering");
    current.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
      current.classList.remove("is-active", "is-exiting");
    }, 240);
  }

  next.classList.add("is-active");
  next.classList.remove("is-exiting");
  next.classList.add("is-entering");
  next.setAttribute("aria-hidden", "false");
  window.setTimeout(() => next.classList.remove("is-entering"), 460);
  updateProgress(name);
}

function wait(ms) {
  return new Promise((r) => window.setTimeout(r, ms));
}

async function runTypewriterIntro() {
  const screen = qs("#screen-welcome");
  if (!screen) return;

  const title = qs(".title", screen);
  const question = qs(".sub:not(.sub--hint)", screen);
  const nameInput = qs("#nameInput");

  if (!title || !question) return;

  const hiText = "Hi 👋";
  const qText = "What’s your name?";

  screen.classList.add("is-intro");
  screen.classList.remove("is-intro-done");

  title.textContent = "";
  question.textContent = "";

  const cursor = document.createElement("span");
  cursor.className = "type-cursor";

  async function typeInto(el, text) {
    el.textContent = "";
    el.appendChild(cursor);
    for (const ch of text) {
      el.insertBefore(document.createTextNode(ch), cursor);
      await wait(34 + Math.random() * 20);
    }
  }

  await typeInto(title, hiText);
  await wait(160);
  await typeInto(question, qText);
  await wait(220);
  cursor.remove();

  screen.classList.add("is-intro-done");
  window.setTimeout(() => nameInput && nameInput.focus(), 60);
}

function initIntroTypewriterOnce() {
  if (bound.intro) return;
  bound.intro = true;

  const screen = qs("#screen-welcome");
  if (!screen) return;

  const title = qs(".title", screen);
  const question = qs(".sub:not(.sub--hint)", screen);
  if (!title || !question) return;

  if (prefersReducedMotion()) {
    title.textContent = "Hi 👋";
    question.textContent = "What’s your name?";
    screen.classList.add("is-intro", "is-intro-done");
    const nameInput = qs("#nameInput");
    window.setTimeout(() => nameInput && nameInput.focus(), 0);
    return;
  }

  runTypewriterIntro();
}

function initBackgroundParallaxOnce() {
  if (bound.bgParallax) return;
  bound.bgParallax = true;
  if (prefersReducedMotion()) return;
  if (!window.matchMedia || !window.matchMedia("(pointer: fine)").matches) return;

  const root = document.documentElement;
  let tx = 0;
  let ty = 0;
  let raf = 0;

  function apply() {
    raf = 0;
    root.style.setProperty("--bgx", `${tx.toFixed(2)}px`);
    root.style.setProperty("--bgy", `${ty.toFixed(2)}px`);
    root.style.setProperty("--bgx2", `${(-tx * 0.55).toFixed(2)}px`);
    root.style.setProperty("--bgy2", `${(-ty * 0.55).toFixed(2)}px`);
  }

  function onMove(e) {
    const x = e.clientX / Math.max(1, window.innerWidth) - 0.5;
    const y = e.clientY / Math.max(1, window.innerHeight) - 0.5;
    tx = x * 10;
    ty = y * 8;
    if (!raf) raf = window.requestAnimationFrame(apply);
  }

  function reset() {
    tx = 0;
    ty = 0;
    if (!raf) raf = window.requestAnimationFrame(apply);
  }

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerleave", reset, { passive: true });
  window.addEventListener("blur", reset, { passive: true });
}

function initMicroInteractions() {
  const card = qs(".card");
  if (card && !prefersReducedMotion()) {
    const maxTilt = 6;

    function setFromPointer(e) {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const tiltY = (px - 0.5) * (maxTilt * 2);
      const tiltX = -(py - 0.5) * (maxTilt * 2);

      card.style.setProperty("--tiltX", `${tiltX.toFixed(2)}deg`);
      card.style.setProperty("--tiltY", `${tiltY.toFixed(2)}deg`);
      card.style.setProperty("--mx", `${Math.round(px * 100)}%`);
      card.style.setProperty("--my", `${Math.round(py * 100)}%`);
    }

    card.addEventListener("pointerenter", () => card.classList.add("is-hovered"));
    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-hovered");
      card.style.setProperty("--tiltX", "0deg");
      card.style.setProperty("--tiltY", "0deg");
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "30%");
    });
    card.addEventListener("pointermove", setFromPointer);
  }

  document.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest(".btn") : null;
    if (!btn) return;
    if (btn.disabled) return;
    if (prefersReducedMotion()) return;

    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const d = Math.max(r.width, r.height) * 1.35;

    const ripple = document.createElement("span");
    ripple.className = "btn__ripple";
    ripple.style.setProperty("--x", `${x}px`);
    ripple.style.setProperty("--y", `${y}px`);
    ripple.style.setProperty("--d", `${d}px`);
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  });
}

function updateProgress(screenName) {
  const progress = qs("#progressBar");
  if (!progress) return;

  const mapping = {
    welcome: "25%",
    status: "50%",
    generate: "75%",
    receiver: "100%",
  };
  progress.style.width = mapping[screenName] || "25%";
}

function statusLabel(status) {
  if (status === "taken") return "Taken";
  if (status === "single") return "Single";
  if (status === "complicated") return "It’s complicated";
  return "—";
}

function buildAskUrl({ from, to, status, msg }) {
  const params = new URLSearchParams();
  params.set("from", clampLen(from, 30));
  if (to) params.set("to", clampLen(to, 30));
  if (status) params.set("status", status);
  if (msg) params.set("msg", clampLen(msg, 140));

  const base = new URL(window.location.href);
  base.search = params.toString();
  base.hash = "";
  return base.toString();
}

async function copyToClipboard(text) {
  const value = (text ?? "").toString();
  if (!value) return false;

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

function shareWhatsApp(url, from, to) {
  const toPart = to ? ` to ${to}` : "";
  const message = `Hey${toPart}! 💘\n\n${from} made a tiny love link for you:\n${url}\n\nOpen it and answer honestly 😭`;
  const wa = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(wa, "_blank", "noopener,noreferrer");
}

function shareX(url, from, to) {
  const toPart = to ? `, ${to}` : "";
  const text = `Valentine or Nah? 💘\n${from} is asking you something${toPart}...\n${url}`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(x, "_blank", "noopener,noreferrer");
}

function confettiBurst() {
  if (typeof confetti !== "function") return;
  if (prefersReducedMotion()) return;

  const colors = ["#ff3ea5", "#ff6b6b", "#ffd6e8", "#ffffff"];
  confetti({
    particleCount: 140,
    spread: 70,
    origin: { y: 0.65 },
    scalar: 1.05,
    colors,
  });
  window.setTimeout(() => {
    confetti({
      particleCount: 70,
      spread: 110,
      origin: { y: 0.45 },
      scalar: 0.95,
      colors,
    });
  }, 120);
}

function pulseHearts() {
  if (prefersReducedMotion()) return;
  const host = qs("#hearts");
  if (!host) return;
  host.style.filter = "drop-shadow(0 0 22px rgba(255, 62, 165, 0.35))";
  window.clearTimeout(pulseHearts._t);
  pulseHearts._t = window.setTimeout(() => {
    host.style.filter = "";
  }, 800);
}

function burstEmojiHearts(anchorEl) {
  if (prefersReducedMotion()) return;
  if (!anchorEl) return;

  const r = anchorEl.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "0";
  host.style.top = "0";
  host.style.width = "100%";
  host.style.height = "100%";
  host.style.pointerEvents = "none";
  host.style.zIndex = "20";
  document.body.appendChild(host);

  const count = 10;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.textContent = Math.random() < 0.22 ? "💘" : "💗";
    p.style.position = "absolute";
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    p.style.fontSize = `${14 + Math.random() * 18}px`;
    p.style.filter = "drop-shadow(0 12px 22px rgba(255, 62, 165, 0.22))";

    const angle = (-110 + Math.random() * 220) * (Math.PI / 180);
    const dist = 70 + Math.random() * 110;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - (20 + Math.random() * 40);
    const rot = -40 + Math.random() * 80;
    const dur = 720 + Math.random() * 260;

    p.animate(
      [
        { transform: "translate3d(0,0,0) scale(0.75)", opacity: 0 },
        { transform: "translate3d(0,0,0) scale(1)", opacity: 1, offset: 0.12 },
        { transform: `translate3d(${dx}px, ${dy}px, 0) rotate(${rot}deg) scale(1.02)`, opacity: 0 },
      ],
      { duration: dur, easing: "cubic-bezier(0.2, 0.9, 0.2, 1)", fill: "forwards" },
    );

    host.appendChild(p);
    window.setTimeout(() => p.remove(), dur + 40);
  }

  window.setTimeout(() => host.remove(), 1100);
}

function renderReceiver(params) {
  const from = safeText(params.get("from"), "Someone");
  const to = safeText(params.get("to"), "friend");
  const msg = safeText(params.get("msg"), "");
  const status = safeText(params.get("status"), "");

  state.name = from;
  state.to = to;
  state.status = status;
  state.msg = msg;

  qs("#receiverFrom").textContent = from;
  qs("#receiverIntro").textContent = `${from} is asking you something…`;

  setActiveScreen("receiver");
  const receiverScreen = qs("#screen-receiver");
  if (receiverScreen) {
    receiverScreen.classList.remove("is-reveal");
    void receiverScreen.offsetWidth;
    receiverScreen.classList.add("is-reveal");
  }

  const qEl = qs("#receiverQuestion");
  const msgEl = qs("#receiverMsg");
  const actions = qs("#receiverActions");

  setHidden(qEl, true);
  setHidden(msgEl, true);
  setHidden(actions, true);

  window.setTimeout(() => {
    setHidden(qEl, false);
    setHidden(actions, false);
    if (actions) {
      actions.classList.remove("is-pop");
      void actions.offsetWidth;
      actions.classList.add("is-pop");
      window.setTimeout(() => actions.classList.remove("is-pop"), 520);
    }
    if (msg) {
      msgEl.textContent = `“${msg}”`;
      setHidden(msgEl, false);
    }
  }, prefersReducedMotion() ? 0 : 1000);
}

function showOutcome({ kind }) {
  const outcome = qs("#outcome");
  const emoji = qs("#outcomeEmoji");
  const title = qs("#outcomeTitle");
  const text = qs("#outcomeText");
  const actions = qs("#outcomeActions");

  const from = safeText(state.name, "Someone");
  const to = safeText(state.to, "bestie");

  setHidden(outcome, false);
  outcome.dataset.kind = kind;
  outcome.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });

  actions.innerHTML = "";

  if (kind === "yes") {
    emoji.textContent = "💘";
    title.textContent = "Yay!";
    text.textContent = `Yay! You just made ${from} happy 💘`;
    confettiBurst();
    pulseHearts();

    const btn = document.createElement("button");
    btn.className = "btn btn--primary";
    btn.type = "button";
    btn.id = "shareOwnBtnInline";
    btn.innerHTML = `Make my own link<span class="btn__spark" aria-hidden="true"></span>`;
    btn.addEventListener("click", () => {
      window.history.replaceState({}, "", window.location.pathname);
      initGeneratorUI();
      setActiveScreen("welcome");
      qs("#nameInput").focus();
    });
    actions.appendChild(btn);
    return;
  }

  emoji.textContent = "🙃";
  title.textContent = "Fair enough";
  text.textContent = `Fair enough 😄 Consent is king/queen. ${from} appreciates the honesty.`;

  const replyBtn = document.createElement("button");
  replyBtn.className = "btn btn--primary";
  replyBtn.type = "button";
  replyBtn.textContent = "Send a kind reply";
  replyBtn.addEventListener("click", async () => {
    const reply = `Hey ${from} 💛 Thanks for asking — I’m going to pass, but you’re amazing.`;
    const ok = await copyToClipboard(reply);
    showToast(ok ? "Reply copied ✨" : "Couldn’t copy (still sending good vibes)");
  });
  actions.appendChild(replyBtn);
}

function resetGeneratorForm() {
  state.name = "";
  state.status = "";
  state.to = "";
  state.msg = "";

  const nameInput = qs("#nameInput");
  const toInput = qs("#toInput");
  const msgInput = qs("#msgInput");
  const linkResult = qs("#linkResult");
  const generatedUrl = qs("#generatedUrl");
  const toGenerateBtn = qs("#toGenerateBtn");
  const nameError = qs("#nameError");
  const statusConfirm = qs("#statusConfirm");
  const statusError = qs("#statusError");
  const options = qs(".options");
  const nameField = nameInput ? nameInput.closest(".field") : null;

  if (nameInput) nameInput.value = "";
  if (toInput) toInput.value = "";
  if (msgInput) msgInput.value = "";

  setHidden(linkResult, true);
  if (generatedUrl) generatedUrl.value = "";
  if (nameError) setHidden(nameError, true);
  if (statusConfirm) setHidden(statusConfirm, true);
  if (statusError) setHidden(statusError, true);
  if (options) options.classList.remove("is-error");
  if (nameField) nameField.classList.remove("is-error");

  const statusButtons = qsa("[data-status]");
  for (const b of statusButtons) b.setAttribute("aria-checked", "false");
  if (toGenerateBtn) toGenerateBtn.disabled = true;

  const chip = qs("#statusChip");
  if (chip) chip.textContent = "status: —";
}

function bindGeneratorOnce() {
  if (bound.generator) return;
  bound.generator = true;

  const nameInput = qs("#nameInput");
  const toStatusBtn = qs("#toStatusBtn");
  const backToWelcomeBtn = qs("#backToWelcomeBtn");
  const toGenerateBtn = qs("#toGenerateBtn");
  const backToStatusBtn = qs("#backToStatusBtn");
  const generateLinkBtn = qs("#generateLinkBtn");
  const toInput = qs("#toInput");
  const msgInput = qs("#msgInput");
  const linkResult = qs("#linkResult");
  const generatedUrl = qs("#generatedUrl");
  const copyBtn = qs("#copyBtn");
  const waBtn = qs("#waBtn");
  const xBtn = qs("#xBtn");
  const startOverBtn = qs("#startOverBtn");
  const nameEcho = qs("#nameEcho");
  const statusButtons = qsa("[data-status]");
  const nameError = qs("#nameError");
  const statusConfirm = qs("#statusConfirm");
  const statusError = qs("#statusError");
  const options = qs(".options");
  const nameField = nameInput ? nameInput.closest(".field") : null;

  function clearNameError() {
    if (nameError) setHidden(nameError, true);
    if (nameField) nameField.classList.remove("is-error");
  }

  function showNameError() {
    if (nameError) setHidden(nameError, false);
    if (nameField) {
      nameField.classList.remove("is-error");
      void nameField.offsetWidth;
      nameField.classList.add("is-error");
    }
  }

  function clearStatusError() {
    if (statusError) setHidden(statusError, true);
    if (options) options.classList.remove("is-error");
  }

  function showStatusError() {
    if (statusError) setHidden(statusError, false);
    if (options) {
      options.classList.remove("is-error");
      void options.offsetWidth;
      options.classList.add("is-error");
    }
  }

  function goStatus() {
    state.name = safeText(nameInput.value, "");
    if (!state.name) {
      nameInput.focus();
      showNameError();
      showToast("Drop your name first ✨");
      return;
    }
    clearNameError();
    nameEcho.textContent = state.name;
    setActiveScreen("status");
  }

  function goWelcome() {
    setActiveScreen("welcome");
    window.setTimeout(() => nameInput.focus(), prefersReducedMotion() ? 0 : 220);
  }

  function goGenerate() {
    if (!state.status) {
      showStatusError();
      showToast("Pick a status (for the plot) 💞");
      return;
    }
    clearStatusError();
    setActiveScreen("generate");
    window.setTimeout(() => toInput.focus(), prefersReducedMotion() ? 0 : 220);
  }

  function onStatusPick(btn) {
    const value = btn.dataset.status;
    state.status = value;
    for (const b of statusButtons) b.setAttribute("aria-checked", b === btn ? "true" : "false");
    toGenerateBtn.disabled = false;
    qs("#statusChip").textContent = `status: ${statusLabel(value)}`;
    clearStatusError();
    if (!prefersReducedMotion()) {
      btn.classList.remove("is-bounce");
      void btn.offsetWidth;
      btn.classList.add("is-bounce");
      window.setTimeout(() => btn.classList.remove("is-bounce"), 520);
    }
    if (statusConfirm) {
      setHidden(statusConfirm, false);
      statusConfirm.style.animation = "none";
      void statusConfirm.offsetWidth;
      statusConfirm.style.animation = "";
    }
  }

  toStatusBtn.addEventListener("click", goStatus);
  backToWelcomeBtn.addEventListener("click", goWelcome);
  toGenerateBtn.addEventListener("click", goGenerate);
  backToStatusBtn.addEventListener("click", () => setActiveScreen("status"));

  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goStatus();
    }
  });

  nameInput.addEventListener("input", clearNameError);

  for (const btn of statusButtons) {
    btn.addEventListener("click", () => onStatusPick(btn));
  }

  generateLinkBtn.addEventListener("click", () => {
    state.name = safeText(nameInput.value, "");
    state.to = safeText(toInput.value, "");
    state.msg = safeText(msgInput.value, "");

    if (!state.name) {
      setActiveScreen("welcome");
      nameInput.focus();
      showNameError();
      showToast("Name first ✨");
      return;
    }

    if (!state.status) {
      setActiveScreen("status");
      showStatusError();
      showToast("Pick a status (for the plot) 💞");
      return;
    }

    const url = buildAskUrl({
      from: state.name,
      to: state.to,
      status: state.status,
      msg: state.msg,
    });

    generatedUrl.value = url;
    setHidden(linkResult, false);
    showToast("Link generated 💘");

    copyBtn.onclick = async () => {
      const ok = await copyToClipboard(url);
      showToast(ok ? "Link copied ✅" : "Couldn’t copy");
    };
    waBtn.onclick = () => shareWhatsApp(url, state.name, state.to);
    xBtn.onclick = () => shareX(url, state.name, state.to);
  });

  if (startOverBtn) {
    startOverBtn.addEventListener("click", () => {
      window.history.replaceState({}, "", window.location.pathname);
      initGeneratorUI();
      setActiveScreen("welcome");
      window.setTimeout(() => nameInput.focus(), prefersReducedMotion() ? 0 : 120);
    });
  }
}

function initGeneratorUI() {
  bindGeneratorOnce();
  resetGeneratorForm();
}

function initReceiverUI(params) {
  renderReceiver(params);

  const yesBtn = qs("#yesBtn");
  const noBtn = qs("#noBtn");
  const qEl = qs("#receiverQuestion");
  const actions = qs("#receiverActions");

  if (bound.receiver) return;
  bound.receiver = true;

  let noDodges = 0;
  const maxDodges = 4;

  function pickDodgeTransform() {
    const rect = noBtn.getBoundingClientRect();
    const margin = 10;
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    for (let i = 0; i < 10; i++) {
      const dx = Math.round((Math.random() * 2 - 1) * 90);
      const dy = Math.round((Math.random() * 2 - 1) * 60);
      const next = { left: rect.left + dx, right: rect.right + dx, top: rect.top + dy, bottom: rect.bottom + dy };
      const ok =
        next.left >= margin &&
        next.top >= margin &&
        next.right <= viewW - margin &&
        next.bottom <= viewH - margin;
      if (ok) return { dx, dy };
    }

    return { dx: 0, dy: 0 };
  }

  function maybeDodge(e) {
    if (prefersReducedMotion()) return;
    if (noDodges >= maxDodges) return;
    if (e && e.type === "pointerdown") e.preventDefault();

    noDodges += 1;
    const { dx, dy } = pickDodgeTransform();
    noBtn.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    noBtn.classList.remove("is-teleporting");
    void noBtn.offsetWidth;
    noBtn.classList.add("is-teleporting");
    window.setTimeout(() => noBtn.classList.remove("is-teleporting"), 380);
    if (noDodges >= maxDodges) {
      window.setTimeout(() => {
        noBtn.style.transform = "";
      }, 260);
    }
  }

  yesBtn.addEventListener("click", () => {
    setHidden(actions, true);
    setHidden(qEl, false);
    burstEmojiHearts(yesBtn);
    showOutcome({ kind: "yes" });
  });

  noBtn.addEventListener("pointerenter", maybeDodge);
  noBtn.addEventListener("pointerdown", maybeDodge);

  noBtn.addEventListener("click", () => {
    noBtn.style.transform = "";
    setHidden(actions, true);
    setHidden(qEl, false);
    showOutcome({ kind: "no" });
  });
}

function initApp() {
  initTheme();
  if (isLowPerfDevice()) document.documentElement.dataset.perf = "low";
  buildFloatingHearts();
  initMicroInteractions();
  initBackgroundParallaxOnce();

  const themeToggle = qs("#themeToggle");
  if (!bound.theme) {
    bound.theme = true;
    themeToggle.addEventListener("click", toggleTheme);
  }
  document.addEventListener(
    "visibilitychange",
    () => {
      const paused = document.hidden;
      document.documentElement.dataset.paused = paused ? "true" : "false";
    },
    { passive: true },
  );

  const params = new URLSearchParams(window.location.search);
  const hasReceiver = params.has("from") && safeText(params.get("from"), "").length > 0;

  if (hasReceiver) {
    initReceiverUI(params);
    return;
  }

  initGeneratorUI();
  setActiveScreen("welcome");
  initIntroTypewriterOnce();
}

document.addEventListener("DOMContentLoaded", initApp);
