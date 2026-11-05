# Kitchen Companion — Task List (Phase 2.1 prototype)

## Running a test session

1. Unzip the folder anywhere. No installation, server, or internet connection is needed.
2. Open `index.html` in Google Chrome (double-click it, or drag it into a Chrome window).
3. Size the device: use **Ctrl +/−** (Windows) or **Cmd +/−** (macOS) until the device's screen
   measures about **8.3″ diagonally** (roughly 4.6″ wide × 6.9″ tall), measured on your monitor with a ruler.
   If the window is shorter than the device, the app shrinks it automatically to fit.
4. Before each participant: tap **Household** (top-right on any main screen) → **Reset demo data** → **Reset**.
   This restores all demo data. Expiration dates are relative to today, so the demo works on any date.
5. Typing: use the computer keyboard. The on-screen keyboard is only a picture of what the device would show.

**Demo household:** "Me" (the participant) and roommate "Jordan". Items tagged **Jordan's** are Jordan's
personal food. They are shown in the kitchen but never used in the participant's recipes, plans, or restock math.

**Key demo data at reset:**
- Milk: shared **250 mL** (expires tomorrow) + Jordan's **1.89 L** (expires in 4 days)
- Flour 75 g (Pantry) · Eggs 10 each · Butter 200 g · Sugar 1 kg · Baking Powder 0.5 cup
- Spinach 1 bag (**expired yesterday**) · Jordan's Hummus (**expired 3 days ago**)
- Expiring soon: Milk 250 mL, Jordan's Greek Yogurt 500 g, Tomatoes 4 each
- Stock alerts: Milk (below 500 mL → restock to 2 L), Flour (below 250 g → 1 kg), Eggs (below 4 → 12 each), Butter, Olive Oil
- Shopping list: Milk 1 L, Bananas 6 each, Sourdough Bread 1 loaf, Paper Towels 1 pack (to buy); Lemons 3 each (purchased)

---

Difficulty labels are planning estimates, subject to the course rubric. T1–T12 cover nine moderate-or-better tasks (including three deep tasks) and three additional shallow-or-better tasks across three feature sets. Sorting and favorites are additional interactions; the share-list placeholder is not a completed task.

## Feature set 1 — Kitchen inventory

### T1 · Add groceries and edit item details — *Moderate/Deep*
**Steps (add):**
1. On **Kitchen**, tap **+ Add item**.
2. Step 1 "What is it?": Name **Milk**, Category **Dairy & Eggs**, Quantity **1**, unit **L**, owner **Shared**. Tap **Next**.
3. Step 2 "Where & when": Location **Fridge**, tap **+3 days**. Tap **Save item**.
4. Item Details for Milk opens and shows the new 1 L batch.

**Steps (correct):** On Kitchen, tap **Eggs** → **Edit** → change Quantity to **8** → **Next** → **Save changes**.

**Error checks to try:** tap Next with an empty name ("Enter a name for this item."), quantity 0
("Quantity must be greater than 0."), or Save with no date ("Pick an expiration date or check No expiration.").
Changes persist after reloading the page.

### T2 · Log used or discarded food — *Moderate*
1. On **Kitchen**, tap **Milk** (the **1.89 L Jordan's** row). Item Details opens with that batch selected.
2. Tap **Use**. Enter **250**, unit **mL**. The preview reads "Remaining: 1.64 L (was 1.89 L)". Or tap ¼ / ½ / All.
3. Tap **Confirm use**. A toast "Used 250 mL Milk · 1.64 L left · Undo" appears. Tap **Undo** to revert, if wanted.
4. Discard: on Kitchen tap **Spinach** → **Discard** → tap **All** → reason **Expired** (pre-selected) → **Confirm discard**.
   The batch is removed at 0.

### T3 · Review expired and expiring food — *Moderate*
1. On **Kitchen**, tap the red banner **"2 expired · 3 expiring soon"**.
2. Review the **Expired** section (Hummus, Spinach) and **Expiring soon (within 3 days)** (Milk 250 mL, Greek Yogurt, Tomatoes),
   most urgent first. Tap any row to open its details.

### T4 · Search by item and storage location — *Shallow*
1. On **Kitchen**, type **rice** in the search field → Rice 2 kg · Pantry appears.
2. Tap the **Freezer** chip and search **oat milk** → empty state "No 'oat milk' in Freezer".
3. Tap **Clear filters**, or **Add 'oat milk'** (opens the add form with the name filled in).

### T4b · Sort the inventory — *Shallow*
On **Kitchen**, tap **Sort: Expiring soonest** once to cycle to **A–Z**, again for **Recently added**.

---

## Feature set 2 — Shopping and restocking

### T5 · Add, edit, and remove shopping items — *Moderate/Deep*
1. Tap the **Shopping** tab → **+ Add item**.
2. Name **Oat Milk**, Quantity **2**, unit **L**, Section **Dairy & Eggs**, Note **Unsweetened** → **Add to list**.
   It appears under Dairy & Eggs tagged "Added by you".
3. Duplicate check: **+ Add item** → Name **Bananas**, Quantity **3**, unit **each**, Section **Produce** → **Add to list**.
   A dialog offers **Merge (9 each)** or **Add separately**. Tap **Merge**.
4. Revise: tap the **Paper Towels** row → change Quantity to **2** → **Save changes**.
5. Delete: tap **Sourdough Bread** → **Remove from list** → toast with **Undo**.

### T6 · Review restock suggestions and adjust stock alerts — *Moderate*
1. On **Shopping**, tap **"2 restock suggestions"**.
2. Read: "Milk: 250 mL usable, below your 500 mL alert → buy 1.75 L to reach 2 L" and
   "Milk is already on your list (1 L) — will update to 1.75 L". Flour: buy 925 g to reach 1 kg.
3. Optionally change an amount or uncheck one. Tap **Add selected (2)**. Milk's entry is updated (no duplicate); Flour is added.
4. Changing an alert: **Kitchen** → **Eggs** → **Edit stock alert** → Alert me below **11** each, Restock up to **18** each →
   **Save alert**. A third suggestion (Eggs) now appears. Entering a restock level at or below the alert level shows
   "Restock level must be above the alert level (…)".

### T7 · Put purchased groceries into inventory — *Deep*
1. On **Shopping**, check off **Milk** (tap its checkbox). Switch to **Purchased**.
2. Tap **Put away 2 items**. (1) Leave **Milk** and **Lemons** checked → **Next: details for 2 items**.
3. (2) Milk: change Quantity bought to **1.5** L, keep **Keep as a new batch**, Fridge, the pre-filled date (+7 days),
   owner Shared → **Next item**. Lemons: keep defaults → **Review changes**.
4. (3) Preview shows e.g. "New batch: Milk 1.5 L · Fridge · expires Nov 11".
5. (4) Tap **Confirm & put away** → success screen → **View in Kitchen**. The older 250 mL milk keeps its own date.

### T8 · Check off purchases — *Shallow*
On **Shopping**, check **Bananas** and **Paper Towels**. "4 items left to buy" counts down live. Toggle **To buy / Purchased**,
and uncheck an item in Purchased to move it back.

### T8b · Share-list placeholder — not counted toward task coverage
On **Shopping**, tap **Share list** → "Under development" dialog → **Close**.

---

## Feature set 3 — Recipes and cooking

### T9 · Plan a meal with available ingredients and a serving count — *Deep*
1. **Recipes** tab → **Plan a meal**.
2. Tap **+** until it shows **6** people. Recipes re-rank by availability. Each shows exact shortages
   (e.g. "Need 300 g more flour" and "Need 200 mL more milk" for Fluffy Pancakes).
3. Tap **Why some food isn't counted** → Milk 1.89 L (Jordan's), Spinach (expired), Greek Yogurt (Jordan's).
4. Tap a recipe to open it already scaled to 6 servings.

### T10 · Add a recipe’s missing ingredients to shopping — *Moderate*
1. **Recipes** → **Fluffy Pancakes**. Tap **−** twice for **2 servings**. Flour shows "⚠ Short 50 g"; the rest show "✓ Have enough".
2. Tap **Add missing (1)**. Flour: "Need 50 g more flour". Change the amount to **1** and the unit to **kg**.
3. Check **Summary of changes** ("Add Flour · 1 kg · Pantry Staples · For Fluffy Pancakes") → **Confirm (1 change)**.
4. Opening Add missing again shows "1 kg flour already on your list — nothing more needed".

### T11 · Follow cooking steps and deduct ingredients — *Deep*
1. **Recipes** → **Fluffy Pancakes** → set **2 servings** → **Start cooking**.
2. Read each step ("Step 1 of 6" … "Step 6 of 6") with **Next** / **Back** → **Done — review what you used**.
3. Review: each ingredient shows its scaled amount and the batch it comes from (soonest-expiring first). If the first batch
   isn't enough, the rest is taken from the next batch. If you're short, choose "Only … available — deduct …" or **Skip this ingredient**.
4. Tap **Update kitchen** → the done screen lists every change → toast **Undo** restores everything.

### T12 · Search recipes and read the details — *Shallow/Moderate*
**Recipes** → type **yogurt** (search by ingredient) → open **Greek Yogurt Berry Parfait** → read ingredients, time, servings, and steps.

### T12b · Favorite a recipe — *Shallow*
**Recipes** → tap **Save** on **Overnight Oats** (one tap, it becomes "Saved") → tap the **Favorites** chip to see only saved recipes.

---

## End-to-end demo checks (reset demo data before each)

**A.** Kitchen → + Add item → Milk, Dairy & Eggs, 1 L, Shared → Next → Fridge, **+3 days** → Save item →
**Use** → 250 mL → Confirm use → back → tap the red banner → Expiring soon shows **Milk · 750 mL · Expires in 3 days**.

**B.** Shopping → **2 restock suggestions** → **Add selected (2)** (Milk updates to 1.75 L) → check **Milk** → Purchased →
**Put away** → uncheck Lemons → Next → Quantity **1.5** L, **Keep as a new batch** → Review changes → Confirm →
View in Kitchen → tap Milk: the 250 mL batch still expires tomorrow; the new 1.5 L batch has its own date.

**C.** Recipes → Fluffy Pancakes → **−** twice (2 servings) → **Add missing (1)** → Flour amount **1 kg** → Confirm →
Shopping → check **Flour** → Purchased → Put away (uncheck Lemons) → Next → choose **Add to existing batch** →
Review ("Flour: 75 g → 1.08 kg") → Confirm → Recipes → Fluffy Pancakes → 2 servings → Start cooking → Next ×5 →
Done — review → Update kitchen (Flour −125 g, Milk −150 mL, Eggs −1, Butter −15 g, Sugar −12.5 g, Baking powder −1 tsp) →
tap **Undo** on the toast → inventory is restored.

**D.** Kitchen → tap **Milk 1.89 L** → **Use** → enter **3** (unit L) → error "You only have 1.89 L in this batch",
and **Confirm use** stays disabled.
