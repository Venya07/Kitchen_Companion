# Kitchen Companion

CMSC434 Phase 2.1 medium-fidelity prototype: a kitchen management app for shared households
(inventory, shopping and restocking, recipes and cooking).

## Run it

Double-click `index.html` and open it in Chrome. It works offline: no server, no install, no internet.
Plain HTML/CSS/JavaScript; data is stored in the browser's `localStorage` and seeded with demo data on first load.
Reset it any time from **Household → Reset demo data**.

See **[TASKS.md](TASKS.md)** for the task list, exact steps, demo data, and device-sizing instructions.
The style guide is in **`style-guide.html`** (open it directly). Screenshots are in `docs/screenshots/`.

## Files

```text
index.html          Device frame (640x960) + app shell
style-guide.html    Colors, type scale, icons, components
css/style.css       All styles; color tokens with contrast ratios in :root
js/icons.js         Inline SVG icon sprite (defined once, used everywhere)
js/data.js          Units + conversion, dates, seed data, storage, undo snapshots, shared calculations
js/ui.js            Router (back stack per tab), top bar, nav, FAB, toasts, dialogs, soft keyboard, HTML helpers
js/kitchen.js       Kitchen inventory screens (T1–T4, stock alerts)
js/shopping.js      Shopping list, restock suggestions, put-away flow (T5–T8)
js/recipes.js       Recipes, plan a meal, add missing, cook mode (T9–T12)
js/household.js     Household screen
js/app.js           Boot
assets/             Keyboard and numeric keypad images (SVG)
```

Scripts are plain `<script>` tags (no ES modules, since Chrome blocks them on `file://`).
