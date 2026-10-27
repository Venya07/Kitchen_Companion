// Inventory (home) page — owned by Developer 1.
import { initStorage, getInventory, isLowStock } from "./storage.js";
import { renderNav } from "./navigation.js";
import { escapeHtml, showToast } from "./ui.js";

const listEl = document.getElementById("inventory-list");
const searchEl = document.getElementById("inventory-search");

// One icon per storage location, so the icon next to each item means something.
const LOCATION_ICONS = {
  Refrigerator: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 10h12M9 6v2M9 13v3"/>',
  Freezer: '<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/>',
  Pantry: '<rect x="5" y="7" width="14" height="14" rx="2"/><path d="M8 3h8v4H8z"/>',
  Cupboard: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 4v16M9.5 11v2M14.5 11v2"/>',
  Other: '<circle cx="12" cy="12" r="8"/>',
};

function renderList() {
  const query = searchEl.value.trim().toLowerCase();
  const items = getInventory().filter((item) => item.name.toLowerCase().includes(query));

  if (items.length === 0) {
    listEl.innerHTML = `<li class="empty-state">No items found.</li>`;
    return;
  }

  listEl.innerHTML = items
    .map(
      (item) => `
      <li class="inventory-row">
        <svg class="inventory-icon" viewBox="0 0 24 24" role="img" aria-label="${escapeHtml(item.location)}">
          ${LOCATION_ICONS[item.location] ?? LOCATION_ICONS.Other}
        </svg>
        <div class="inventory-info">
          <span class="inventory-name">${escapeHtml(item.name)}</span>
          <span class="text-muted">${escapeHtml(item.location)}${item.isShared ? "" : " · Personal"}</span>
        </div>
        <div class="inventory-qty">
          <span>${item.quantity} ${escapeHtml(item.unit)}</span>
          ${isLowStock(item) ? `<span class="badge badge-warning">Low</span>` : ""}
        </div>
      </li>`
    )
    .join("");
}

searchEl.addEventListener("input", renderList);

// TODO (Developer 1): open an add/edit form and call addInventoryItem / updateInventoryItem.
document.getElementById("add-item-btn").addEventListener("click", () => {
  showToast("Add Item is coming soon.");
});

initStorage();
renderNav();
renderList();
