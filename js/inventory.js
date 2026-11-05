// Inventory (home) page — owned by Developer 1.
import { initStorage, getInventory, updateInventoryItem } from "./storage.js";
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
      <li>
        <button class="inventory-row" type="button" data-id="${item.id}" aria-label="Edit ${escapeHtml(item.name)}, ${item.quantity} ${escapeHtml(item.unit)}">
          <svg class="inventory-icon" viewBox="0 0 24 24" aria-hidden="true">
            ${LOCATION_ICONS[item.location] ?? LOCATION_ICONS.Other}
          </svg>
          <span class="inventory-info">
            <span class="inventory-name">${escapeHtml(item.name)}</span>
            <span class="text-muted">${escapeHtml(item.location)}${item.isShared ? "" : " · Personal"}</span>
          </span>
          <span class="inventory-qty">
            <span>${item.quantity} ${escapeHtml(item.unit)}</span>
          </span>
        </button>
      </li>`
    )
    .join("");
}

searchEl.addEventListener("input", renderList);

// ---------- Edit quantity ----------

const dialogEl = document.getElementById("edit-dialog");
const formEl = document.getElementById("edit-form");
const quantityEl = document.getElementById("edit-quantity");
const errorEl = document.getElementById("edit-error");
let editingId = null;

listEl.addEventListener("click", (e) => {
  const row = e.target.closest(".inventory-row");
  if (!row) return;
  const item = getInventory().find((i) => i.id === row.dataset.id);
  if (!item) return;

  editingId = item.id;
  document.getElementById("edit-title").textContent = `Edit ${item.name}`;
  document.getElementById("edit-unit").textContent = item.unit;
  quantityEl.value = item.quantity;
  errorEl.textContent = "";
  dialogEl.showModal();
  quantityEl.select();
});

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const quantity = Number(quantityEl.value);
  if (quantityEl.value.trim() === "" || !Number.isFinite(quantity) || quantity < 0) {
    errorEl.textContent = "Enter a quantity of 0 or more.";
    return;
  }
  const updated = updateInventoryItem(editingId, { quantity });
  dialogEl.close();
  renderList();
  if (updated) showToast(`${updated.name} updated to ${updated.quantity} ${updated.unit}`);
});

document.getElementById("edit-cancel").addEventListener("click", () => dialogEl.close());

// TODO (Developer 1): open an add/edit form and call addInventoryItem / updateInventoryItem.
document.getElementById("add-item-btn").addEventListener("click", () => {
  showToast("Add Item is coming soon.");
});

initStorage();
renderNav();
renderList();
