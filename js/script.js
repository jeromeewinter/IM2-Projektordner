console.log("blub");

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

    // loadArtworks(page); // ← API-Anbindung hier einkommentieren
  });
});

// ── API-Anbindung (später aktivieren) ──
//
// async function loadArtworks(page = 1) {
//   try {
//     const res = await fetch(
//       `https://api.artic.edu/api/v1/artworks?page=${page}&limit=4`
//     );
//     const data = await res.json();
//     console.log('API-Daten geladen:', data);
//
//     const list = document.getElementById('artwork-list');
//     list.innerHTML = data.data.map(item => `
//       <li class="artwork-item">
//         ${item.image_id
//           ? `<img class="artwork-img"
//                src="https://www.artic.edu/iiif/2/${item.image_id}/full/200,/0/default.jpg"
//                alt="${item.title}">`
//           : `<div class="artwork-img-placeholder">Kein Bild</div>`
//         }
//         <div class="artwork-info">
//           <span class="artwork-artist">${item.artist_title ?? 'Unbekannt'}</span>
//           <h2 class="artwork-title">${item.title}</h2>
//           <span class="artwork-location">
//             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
//               <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
//               <circle cx="12" cy="9" r="2.5"/>
//             </svg>
//             Art Institute Chicago
//           </span>
//         </div>
//         <button class="btn-learn">Learn more</button>
//       </li>
//     `).join('');
//
//   } catch (error) {
//     console.error('Fehler beim Laden der API:', error);
//   }
// }
//
// loadArtworks();
