(function () {
  const cfg = window.WEDDING_CONFIG;
  if (!cfg) return;

  const w = cfg.welcome || {};
  const v = cfg.venue || {};

  function set(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.textContent = text;
  }

  set("welcome-eyebrow", w.eyebrow);
  set("welcome-families", cfg.familiesLine);
  set("welcome-p1", cfg.partner1);
  set("welcome-p2", cfg.partner2);
  set("welcome-date", cfg.dateLong || cfg.dateDisplay);
  set(
    "welcome-venue",
    v.name && v.area ? `${v.name} · ${v.area}` : v.name || v.area
  );
  set("welcome-sub", w.subline);

  const enter = document.getElementById("welcome-enter");
  const path = w.invitationPath || "invitation.html";
  if (enter) {
    enter.href = path;
    enter.textContent = w.cta || "Open invitation";
  }

  const bg = document.getElementById("welcome-bg");
  const hero = cfg.images?.hero;
  if (bg && hero) {
    const src = hero.startsWith("images/") ? encodeURI(hero) : encodeURI(`images/${hero}`);
    bg.style.backgroundImage = `url("${src}")`;
  }

  document.title = `Welcome · ${cfg.partner1 || ""} & ${cfg.partner2 || ""}`.trim();

  requestAnimationFrame(() => {
    document.getElementById("welcome-screen")?.classList.add("is-ready");
  });
})();
