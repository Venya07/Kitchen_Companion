// Recipes page — owned by Developer 3.
import { initStorage, getRecipes, getInventory, toBaseUnit } from "./storage.js";
import { renderNav } from "./navigation.js";
import { escapeHtml } from "./ui.js";

const listEl = document.getElementById("recipe-list");
const searchEl = document.getElementById("recipe-search");

// An ingredient is "available" if inventory has an item with the same name
// and enough of it in a compatible unit (mass vs mass, volume vs volume, count vs count).
// Incompatible units (e.g. "pcs" vs "g") are treated as NOT available.
function isAvailable(ingredient, inventory) {
  const item = inventory.find((i) => i.name.toLowerCase() === ingredient.name.toLowerCase());
  if (!item) return false;
  const have = toBaseUnit(item.quantity, item.unit);
  const need = toBaseUnit(ingredient.quantity, ingredient.unit);
  return Boolean(have && need && have.group === need.group && have.amount >= need.amount);
}

function renderList() {
  const query = searchEl.value.trim().toLowerCase();
  const inventory = getInventory();
  const recipes = getRecipes().filter((r) => r.name.toLowerCase().includes(query));

  if (recipes.length === 0) {
    listEl.innerHTML = `<li class="empty-state">No recipes found.</li>`;
    return;
  }

  // TODO (Developer 3): open a recipe detail view with instructions and an
  // "Add missing to shopping list" button that calls addShoppingItem.
  listEl.innerHTML = recipes
    .map((recipe) => {
      const haveCount = recipe.ingredients.filter((ing) => isAvailable(ing, inventory)).length;
      const total = recipe.ingredients.length;
      const badge = haveCount === total ? "badge-success" : "badge-warning";
      return `
      <li class="card">
        <p class="card-title">${escapeHtml(recipe.name)}</p>
        <p class="text-muted">${escapeHtml(recipe.description)}</p>
        <div class="recipe-meta">
          <span class="text-muted">${recipe.prepTime + recipe.cookTime} min · Serves ${recipe.servings}</span>
          <span class="badge ${badge}">${haveCount}/${total} ingredients</span>
        </div>
      </li>`;
    })
    .join("");
}

searchEl.addEventListener("input", renderList);

initStorage();
renderNav();
renderList();
