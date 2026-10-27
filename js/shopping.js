// Shopping page — owned by Developer 2.
import { initStorage, getShoppingList, updateShoppingItem, getInventory, isLowStock } from "./storage.js";
import { renderNav } from "./navigation.js";
import { escapeHtml, showToast } from "./ui.js";

const listEl = document.getElementById("shopping-list");
const suggestedEl = document.getElementById("suggested-list");

function renderList() {
  const items = getShoppingList();

  if (items.length === 0) {
    listEl.innerHTML = `<li class="empty-state">Your shopping list is empty.</li>`;
    return;
  }

  listEl.innerHTML = items
    .map(
      (item) => `
      <li class="card shopping-card${item.purchased ? " purchased" : ""}">
        <label class="shopping-check">
          <input type="checkbox" data-id="${item.id}" ${item.purchased ? "checked" : ""}>
          <span class="shopping-name">${escapeHtml(item.name)}</span>
        </label>
        <span class="text-muted">${item.quantity} ${escapeHtml(item.unit)}</span>
      </li>`
    )
    .join("");
}

function renderSuggestions() {
  const onList = new Set(getShoppingList().map((item) => item.name.toLowerCase()));
  const lowItems = getInventory().filter((item) => isLowStock(item) && !onList.has(item.name.toLowerCase()));

  if (lowItems.length === 0) {
    suggestedEl.innerHTML = `<li class="empty-state">Nothing is running low.</li>`;
    return;
  }

  // TODO (Developer 2): add an "Add to list" button that calls addShoppingItem with source: "suggested".
  suggestedEl.innerHTML = lowItems
    .map(
      (item) => `
      <li class="card shopping-card">
        <span class="shopping-name">${escapeHtml(item.name)}</span>
        <span class="badge badge-warning">${item.quantity} ${escapeHtml(item.unit)} left</span>
      </li>`
    )
    .join("");
}

listEl.addEventListener("change", (e) => {
  if (e.target.type !== "checkbox") return;
  updateShoppingItem(e.target.dataset.id, { purchased: e.target.checked });
  renderList();
});

// TODO (Developer 2): open an add form and call addShoppingItem.
document.getElementById("add-item-btn").addEventListener("click", () => {
  showToast("Add Item is coming soon.");
});

initStorage();
renderNav();
renderList();
renderSuggestions();
