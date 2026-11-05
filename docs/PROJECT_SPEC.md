# Kitchen Companion — Foundation Requirements

Kitchen Companion is a CMSC434 kitchen-management prototype for shared households, developed across inventory, shopping, and recipes.

This document records the original Phase 2 foundation requirements. The Phase 2.1 prototype has since moved to a single-page app with plain scripts so it can open directly from disk. File names, ES-module requirements, design tokens, and viewport dimensions below describe the earlier foundation; see [README.md](../README.md) for the current structure, [style-guide.html](../style-guide.html) for the current visual design, and [TASKS.md](../TASKS.md) for the current task coverage and demo instructions.

The foundation scope covered shared navigation, styling, persistence, and starter screens, with feature development divided among three developers.

## 1. Technology Requirements

Use ONLY:
- HTML5
- CSS3
- Vanilla JavaScript (ES6+)
- Browser localStorage for data persistence

Do NOT use:
- React
- Vue
- Angular
- TypeScript
- Node.js backend
- External databases
- Firebase
- Supabase
- Bootstrap
- Tailwind CSS

The application must work offline without requiring internet access.

Use relative paths for all assets, scripts, stylesheets, and navigation links.

The project should be runnable using a local development server such as VS Code Live Server, but it must not depend on a backend.

## 2. Original Folder Structure

```text
kitchen-companion/
│
├── index.html
│
├── pages/
│   ├── shopping.html
│   └── recipes.html
│
├── css/
│   ├── global.css
│   ├── inventory.css
│   ├── shopping.css
│   └── recipes.css
│
├── js/
│   ├── storage.js
│   ├── navigation.js
│   ├── inventory.js
│   ├── shopping.js
│   └── recipes.js
│
├── data/
│   ├── sampleInventory.js
│   └── sampleRecipes.js
│
├── assets/
│   ├── icons/
│   └── images/
│
├── README.md
└── .gitignore
```

## 3. Application Overview

Kitchen Companion helps people who share kitchens manage their food and coordinate grocery shopping.

The application has three primary feature sets:

### Feature 1: Kitchen Inventory

Owned by Developer 1.

Required user capabilities:
- View all kitchen inventory.
- Add food items.
- Edit food items.
- Delete food items.
- Specify quantities and measurement units.
- Track expiration dates.
- Identify low-stock items.
- Assign storage locations.
- Mark items as personal or shared.

Storage locations:
- Refrigerator
- Freezer
- Pantry
- Cupboard
- Other

Measurement units:
- Pieces
- Grams
- Kilograms
- Milliliters
- Liters
- Ounces
- Pounds
- Cups
- Tablespoons
- Teaspoons

### Feature 2: Shopping List

Owned by Developer 2.

Required user capabilities:
- View their shopping list.
- Add grocery items.
- Enter quantities and units.
- Mark items as purchased.
- Remove items.
- See suggested purchases based on low inventory.
- Add purchased items to inventory.

### Feature 3: Recipes

Owned by Developer 3.

Required user capabilities:
- Browse recipes.
- Search recipes.
- View recipe ingredients.
- View cooking instructions.
- Identify missing ingredients.
- See which ingredients are already available.
- Add missing ingredients to the shopping list.

All three feature sets must be able to share data.

## 4. Visual Design System

The interface should be readable, consistent, and suitable for a mobile kitchen-management app.

Original design tokens:

Primary green: #2E7D5B

Secondary sage: #A8C9B0

Background: #F8FAF7

Surface: #FFFFFF

Accent orange: #F4A261

Primary text: #263238

Secondary text: #66757F

Border: #E1E8E2

Error: #C94C4C

Success: #2E7D5B

Typography:
- Use a local/system font stack.
- Main page headings: 26px
- Section headings: 20px
- Body text: 16px
- Secondary text: 14px
- Navigation labels: 13px

Shared CSS components:
- Buttons
- Cards
- Forms
- Inputs
- Dropdowns
- Badges
- Modals
- Navigation
- Empty states
- Alerts

Use CSS variables in global.css.

Do not use external fonts, icon CDNs, or online images. Use local SVG icons where appropriate.

## 5. Mobile Layout

Design primarily for a mobile viewport approximately 393px wide and 852px tall.

The application should:
- Be mobile-first.
- Have realistic padding and spacing.
- Use readable font sizes.
- Support vertical scrolling.
- Avoid horizontal overflow.
- Have a fixed bottom navigation bar.
- Respect mobile safe areas.
- Remain usable on desktop screens.

Do not create a separate welcome screen.

The application should open directly to Kitchen Inventory.

## 6. Shared Bottom Navigation

The shared navigation has three tabs:

1. Inventory
2. Shopping
3. Recipes

Each tab must have:
- A recognizable SVG icon.
- A text label.
- An active state.
- A working navigation link.

The navigation should appear consistently across all three pages.

Navigation links must work correctly from both the root directory and the pages directory.

## 7. Shared Data Model

The original storage.js module centralizes application data in localStorage.

Use a consistent inventory item structure:

```javascript
{
  id: "item-001",
  name: "Milk",
  quantity: 500,
  unit: "mL",
  location: "Refrigerator",
  expirationDate: "2026-11-05",
  lowStockThreshold: 200,
  isShared: true,
  owner: null
}
```

Shopping list item structure:

```javascript
{
  id: "shopping-001",
  name: "Flour",
  quantity: 1,
  unit: "kg",
  purchased: false,
  source: "manual"
}
```

Recipe structure:

```javascript
{
  id: "recipe-001",
  name: "Pancakes",
  description: "Classic homemade pancakes",
  prepTime: 10,
  cookTime: 15,
  servings: 4,
  ingredients: [
    {
      name: "Flour",
      quantity: 200,
      unit: "g"
    }
  ],
  instructions: [
    "Combine dry ingredients.",
    "Mix wet ingredients.",
    "Cook pancakes in a skillet."
  ]
}
```

Original shared data API:

- getInventory()
- saveInventory()
- addInventoryItem()
- updateInventoryItem()
- deleteInventoryItem()
- getShoppingList()
- saveShoppingList()
- addShoppingItem()
- updateShoppingItem()
- deleteShoppingItem()
- getRecipes()

Use stable unique identifiers for new records.

Validate data before saving.

Ensure that missing or corrupted localStorage data does not crash the application.

Provide sample inventory, shopping, and recipe data.

Initialize sample data only when storage has not previously been initialized. Do not overwrite user changes on refresh.

For recipe ingredient matching, document how measurement units and quantities will be compared. Do not silently treat incompatible units as equivalent.

## 8. Starter Pages

The foundation included three functional starter pages.

### Inventory — index.html

Include:
- Page heading: "My Kitchen"
- Search input
- Storage location filters
- Sample inventory cards
- Quantity and unit labels
- Expiration date labels
- Low-stock indicators
- Add Item button

The layout should use the shared visual styles.

Developer 1 owns the inventory integration points.

### Shopping — shopping.html

Include:
- Page heading: "Shopping List"
- Sample shopping items
- Purchased/unpurchased visual states
- Add Item button
- Suggested Items section

Developer 2 owns the shopping integration points.

### Recipes — recipes.html

Include:
- Page heading: "Recipes"
- Recipe search input
- Sample recipe cards
- Recipe names
- Cooking times
- Ingredient availability indicators

Developer 3 owns the recipe integration points.

All pages must load without JavaScript errors.

## 9. Collaboration Requirements

Original feature-branch plan:

- feature/inventory
- feature/shopping
- feature/recipes

The collaboration plan places the shared foundation on main before feature development.

Do not put all application logic in one JavaScript file.

Keep shared functions in storage.js.

Use ES modules with explicit imports and exports.

## 10. Accessibility and Usability

Implement:
- Semantic HTML
- Accessible labels for form controls
- Keyboard-accessible buttons
- Visible focus indicators
- Adequate color contrast
- Touch-friendly interactive elements
- Clear error messages
- Consistent navigation

The interface should prioritize clarity and usability.

## 11. Prototype Scope

The app runs offline without a backend, external dependencies, or authentication. Unfinished features must be visibly marked as unavailable rather than appearing functional.

## 12. Verification

Foundation verification checklist:

1. Check that all required files exist.
2. Verify that relative paths are correct.
3. Check that JavaScript modules import correctly.
4. Verify navigation between all three pages.
5. Verify that sample data loads.
6. Verify that localStorage persists changes.
7. Verify the mobile layout.
8. Check for JavaScript errors.
9. Confirm no network resources are required.
