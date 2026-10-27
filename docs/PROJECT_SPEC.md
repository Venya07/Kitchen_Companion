# Kitchen Companion — CMSC434 Phase 2 Project Setup

You are helping initialize a collaborative web application called **Kitchen Companion**

We have three developers collaborating through GitHub. We are creating a medium-fidelity, interactive mobile-style web application for managing household food inventory, shopping lists, and recipes.

Your immediate task is to **initialize the complete project structure, shared design system, navigation, and reusable data infrastructure** so each developer can independently implement their assigned feature.

Do not implement every feature completely yet. Create a polished, working foundation with starter pages and clearly defined integration points.

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

## 2. Create This Folder Structure

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

If you identify additional shared files that would improve maintainability, you may create them, but explain their purpose.

## 3. Application Overview

Kitchen Companion helps people who share kitchens manage their food and coordinate grocery shopping.

The application has three primary feature sets:

### Feature 1: Kitchen Inventory

Owned by Developer 1.

Users will eventually be able to:
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

Users will eventually be able to:
- View their shopping list.
- Add grocery items.
- Enter quantities and units.
- Mark items as purchased.
- Remove items.
- See suggested purchases based on low inventory.
- Add purchased items to inventory.

### Feature 3: Recipes

Owned by Developer 3.

Users will eventually be able to:
- Browse recipes.
- Search recipes.
- View recipe ingredients.
- View cooking instructions.
- Identify missing ingredients.
- See which ingredients are already available.
- Add missing ingredients to the shopping list.

All three feature sets must be able to share data.

## 4. Visual Design System

Create a modern, realistic mobile application interface.

The app should resemble a polished consumer kitchen-management application rather than a basic student HTML project.

Use these design tokens:

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

Create reusable CSS classes for:
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

Create a reusable navigation component with three tabs:

1. Inventory
2. Shopping
3. Recipes

Each tab must have:
- A recognizable SVG icon.
- A text label.
- An active state.
- A working navigation link.

The navigation should appear consistently across all three pages.

Avoid duplicating navigation logic unnecessarily.

Navigation links must work correctly from both the root directory and the pages directory.

## 7. Shared Data Model

Create a reusable storage.js module that manages application data using localStorage.

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

Implement reusable functions for:

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

Create three functional starter pages.

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

The layout should be realistic and visually polished.

Leave clear integration points for Developer 1 to implement full inventory management.

### Shopping — shopping.html

Include:
- Page heading: "Shopping List"
- Sample shopping items
- Purchased/unpurchased visual states
- Add Item button
- Suggested Items section

Leave clear integration points for Developer 2.

### Recipes — recipes.html

Include:
- Page heading: "Recipes"
- Recipe search input
- Sample recipe cards
- Recipe names
- Cooking times
- Ingredient availability indicators

Leave clear integration points for Developer 3.

All pages must load without JavaScript errors.

## 9. Collaboration Requirements

We are using GitHub with three feature branches:

- feature/inventory
- feature/shopping
- feature/recipes

The shared foundation will be committed to main before feature development begins.

Organize the code so developers can work primarily within their assigned files.

Do not put all application logic in one JavaScript file.

Keep shared functions in storage.js.

Use ES modules with explicit imports and exports.

Document which files each developer should edit.

Avoid creating unnecessary dependencies between feature-specific JavaScript files.

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

## 11. README Documentation

Create a README.md containing:

1. Project overview.
2. Technology stack.
3. Folder structure.
4. Instructions for running locally.
5. Team responsibilities.
6. GitHub branching workflow.
7. Shared data model.
8. How to add new features.
9. How to test offline.
10. Current functionality versus planned functionality.

Include instructions for creating feature branches and opening pull requests.

## 12. Implementation Scope

For this initial setup:

DO:
- Create every required file.
- Implement the shared CSS design system.
- Implement working navigation.
- Implement localStorage utilities.
- Add realistic sample data.
- Build visually polished starter screens.
- Ensure all pages load correctly.
- Document the project structure.

DO NOT:
- Fully implement all three feature sets.
- Create a backend.
- Add external dependencies.
- Implement unnecessary authentication.
- Build unrelated features.
- Add nonfunctional buttons that appear to work without providing feedback.

If a feature is not implemented yet, clearly mark it as a placeholder or disable its control.

## 13. Final Verification

After creating the project:

1. Check that all required files exist.
2. Verify that relative paths are correct.
3. Check that JavaScript modules import correctly.
4. Verify navigation between all three pages.
5. Verify that sample data loads.
6. Verify that localStorage persists changes.
7. Verify the mobile layout.
8. Check for JavaScript errors.
9. Confirm no network resources are required.

If browser testing is unavailable, clearly identify what still requires manual testing rather than claiming it has been verified.

## 14. Final Output

When finished, provide:

- A summary of files created.
- An explanation of the architecture.
- Instructions for running the application.
- Which files each teammate owns.
- Which functionality is already working.
- Which functionality still needs implementation.
- Any integration considerations for the three developers.

Start by examining the existing repository.

If files already exist, preserve working code and integrate with the existing structure rather than overwriting it.

Then implement the shared project foundation.