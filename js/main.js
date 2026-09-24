(function () {
  const cfg = window.WEDDING_CONFIG;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  /** Resolve paths under local `images/` (see WEDDING_CONFIG.imagesBase). */
  function imgSrc(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return encodeURI(path);
    const base = (cfg && cfg.imagesBase) || "images";
    const normalized = path.startsWith(`${base}/`) || path.startsWith("images/")
      ? path
      : `${base}/${path.replace(/^\/+/, "")}`;
    return encodeURI(normalized);
  }

  function setText(field, value) {
    if (value == null || value === "") return;
    $$(`[data-field="${field}"]`).forEach((el) => {
      if (el.tagName === "IFRAME") el.src = value;
      else if (field === "mapLink") el.href = value;
      else el.textContent = value;
    });
  }

  function applyConfig() {
    if (!cfg) return;
    setText("partner1", cfg.partner1);
    setText("partner2", cfg.partner2);
    setText("partner1-footer", cfg.partner1);
    setText("partner2-footer", cfg.partner2);
    setText("hashtag", cfg.hashtag ? `#${cfg.hashtag}` : "");
    setText("dateDisplay", cfg.dateDisplay);
    setText("headerDate", cfg.headerDate || cfg.dateDisplay);
    setText("dateLong", cfg.dateLong || cfg.dateDisplay);
    setText("familiesLine", cfg.familiesLine);
    setText("storyIntro", cfg.storyIntro);
    setText("dressCode", cfg.dressCode);
    setText("rsvpDeadline", cfg.rsvpDeadline);
    setText("whereToStayTitle", cfg.whereToStay?.title);
    setText("whereToStayNote", cfg.whereToStay?.note);
    setText("travelHeading", cfg.travel?.heading);
    setText("travelVenue", cfg.travel?.venueLine);
    setText("travelNote", cfg.travel?.note);
    renderWhereToStay(cfg.whereToStay);
    const v = cfg.venue || {};
    setText("whenVenue", v.name);
    setText("whenCity", v.area);
    setText("mapEmbed", cfg.map?.embedUrl);
    setText("mapLink", cfg.map?.linkUrl);

    const heroBg = $("#hero-bg");
    if (heroBg && cfg.images?.hero) {
      heroBg.style.backgroundImage = `url("${imgSrc(cfg.images.hero)}")`;
    }

    renderStorySlideshow(cfg.storyTimeline);
    renderDetailCards(cfg.ceremony, cfg.reception);
    renderGlimpseCards(cfg.ceremony, cfg.reception);
    renderProgram(cfg.program);
    renderSponsors("#principal-sponsors", cfg.principalSponsors, "Principal sponsor");
    renderSponsors("#secondary-sponsors", cfg.secondarySponsors, "Secondary sponsor");
    renderGallery(cfg.images?.gallery);
    setupGoogleForm(cfg.googleFormUrl);
    initRsvpForm();
    initHeaderScroll();
    initScrollSpy();
    initCountdown();
    initHeroMusic();
  }

  function initCountdown() {
    const wrap = document.querySelector(".countdown");
    const iso = cfg?.weddingDateTime || wrap?.dataset.weddingDatetime;
    if (!iso) return;
    startCountdown(iso);
  }

  function youtubeIdFromUrl(url) {
    return String(url).replace(/^.*(?:v=|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{11}).*$/, "$1");
  }

  function storySlideVisual(item) {
    if (item.youtube) {
      const id = escapeHtml(youtubeIdFromUrl(item.youtube));
      const autoplay = item.youtubeAutoplay !== false;
      return `<div class="timeline-visual timeline-visual--video"${autoplay ? ' data-youtube-autoplay="true"' : ""}><iframe data-youtube-id="${id}" src="https://www.youtube.com/embed/${id}?rel=0" title="${escapeHtml(item.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
    }
    if (item.image) {
      return `<div class="timeline-visual"><img src="${escapeHtml(imgSrc(item.image))}" alt="${escapeHtml(item.title)}" loading="lazy" /></div>`;
    }
    return `<div class="timeline-visual timeline-visual--empty" aria-hidden="true"></div>`;
  }

  function storySlideCopy(item) {
    return `
      <div class="timeline-copy story-slide-copy">
        <p class="timeline-era">${escapeHtml(item.era)}${item.place ? ` · ${escapeHtml(item.place)}` : ""}</p>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.text)}</p>
      </div>`;
  }

  let storySlideIndex = 0;
  let storyAutoplayTimer;

  function setStorySlideYoutubeState(slide, active) {
    const wrap = slide?.querySelector(".timeline-visual--video[data-youtube-autoplay]");
    const iframe = wrap?.querySelector("iframe");
    const id = iframe?.dataset.youtubeId;
    if (!iframe || !id) return;
    if (active && !prefersReducedMotion) {
      iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0`;
    } else {
      iframe.src = `https://www.youtube.com/embed/${id}?rel=0`;
    }
  }

  function goToStorySlide(index, total) {
    const track = $("#story-slideshow-track");
    const dots = $$(".story-slideshow-dot");
    const slides = $$(".story-slide");
    if (!track || !total) return;

    storySlideIndex = ((index % total) + total) % total;
    track.style.transform = `translate3d(-${storySlideIndex * 100}%, 0, 0)`;

    slides.forEach((slide, i) => {
      const isActive = i === storySlideIndex;
      slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      slide.tabIndex = isActive ? 0 : -1;
      setStorySlideYoutubeState(slide, isActive);
    });

    dots.forEach((dot, i) => {
      const selected = i === storySlideIndex;
      dot.classList.toggle("is-active", selected);
      dot.setAttribute("aria-selected", selected ? "true" : "false");
      dot.tabIndex = selected ? 0 : -1;
    });
  }

  function initStorySlideshow(total) {
    const prev = $(".story-slideshow-prev");
    const next = $(".story-slideshow-next");
    const root = $("#story-slideshow");

    const step = (delta) => {
      goToStorySlide(storySlideIndex + delta, total);
      restartStoryAutoplay(total);
    };

    prev?.addEventListener("click", () => step(-1));
    next?.addEventListener("click", () => step(1));

    root?.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });

    let touchStartX = 0;
    root?.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0]?.clientX ?? 0;
      },
      { passive: true }
    );
    root?.addEventListener(
      "touchend",
      (e) => {
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX;
        if (Math.abs(dx) < 40) return;
        step(dx < 0 ? 1 : -1);
      },
      { passive: true }
    );

    function restartStoryAutoplay(totalSlides) {
      if (storyAutoplayTimer) clearInterval(storyAutoplayTimer);
      if (prefersReducedMotion || totalSlides < 2) return;
      storyAutoplayTimer = setInterval(() => {
        goToStorySlide(storySlideIndex + 1, totalSlides);
      }, 9000);
    }

    goToStorySlide(0, total);
    restartStoryAutoplay(total);
  }

  function renderStorySlideshow(items) {
    const track = $("#story-slideshow-track");
    const dotsWrap = $("#story-slideshow-dots");
    if (!track || !dotsWrap || !items?.length) return;

    track.innerHTML = "";
    dotsWrap.innerHTML = "";

    items.forEach((item, i) => {
      const slide = document.createElement("article");
      slide.className = "story-slide";
      slide.setAttribute("role", "tabpanel");
      slide.id = `story-slide-${i + 1}`;
      slide.innerHTML = `${storySlideVisual(item)}${storySlideCopy(item)}`;
      track.appendChild(slide);

      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "story-slideshow-dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-controls", slide.id);
      dot.setAttribute("aria-label", `${item.title || "Story"} — slide ${i + 1} of ${items.length}`);
      dot.addEventListener("click", () => {
        goToStorySlide(i, items.length);
        if (storyAutoplayTimer) clearInterval(storyAutoplayTimer);
      });
      dotsWrap.appendChild(dot);
    });

    initStorySlideshow(items.length);
  }

  function renderDetailCards(ceremony, reception) {
    const cEl = $("#ceremony-card");
    const rEl = $("#reception-card");
    if (cEl && ceremony) {
      cEl.classList.toggle("detail-card--has-media", Boolean(ceremony.image));
      cEl.innerHTML = cardHtml(ceremony);
    }
    if (rEl && reception) {
      rEl.classList.toggle("detail-card--has-media", Boolean(reception.image));
      rEl.innerHTML = cardHtml(reception);
    }
  }

  function renderGlimpseCards(ceremony, reception) {
    if (ceremony) {
      fillGlimpseCard("#ceremony-glimpse-card", "#ceremony-glimpse-media", ceremony);
    }
    if (reception) {
      fillGlimpseCard("#reception-glimpse-card", "#reception-glimpse-media", reception);
    }
  }

  function fillGlimpseCard(cardSel, mediaSel, block) {
    const card = $(cardSel);
    const media = $(mediaSel);
    if (!card || !block) return;
    const body = card.querySelector(".glimpse-card-body");
    if (body) body.innerHTML = cardHtml(block, { includeMedia: false });
    if (media && block.image) {
      media.style.backgroundImage = `url("${imgSrc(block.image)}")`;
      media.setAttribute("aria-label", block.label || block.title || "Photo");
    }
  }

  const DETAIL_ICON_SVG = {
    ceremony: `<svg class="detail-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><circle cx="11" cy="18" r="5.5"/><circle cx="21" cy="18" r="5.5"/><path d="M11 12.5V10M21 12.5V10"/></svg>`,
    reception: `<svg class="detail-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true"><path d="M10 8h12v3c0 4-2.5 6.5-6 6.5S10 15 10 11V8z"/><path d="M16 17.5V24M12 24h8"/></svg>`,
  };

  function detailIconKey(block) {
    if (block?.icon && DETAIL_ICON_SVG[block.icon]) return block.icon;
    const label = String(block?.label || "").toLowerCase();
    if (label.includes("ceremony")) return "ceremony";
    if (label.includes("reception")) return "reception";
    return null;
  }

  function cardHtml(block, options = {}) {
    const includeMedia = options.includeMedia !== false;
    const bullets = (block.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("");
    const href = escapeHtml(block.linkTarget || "#");
    const label = escapeHtml(block.linkLabel);
    const btnClass =
      block.linkButtonStyle === "outline" ? "btn btn-outline detail-card-btn" : "btn btn-primary detail-card-btn";
    const link = block.linkLabel
      ? block.linkAsButton
        ? `<a class="${btnClass}" href="${href}">${label}</a>`
        : `<a class="card-link" href="${href}">${label}</a>`
      : "";
    const iconKey = detailIconKey(block);
    const icon = iconKey ? DETAIL_ICON_SVG[iconKey] : "";
    const body = `
      ${icon}
      <p class="label">${escapeHtml(block.label)}</p>
      <h3>${escapeHtml(block.title)}</h3>
      <p class="subtitle">${escapeHtml(block.subtitle)}</p>
      <ul>${bullets}</ul>
      ${link}`;
    if (!includeMedia || !block.image) return body;
    const alt = escapeHtml(block.imageAlt || block.title || block.label || "");
    return `
      <div class="detail-card-media">
        <img src="${escapeHtml(imgSrc(block.image))}" alt="${alt}" loading="lazy" />
      </div>
      <div class="detail-card-body">${body}</div>`;
  }

  function renderProgram(items) {
    const list = $("#program-list");
    if (!list || !items) return;
    list.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${escapeHtml(item.title)}${item.note ? ` · <em>${escapeHtml(item.note)}</em>` : ""}</span><span class="prog-time">${escapeHtml(item.time)}</span>`;
      list.appendChild(li);
    });
  }

  function sponsorPairNames(pair) {
    if (Array.isArray(pair?.names) && pair.names.length) {
      return [pair.names[0] || "", pair.names[1] || ""];
    }
    return [pair?.name1 || "", pair?.name2 || ""];
  }

  function sponsorNameLine(text, emptyLabel) {
    const trimmed = (text || "").trim();
    if (!trimmed) {
      return `<span class="party-name party-name-empty">${escapeHtml(emptyLabel)}</span>`;
    }
    return `<strong class="party-name">${escapeHtml(trimmed)}</strong>`;
  }

  function renderSponsors(selector, pairs, roleLabel) {
    const list = $(selector);
    if (!list || !pairs) return;
    list.innerHTML = "";
    pairs.forEach((pair, i) => {
      const [n1, n2] = sponsorPairNames(pair);
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="role">${escapeHtml(roleLabel)} ${i + 1}</span>
        <div class="party-names">
          ${sponsorNameLine(n1, "Name")}
          ${sponsorNameLine(n2, "Name")}
        </div>`;
      list.appendChild(li);
    });
  }

  function formatStayDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function renderWhereToStay(stay) {
    const grid = $("#stay-grid");
    const datesEl = $("#stay-dates");
    if (!grid || !stay?.places?.length) {
      if (grid) grid.innerHTML = "";
      return;
    }

    const checkIn = formatStayDate(stay.suggestedCheckIn);
    const checkOut = formatStayDate(stay.suggestedCheckOut);
    if (datesEl && checkIn && checkOut) {
      datesEl.textContent = `Suggested dates: ${checkIn} – ${checkOut}`;
      datesEl.hidden = false;
    } else if (datesEl) {
      datesEl.hidden = true;
    }

    grid.innerHTML = "";
    stay.places.forEach((place) => {
      const article = document.createElement("article");
      article.className = "stay-card";
      if (place.featured) article.classList.add("stay-card--featured");
      if (place.coupleStaying) article.classList.add("stay-card--couple");

      const badges = [];
      if (place.featured) badges.push('<span class="stay-badge">Featured</span>');
      if (place.coupleStaying) badges.push('<span class="stay-badge stay-badge--couple">We\'re staying here</span>');
      if (place.type) badges.push(`<span class="stay-badge stay-badge--type">${escapeHtml(place.type)}</span>`);

      const meta = [place.distance, place.priceHint].filter(Boolean).join(" · ");
      const booking =
        place.bookingUrl && place.bookingLabel
          ? `<a class="btn btn-primary stay-book" href="${escapeHtml(place.bookingUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(place.bookingLabel)}</a>`
          : "";

      article.innerHTML = `
        <div class="stay-card-media" style="background-image:url('${escapeHtml(place.image || "images/placeholder.svg")}')" role="img" aria-label="${escapeHtml(place.name || "Place to stay")}"></div>
        <div class="stay-card-body">
          <div class="stay-badges">${badges.join("")}</div>
          <h3 class="stay-name">${escapeHtml(place.name || "Place to stay")}</h3>
          ${meta ? `<p class="stay-meta">${escapeHtml(meta)}</p>` : ""}
          <p class="stay-note-text">${escapeHtml(place.note || "")}</p>
          ${booking}
        </div>`;
      grid.appendChild(article);
    });
  }

  function renderGallery(items) {
    const grid = $("#gallery-grid");
    if (!grid || !items?.length) return;
    grid.innerHTML = "";
    items.forEach((src, i) => {
      const fig = document.createElement("figure");
      fig.innerHTML = `<img src="${escapeHtml(imgSrc(src))}" alt="Little Glimpses ${i + 1}" loading="lazy" />`;
      grid.appendChild(fig);
    });
  }

  function setupGoogleForm(url) {
    const wrap = $("#google-form-wrap");
    const form = $("#rsvp-form");
    const setup = $("#google-form-setup");
    const iframe = $("#google-form-iframe");
    if (!url) return;

    let embed = url.trim();
    if (embed.includes("/viewform")) {
      embed = embed.replace(/\/viewform.*$/, "/viewform?embedded=true");
    }
    if (iframe) iframe.src = embed;
    if (wrap) wrap.hidden = false;
    if (form) form.hidden = true;
    if (setup) setup.hidden = true;
  }

  function initRsvpForm() {
    const form = $("#rsvp-form");
    const success = $("#rsvp-success");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      form.hidden = true;
      if (success) success.hidden = false;
    });
  }

  function startCountdown(iso) {
    const target = new Date(iso).getTime();
    if (Number.isNaN(target)) return;

    const ids = ["cd-days", "cd-hours", "cd-mins", "cd-secs"];
    let timerId;

    function tick() {
      const totalSec = Math.max(0, Math.floor((target - Date.now()) / 1000));
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      [days, hours, mins, secs].forEach((val, i) => {
        const el = document.getElementById(ids[i]);
        if (el) el.textContent = String(val).padStart(2, "0");
      });
      const headerDays = document.getElementById("header-days");
      if (headerDays) {
        if (totalSec === 0) headerDays.textContent = "Today";
        else if (days === 1) headerDays.textContent = "1 day to go";
        else headerDays.textContent = `${days} days to go`;
      }
      if (totalSec === 0 && timerId) {
        clearInterval(timerId);
      }
    }

    tick();
    timerId = setInterval(tick, 1000);
  }

  function initHeaderScroll() {
    const header = $("#header");
    if (!header) return;
    window.addEventListener(
      "scroll",
      () => {
        header.style.opacity = window.scrollY > 80 ? "1" : "0.95";
      },
      { passive: true }
    );
  }

  let heroMusicPlayer = null;
  let heroMusicPlayerReady = false;
  let heroMusicWantsPlay = false;

  function loadYouTubeIframeApi() {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
      const finish = () => resolve();
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevReady?.();
        finish();
      };
      if (!existing) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      } else {
        const poll = window.setInterval(() => {
          if (window.YT && window.YT.Player) {
            window.clearInterval(poll);
            finish();
          }
        }, 50);
        window.setTimeout(() => window.clearInterval(poll), 8000);
      }
    });
  }

  function initHeroMusic() {
    const music = cfg?.heroMusic;
    if (!music?.youtube) return;
    if (prefersReducedMotion) return;

    const videoId = youtubeIdFromUrl(music.youtube);
    if (!videoId || videoId.length !== 11) return;

    const section = document.getElementById("hero");
    const host = document.getElementById("hero-music-host");
    const btn = document.getElementById("hero-music-btn");
    if (!section || !host) return;
    if (btn) btn.hidden = false;

    function safePause() {
      if (!heroMusicPlayerReady || !heroMusicPlayer) return;
      try {
        heroMusicPlayer.pauseVideo();
      } catch (_) {
        /* player not ready */
      }
      heroMusicWantsPlay = false;
    }

    function safePlay(muted) {
      heroMusicWantsPlay = true;
      ensureHeroMusicPlayer(videoId, host, () => {
        if (!heroMusicPlayerReady || !heroMusicPlayer) return;
        try {
          if (muted) heroMusicPlayer.mute();
          heroMusicPlayer.playVideo();
          if (!muted) heroMusicPlayer.unMute();
        } catch (_) {
          /* autoplay blocked */
        }
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.35);
        if (visible) safePlay(true);
        else if (music.pauseWhenLeave !== false) safePause();
      },
      { threshold: [0, 0.35, 0.55] }
    );
    observer.observe(section);

    if (btn) {
      btn.addEventListener("click", () => {
        const on = btn.getAttribute("aria-pressed") === "true";
        ensureHeroMusicPlayer(videoId, host, () => {
          if (!heroMusicPlayerReady || !heroMusicPlayer) return;
          if (on) {
            heroMusicPlayer.mute();
            btn.setAttribute("aria-pressed", "false");
            btn.setAttribute("aria-label", "Turn on wedding music");
          } else {
            heroMusicPlayer.unMute();
            heroMusicPlayer.playVideo();
            btn.setAttribute("aria-pressed", "true");
            btn.setAttribute("aria-label", "Turn off wedding music");
          }
        });
      });
    }

    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.7 && rect.bottom > 0) {
      safePlay(true);
    }
  }

  function ensureHeroMusicPlayer(videoId, host, onReady) {
    if (heroMusicPlayerReady && heroMusicPlayer) {
      onReady?.();
      return;
    }
    loadYouTubeIframeApi().then(() => {
      if (heroMusicPlayerReady && heroMusicPlayer) {
        onReady?.();
        return;
      }
      heroMusicPlayer = new window.YT.Player(host, {
        height: "1",
        width: "1",
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          loop: 1,
          playlist: videoId,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            heroMusicPlayerReady = true;
            if (heroMusicWantsPlay) {
              try {
                heroMusicPlayer.mute();
                heroMusicPlayer.playVideo();
              } catch (_) {
                /* ignore */
              }
            }
            onReady?.();
          },
        },
      });
    });
  }

  function initScrollSpy() {
    const navLinks = $$(".header-nav a[href^='#']");
    if (!navLinks.length) return;

    const sectionById = new Map();
    navLinks.forEach((link) => {
      const id = link.getAttribute("href")?.slice(1);
      if (!id) return;
      const section = document.getElementById(id);
      if (section) sectionById.set(id, { link, section });
    });
    if (!sectionById.size) return;

    const setActive = (id) => {
      navLinks.forEach((a) => a.classList.remove("is-active"));
      sectionById.get(id)?.link.classList.add("is-active");
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.12, 0.35] }
    );

    sectionById.forEach(({ section }) => observer.observe(section));

    const hero = document.getElementById("hero");
    if (hero) {
      const heroObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) navLinks.forEach((a) => a.classList.remove("is-active"));
        },
        { threshold: 0.2 }
      );
      heroObserver.observe(hero);
    }
  }

  const WORD_REVEAL_SELECTORS = [
    ".section-title",
    ".detail-card h3",
    ".sponsor-heading",
    ".program-title",
    ".story-slide-copy h3",
    ".glimpse-card-body h3",
    ".site-footer .hashtag",
    "#where-to-stay .section-title",
  ];

  const ELEGANT_REVEAL_SELECTORS = [
    ".section-sub",
    ".lead",
    ".details-summary",
    ".detail-card .label",
    ".detail-card .subtitle",
    ".story-slide-copy .timeline-era",
    ".glimpse-card-body .label",
    ".glimpse-card-body .subtitle",
    ".dress",
    ".site-footer p",
    "#where-to-stay .section-sub",
  ];

  const ELEGANT_REVEAL_BLOCKS =
    ".hero-inner .families, .hero-inner .hero-names, .hero-inner .hero-meta, .hero-inner .countdown, .detail-card, .glimpse-card, .party-grid > li, .gallery-mosaic figure, .program-list li, .stay-card, .travel-card, .story-slideshow, .rsvp-form, .map-wrap";

  function wrapWords(el) {
    if (!el || el.dataset.wordRevealDone) return;
    if (el.closest(".header-nav")) return;

    const text = (el.textContent || "").trim();
    if (!text) return;

    el.textContent = "";
    const parts = text.split(/(\s+)/);
    let wordIndex = 0;

    parts.forEach((part) => {
      if (/^\s+$/.test(part)) {
        el.appendChild(document.createTextNode(part));
        return;
      }
      const span = document.createElement("span");
      span.className = "word-reveal";
      span.style.setProperty("--word-i", String(Math.min(wordIndex, 20)));
      span.textContent = part;
      el.appendChild(span);
      wordIndex += 1;
    });

    el.classList.add("word-reveal-host");
    el.dataset.wordRevealDone = "true";
  }

  function initScrollReveal() {
    const markVisible = (el) => el.classList.add("is-visible");

    if (prefersReducedMotion) {
      WORD_REVEAL_SELECTORS.forEach((sel) => $$(sel).forEach((el) => markVisible(el)));
      ELEGANT_REVEAL_SELECTORS.forEach((sel) =>
        $$(sel).forEach((el) => {
          el.classList.add("elegant-reveal");
          markVisible(el);
        })
      );
      $$(ELEGANT_REVEAL_BLOCKS).forEach((el) => {
        el.classList.add("elegant-reveal");
        markVisible(el);
      });
      return;
    }

    WORD_REVEAL_SELECTORS.forEach((sel) => $$(sel).forEach(wrapWords));
    ELEGANT_REVEAL_SELECTORS.forEach((sel) =>
      $$(sel).forEach((el) => el.classList.add("elegant-reveal"))
    );

    $$(ELEGANT_REVEAL_BLOCKS).forEach((el, i) => {
      el.classList.add("elegant-reveal");
      el.style.setProperty("--reveal-i", String(i % 8));
    });

    const targets = $$(".word-reveal-host, .elegant-reveal");
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );

    targets.forEach((el) => {
      observer.observe(el);
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.94 && rect.bottom > 0) {
        requestAnimationFrame(() => el.classList.add("is-visible"));
      }
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function boot() {
    applyConfig();
    initScrollReveal();
    if (!cfg) {
      initRsvpForm();
      initHeaderScroll();
      initCountdown();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
