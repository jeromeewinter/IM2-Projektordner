// ── Lottie Logo ───────────────────────────────────────────────────
const logoEl = document.getElementById("logo-lottie");
if (typeof lottie !== "undefined" && logoEl) {
  const animation = lottie.loadAnimation({
    container: logoEl,
    renderer: "svg",
    loop: false,
    autoplay: true,
    path: "/assets/logo.json",
  });
  logoEl.addEventListener("mouseenter", () => animation.goToAndPlay(0));
}

// ── Accordion (läuft auf allen Seiten) ────────────────────────────
document.querySelectorAll(".accordion").forEach(btn => {
  btn.addEventListener("click", function () {
    const panel = this.nextElementSibling;
    const isOpen = this.classList.contains("active");

    document.querySelectorAll(".accordion.active").forEach(b => {
      b.classList.remove("active");
      b.nextElementSibling.style.maxHeight = null;
    });

    if (!isOpen) {
      this.classList.add("active");
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
  });
});

// ── Hauptseiten-Code (nur wenn Artwork-Liste vorhanden) ───────────
if (document.getElementById("artwork-list")) {

  // ── Konstanten ──────────────────────────────────────────────────
  const BASE     = "https://api.artic.edu/api/v1";
  const IIIF     = "https://www.artic.edu/iiif/2";
  const PER_PAGE = 10;
  const FIELDS   = "id,title,artist_display,date_display,image_id,department_title,place_of_origin,medium_display,artwork_type_title,dimensions,credit_line";

 const DEPARTMENTS = [
  { id: "",                                          label: "All Departments" },
  { id: "Applied Arts of Europe",                    label: "European Decorative Art" },
  { id: "Arts of the Americas",                      label: "Arts of the Americas" },
  { id: "Arts of Africa",                            label: "Arts of Africa" },
  { id: "Asian and Ancient Mediterranean Art",       label: "Asian Art" },
  { id: "Ancient and Byzantine Art",                 label: "Ancient and Byzantine Art" },
  { id: "Architecture and Design",                   label: "Architecture and Design" },
  { id: "Arms and Armor",                            label: "Arms and Armor" },
  { id: "American Art",                              label: "American Art" },
  { id: "Contemporary Art",                          label: "Contemporary Art" },
  { id: "Painting and Sculpture of Europe",          label: "European Painting and Sculpture" },
  { id: "Photography and Media",                     label: "Photography" },
  { id: "Prints and Drawings",                       label: "Prints and Drawings" },
  { id: "Textiles",                                  label: "Textiles" },
];

  // ── State ────────────────────────────────────────────────────────
  let currentPage  = 1;
  let totalPages   = 1;
  let currentQuery = "";

  // ── DOM Referenzen ───────────────────────────────────────────────
  const searchInput      = document.getElementById("search");
  const searchBtn        = document.querySelector(".search-btn");
  const countEl          = document.getElementById("count");
  const listEl           = document.getElementById("artwork-list");
  const paginationEl     = document.querySelector(".pagination");
  const filterToggleBtn  = document.getElementById("filter-toggle");
  const filterPanel      = document.getElementById("filter-panel");
  const departmentSelect = document.getElementById("filter-department");
  const dateFromInput    = document.getElementById("filter-date-from");
  const dateToInput      = document.getElementById("filter-date-to");
  const mediumInput      = document.getElementById("filter-medium");
  const filterApplyBtn   = document.getElementById("filter-apply");
  const filterResetBtn   = document.getElementById("filter-reset");
  const activeFiltersEl  = document.getElementById("active-filters");

  // ── Department Dropdown befüllen ─────────────────────────────────
  DEPARTMENTS.forEach(({ id, label }) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = label;
    departmentSelect.appendChild(opt);
  });

  // ── Filter Panel Toggle ──────────────────────────────────────────
  filterToggleBtn.addEventListener("click", () => {
    const open = filterPanel.classList.toggle("open");
    filterToggleBtn.setAttribute("aria-expanded", open);
    filterToggleBtn.querySelector(".filter-chevron").style.transform =
      open ? "rotate(180deg)" : "rotate(0deg)";
  });

  let favorites = JSON.parse(localStorage.getItem("aic-favorites") || "[]");

  // ── Filter-Werte auslesen ────────────────────────────────────────
  function getFilters() {
    return {
      department: departmentSelect.value,
      dateFrom:   dateFromInput.value.trim(),
      dateTo:     dateToInput.value.trim(),
      medium:     mediumInput.value.trim(),
    };
  }

  // ── Aktive Filter-Tags rendern ───────────────────────────────────
  function renderActiveTags(filters) {
    activeFiltersEl.innerHTML = "";
    const tags = [];

    if (filters.department) {
      tags.push({
        label: filters.department,
        clear: () => { departmentSelect.value = ""; },
      });
    }
    if (filters.dateFrom || filters.dateTo) {
      tags.push({
        label: `${filters.dateFrom || "…"} – ${filters.dateTo || "…"}`,
        clear: () => { dateFromInput.value = ""; dateToInput.value = ""; },
      });
    }
    if (filters.medium) {
      tags.push({
        label: filters.medium,
        clear: () => { mediumInput.value = ""; },
      });
    }

    tags.forEach(({ label, clear }) => {
      const tag = document.createElement("button");
      tag.className = "filter-tag";
      tag.innerHTML = `${escHtml(label)} <span aria-hidden="true">×</span>`;
      tag.addEventListener("click", () => { clear(); triggerSearch(); });
      activeFiltersEl.appendChild(tag);
    });
  }

  // ── Such-Request bauen (POST mit JSON-Body für zuverlässiges AND) ─
  function buildSearch(query, filters, page) {
    const url = new URL(`${BASE}/artworks/search`);
    url.searchParams.set("fields", FIELDS);
    url.searchParams.set("limit",  PER_PAGE);
    url.searchParams.set("page",   page);

    const boolQuery = { bool: {} };

    if (query.trim()) {
      boolQuery.bool.must = {
        multi_match: {
          query:   query.trim(),
          type:    "phrase",
          fields:  ["title^3", "artist_display^2"],
          lenient: true,
        }
      };
    } else {
      boolQuery.bool.must = { match_all: {} };
    }

    const filterClauses = [];
    if (filters.department) {
      filterClauses.push({ term: { "department_title.keyword": filters.department } });
    }
    if (filters.dateFrom) {
      filterClauses.push({ range: { date_start: { gte: parseInt(filters.dateFrom) } } });
    }
    if (filters.dateTo) {
      filterClauses.push({ range: { date_end: { lte: parseInt(filters.dateTo) } } });
    }
    if (filters.medium) {
      filterClauses.push({ match: { medium_display: filters.medium } });
    }
    if (filterClauses.length) {
      boolQuery.bool.filter = filterClauses;
    }

    return {
      url:  url.toString(),
      body: JSON.stringify({ query: boolQuery }),
    };
  }

  // ── Suche ausführen ──────────────────────────────────────────────
  async function search(query, page = 1) {
    currentQuery = query.trim();
    currentPage  = page;
    listEl.innerHTML    = "";
    countEl.textContent = "Searching…";

    const filters = getFilters();
    renderActiveTags(filters);

    const activeCount = [
      filters.department,
      filters.dateFrom || filters.dateTo,
      filters.medium,
    ].filter(Boolean).length;
    const badge = filterToggleBtn.querySelector(".filter-badge");
    badge.textContent = activeCount;
    badge.hidden = activeCount === 0;

    try {
      const { url, body } = buildSearch(currentQuery, filters, currentPage);
      const res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const artworks   = data.data       ?? [];
      const pagination = data.pagination ?? {};

      totalPages = pagination.total_pages ?? 1;
      const total = pagination.total ?? artworks.length;

      countEl.textContent = `${total.toLocaleString("de-CH")} results`;

      listEl.innerHTML = "";
      if (artworks.length === 0) {
        listEl.innerHTML = '<li style="padding:2rem;color:var(--muted)">No results found.</li>';
      } else {
        for (const art of artworks) {
          listEl.appendChild(buildItem(art));
        }
      }

      renderPagination();
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
      totalPages = 1;
      countEl.textContent = "Error loading results. Please try again.";
      paginationEl.innerHTML = "";
      listEl.innerHTML = '<li style="padding:2rem;color:var(--muted)">Something went wrong. Please try again.</li>';
      console.error("AIC API error:", err);
    }
  }

  function triggerSearch() {
    search(searchInput.value, 1);
  }

  // ── Listeneintrag bauen ──────────────────────────────────────────
  function buildItem(art) {
    const li = document.createElement("li");
    li.className = "artwork-item";

    const imgHtml = art.image_id
      ? `<img class="artwork-img"
              src="${IIIF}/${art.image_id}/full/400,/0/default.jpg"
              alt="${escHtml(art.title)}"
              loading="lazy"
              onerror="this.outerHTML='<div class=\\"artwork-img-placeholder\\">No image</div>'" />`
      : `<div class="artwork-img-placeholder">No image</div>`;

    const locationParts = [art.department_title, art.place_of_origin].filter(Boolean);
    const locationStr = locationParts.length
      ? `<span class="artwork-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          ${escHtml(locationParts.join(" · "))}
        </span>`
      : "";

    const artist = art.artist_display
      ? art.artist_display.split("\n")[0]
      : "Unknown Artist";
    const date = art.date_display ? ` · ${art.date_display}` : "";

    li.innerHTML = `
      ${imgHtml}
      <div class="artwork-info">
        <span class="artwork-artist">${escHtml(artist)}${escHtml(date)}</span>
        <span class="artwork-title">${escHtml(art.title || "Untitled")}</span>
        ${locationStr}
      </div>
<button class="btn-favorite${favorites.includes(art.id) ? " active" : ""}" 
  aria-label="Zu Favoriten hinzufügen" 
  data-id="${art.id}">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
</button>
<button class="btn-learn" aria-label="More about ${escHtml(art.title || "this artwork")}">
  More →
</button>
    `;

    li.querySelector(".btn-learn").addEventListener("click", (e) => {
      e.stopPropagation();
      openLightbox(art);
    });
    li.addEventListener("click", () => openLightbox(art));

    li.querySelector(".btn-favorite").addEventListener("click", (e) => {
  e.stopPropagation();
  const id = art.id;
  const idx = favorites.indexOf(id);
  if (idx === -1) {
    favorites.push(id);
    e.currentTarget.classList.add("active");
  } else {
    favorites.splice(idx, 1);
    e.currentTarget.classList.remove("active");
  }
  localStorage.setItem("aic-favorites", JSON.stringify(favorites));
});

    return li;
  }

  // ── Lightbox ─────────────────────────────────────────────────────
  const lightboxEl    = document.getElementById("lightbox");
  const lightboxImg   = document.getElementById("lightbox-img");
  const lightboxTitle = document.getElementById("lightbox-title");
  const lightboxMeta  = document.getElementById("lightbox-meta");
  const lightboxLink  = document.getElementById("lightbox-link");
  const lightboxClose = document.getElementById("lightbox-close");

  function openLightbox(art) {
    if (art.image_id) {
      lightboxImg.src           = `${IIIF}/${art.image_id}/full/843,/0/default.jpg`;
      lightboxImg.alt           = art.title || "";
      lightboxImg.style.display = "block";
    } else {
      lightboxImg.style.display = "none";
    }

    lightboxTitle.textContent = art.title || "Untitled";

    const fields = [
      { label: "Artist",     value: art.artist_display ? art.artist_display.split("\n")[0] : null },
      { label: "Date",       value: art.date_display },
      { label: "Medium",     value: art.medium_display },
      { label: "Dimensions", value: art.dimensions },
      { label: "Department", value: art.department_title },
      { label: "Origin",     value: art.place_of_origin },
      { label: "Credit",     value: art.credit_line },
    ];

    lightboxMeta.innerHTML = fields
      .filter(f => f.value)
      .map(f => `
        <div class="lightbox-meta-row">
          <span class="lightbox-meta-label">${f.label}</span>
          <span class="lightbox-meta-value">${escHtml(f.value)}</span>
        </div>`)
      .join("");

    lightboxLink.href = `https://www.artic.edu/artworks/${art.id}`;
    lightboxEl.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightboxEl.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => { lightboxImg.src = ""; }, 300);
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxEl.addEventListener("click", (e) => {
    if (e.target === lightboxEl) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  // ── Pagination ───────────────────────────────────────────────────
  function renderPagination() {
    paginationEl.innerHTML = "";
    if (totalPages <= 1) return;

    getPageNumbers(currentPage, totalPages).forEach(p => {
      if (p === "…") {
        const span = document.createElement("span");
        span.className   = "page-dots";
        span.textContent = "…";
        paginationEl.appendChild(span);
      } else {
        const btn = document.createElement("button");
        btn.className   = "page-btn" + (p === currentPage ? " active" : "");
        btn.textContent = p;
        btn.addEventListener("click", () => search(currentQuery, p));
        paginationEl.appendChild(btn);
      }
    });
  }

  function getPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = [1];
    if (current > 3) pages.push("…");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push("…");
    pages.push(total);
    return pages;
  }

  // ── Events ───────────────────────────────────────────────────────
  searchBtn.addEventListener("click", triggerSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") triggerSearch();
  });
  filterApplyBtn.addEventListener("click", () => {
    filterPanel.classList.remove("open");
    filterToggleBtn.setAttribute("aria-expanded", "false");
    filterToggleBtn.querySelector(".filter-chevron").style.transform = "rotate(0deg)";
    triggerSearch();
  });
  filterResetBtn.addEventListener("click", () => {
    departmentSelect.value = "";
    dateFromInput.value    = "";
    dateToInput.value      = "";
    mediumInput.value      = "";
    triggerSearch();
  });

  // ── Init ─────────────────────────────────────────────────────────
  search("");

} // end if(artwork-list)

// ── Hilfsfunktion: HTML escapen ───────────────────────────────────
function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}