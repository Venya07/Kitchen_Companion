/* data.js — units, dates, seed data, localStorage persistence, undo snapshots,
   and the inventory / shopping / recipe calculations every screen shares. */
(function () {
  "use strict";
  var KC = (window.KC = window.KC || {});

  var STORE_KEY = "kitchenCompanion.phase21";
  var VERSION = 3;

  /* ---------------- Units ---------------- */

  // toBase: mL for volume, g for weight, "each" for count.
  // Standalone units (can, bunch, ...) are each their own family and never convert.
  var UNITS = {
    mL: { family: "volume", toBase: 1 },
    L: { family: "volume", toBase: 1000 },
    tsp: { family: "volume", toBase: 4.92892 },
    tbsp: { family: "volume", toBase: 14.7868 },
    "fl oz": { family: "volume", toBase: 29.5735 },
    cup: { family: "volume", toBase: 236.588 },
    gal: { family: "volume", toBase: 3785.41 },
    g: { family: "weight", toBase: 1 },
    kg: { family: "weight", toBase: 1000 },
    oz: { family: "weight", toBase: 28.3495 },
    lb: { family: "weight", toBase: 453.592 },
    each: { family: "count", toBase: 1 },
    dozen: { family: "count", toBase: 12 },
    can: { family: "can", toBase: 1 },
    bunch: { family: "bunch", toBase: 1 },
    pack: { family: "pack", toBase: 1 },
    loaf: { family: "loaf", toBase: 1 },
    bag: { family: "bag", toBase: 1 }
  };

  var UNIT_GROUPS = [
    { label: "Volume", units: ["mL", "L", "tsp", "tbsp", "fl oz", "cup", "gal"] },
    { label: "Weight", units: ["g", "kg", "oz", "lb"] },
    { label: "Count", units: ["each", "dozen"] },
    { label: "Package", units: ["can", "bunch", "pack", "loaf", "bag"] }
  ];

  function unitFamily(u) { return UNITS[u] ? UNITS[u].family : u; }

  // Returns null when the units are in different families (never convert across).
  function convert(q, from, to) {
    if (from === to) return q;
    var f = UNITS[from], t = UNITS[to];
    if (!f || !t || f.family !== t.family) return null;
    return (q * f.toBase) / t.toBase;
  }

  function compatible(a, b) { return convert(1, a, b) !== null; }

  function compatibleUnits(u) {
    var fam = unitFamily(u);
    return Object.keys(UNITS).filter(function (k) { return UNITS[k].family === fam; });
  }

  function round2(q) { return Math.round((q + Number.EPSILON) * 100) / 100; }
  function round6(q) { return Math.round(q * 1e6) / 1e6; }

  // Switch mL<->L and g<->kg so numbers stay readable (750 mL, 1.08 kg).
  function tidy(q, unit) {
    if (unit === "mL" && q >= 1000) return { q: q / 1000, unit: "L" };
    if (unit === "L" && q > 0 && q < 1) return { q: q * 1000, unit: "mL" };
    if (unit === "g" && q >= 1000) return { q: q / 1000, unit: "kg" };
    if (unit === "kg" && q > 0 && q < 1) return { q: q * 1000, unit: "g" };
    return { q: q, unit: unit };
  }

  function fmtNum(q) { return String(round2(q)); }

  function fmtQty(q, unit) {
    var t = tidy(q, unit);
    return fmtNum(t.q) + " " + t.unit;
  }

  /* ---------------- Dates ---------------- */

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function toISO(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseISO(s) { var p = s.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function today() { return toISO(new Date()); }
  function addDays(iso, n) { var d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); }
  function daysUntil(iso) { return Math.round((parseISO(iso) - parseISO(today())) / 86400000); }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(iso) {
    var d = parseISO(iso);
    var s = MONTHS[d.getMonth()] + " " + d.getDate();
    if (d.getFullYear() !== new Date().getFullYear()) s += ", " + d.getFullYear();
    return s;
  }

  var SOON_DAYS = 3;

  // level: expired | soon | ok | none
  function expiryInfo(iso) {
    if (!iso) return { level: "none", days: Infinity, text: "No expiration" };
    var d = daysUntil(iso);
    var text;
    if (d < -1) text = "Expired " + -d + " days ago";
    else if (d === -1) text = "Expired yesterday";
    else if (d === 0) text = "Expires today";
    else if (d === 1) text = "Expires tomorrow";
    else if (d <= 7) text = "Expires in " + d + " days";
    else text = "Expires " + fmtDate(iso);
    var level = d < 0 ? "expired" : d <= SOON_DAYS ? "soon" : "ok";
    return { level: level, days: d, text: text };
  }

  /* ---------------- Names / categories ---------------- */

  function singular(w) {
    if (w.length <= 3) return w;
    if (/ies$/.test(w)) return w.slice(0, -3) + "y";
    if (/(oes|ches|shes|sses|xes)$/.test(w)) return w.slice(0, -2);
    if (/s$/.test(w) && !/(ss|us)$/.test(w)) return w.slice(0, -1);
    return w;
  }

  function foodKey(name) {
    return String(name || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim()
      .split(" ").map(singular).join(" ");
  }

  var LOCATIONS = ["Fridge", "Freezer", "Pantry", "Cupboard", "Other"];
  var LOCATION_ICONS = { Fridge: "fridge", Freezer: "freezer", Pantry: "pantry", Cupboard: "cupboard", Other: "box" };
  var SECTIONS = ["Produce", "Dairy & Eggs", "Meat & Seafood", "Bakery", "Pantry Staples", "Frozen", "Household", "Other"];

  // category -> store section, default location, default shelf life in days (null = no expiration)
  var CATEGORIES = {
    "Dairy & Eggs": { section: "Dairy & Eggs", location: "Fridge", shelf: 7 },
    Produce: { section: "Produce", location: "Fridge", shelf: 5 },
    "Meat & Seafood": { section: "Meat & Seafood", location: "Fridge", shelf: 3 },
    Bakery: { section: "Bakery", location: "Pantry", shelf: 4 },
    "Pantry Staples": { section: "Pantry Staples", location: "Pantry", shelf: 180 },
    Frozen: { section: "Frozen", location: "Freezer", shelf: 90 },
    "Condiments & Oils": { section: "Pantry Staples", location: "Cupboard", shelf: 180 },
    Beverages: { section: "Other", location: "Fridge", shelf: 30 },
    Snacks: { section: "Pantry Staples", location: "Cupboard", shelf: 60 },
    Household: { section: "Household", location: "Other", shelf: null },
    Other: { section: "Other", location: "Other", shelf: 14 }
  };
  var CATEGORY_NAMES = Object.keys(CATEGORIES);

  function sectionToCategory(section) {
    return CATEGORIES[section] ? section : "Other";
  }

  // Store sections for foods that may not be in the kitchen yet (recipe ingredients).
  var FOOD_SECTIONS = {
    basil: "Produce", lemon: "Produce", banana: "Produce", spinach: "Produce", "bell pepper": "Produce",
    tomato: "Produce", "garlic clove": "Produce", onion: "Produce", "greek yogurt": "Dairy & Eggs",
    milk: "Dairy & Eggs", egg: "Dairy & Eggs", butter: "Dairy & Eggs", cheddar: "Dairy & Eggs",
    parmesan: "Dairy & Eggs", "feta cheese": "Dairy & Eggs", "chicken breast": "Meat & Seafood",
    flour: "Pantry Staples", sugar: "Pantry Staples", "baking powder": "Pantry Staples", rice: "Pantry Staples",
    pasta: "Pantry Staples", "rolled oat": "Pantry Staples", honey: "Pantry Staples", "olive oil": "Pantry Staples",
    "soy sauce": "Pantry Staples", "chicken broth": "Pantry Staples", "diced tomato": "Pantry Staples",
    "frozen berry": "Frozen"
  };

  /* ---------------- Seed ---------------- */

  var counter = 0;
  function uid(prefix) { counter += 1; return prefix + "-" + Date.now().toString(36) + "-" + counter.toString(36); }

  function seed() {
    var t = today();
    var exp = function (n) { return n === null ? null : addDays(t, n); };
    var inv = [];
    function add(name, q, unit, location, days, category, owner, addedAgo) {
      inv.push({
        id: uid("b"), name: name, foodKey: foodKey(name), quantity: q, unit: unit, location: location,
        expires: exp(days), owner: owner || "shared", category: category, added: addDays(t, -(addedAgo || 3))
      });
    }
    // Fridge
    add("Milk", 1.89, "L", "Fridge", 4, "Dairy & Eggs", "jordan", 2);
    add("Milk", 250, "mL", "Fridge", 1, "Dairy & Eggs", "shared", 6);
    add("Eggs", 10, "each", "Fridge", 12, "Dairy & Eggs", "shared", 4);
    add("Spinach", 1, "bag", "Fridge", -1, "Produce", "shared", 8);
    add("Butter", 200, "g", "Fridge", 30, "Dairy & Eggs", "shared", 10);
    add("Greek Yogurt", 500, "g", "Fridge", 2, "Dairy & Eggs", "jordan", 5);
    add("Hummus", 283, "g", "Fridge", -3, "Snacks", "jordan", 12);
    add("Cheddar", 200, "g", "Fridge", 20, "Dairy & Eggs", "shared", 7);
    add("Parmesan", 120, "g", "Fridge", 40, "Dairy & Eggs", "me", 14);
    add("Bell Peppers", 2, "each", "Fridge", 5, "Produce", "shared", 2);
    add("Tomatoes", 4, "each", "Fridge", 3, "Produce", "shared", 3);
    add("Carrots", 1, "bag", "Fridge", 10, "Produce", "shared", 1);
    // Freezer
    add("Chicken Breast", 1, "lb", "Freezer", 60, "Meat & Seafood", "shared", 9);
    add("Frozen Berries", 500, "g", "Freezer", 120, "Frozen", "me", 20);
    add("Ground Beef", 1, "lb", "Freezer", 45, "Meat & Seafood", "shared", 15);
    // Pantry
    add("Flour", 75, "g", "Pantry", 90, "Pantry Staples", "shared", 40);
    add("Sugar", 1, "kg", "Pantry", 365, "Pantry Staples", "shared", 30);
    add("Rice", 2, "kg", "Pantry", null, "Pantry Staples", "shared", 25);
    add("Salt", 750, "g", "Pantry", null, "Pantry Staples", "shared", 60);
    add("Pasta", 450, "g", "Pantry", 200, "Pantry Staples", "shared", 11);
    add("Rolled Oats", 500, "g", "Pantry", 150, "Pantry Staples", "me", 18);
    add("Baking Powder", 0.5, "cup", "Pantry", 200, "Pantry Staples", "shared", 50);
    add("Diced Tomatoes", 2, "can", "Pantry", 400, "Pantry Staples", "shared", 21);
    add("Garlic Cloves", 8, "each", "Pantry", 14, "Produce", "shared", 5);
    // Cupboard
    add("Olive Oil", 500, "mL", "Cupboard", 300, "Condiments & Oils", "shared", 35);
    add("Soy Sauce", 250, "mL", "Cupboard", 180, "Condiments & Oils", "shared", 33);
    add("Honey", 250, "mL", "Cupboard", null, "Condiments & Oils", "shared", 45);
    add("Chicken Broth", 1, "L", "Cupboard", 90, "Pantry Staples", "shared", 16);
    // Other (counter)
    add("Bananas", 2, "each", "Other", 4, "Produce", "shared", 1);

    var stockRules = {
      milk: { alertQty: 500, alertUnit: "mL", targetQty: 2, targetUnit: "L" },
      egg: { alertQty: 4, alertUnit: "each", targetQty: 12, targetUnit: "each" },
      flour: { alertQty: 250, alertUnit: "g", targetQty: 1, targetUnit: "kg" },
      butter: { alertQty: 100, alertUnit: "g", targetQty: 250, targetUnit: "g" },
      "olive oil": { alertQty: 200, alertUnit: "mL", targetQty: 1, targetUnit: "L" }
    };

    function shop(name, q, unit, section, note, purchased) {
      return { id: uid("s"), name: name, foodKey: foodKey(name), quantity: q, unit: unit, section: section,
        note: note || "", source: "manual", purchased: !!purchased };
    }
    var shopping = [
      shop("Milk", 1, "L", "Dairy & Eggs", "2% if they have it"),
      shop("Bananas", 6, "each", "Produce", "Slightly green"),
      shop("Sourdough Bread", 1, "loaf", "Bakery", ""),
      shop("Paper Towels", 1, "pack", "Household", "Store brand is fine"),
      shop("Lemons", 3, "each", "Produce", "", true)
    ];

    return {
      version: VERSION,
      members: [
        { id: "me", name: "Me", role: "You" },
        { id: "jordan", name: "Jordan", role: "Roommate" }
      ],
      defaultOwner: "shared",
      inventory: inv,
      stockRules: stockRules,
      shopping: shopping,
      recipes: seedRecipes(),
      log: []
    };
  }

  function ing(name, quantity, unit, key) {
    return { foodKey: key || foodKey(name), name: name, quantity: quantity, unit: unit };
  }

  function seedRecipes() {
    return [
      { id: "r-pancakes", name: "Fluffy Pancakes", servings: 4, prep: 10, cook: 15, tags: ["Breakfast", "Vegetarian"], favorite: true,
        ingredients: [ing("Flour", 250, "g"), ing("Milk", 300, "mL"), ing("Eggs", 2, "each"), ing("Butter", 30, "g"),
          ing("Sugar", 25, "g"), ing("Baking powder", 2, "tsp")],
        steps: [
          "Whisk the flour, sugar, and baking powder together in a large bowl.",
          "Melt the butter in a small pan over low heat, then let it cool for a minute.",
          "In a second bowl, whisk the milk and eggs, then stir in the melted butter.",
          "Pour the wet ingredients into the dry ones and stir until just combined. A few lumps are fine.",
          "Heat a lightly greased pan over medium heat. Pour about 1/4 cup of batter per pancake.",
          "Cook until bubbles form on top (about 2 minutes), flip, and cook 1 more minute until golden. Serve warm."
        ] },
      { id: "r-stirfry", name: "Chicken & Pepper Stir-Fry", servings: 4, prep: 15, cook: 15, tags: ["Dinner", "High protein"], favorite: false,
        ingredients: [ing("Chicken breast", 1, "lb"), ing("Bell peppers", 2, "each"), ing("Rice", 300, "g"),
          ing("Soy sauce", 3, "tbsp"), ing("Garlic cloves", 3, "each"), ing("Olive oil", 2, "tbsp")],
        steps: [
          "Cook the rice according to the package directions and keep it warm.",
          "Slice the chicken into thin strips and the bell peppers into strips. Mince the garlic.",
          "Heat the olive oil in a large pan over medium-high heat. Cook the chicken 5–6 minutes until no longer pink.",
          "Add the peppers and garlic and stir-fry for 3 minutes until the peppers are crisp-tender.",
          "Stir in the soy sauce and cook 1 more minute. Serve over the rice."
        ] },
      { id: "r-parfait", name: "Greek Yogurt Berry Parfait", servings: 2, prep: 5, cook: 0, tags: ["Breakfast", "No cook"], favorite: false,
        ingredients: [ing("Greek yogurt", 300, "g"), ing("Frozen berries", 150, "g"), ing("Rolled oats", 60, "g"), ing("Honey", 2, "tbsp")],
        steps: [
          "Thaw the berries in the microwave for 30 seconds, or leave them in the fridge overnight.",
          "Toast the oats in a dry pan for 3 minutes until fragrant, then let them cool.",
          "Layer yogurt, berries, and oats in two glasses, repeating until everything is used.",
          "Drizzle the honey on top and serve right away."
        ] },
      { id: "r-omelette", name: "Spinach & Cheddar Omelette", servings: 2, prep: 5, cook: 10, tags: ["Breakfast", "Vegetarian"], favorite: false,
        ingredients: [ing("Eggs", 4, "each"), ing("Spinach", 1, "bag"), ing("Cheddar", 50, "g"), ing("Milk", 30, "mL"), ing("Butter", 10, "g")],
        steps: [
          "Whisk the eggs and milk with a pinch of salt and pepper.",
          "Melt the butter in a non-stick pan over medium heat. Add the spinach and cook until wilted, about 1 minute.",
          "Pour in the eggs and let them set for 30 seconds, gently pulling the edges toward the center.",
          "When the top is almost set, sprinkle the grated cheddar over one half.",
          "Fold the omelette in half, cook 30 more seconds, cut in two, and serve."
        ] },
      { id: "r-pasta", name: "Garlic Tomato Pasta", servings: 4, prep: 5, cook: 20, tags: ["Dinner", "Vegetarian"], favorite: true,
        ingredients: [ing("Pasta", 450, "g"), ing("Diced tomatoes", 1, "can"), ing("Garlic cloves", 3, "each"), ing("Olive oil", 3, "tbsp"),
          ing("Parmesan", 50, "g"), ing("Basil", 1, "bunch")],
        steps: [
          "Bring a large pot of salted water to a boil and cook the pasta until al dente.",
          "Meanwhile, warm the olive oil in a pan over medium heat and cook the sliced garlic for 1 minute.",
          "Add the diced tomatoes and simmer for 10 minutes, stirring now and then.",
          "Drain the pasta, keeping 1/2 cup of the cooking water.",
          "Toss the pasta with the sauce, adding a splash of pasta water if it looks dry.",
          "Top with grated parmesan and torn basil leaves."
        ] },
      { id: "r-oats", name: "Overnight Oats", servings: 2, prep: 10, cook: 0, tags: ["Breakfast", "Make ahead"], favorite: false,
        ingredients: [ing("Rolled oats", 100, "g"), ing("Milk", 250, "mL"), ing("Greek yogurt", 100, "g"), ing("Honey", 1, "tbsp"), ing("Bananas", 1, "each")],
        steps: [
          "Stir the oats, milk, yogurt, and honey together in a bowl or jar.",
          "Cover and refrigerate for at least 6 hours or overnight.",
          "In the morning, slice the banana and stir in half. Put the rest on top and serve cold."
        ] },
      { id: "r-lemonchicken", name: "Lemon Garlic Chicken & Rice", servings: 4, prep: 15, cook: 35, tags: ["Dinner", "High protein"], favorite: false,
        ingredients: [ing("Chicken breast", 1.5, "lb"), ing("Rice", 300, "g"), ing("Chicken broth", 600, "mL"), ing("Lemons", 1, "each"),
          ing("Garlic cloves", 2, "each"), ing("Olive oil", 2, "tbsp")],
        steps: [
          "Pat the chicken dry and season with salt, pepper, and the zest of the lemon.",
          "Heat the olive oil in a deep pan and brown the chicken 4 minutes per side. Set it aside.",
          "Add the minced garlic and rice to the pan and stir for 1 minute.",
          "Pour in the broth and the lemon juice, then place the chicken on top of the rice.",
          "Cover and simmer on low for 20 minutes until the rice is tender and the chicken is cooked through.",
          "Rest for 5 minutes, then slice the chicken and serve over the rice."
        ] },
      { id: "r-bananabread", name: "Easy Banana Bread", servings: 8, prep: 15, cook: 60, tags: ["Baking", "Snack"], favorite: false,
        ingredients: [ing("Bananas", 3, "each"), ing("Flour", 190, "g"), ing("Sugar", 150, "g"), ing("Butter", 115, "g"),
          ing("Eggs", 2, "each"), ing("Baking powder", 1, "tsp")],
        steps: [
          "Heat the oven to 350°F (175°C) and grease a loaf pan.",
          "Mash the bananas in a large bowl, then stir in the melted butter.",
          "Beat in the sugar and eggs.",
          "Stir in the baking powder and then the flour until just combined.",
          "Pour into the pan and bake for 55–60 minutes, until a toothpick comes out clean.",
          "Cool in the pan for 10 minutes before slicing."
        ] }
    ];
  }

  /* ---------------- Storage + undo ---------------- */

  var state = null;

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.version === VERSION) { state = parsed; return; }
      }
    } catch (e) { /* fall through to seed */ }
    state = seed();
    save();
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked */ }
  }

  function reset() { state = seed(); save(); }
  function snapshot() { return JSON.stringify(state); }
  function restore(snap) { state = JSON.parse(snap); save(); }

  /* ---------------- Members ---------------- */

  function memberName(id) {
    var m = state.members.filter(function (x) { return x.id === id; })[0];
    return m ? m.name : id;
  }
  function ownerLabel(owner) {
    if (owner === "shared") return "Shared";
    if (owner === "me") return "Mine";
    return memberName(owner) + "'s";
  }

  /* ---------------- Inventory ---------------- */

  function expSortKey(b) { return b.expires ? daysUntil(b.expires) : 1e9; }

  function batch(id) { return state.inventory.filter(function (b) { return b.id === id; })[0] || null; }

  function batchesFor(key) {
    return state.inventory.filter(function (b) { return b.foodKey === key; })
      .sort(function (a, b) { return expSortKey(a) - expSortKey(b); });
  }

  // Why a batch can't be used for my recipes / restock math, or null if it can.
  function exclusionReason(b) {
    if (b.expires && daysUntil(b.expires) < 0) return "expired " + fmtDate(b.expires);
    if (b.owner !== "shared" && b.owner !== "me") return memberName(b.owner) + "'s personal item";
    return null;
  }

  function usableBatches(key, unit) {
    return batchesFor(key).filter(function (b) { return !exclusionReason(b) && (!unit || compatible(b.unit, unit)); });
  }

  // Total of usable (not expired, shared or mine) batches, expressed in `unit`.
  function usableAmount(key, unit) {
    return usableBatches(key, unit).reduce(function (sum, b) { return sum + convert(b.quantity, b.unit, unit); }, 0);
  }

  function excludedBatches(key) {
    return batchesFor(key).filter(function (b) { return exclusionReason(b); });
  }

  function removeBatch(id) { state.inventory = state.inventory.filter(function (b) { return b.id !== id; }); }

  // Subtract an amount (in `unit`) from a batch; removes the batch at 0. Returns the remaining quantity.
  function deduct(b, amount, unit) {
    var left = round6(b.quantity - convert(amount, unit, b.unit));
    if (left <= 1e-6) { removeBatch(b.id); return 0; }
    b.quantity = left;
    return left;
  }

  function newBatch(fields) {
    var b = {
      id: uid("b"), name: fields.name, foodKey: foodKey(fields.name), quantity: round6(fields.quantity), unit: fields.unit,
      location: fields.location, expires: fields.expires || null, owner: fields.owner || "shared",
      category: fields.category || "Other", added: today()
    };
    state.inventory.push(b);
    return b;
  }

  /* ---------------- Stock rules / restock ---------------- */

  function restockSuggestions() {
    var out = [];
    Object.keys(state.stockRules).forEach(function (key) {
      var r = state.stockRules[key];
      var anyBatch = batchesFor(key)[0];
      var have = usableAmount(key, r.targetUnit);
      var alertInTarget = convert(r.alertQty, r.alertUnit, r.targetUnit);
      if (alertInTarget === null || have >= alertInTarget - 1e-9) return;
      out.push({
        foodKey: key, rule: r, have: have,
        name: anyBatch ? anyBatch.name : key.charAt(0).toUpperCase() + key.slice(1),
        category: anyBatch ? anyBatch.category : null,
        buy: round6(r.targetQty - have)
      });
    });
    return out;
  }

  /* ---------------- Shopping ---------------- */

  function shoppingEntry(id) { return state.shopping.filter(function (s) { return s.id === id; })[0] || null; }

  // An entry still to buy for the same food with a convertible unit.
  function findOnList(key, unit, purchased) {
    return state.shopping.filter(function (s) {
      return s.foodKey === key && !!s.purchased === !!purchased && compatible(s.unit, unit);
    })[0] || null;
  }

  function sectionFor(name) {
    var key = foodKey(name);
    var b = batchesFor(key)[0];
    if (b && CATEGORIES[b.category]) return CATEGORIES[b.category].section;
    return FOOD_SECTIONS[key] || null;
  }

  function sourceLabel(src) {
    if (src === "manual") return "Added by you";
    if (src === "restock") return "Suggested restock";
    return src; // "For <recipe>"
  }

  function addShopping(fields) {
    var e = {
      id: uid("s"), name: fields.name, foodKey: foodKey(fields.name), quantity: round6(fields.quantity), unit: fields.unit,
      section: fields.section || "Other", note: fields.note || "", source: fields.source || "manual", purchased: false
    };
    state.shopping.push(e);
    return e;
  }

  /* ---------------- Recipes ---------------- */

  function recipe(id) { return state.recipes.filter(function (r) { return r.id === id; })[0] || null; }

  function analyzeIngredient(ingr, factor) {
    var need = round6(ingr.quantity * factor);
    var have = usableAmount(ingr.foodKey, ingr.unit);
    var otherUnits = usableBatches(ingr.foodKey).filter(function (b) { return !compatible(b.unit, ingr.unit); });
    var status = have >= need - 1e-9 ? "enough" : have > 0 ? "short" : "missing";
    return {
      ing: ingr, need: need, unit: ingr.unit, have: have, short: Math.max(0, round6(need - have)), status: status,
      excluded: excludedBatches(ingr.foodKey), otherUnits: otherUnits
    };
  }

  function analyzeRecipe(r, servings) {
    var factor = servings / r.servings;
    var items = r.ingredients.map(function (i) { return analyzeIngredient(i, factor); });
    var haveCount = items.filter(function (x) { return x.status === "enough"; }).length;
    return { recipe: r, servings: servings, items: items, haveCount: haveCount, total: items.length,
      canMake: haveCount === items.length, missing: items.filter(function (x) { return x.status !== "enough"; }) };
  }

  function totalTime(r) { return r.prep + r.cook; }

  /* ---------------- Export ---------------- */

  KC.data = {
    get state() { return state; },
    load: load, save: save, reset: reset, snapshot: snapshot, restore: restore, uid: uid,
    UNITS: UNITS, UNIT_GROUPS: UNIT_GROUPS, unitFamily: unitFamily, convert: convert, compatible: compatible,
    compatibleUnits: compatibleUnits, round2: round2, round6: round6, tidy: tidy, fmtNum: fmtNum, fmtQty: fmtQty,
    today: today, addDays: addDays, daysUntil: daysUntil, fmtDate: fmtDate, expiryInfo: expiryInfo, SOON_DAYS: SOON_DAYS,
    foodKey: foodKey, LOCATIONS: LOCATIONS, LOCATION_ICONS: LOCATION_ICONS, SECTIONS: SECTIONS,
    CATEGORIES: CATEGORIES, CATEGORY_NAMES: CATEGORY_NAMES, sectionToCategory: sectionToCategory,
    memberName: memberName, ownerLabel: ownerLabel,
    batch: batch, batchesFor: batchesFor, exclusionReason: exclusionReason, usableBatches: usableBatches,
    usableAmount: usableAmount, excludedBatches: excludedBatches, removeBatch: removeBatch, deduct: deduct,
    newBatch: newBatch, expSortKey: expSortKey,
    restockSuggestions: restockSuggestions,
    shoppingEntry: shoppingEntry, findOnList: findOnList, sectionFor: sectionFor, sourceLabel: sourceLabel, addShopping: addShopping,
    recipe: recipe, analyzeRecipe: analyzeRecipe, totalTime: totalTime
  };
})();
