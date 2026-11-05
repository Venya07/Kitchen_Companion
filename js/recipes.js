// Recipes page — owned by Developer 3.
import { initStorage, getRecipes, addRecipe, getInventory, toBaseUnit, UNITS } from "./storage.js";
import { renderNav } from "./navigation.js";
import { escapeHtml, showToast } from "./ui.js";

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

// ---------- Add recipe ----------

const dialogEl = document.getElementById("recipe-dialog");
const formEl = document.getElementById("recipe-form");
const errorEl = document.getElementById("recipe-error");
const unitCodes = UNITS.map((u) => u.code);

function lines(id) {
  return document.getElementById(id).value.split("\n").map((l) => l.trim()).filter(Boolean);
}

// Turns "200 g Flour" into { quantity: 200, unit: "g", name: "Flour" }, or null if it doesn't match.
function parseIngredient(line) {
  const match = line.match(/^(\d*\.?\d+)\s+(\S+)\s+(.+)$/);
  if (!match) return null;
  const unit = unitCodes.find((code) => code.toLowerCase() === match[2].toLowerCase());
  return unit ? { quantity: Number(match[1]), unit, name: match[3] } : null;
}

document.getElementById("add-recipe-btn").addEventListener("click", () => {
  formEl.reset();
  errorEl.textContent = "";
  dialogEl.showModal();
});

document.getElementById("recipe-cancel").addEventListener("click", () => dialogEl.close());

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("recipe-name").value.trim();
  const ingredientLines = lines("recipe-ingredients");
  const instructions = lines("recipe-instructions");

  if (!name) return (errorEl.textContent = "Enter a recipe name.");
  if (ingredientLines.length === 0) return (errorEl.textContent = "Add at least one ingredient.");

  const ingredients = [];
  for (const [i, line] of ingredientLines.entries()) {
    const ingredient = parseIngredient(line);
    if (!ingredient) {
      errorEl.textContent = `Ingredient line ${i + 1} should look like "200 g Flour". Units: ${unitCodes.join(", ")}.`;
      return;
    }
    ingredients.push(ingredient);
  }

  if (instructions.length === 0) return (errorEl.textContent = "Add at least one step.");

  try {
    const recipe = addRecipe({
      name,
      description: document.getElementById("recipe-description").value.trim(),
      prepTime: Number(document.getElementById("recipe-prep").value) || 0,
      cookTime: Number(document.getElementById("recipe-cook").value) || 0,
      servings: Number(document.getElementById("recipe-servings").value) || 1,
      ingredients,
      instructions,
    });
    dialogEl.close();
    renderList();
    showToast(`${recipe.name} added`);
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

initStorage();
renderNav();
renderList();
