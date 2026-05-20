console.log("blub");
// -- Search Bar -- //
function handleSearch(value) {
  console.log("Suche ausgeführt:", value);
  console.log("Suchfeld geleert");
}

const input = document.getElementById("search");

input.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    handleSearch(this.value);
    this.value = "";
  }
});

document.querySelector(".search-btn").addEventListener("click", function () {
  handleSearch(input.value);
  input.value = "";
});

localStorage.removeItem("suchverlauf"); // einzelnen Eintrag löschen

console.log(document.getElementById("search"));

// ── Pagination ──
const pageButtons = document.querySelectorAll(".page-btn");

pageButtons.forEach((btn) => {
  btn.addEventListener("click", function () {
    pageButtons.forEach((b) => b.classList.remove("active"));
    this.classList.add("active");

    const page = parseInt(this.textContent);
    console.log("Seite gewechselt zu:", page);

    loadArtworks(page);
  });
});

import { DotLottie } from "https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm";

const dotLottie = new DotLottie({
  autoplay: false,
  loop: false,
  canvas: document.getElementById("logo-lottie"),
  src: "https://lottie.host/a4d7017e-0f9f-4794-a832-457c4d56a1e1/wy2aqUPHpH.lottie",
});

document.getElementById("logo-lottie").addEventListener("mouseenter", () => {
  dotLottie.setFrame(0);
  dotLottie.play();
});

// ── API-Anbindung ──

async function loadArtworks(page = 1) {
  try {
    // ── AIC ──
    const resAic = await fetch(
      `https://api.artic.edu/api/v1/artworks?page=${page}&limit=4`,
    );
    const dataAic = await resAic.json();

    // ── Met Museum ──
    // Schritt 1: IDs holen (Met hat kein direktes page/limit, daher slice)
    const resMet = await fetch(
      `https://corsproxy.io/?url=https://collectionapi.metmuseum.org/public/collection/v1/search?q=painting&hasImages=true`,
    );
    const dataMet = await resMet.json();
    const ids = dataMet.objectIDs.slice((page - 1) * 4, page * 4);

    // Schritt 2: Details für jede ID laden
    const metArtworks = await Promise.all(
      ids.map((id) =>
        fetch(
          `https://corsproxy.io/?url=https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`,
        ).then((r) => r.json()),
      ),
    );

    // ── Beide ins HTML schreiben ──
    const list = document.getElementById("artwork-list");

    const aicHtml = dataAic.data
      .map(
        (item) => `
      <li class="artwork-item">
        ${
          item.image_id
            ? `<img class="artwork-img"
               src="https://www.artic.edu/iiif/2/${item.image_id}/full/200,/0/default.jpg"
               alt="${item.title}">`
            : `<div class="artwork-img-placeholder">Kein Bild</div>`
        }
        <div class="artwork-info">
          <span class="artwork-artist">${item.artist_title ?? "Unbekannt"}</span>
          <h2 class="artwork-title">${item.title}</h2>
          <span class="artwork-location">Art Institute Chicago</span>
        </div>
        <button class="btn-learn">Learn more</button>
      </li>
    `,
      )
      .join("");

    const metHtml = metArtworks
      .filter((obj) => obj.primaryImageSmall) // nur Werke mit Bild
      .map(
        (obj) => `
        <li class="artwork-item">
          <img class="artwork-img" src="${obj.primaryImageSmall}" alt="${obj.title}">
          <div class="artwork-info">
            <span class="artwork-artist">${obj.artistDisplayName || "Unbekannt"}</span>
            <h2 class="artwork-title">${obj.title}</h2>
            <span class="artwork-location">Met Museum New York</span>
          </div>
          <button class="btn-learn">Learn more</button>
        </li>
      `,
      )
      .join("");

    list.innerHTML = aicHtml + metHtml;
  } catch (error) {
    console.error("Fehler beim Laden der API:", error);
  }
}

loadArtworks();
