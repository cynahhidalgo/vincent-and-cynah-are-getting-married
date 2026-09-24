(function () {
  const cfg = window.WEDDING_CONFIG;
  if (!cfg) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const w = cfg.welcome || {};
  const v = cfg.venue || {};

  function set(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.textContent = text;
  }

  set("welcome-headline", w.headline);
  set("welcome-eyebrow", w.eyebrow);
  set("welcome-families", cfg.familiesLine);
  set("welcome-p1", cfg.partner1);
  set("welcome-p2", cfg.partner2);
  set("welcome-couple-p1", cfg.partner1);
  set("welcome-couple-p2", cfg.partner2);

  function assetPath(relative) {
    if (!relative) return "";
    return relative.startsWith("images/") ? relative : `images/${relative}`;
  }

  const monogram = document.getElementById("welcome-monogram");
  const monogramPath = w.monogram;
  if (monogram && monogramPath) {
    monogram.src = encodeURI(assetPath(monogramPath));
  }

  const flowerFrame = document.getElementById("welcome-envelope-flowers");
  const flowerPath = w.envelopeFlowers;
  if (flowerFrame && flowerPath) {
    flowerFrame.src = encodeURI(assetPath(flowerPath));
  }

  const envelopeStyle = document.getElementById("welcome-envelope-style");
  const stylePath = w.envelopeStyle;
  const shell = document.querySelector(".welcome-envelope__shell");
  if (envelopeStyle && stylePath) {
    envelopeStyle.src = encodeURI(assetPath(stylePath));
    shell?.classList.add("has-envelope-style");
  }

  set("welcome-date", cfg.dateLong || cfg.dateDisplay);
  set(
    "welcome-venue",
    v.name && v.area ? `${v.name} · ${v.area}` : v.name || v.area
  );
  set("welcome-sub", w.subline);

  const path = w.invitationPath || "invitation.html";
  const envelope = document.getElementById("welcome-envelope");
  const tap = document.getElementById("welcome-envelope-tap");
  const card = document.getElementById("welcome-envelope-card");
  const enter = document.getElementById("welcome-enter");
  const modal = document.getElementById("welcome-invitation-modal");
  const frame = document.getElementById("welcome-invitation-frame");
  const closeBtn = document.getElementById("welcome-invitation-close");
  const backdrop = document.getElementById("welcome-invitation-backdrop");

  if (enter) {
    enter.href = path;
    enter.textContent = w.cta || "Open invitation";
  }

  const hero = cfg.images?.hero;
  if (card && hero) {
    const src = hero.startsWith("images/") ? encodeURI(hero) : encodeURI(`images/${hero}`);
    card.dataset.heroSrc = src;
    card.style.backgroundImage = `url("${src}")`;
  }

  const modalMotionMs = prefersReducedMotion ? 120 : 920;

  function showInvitationModal() {
    if (!modal || !frame) {
      window.location.href = path;
      return;
    }
    if (!frame.src) frame.src = path;
    modal.classList.remove("is-visible");
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("welcome-modal-open");
    void modal.offsetHeight;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => modal.classList.add("is-visible"));
    });
  }

  function hideInvitationModal() {
    if (!modal) return;
    modal.classList.remove("is-visible");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("welcome-modal-open");
    window.setTimeout(() => {
      modal.hidden = true;
    }, modalMotionMs);
  }

  function openEnvelope() {
    if (!envelope || envelope.classList.contains("is-open")) return false;
    envelope.classList.add("is-open");
    document.getElementById("welcome-screen")?.classList.add("is-envelope-open");
    if (card) card.removeAttribute("aria-hidden");
    if (tap) tap.disabled = true;
    window.setTimeout(() => {
      if (enter) {
        enter.hidden = false;
        enter.classList.add("is-visible");
      }
    }, 1100);
    return true;
  }

  function onSealClick() {
    const opened = openEnvelope();
    if (!opened && envelope?.classList.contains("is-open")) {
      showInvitationModal();
      return;
    }
    const delay = prefersReducedMotion ? 200 : 1450;
    window.setTimeout(showInvitationModal, delay);
  }

  tap?.addEventListener("click", onSealClick);

  enter?.addEventListener("click", (e) => {
    e.preventDefault();
    showInvitationModal();
  });

  closeBtn?.addEventListener("click", hideInvitationModal);
  backdrop?.addEventListener("click", hideInvitationModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.hidden) hideInvitationModal();
  });

  document.title = `Welcome · ${cfg.partner1 || ""} & ${cfg.partner2 || ""}`.trim();

  requestAnimationFrame(() => {
    document.getElementById("welcome-screen")?.classList.add("is-ready");
  });
})();
