// ── Lottie Logo ───────────────────────────────────────────────────
const animation = lottie.loadAnimation({
  container: document.getElementById("logo-lottie"),
  renderer: "svg",
  loop: false,
  autoplay: true,
  path: "/assets/logo.json",
});

document.getElementById("logo-lottie").addEventListener("mouseenter", () => {
  animation.goToAndPlay(0);
});

// ── Art Institute of Chicago API ────────────────────────────────
const BASE = "https://api.artic.edu/api/v1";
const IIIF = "https://www.artic.edu/iiif/2";
const PER_PAGE = 10;
const FIELDS =
  "id,title,artist_display,date_display,image_id,department_title,place_of_origin,medium_display,artwork_type_title,dimensions,credit_line";

// AIC Department / category labels (used for filter dropdown)
const DEPARTMENTS = [
  { id: "", label: "All Departments" },
  { id: "Applied Arts of Europe", label: "Applied Arts of Europe" },
  { id: "Architecture and Design", label: "Architecture and Design" },
  { id: "Arts of Africa", label: "Arts of Africa" },
  { id: "Arts of the Americas", label: "Arts of the Americas" },
  { id: "Arts of Asia", label: "Arts of Asia" },
  { id: "Decorative Arts", label: "Decorative Arts" },
  { id: "Drawing and Printmaking", label: "Drawing and Printmaking" },
  {
    id: "European Painting and Sculpture",
    label: "European Painting and Sculpture",
  },
  {
    id: "Medieval to Modern European Painting and Sculpture",
    label: "Medieval to Modern European Painting",
  },
  { id: "Modern Art", label: "Modern Art" },
  { id: "Photography and Media", label: "Photography and Media" },
  { id: "Prints and Drawings", label: "Prints and Drawings" },
  { id: "Textiles", label: "Textiles" },
];

// ── State ────────────────────────────────────────────────────────
let currentPage = 1;
let totalPages = 1;
let currentQuery = "";

// ── DOM refs ─────────────────────────────────────────────────────
const searchInput = document.getElementById("search");
const searchBtn = document.querySelector(".search-btn");
const countEl = document.getElementById("count");
const listEl = document.getElementById("artwork-list");
const paginationEl = document.querySelector(".pagination");

// Filter elements
const filterToggleBtn = document.getElementById("filter-toggle");
const filterPanel = document.getElementById("filter-panel");
const departmentSelect = document.getElementById("filter-department");
const dateFromInput = document.getElementById("filter-date-from");
const dateToInput = document.getElementById("filter-date-to");
const mediumInput = document.getElementById("filter-medium");

const filterApplyBtn = document.getElementById("filter-apply");
const filterResetBtn = document.getElementById("filter-reset");
const activeFiltersEl = document.getElementById("active-filters");

// ── Populate department dropdown ─────────────────────────────────
DEPARTMENTS.forEach(({ id, label }) => {
  const opt = document.createElement("option");
  opt.value = id;
  opt.textContent = label;
  departmentSelect.appendChild(opt);
});

// ── Filter panel toggle ──────────────────────────────────────────
filterToggleBtn.addEventListener("click", () => {
  const open = filterPanel.classList.toggle("open");
  filterToggleBtn.setAttribute("aria-expanded", open);
  filterToggleBtn.querySelector(".filter-chevron").style.transform = open
    ? "rotate(180deg)"
    : "rotate(0deg)";
});

// ── Get current filter values ────────────────────────────────────
function getFilters() {
  return {
    department: departmentSelect.value,
    dateFrom: dateFromInput.value.trim(),
    dateTo: dateToInput.value.trim(),
    medium: mediumInput.value.trim(),
  };
}

// ── Build active filter tags ─────────────────────────────────────
function renderActiveTags(filters) {
  activeFiltersEl.innerHTML = "";
  const tags = [];

  if (filters.department) {
    tags.push({
      label: filters.department,
      clear: () => {
        departmentSelect.value = "";
      },
    });
  }
  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom || "…";
    const to = filters.dateTo || "…";
    tags.push({
      label: `${from} – ${to}`,
      clear: () => {
        dateFromInput.value = "";
        dateToInput.value = "";
      },
    });
  }
  if (filters.medium) {
    tags.push({
      label: filters.medium,
      clear: () => {
        mediumInput.value = "";
      },
    });
  }

  tags.forEach(({ label, clear }) => {
    const tag = document.createElement("button");
    tag.className = "filter-tag";
    tag.innerHTML = `${escHtml(label)} <span aria-hidden="true">×</span>`;
    tag.addEventListener("click", () => {
      clear();
      triggerSearch();
    });
    activeFiltersEl.appendChild(tag);
  });
}

// ── Build search URL ─────────────────────────────────────────────
function buildSearchUrl(query, filters, page) {
  const params = new URLSearchParams();
  params.set("fields", FIELDS);
  params.set("limit", PER_PAGE);
  params.set("page", page);

  // Only show public domain works (safe for display)
  params.set("query[term][is_public_domain]", "true");

  if (query) {
    params.set("q", query);
  }

  if (filters.department) {
    params.set("query[term][department_title.keyword]", filters.department);
  }

  if (filters.dateFrom) {
    params.set("query[range][date_start][gte]", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.set("query[range][date_end][lte]", filters.dateTo);
  }

  if (filters.medium) {
    params.set("query[match][medium_display]", filters.medium);
  }

  const endpoint = query ? "artworks/search" : "artworks";
  return `${BASE}/${endpoint}?${params.toString()}`;
}

// ── Search ───────────────────────────────────────────────────────
async function search(query, page = 1) {
  currentQuery = query.trim();
  currentPage = page;
  listEl.innerHTML = "";
  countEl.textContent = "Searching…";

  const filters = getFilters();
  renderActiveTags(filters);

  // Update filter toggle badge
  const activeCount = [
    filters.department,
    filters.dateFrom || filters.dateTo,
    filters.medium,
  ].filter(Boolean).length;
  const badge = filterToggleBtn.querySelector(".filter-badge");
  if (activeCount > 0) {
    badge.textContent = activeCount;
    badge.hidden = false;
  } else {
    badge.hidden = true;
  }

  try {
    const url = buildSearchUrl(currentQuery, filters, currentPage);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const artworks = data.data ?? [];
    const pagination = data.pagination ?? {};

    totalPages = pagination.total_pages ?? 1;
    const total = pagination.total ?? artworks.length;

    countEl.textContent = `${total.toLocaleString("de-CH")} results`;

    listEl.innerHTML = "";
    if (artworks.length === 0) {
      listEl.innerHTML =
        '<li style="padding:2rem;color:var(--muted)">No results found.</li>';
    } else {
      for (const art of artworks) {
        listEl.appendChild(buildItem(art));
      }
    }

    renderPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    countEl.textContent = "Error loading results. Please try again.";
    console.error("AIC API error:", err);
  }
}

function triggerSearch() {
  search(searchInput.value, 1);
}

// ── Build list item ───────────────────────────────────────────────
function buildItem(art) {
  const li = document.createElement("li");
  li.className = "artwork-item";

  let imgHtml;
  if (art.image_id) {
    const imgUrl = `${IIIF}/${art.image_id}/full/400,/0/default.jpg`;
    imgHtml = `<img class="artwork-img" src="${imgUrl}" alt="${escHtml(art.title)}" loading="lazy" />`;
  } else {
    imgHtml = `<div class="artwork-img-placeholder">No image</div>`;
  }

  const locationParts = [art.department_title, art.place_of_origin].filter(
    Boolean,
  );
  const locationStr = locationParts.length
    ? `<span class="artwork-location">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 13-8 13s-8-7-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
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
    <button class="btn-learn" aria-label="More about ${escHtml(art.title || "this artwork")}">
      More →
    </button>
  `;

  // "More →" öffnet Lightbox (nicht externe Seite)
  li.querySelector(".btn-learn").addEventListener("click", (e) => {
    e.stopPropagation();
    openLightbox(art);
  });

  // Klick auf die ganze Zeile öffnet ebenfalls Lightbox
  li.addEventListener("click", () => openLightbox(art));

  return li;
}

// ── Lightbox ──────────────────────────────────────────────────────
const lightboxEl = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxTitle = document.getElementById("lightbox-title");
const lightboxMeta = document.getElementById("lightbox-meta");
const lightboxLink = document.getElementById("lightbox-link");
const lightboxClose = document.getElementById("lightbox-close");

function openLightbox(art) {
  // Bild (grosse Version für Lightbox)
  if (art.image_id) {
    lightboxImg.src = `${IIIF}/${art.image_id}/full/843,/0/default.jpg`;
    lightboxImg.alt = art.title || "";
    lightboxImg.style.display = "block";
  } else {
    lightboxImg.style.display = "none";
  }

  // Titel
  lightboxTitle.textContent = art.title || "Untitled";

  // Meta-Felder — nur anzeigen wenn vorhanden
  const fields = [
    {
      label: "Artist",
      value: art.artist_display ? art.artist_display.split("\n")[0] : null,
    },
    { label: "Date", value: art.date_display },
    { label: "Medium", value: art.medium_display },
    { label: "Dimensions", value: art.dimensions },
    { label: "Department", value: art.department_title },
    { label: "Origin", value: art.place_of_origin },
    { label: "Credit", value: art.credit_line },
  ];

  lightboxMeta.innerHTML = fields
    .filter((f) => f.value)
    .map(
      (f) => `
      <div class="lightbox-meta-row">
        <span class="lightbox-meta-label">${f.label}</span>
        <span class="lightbox-meta-value">${escHtml(f.value)}</span>
      </div>`,
    )
    .join("");

  // Link zur AIC-Seite
  lightboxLink.href = `https://www.artic.edu/artworks/${art.id}`;

  // Öffnen
  lightboxEl.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightboxEl.classList.remove("open");
  document.body.style.overflow = "";
  // Bild zurücksetzen damit kein altes Bild kurz aufflackert
  setTimeout(() => {
    lightboxImg.src = "";
  }, 300);
}

// Close-Button
lightboxClose.addEventListener("click", closeLightbox);

// Klick auf Overlay (ausserhalb der Box) schliesst
lightboxEl.addEventListener("click", (e) => {
  if (e.target === lightboxEl) closeLightbox();
});

// ESC-Taste
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

// ── Pagination ────────────────────────────────────────────────────
function renderPagination() {
  paginationEl.innerHTML = "";
  if (totalPages <= 1) return;

  const pages = getPageNumbers(currentPage, totalPages);

  for (const p of pages) {
    if (p === "…") {
      const span = document.createElement("span");
      span.className = "page-dots";
      span.textContent = "…";
      paginationEl.appendChild(span);
    } else {
      const btn = document.createElement("button");
      btn.className = "page-btn" + (p === currentPage ? " active" : "");
      btn.textContent = p;
      btn.addEventListener("click", () => search(currentQuery, p));
      paginationEl.appendChild(btn);
    }
  }
}

function getPageNumbers(current, total) {
  const pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (current > 3) pages.push("…");
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  ) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

// ── Utils ─────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Events ────────────────────────────────────────────────────────
searchBtn.addEventListener("click", triggerSearch);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") triggerSearch();
});
filterApplyBtn.addEventListener("click", () => {
  filterPanel.classList.remove("open");
  filterToggleBtn.setAttribute("aria-expanded", "false");
  filterToggleBtn.querySelector(".filter-chevron").style.transform =
    "rotate(0deg)";
  triggerSearch();
});
filterResetBtn.addEventListener("click", () => {
  departmentSelect.value = "";
  dateFromInput.value = "";
  dateToInput.value = "";
  mediumInput.value = "";
  triggerSearch();
});

// ── Init ──────────────────────────────────────────────────────────
search("");
