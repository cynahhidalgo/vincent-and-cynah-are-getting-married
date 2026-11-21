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
    setText("ceremonyLine", cfg.welcome?.ceremonyLine);
    setText("receptionLine", cfg.welcome?.receptionLine);
    setText("ceremonyTime", cfg.welcome?.ceremonyTime);
    setText("ceremonyVenue", cfg.welcome?.ceremonyVenue);
    setText("receptionTime", cfg.welcome?.receptionTime);
    setText("receptionVenue", cfg.welcome?.receptionVenue);
    setText("storyIntro", cfg.storyIntro);
    setText("dressCode", cfg.dressCode);
    setText("rsvpDeadline", cfg.rsvpDeadline);
    setText("guestbookTitle", cfg.guestbook?.title);
    setText("guestbookIntro", cfg.guestbook?.intro);
    setText("guestbookNote", cfg.guestbook?.localOnlyNote);
    setText("seatingTitle", cfg.seating?.title);
    setText("seatingIntro", cfg.seating?.intro);
    setText("registryTitle", cfg.giftRegistry?.title);
    setText("registryIntro", cfg.giftRegistry?.intro);
    setText("entourageTitle", cfg.entourageInvitation?.title);
    setText("entourageIntro", cfg.entourageInvitation?.intro);
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
    renderProgram(cfg.program);
    renderEntourageInvitation(cfg.entourageInvitation);
    renderGallery(cfg.images?.gallery);
    applyFeatureVisibility(cfg.features);
    initGuestbook(cfg.guestbook);
    initSeatingLookup(cfg.seating);
    renderGiftRegistry(cfg.giftRegistry);
    setupGoogleForm(cfg.googleFormUrl, cfg.googleFormEntries, cfg.googleFormMeta);
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
    if (item.youtube && !item.images?.length) {
      const id = escapeHtml(youtubeIdFromUrl(item.youtube));
      const autoplay = item.youtubeAutoplay !== false;
      return `<div class="timeline-visual timeline-visual--video"${autoplay ? ' data-youtube-autoplay="true"' : ""}><iframe data-youtube-id="${id}" src="https://www.youtube.com/embed/${id}?rel=0" title="${escapeHtml(item.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`;
    }
    const pictures = item.images?.length ? item.images : item.image ? [item.image] : [];
    if (pictures.length) {
      const images = pictures
        .map((picture, index) => {
          const src = typeof picture === "string" ? picture : picture.src;
          const alt = typeof picture === "string" ? item.title : picture.alt || item.title;
          return `<img class="story-photo${index === 0 ? " is-active" : ""}" src="${escapeHtml(imgSrc(src))}" alt="${escapeHtml(alt)}" loading="${index === 0 ? "eager" : "lazy"}" />`;
        })
        .join("");
      const position = `<span class="story-photo-counter" aria-live="polite">1 / ${pictures.length}</span>`;
      const controls =
        pictures.length > 1
          ? `<div class="story-photo-controls">
              <button type="button" class="story-photo-btn story-photo-prev" aria-label="Previous photo">Prev</button>
              ${position}
              <button type="button" class="story-photo-btn story-photo-next" aria-label="Next photo">Next</button>
            </div>`
          : "";
      return `<div class="timeline-visual story-photo-slideshow"><div class="story-photo-stage">${images}</div>${controls}</div>`;
    }
    return `<div class="timeline-visual timeline-visual--empty" aria-hidden="true"></div>`;
  }

  function initStoryPhotoSlides() {
    $$(".story-photo-slideshow").forEach((slideshow) => {
      const photos = Array.from(slideshow.querySelectorAll(".story-photo"));
      const dots = Array.from(slideshow.querySelectorAll(".story-photo-dot"));
      const counter = slideshow.querySelector(".story-photo-counter");
      if (photos.length < 2) return;
      let photoIndex = 0;
      let photoTimer;

      const scheduleNextPhoto = () => {
        if (photoTimer) window.clearTimeout(photoTimer);
        if (prefersReducedMotion) return;
        photoTimer = window.setTimeout(() => {
          const storySlide = slideshow.closest(".story-slide");
          if (storySlide?.getAttribute("aria-hidden") === "false") showPhoto(photoIndex + 1);
          else scheduleNextPhoto();
        }, 2000);
      };

      const showPhoto = (index) => {
        photoIndex = ((index % photos.length) + photos.length) % photos.length;
        photos.forEach((photo, i) => photo.classList.toggle("is-active", i === photoIndex));
        dots.forEach((dot, i) => {
          const active = i === photoIndex;
          dot.classList.toggle("is-active", active);
          dot.setAttribute("aria-selected", String(active));
        });
        if (counter) counter.textContent = `${photoIndex + 1} / ${photos.length}`;

        scheduleNextPhoto();
      };

      slideshow.querySelector(".story-photo-prev")?.addEventListener("click", () => showPhoto(photoIndex - 1));
      slideshow.querySelector(".story-photo-next")?.addEventListener("click", () => showPhoto(photoIndex + 1));
      dots.forEach((dot, index) => dot.addEventListener("click", () => showPhoto(index)));
      showPhoto(0);
    });
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

    goToStorySlide(0, total);
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
      });
      dotsWrap.appendChild(dot);
    });

    initStoryPhotoSlides();
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

  function cardHtml(block, options = {}) {
    const includeMedia = options.includeMedia !== false;
    const bullets = (block.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join("");
    const href = escapeHtml(block.linkTarget || "#");
    const label = escapeHtml(block.linkLabel);
    const externalAttrs = block.linkExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
    const btnClass =
      block.linkButtonStyle === "outline" ? "btn btn-outline detail-card-btn" : "btn btn-primary detail-card-btn";
    const link = block.linkLabel
      ? block.linkAsButton
        ? `<a class="${btnClass}" href="${href}"${externalAttrs}>${label}</a>`
        : `<a class="card-link" href="${href}"${externalAttrs}>${label}</a>`
      : "";
    const body = `
      ${block.label ? `<p class="label">${escapeHtml(block.label)}</p>` : ""}
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

  function renderEntourageInvitation(invitation = {}) {
    const grid = $("#entourage-invitation-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const motif = $("#entourage-motif");
    if (motif) {
      motif.innerHTML = "";
      if (invitation.motif?.length) {
        const title = document.createElement("h3");
        title.className = "entourage-motif-title";
        title.textContent = invitation.motifTitle || "Color Motif";
        motif.appendChild(title);

        const swatches = document.createElement("div");
        swatches.className = "entourage-motif-swatches";
        invitation.motif.forEach((item) => {
          const color = document.createElement("div");
          color.className = "entourage-motif-color";
          color.setAttribute("aria-label", item.name || "Wedding motif color");

          const swatch = document.createElement("span");
          swatch.className = "entourage-motif-swatch";
          swatch.style.backgroundColor = item.color || "transparent";
          swatch.title = item.name || "Wedding motif color";
          swatch.setAttribute("aria-hidden", "true");

          const name = document.createElement("small");
          name.className = "entourage-motif-name";
          name.textContent = item.name || "Motif color";

          color.append(swatch, name);
          swatches.appendChild(color);
        });
        motif.appendChild(swatches);

        if (invitation.motifNote) {
          const note = document.createElement("p");
          note.className = "entourage-motif-note";
          note.textContent = invitation.motifNote;
          motif.appendChild(note);
        }
      }
    }

    (invitation.images || []).forEach((item, index) => {
      const src = imgSrc(item.src);
      if (!src) return;

      const figure = document.createElement("figure");
      figure.className = "entourage-invitation-card";
      const alt = item.alt || `Formal invitation entourage page ${index + 1}`;
      const caption = item.caption
        ? `<figcaption>${escapeHtml(item.caption)}</figcaption>`
        : "";
      figure.innerHTML = `
        <a href="${escapeHtml(src)}" target="_blank" rel="noopener" aria-label="Open ${escapeHtml(alt)} full size">
          <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />
          <span class="entourage-invitation-zoom" aria-hidden="true">View full page</span>
        </a>
        ${caption}`;
      grid.appendChild(figure);
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
      const facebook = place.facebookUrl
        ? `<a class="btn btn-outline stay-book" href="${escapeHtml(place.facebookUrl)}" target="_blank" rel="noopener noreferrer">View Facebook</a>`
        : "";
      const directions = place.mapUrl
        ? `<a class="btn btn-primary stay-book" href="${escapeHtml(place.mapUrl)}" target="_blank" rel="noopener noreferrer">Directions</a>`
        : "";
      const actions = [facebook, directions, booking].filter(Boolean).join("");
      const mediaStyle = `background-image:url('${escapeHtml(imgSrc(place.image || "images/placeholder.svg"))}')`;
      const media = place.facebookUrl
        ? `<a class="stay-card-media" style="${mediaStyle}" href="${escapeHtml(place.facebookUrl)}" target="_blank" rel="noopener noreferrer" role="img" aria-label="View ${escapeHtml(place.name || "place to stay")} on Facebook"></a>`
        : `<div class="stay-card-media" style="${mediaStyle}" role="img" aria-label="${escapeHtml(place.name || "Place to stay")}"></div>`;

      article.innerHTML = `
        ${media}
        <div class="stay-card-body">
          <div class="stay-badges">${badges.join("")}</div>
          <h3 class="stay-name">${escapeHtml(place.name || "Place to stay")}</h3>
          ${meta ? `<p class="stay-meta">${escapeHtml(meta)}</p>` : ""}
          <p class="stay-note-text">${escapeHtml(place.note || "")}</p>
          ${actions ? `<div class="stay-actions">${actions}</div>` : ""}
        </div>`;
      grid.appendChild(article);
    });
  }

  function renderGallery(items) {
    const grid = $("#gallery-grid");
    if (!grid || !items?.length) return;
    const images = items.map((src) => imgSrc(src));
    grid.innerHTML = "";
    images.forEach((src, i) => {
      const fig = document.createElement("figure");
      fig.innerHTML = `
        <button class="gallery-view-button" type="button" aria-label="View Moments Before I Do photo ${i + 1} full size">
          <img src="${escapeHtml(src)}" alt="Moments Before I Do ${i + 1}" loading="lazy" />
        </button>`;
      grid.appendChild(fig);
    });

    const lightbox = document.createElement("div");
    lightbox.className = "gallery-lightbox";
    lightbox.id = "gallery-lightbox";
    lightbox.hidden = true;
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Moments Before I Do image viewer");
    lightbox.innerHTML = `
      <button class="gallery-lightbox-close" type="button" aria-label="Close image viewer">&times;</button>
      <button class="gallery-lightbox-nav gallery-lightbox-prev" type="button" aria-label="Previous image">&#8249;</button>
      <figure class="gallery-lightbox-figure">
        <img class="gallery-lightbox-image" src="" alt="" />
        <figcaption class="gallery-lightbox-count" aria-live="polite"></figcaption>
      </figure>
      <button class="gallery-lightbox-nav gallery-lightbox-next" type="button" aria-label="Next image">&#8250;</button>`;
    document.body.appendChild(lightbox);

    const image = lightbox.querySelector(".gallery-lightbox-image");
    const count = lightbox.querySelector(".gallery-lightbox-count");
    const closeButton = lightbox.querySelector(".gallery-lightbox-close");
    let activeIndex = 0;

    function showImage(index) {
      activeIndex = (index + images.length) % images.length;
      image.src = images[activeIndex];
      image.alt = `Moments Before I Do ${activeIndex + 1}`;
      count.textContent = `${activeIndex + 1} / ${images.length}`;
    }

    function openLightbox(index) {
      showImage(index);
      lightbox.hidden = false;
      document.body.classList.add("gallery-lightbox-open");
      closeButton.focus();
    }

    function closeLightbox() {
      lightbox.hidden = true;
      document.body.classList.remove("gallery-lightbox-open");
      grid.querySelectorAll(".gallery-view-button")[activeIndex]?.focus();
    }

    grid.querySelectorAll(".gallery-view-button").forEach((button, index) => {
      button.addEventListener("click", () => openLightbox(index));
    });
    closeButton.addEventListener("click", closeLightbox);
    lightbox.querySelector(".gallery-lightbox-prev").addEventListener("click", () => showImage(activeIndex - 1));
    lightbox.querySelector(".gallery-lightbox-next").addEventListener("click", () => showImage(activeIndex + 1));
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
      if (lightbox.hidden) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showImage(activeIndex - 1);
      if (event.key === "ArrowRight") showImage(activeIndex + 1);
    });
  }

  function applyFeatureVisibility(features = {}) {
    const featureTargets = {
      rsvp: ["#rsvp"],
      guestbook: ["#guestbook"],
      seating: ["#seating"],
      giftRegistry: ["#registry"],
      schedule: [".program-wrap"],
      gallery: ["#gallery"],
      accommodations: ["#where-to-stay"],
      travel: ["#travel"],
    };

    Object.entries(featureTargets).forEach(([feature, selectors]) => {
      if (features[feature] !== false) return;
      selectors.forEach((selector) => {
        $$(selector).forEach((el) => {
          el.hidden = true;
        });
      });
      const sectionId = selectors.find((selector) => selector.startsWith("#"))?.slice(1);
      if (sectionId) {
        $$(`.header-nav a[href="#${sectionId}"]`).forEach((link) => {
          link.hidden = true;
        });
      }
    });
  }

  function guestbookStorageRead(key) {
    if (!key) return [];
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function guestbookStorageWrite(key, messages) {
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(messages));
    } catch (_) {
      /* Browser storage may be unavailable in private contexts. */
    }
  }

  function renderGuestbookMessages(messages) {
    const list = $("#guestbook-list");
    if (!list) return;
    list.innerHTML = "";
    messages.forEach((entry) => {
      const article = document.createElement("article");
      article.className = "guestbook-entry";
      article.innerHTML = `
        <p>${escapeHtml(entry.message || "")}</p>
        <h3>${escapeHtml(entry.name || "Guest")}</h3>`;
      list.appendChild(article);
    });
  }

  function initGuestbook(guestbook = {}) {
    const form = $("#guestbook-form");
    const key = guestbook.storageKey || "wedding-guestbook";
    const seeded = Array.isArray(guestbook.messages) ? guestbook.messages : [];
    let localMessages = guestbookStorageRead(key);
    renderGuestbookMessages([...seeded, ...localMessages].reverse());
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const message = String(data.get("message") || "").trim();
      if (!name || !message) return;
      localMessages.push({ name, message, createdAt: new Date().toISOString() });
      guestbookStorageWrite(key, localMessages);
      renderGuestbookMessages([...seeded, ...localMessages].reverse());
      form.reset();
    });
  }

  function normalizeGuestName(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase()
      .replace(/\s+/g, " ");
  }

  function initSeatingLookup(seating = {}) {
    const form = $("#seating-form");
    const result = $("#seating-result");
    if (!form || !result) return;
    const assignments = Array.isArray(seating.assignments) ? seating.assignments : [];

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const query = normalizeGuestName(data.get("guestName"));
      const match = assignments.find((entry) => normalizeGuestName(entry.name) === query);
      result.hidden = false;
      result.classList.toggle("is-found", Boolean(match));
      if (!match) {
        result.innerHTML = `<p>${escapeHtml(seating.notFound || "No seating assignment was found.")}</p>`;
        return;
      }
      result.innerHTML = `
        <p class="seating-result-label">Welcome, ${escapeHtml(match.name)}</p>
        <h3>${escapeHtml(match.table || "Table assignment pending")}</h3>
        ${match.note ? `<p>${escapeHtml(match.note)}</p>` : ""}`;
    });
  }

  function renderGiftRegistry(registry = {}) {
    const grid = $("#registry-grid");
    if (!grid) return;
    const items = Array.isArray(registry.items) ? registry.items : [];
    grid.innerHTML = "";
    items.forEach((item, index) => {
      const article = document.createElement("article");
      article.className = "registry-card";
      const label = item.linkLabel || "View registry";
      const qrCode = item.qrImage
        ? `<a class="registry-qr" href="${escapeHtml(imgSrc(item.qrImage))}" target="_blank" rel="noopener" aria-label="Open ${escapeHtml(item.qrAlt || item.title || "QR code")} full size">
            <img src="${escapeHtml(imgSrc(item.qrImage))}" alt="${escapeHtml(item.qrAlt || item.title || "Gift QR code")}" loading="lazy" />
          </a>`
        : `<div class="registry-qr registry-qr--placeholder" aria-label="${escapeHtml(item.qrPlaceholder || "QR code image placeholder")}">
            <span aria-hidden="true">QR</span>
            <small>${escapeHtml(item.qrPlaceholder || "Add QR Code")}</small>
          </div>`;
      const action = item.url
        ? `<a class="btn btn-outline" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`
        : "";
      article.innerHTML = `
        <span class="registry-number">${String(index + 1).padStart(2, "0")}</span>
        <h3>${escapeHtml(item.title || "Registry")}</h3>
        <p>${escapeHtml(item.description || "")}</p>
        ${qrCode}
        ${action}`;
      grid.appendChild(article);
    });
  }

  function setupGoogleForm(url, entries = {}, meta = {}) {
    const wrap = $("#google-form-wrap");
    const form = $("#rsvp-form");
    const setup = $("#google-form-setup");
    const iframe = $("#google-form-iframe");
    if (!url) return;

    const fields = ["name", "email", "attending", "plusOne", "message"];
    const hasMappedFields = form && fields.every((field) => entries[field]);
    if (hasMappedFields) {
      let responseUrl = url.trim().replace(/\/viewform.*$/, "/formResponse");
      const targetName = "google-form-response-frame";
      let responseFrame = document.querySelector(`iframe[name="${targetName}"]`);
      if (!responseFrame) {
        responseFrame = document.createElement("iframe");
        responseFrame.name = targetName;
        responseFrame.hidden = true;
        responseFrame.title = "Google Form response";
        document.body.appendChild(responseFrame);
      }

      form.action = responseUrl;
      form.method = "POST";
      form.target = targetName;
      form.dataset.googleConnected = "true";
      fields.forEach((field) => {
        const control = form.elements.namedItem(field);
        if (control) {
          control.dataset.rsvpField = field;
          control.name = `entry.${entries[field]}`;
        }
      });
      Object.entries(meta).forEach(([name, value]) => {
        const hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = name;
        hidden.value = value;
        form.appendChild(hidden);
      });
      if (wrap) wrap.hidden = true;
      form.hidden = false;
      if (setup) setup.hidden = true;
      return;
    }

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
    const submissionKey = "vincent-cynah-rsvp-submitted-v2";
    const submittedMessage =
      "Your RSVP has already been submitted. Thank you — we have saved your response and cannot wait to celebrate with you!";

    try {
      if (localStorage.getItem(submissionKey)) {
        form.hidden = true;
        if (success) {
          success.textContent = submittedMessage;
          success.hidden = false;
        }
        return;
      }
    } catch (_) {
      /* Browser storage may be unavailable in private contexts. */
    }

    form.addEventListener("submit", (e) => {
      if (form.dataset.googleConnected === "true") {
        const nameField =
          form.querySelector('[data-rsvp-field="name"]') || form.elements.namedItem("name");
        const responseFrame = document.querySelector('iframe[name="google-form-response-frame"]');
        const submitButton = form.querySelector('[type="submit"]');
        const originalButtonText = submitButton?.textContent || "Send RSVP";
        let completed = false;

        const finishSubmission = () => {
          if (completed) return;
          completed = true;
          try {
            localStorage.setItem(
              submissionKey,
              JSON.stringify({
                name: String(nameField?.value || "").trim(),
                submittedAt: new Date().toISOString(),
              })
            );
          } catch (_) {
            /* Submission still succeeds if browser storage is unavailable. */
          }
          form.hidden = true;
          if (success) {
            success.textContent = submittedMessage;
            success.hidden = false;
          }
          form.reset();
        };

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = "Sending RSVP…";
        }
        responseFrame?.addEventListener("load", finishSubmission, { once: true });
        window.setTimeout(() => {
          if (completed) return;
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
          }
        }, 15000);
        return;
      }
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
    const section = document.getElementById("hero");
    const host = document.getElementById("hero-music-host");
    const btn = document.getElementById("hero-music-btn");
    if (!music || !section || !btn) return;

    if (music.audio) {
      initLocalHeroMusic(music, section, btn);
      return;
    }

    if (!music.youtube || prefersReducedMotion || !host) return;
    const videoId = youtubeIdFromUrl(music.youtube);
    if (!videoId || videoId.length !== 11) return;

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

  function initLocalHeroMusic(music, section, btn) {
    const audio = new Audio(encodeURI(music.audio));
    audio.loop = music.loop !== false;
    audio.preload = "metadata";
    let enabled = music.autoplay === true;
    let heroVisible = true;

    btn.hidden = false;

    function updateButton() {
      btn.setAttribute("aria-pressed", String(enabled));
      btn.setAttribute("aria-label", enabled ? "Turn off wedding music" : "Turn on wedding music");
    }

    function playIfAllowed() {
      if (!enabled || (!heroVisible && music.pauseWhenLeave !== false)) return;
      audio.play().catch(() => {
        /* Browsers may wait for the guest's first interaction before allowing audio. */
      });
    }

    btn.addEventListener("click", () => {
      enabled = !enabled;
      updateButton();
      if (enabled) playIfAllowed();
      else audio.pause();
    });

    audio.addEventListener("ended", () => {
      if (audio.loop) return;
      enabled = false;
      updateButton();
    });

    const observer = new IntersectionObserver(
      (entries) => {
        heroVisible = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.2);
        if (heroVisible) playIfAllowed();
        else if (music.pauseWhenLeave !== false) audio.pause();
      },
      { threshold: [0, 0.2, 0.5] }
    );
    observer.observe(section);
    updateButton();
    playIfAllowed();

    const resumeAfterBlockedAutoplay = () => {
      if (enabled && (heroVisible || music.pauseWhenLeave === false) && audio.paused) {
        audio.play().catch(() => {});
      }
    };
    document.addEventListener("pointerdown", resumeAfterBlockedAutoplay, { once: true });
    document.addEventListener("keydown", resumeAfterBlockedAutoplay, { once: true });
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
    ".guestbook-entry h3",
    ".registry-card h3",
    ".seating-result h3",
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
    ".guestbook-entry p",
    ".registry-card p",
    ".dress",
    ".site-footer p",
    "#where-to-stay .section-sub",
  ];

  const ELEGANT_REVEAL_BLOCKS =
    ".hero-inner .families, .hero-inner .hero-names, .hero-inner .hero-meta, .hero-inner .countdown, .detail-card, .glimpse-card, .entourage-motif, .entourage-invitation-card, .gallery-mosaic figure, .program-list li, .stay-card, .travel-card, .story-slideshow, .rsvp-form, .guestbook-form, .guestbook-entry, .seating-form, .seating-result, .registry-card, .map-wrap";

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
