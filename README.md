# Kitchen Companion

CMSC434 Phase 2 — a mobile-style web app for managing shared kitchen inventory, shopping lists, and recipes.

Plain HTML, CSS, and vanilla JavaScript (ES modules). Data is saved in `localStorage`. No frameworks, no backend, no internet needed.

## Run locally

ES modules don't load from `file://`, so use a local server:

- **VS Code:** install the Live Server extension, right-click `index.html` → *Open with Live Server*
- **Or terminal:** `python3 -m http.server` then open http://localhost:8000

Use browser dev tools' mobile view (~393 × 852) to see the intended layout.

To reset sample data: open the browser console and run `localStorage.clear()`, then refresh.

## Folder structure

```text
index.html              Inventory page (app opens here)
pages/shopping.html     Shopping page
pages/recipes.html      Recipes page
css/global.css          Shared design system (colors, buttons, cards, forms, nav)
css/<feature>.css       Page-specific styles
js/storage.js           Shared data layer (localStorage) — all data goes through here
js/navigation.js        Shared bottom nav
js/ui.js                Shared helpers (escapeHtml, showToast)
js/<feature>.js         Page logic
data/                   Sample data loaded on first run
docs/PROJECT_SPEC.md    Full project requirements
```

## Who owns what

| Developer | Feature   | Files you edit                                                  |
|-----------|-----------|-----------------------------------------------------------------|
| Dev 1     | Inventory | `index.html`, `js/inventory.js`, `css/inventory.css`            |
| Dev 2     | Shopping  | `pages/shopping.html`, `js/shopping.js`, `css/shopping.css`     |
| Dev 3     | Recipes   | `pages/recipes.html`, `js/recipes.js`, `css/recipes.css`        |

**Shared files** (`global.css`, `storage.js`, `navigation.js`, `ui.js`, `data/`): tell the team before changing these, and keep changes in a separate small PR.

Look for `TODO (Developer N)` comments in your JS file for where to start.

## Git workflow

```bash
git checkout main && git pull
git checkout -b feature/inventory     # or feature/shopping, feature/recipes
# ...work, then:
git add . && git commit -m "Describe change"
git push -u origin feature/inventory
```

Open a pull request into `main` on GitHub and have one teammate review it. Pull `main` into your branch often to avoid conflicts:

```bash
git checkout feature/inventory && git pull origin main
```

## Shared data (js/storage.js)

Import only what you need:

```javascript
import { getInventory, addShoppingItem } from "./storage.js";
```

| Function | What it does |
|----------|--------------|
| `initStorage()` | Loads sample data on first visit only (call once per page) |
| `getInventory()` / `saveInventory(list)` | Read / overwrite inventory |
| `addInventoryItem(item)` / `updateInventoryItem(id, changes)` / `deleteInventoryItem(id)` | Inventory CRUD |
| `getShoppingList()` / `saveShoppingList(list)` | Read / overwrite shopping list |
| `addShoppingItem(item)` / `updateShoppingItem(id, changes)` / `deleteShoppingItem(id)` | Shopping CRUD |
| `getRecipes()` | Read recipes |
| `isLowStock(item)` | `true` if quantity ≤ lowStockThreshold |
| `toBaseUnit(quantity, unit)` | Converts to g / mL / pcs for comparisons |
| `LOCATIONS`, `UNITS` | Allowed storage locations and units for dropdowns |

`add*` functions create the `id` for you and throw an `Error` if the name, quantity, or unit is invalid — catch it and show the message to the user.

**Inventory item**
```javascript
{ id: "item-001", name: "Milk", quantity: 500, unit: "mL", location: "Refrigerator",
  expirationDate: "2026-11-05", lowStockThreshold: 200, isShared: true, owner: null }
```

**Shopping item**
```javascript
{ id: "shopping-001", name: "Flour", quantity: 1, unit: "kg", purchased: false, source: "manual" }
```

**Recipe**
```javascript
{ id: "recipe-001", name: "Pancakes", description: "...", prepTime: 10, cookTime: 15, servings: 4,
  ingredients: [{ name: "Flour", quantity: 200, unit: "g" }], instructions: ["..."] }
```

**Units:** always store the short code (`pcs`, `g`, `kg`, `mL`, `L`, `oz`, `lb`, `cup`, `tbsp`, `tsp`). Quantities are only compared within the same group (mass, volume, or count) — e.g. `g` vs `pcs` is never treated as a match.

## Current status

**Working now:** navigation between all three pages, sample data, inventory search + location filters, low-stock badges, shopping checkboxes (saved), low-stock suggestions, recipe search, ingredient availability count.

**To build:**
- Dev 1 — add / edit / delete inventory items, expiration warnings
- Dev 2 — add / remove shopping items, add suggestions to list, move purchased items to inventory
- Dev 3 — recipe detail view, missing-ingredient list, add missing ingredients to shopping list
