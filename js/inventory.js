// Inventory page — owned by Developer 1.
import { initStorage, getInventory, isLowStock, LOCATIONS } from "./storage.js";
import { renderNav } from "./navigation.js";
import { escapeHtml, showToast } from "./ui.js";

const listEl = document.getElementById("inventory-list");
const searchEl = document.getElementById("inventory-search");
const filtersEl = document.getElementById("location-filters");

let activeLocation = "All";

function renderFilters() {
  filtersEl.innerHTML = ["All", ...LOCATIONS]
    .map((loc) => `<button type="button" class="chip" data-location="${loc}" aria-pressed="${loc === activeLocation}">${loc}</button>`)
    .join("");
}

function renderList() {
  const query = searchEl.value.trim().toLowerCase();
  const items = getInventory().filter(
    (item) =>
      (activeLocation === "All" || item.location === activeLocation) &&
      item.name.toLowerCase().includes(query)
  );

  if (items.length === 0) {
    listEl.innerHTML = `<li class="empty-state">No items found.</li>`;
    return;
  }

  listEl.innerHTML = items
    .map(
      (item) => `
      <li class="card inventory-card">
        <div>
          <p class="card-title">${escapeHtml(item.name)}</p>
          <p class="text-muted">${escapeHtml(item.location)}${item.expirationDate ? ` · Expires ${item.expirationDate}` : ""}</p>
        </div>
        <div class="inventory-meta">
          <span class="inventory-qty">${item.quantity} ${escapeHtml(item.unit)}</span>
          ${isLowStock(item) ? `<span class="badge badge-warning">Low stock</span>` : ""}
          ${item.isShared ? "" : `<span class="badge">Personal</span>`}
        </div>
      </li>`
    )
    .join("");
}

filtersEl.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  activeLocation = chip.dataset.location;
  renderFilters();
  renderList();
});

searchEl.addEventListener("input", renderList);

// TODO (Developer 1): open an add/edit form and call addInventoryItem / updateInventoryItem.
document.getElementById("add-item-btn").addEventListener("click", () => {
  showToast("Add Item is coming soon.");
});

initStorage();
renderNav();
renderFilters();
renderList();
