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
  set("welcome-invite", w.inviteLine);
  set("welcome-ceremony-time", w.ceremonyLine);
  set("welcome-reception-time", w.receptionLine);
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

  set("welcome-date", w.dateLine || cfg.dateLong || cfg.dateDisplay);
  set("welcome-rsvp", w.rsvpLine || cfg.rsvpDeadline);
  set(
    "welcome-venue",
    w.venueLine || v.area || v.name
  );
  set("welcome-sub", w.subline);

  const path = w.invitationPath || "invitation.html";
  const envelope = document.getElementById("welcome-envelope");
  const tap = document.getElementById("welcome-envelope-tap");
  const card = document.getElementById("welcome-envelope-card");
  const enter = document.getElementById("welcome-enter");
  const guestLookupForm = document.getElementById("welcome-guest-lookup");
  const guestResult = document.getElementById("welcome-guest-result");
  const verifiedGuestKey = "vincent-cynah-verified-guest";
  const modal = document.getElementById("welcome-invitation-modal");
  const frame = document.getElementById("welcome-invitation-frame");
  const closeBtn = document.getElementById("welcome-invitation-close");
  const backdrop = document.getElementById("welcome-invitation-backdrop");
  let isNavigating = false;

  function readVerifiedGuest() {
    try {
      const guest = JSON.parse(sessionStorage.getItem(verifiedGuestKey) || "null");
      return guest?.name && Number(guest?.seats) > 0 ? guest : null;
    } catch (_) {
      return null;
    }
  }

  function saveVerifiedGuest(guest) {
    try {
      sessionStorage.setItem(verifiedGuestKey, JSON.stringify(guest));
    } catch (_) {
      /* Session storage may be unavailable in private contexts. */
    }
  }

  function clearVerifiedGuest() {
    try {
      sessionStorage.removeItem(verifiedGuestKey);
    } catch (_) {
      /* Session storage may be unavailable in private contexts. */
    }
  }

  function requestGuestAllocation(url, name) {
    return new Promise((resolve, reject) => {
      const callbackName = `welcomeGuestLookup_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const script = document.createElement("script");
      const timeout = window.setTimeout(() => finish(new Error("Guest lookup timed out")), 12000);

      function cleanup() {
        window.clearTimeout(timeout);
        script.remove();
        try {
          delete window[callbackName];
        } catch (_) {
          window[callbackName] = undefined;
        }
      }

      function finish(error, data) {
        cleanup();
        if (error) reject(error);
        else resolve(data);
      }

      window[callbackName] = (data) => finish(null, data);
      script.onerror = () => finish(new Error("Guest lookup failed"));
      const endpoint = new URL(url);
      endpoint.searchParams.set("name", name);
      endpoint.searchParams.set("callback", callbackName);
      script.src = endpoint.toString();
      document.head.appendChild(script);
    });
  }

  function showVerifiedGuest(guest) {
    const seats = Math.max(1, Number.parseInt(guest.seats, 10) || 1);
    const seatWord = seats === 1 ? "seat" : "seats";
    if (guestResult) {
      guestResult.textContent = `Welcome, ${guest.name}. We have reserved ${seats} ${seatWord} for you.`;
      guestResult.classList.add("is-found");
      guestResult.hidden = false;
    }
    if (enter) enter.hidden = false;
  }

  if (enter) {
    enter.href = path;
    enter.textContent = w.cta || "Open invitation";
  }

  const navigationEntry = performance.getEntriesByType?.("navigation")?.[0];
  if (navigationEntry?.type === "reload") clearVerifiedGuest();
  const savedGuest = readVerifiedGuest();
  if (savedGuest) showVerifiedGuest(savedGuest);

  guestLookupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = guestLookupForm.elements.namedItem("guestName");
    const button = guestLookupForm.querySelector('[type="submit"]');
    const name = String(input?.value || "").trim();
    if (!name || !cfg.rsvpGuestLookup?.url) return;

    clearVerifiedGuest();
    if (enter) enter.hidden = true;
    if (button) {
      button.disabled = true;
      button.textContent = "Checking…";
    }
    if (guestResult) guestResult.hidden = true;

    try {
      const response = await requestGuestAllocation(cfg.rsvpGuestLookup.url, name);
      if (!response?.found) {
        if (guestResult) {
          guestResult.textContent =
            response?.message ||
            cfg.rsvpGuestLookup.notFound ||
            "We could not find that invited name.";
          guestResult.classList.remove("is-found");
          guestResult.hidden = false;
        }
        return;
      }

      const guest = {
        name: response.name || name,
        seats: Math.max(1, Number.parseInt(response.seats, 10) || 1),
        verifiedAt: new Date().toISOString(),
      };
      saveVerifiedGuest(guest);
      showVerifiedGuest(guest);
    } catch (_) {
      if (guestResult) {
        guestResult.textContent =
          cfg.rsvpGuestLookup.error ||
          "We could not check the guest list right now. Please try again.";
        guestResult.classList.remove("is-found");
        guestResult.hidden = false;
      }
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Check invitation";
      }
    }
  });

  const hero = cfg.images?.hero;
  if (card && hero) {
    const src = hero.startsWith("images/") ? encodeURI(hero) : encodeURI(`images/${hero}`);
    card.dataset.heroSrc = src;
    card.style.backgroundImage = `url("${src}")`;
  }

  const modalMotionMs = prefersReducedMotion ? 120 : 920;

  function navigateToInvitation() {
    if (!readVerifiedGuest()) {
      document.getElementById("welcome-guest-name")?.focus();
      return;
    }
    if (isNavigating) return;
    isNavigating = true;
    if (enter) enter.textContent = "Opening invitation…";
    document.body.classList.add("welcome-page-leaving");
    window.setTimeout(
      () => {
        window.location.href = path;
      },
      prefersReducedMotion ? 0 : 700
    );
  }

  function showInvitationModal() {
    if (!readVerifiedGuest()) {
      document.getElementById("welcome-guest-name")?.focus();
      return;
    }
    if (!modal || !frame) {
      navigateToInvitation();
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
