/* recipes.js — Feature set 3: recipes and cooking.
   Screens: recipes, recipe-detail, recipe-addmissing, recipe-plan, recipe-cook, recipe-cooked. */
(function () {
  "use strict";
  var KC = window.KC;
  var D = KC.data, UI = KC.ui, icon = KC.icon, esc = UI.esc;

  var FILTERS = [
    { id: "all", label: "All" },
    { id: "fav", label: "Favorites", icon: "heart" },
    { id: "now", label: "Can make now", icon: "check-circle" },
    { id: "quick", label: "Under 30 min", icon: "clock" }
  ];

  function availBadge(a, people) {
    var forWho = people ? " for " + UI.plural(people, "person", "people") : "";
    if (a.canMake) return UI.badge("ok", "check-circle", "Have all " + a.total + " ingredients" + forWho);
    return UI.badge(a.haveCount === 0 ? "danger" : "warning", a.haveCount === 0 ? "x-circle" : "alert", "Have " + a.haveCount + " of " + a.total + " ingredients" + forWho);
  }

  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

  // "Need 50 g more flour" / "Need 2 more eggs" / "Need 1 bunch basil"
  function shortageText(x) {
    var amt = x.short;
    var more = x.status === "short" ? " more" : "";
    if (x.unit === "each") return "Need " + D.fmtNum(amt) + more + " " + lower(x.ing.name);
    return "Need " + D.fmtQty(amt, x.unit) + more + " " + lower(x.ing.name);
  }

  function statusBadge(x) {
    if (x.status === "enough") return UI.badge("ok", "check", "Have enough");
    if (x.status === "short") return UI.badge("warning", "alert", "Short " + D.fmtQty(x.short, x.unit));
    return UI.badge("danger", "x-circle", "Missing");
  }

  function stepper(value, label, unitOne, unitMany) {
    return '<div class="stepper" role="group" aria-label="' + esc(label) + '">' +
      '<button type="button" class="icon-btn" data-act="dec" aria-label="Fewer ' + esc(unitMany) + '"' + (value <= 1 ? " disabled" : "") + ">" + icon("minus") + "</button>" +
      '<div class="stepper-value" aria-live="polite"><span class="big-number">' + value + "</span>" + '<span class="secondary">' + (value === 1 ? unitOne : unitMany) + "</span></div>" +
      '<button type="button" class="icon-btn" data-act="inc" aria-label="More ' + esc(unitMany) + '"' + (value >= 24 ? " disabled" : "") + ">" + icon("plus") + "</button></div>";
  }

  function missingRecipe(root) {
    root.innerHTML = '<div class="card">' + UI.emptyState("book", "Recipe not found", "",
      '<button type="button" class="btn btn-primary btn-block" data-act="back">Back to recipes</button>') + "</div>";
    UI.actions(root, { back: function () { UI.popToRoot(); } });
  }

  /* ================= Recipes (top level, T12, T12b) ================= */

  UI.register("recipes", {
    title: "Recipes",
    render: function (root, r) {
      var st = r.state;
      if (st.q === undefined) { st.q = ""; st.filter = "all"; }
      root.innerHTML =
        '<div class="search">' + icon("search") +
        '<input class="input" type="search" id="r-search" placeholder="Search recipes or ingredients" aria-label="Search recipes or ingredients" value="' + esc(st.q) + '" autocomplete="off"></div>' +
        '<div class="chip-row" role="group" aria-label="Filter recipes">' + FILTERS.map(function (f) {
          return '<button type="button" class="chip" data-act="filter" data-f="' + f.id + '" aria-pressed="' + (st.filter === f.id) + '">' + (f.icon ? icon(f.icon) : "") + f.label + "</button>";
        }).join("") + "</div>" +
        '<button type="button" class="card row plan-entry" data-act="plan" style="margin-bottom:16px"><span class="row-icon">' + icon("users") + "</span>" +
        '<span class="row-main"><span class="row-title">Plan a meal</span><span class="row-sub">Pick how many people and see what you can make with your food</span></span>' +
        '<span class="row-chev">' + icon("chevron-right") + "</span></button>" +
        '<div class="toolbar"><span class="toolbar-count" id="r-count"></span></div><div id="r-list"></div>';

      var listEl = root.querySelector("#r-list"), countEl = root.querySelector("#r-count");
      function renderList() {
        var q = st.q.trim().toLowerCase();
        var items = D.state.recipes.map(function (rec) { return D.analyzeRecipe(rec, rec.servings); }).filter(function (a) {
          var rec = a.recipe;
          if (st.filter === "fav" && !rec.favorite) return false;
          if (st.filter === "now" && !a.canMake) return false;
          if (st.filter === "quick" && D.totalTime(rec) >= 30) return false;
          if (!q) return true;
          return rec.name.toLowerCase().indexOf(q) >= 0 || rec.tags.join(" ").toLowerCase().indexOf(q) >= 0 ||
            rec.ingredients.some(function (i) { return i.name.toLowerCase().indexOf(q) >= 0; });
        });
        countEl.textContent = UI.plural(items.length, "recipe") + (q ? " matching '" + st.q.trim() + "'" : "");
        if (!items.length) {
          listEl.innerHTML = '<div class="card">' + UI.emptyState(st.filter === "fav" ? "heart" : "search",
            st.filter === "fav" && !q ? "No saved recipes yet" : "No recipes found",
            st.filter === "fav" && !q ? "Tap Save on a recipe to keep it here." : "Try another name or ingredient, or clear the filter.",
            '<button type="button" class="btn btn-secondary btn-block" data-act="clear">' + icon("close") + "Clear search and filters</button>") + "</div>";
          return;
        }
        listEl.innerHTML = '<div class="recipe-grid">' + items.map(function (a) {
          var rec = a.recipe;
          return '<article class="card recipe-card"><div class="recipe-band" aria-hidden="true"></div>' +
            '<button type="button" class="recipe-open" data-act="open" data-id="' + rec.id + '">' +
            '<span class="recipe-name">' + esc(rec.name) + "</span>" +
            '<span class="recipe-meta"><span>' + icon("clock") + D.totalTime(rec) + " min</span><span>" + icon("plate") + UI.plural(rec.servings, "serving") + "</span></span>" +
            availBadge(a) + "</button>" +
            '<button type="button" class="recipe-fav" data-act="fav" data-id="' + rec.id + '" aria-pressed="' + !!rec.favorite + '">' +
            icon(rec.favorite ? "heart-fill" : "heart") + (rec.favorite ? "Saved" : "Save") + "</button></article>";
        }).join("") + "</div>";
      }
      renderList();
      root.querySelector("#r-search").addEventListener("input", function (e) { st.q = e.target.value; renderList(); });
      UI.actions(root, {
        filter: function (b) { st.filter = b.getAttribute("data-f"); UI.refresh(); },
        clear: function () { st.q = ""; st.filter = "all"; UI.refresh(); },
        plan: function () { UI.go("recipe-plan"); },
        open: function (b) { UI.go("recipe-detail", { id: b.getAttribute("data-id") }); },
        fav: function (b) { toggleFav(b.getAttribute("data-id")); UI.refresh(); }
      });
      root.classList.add("no-fab");
    }
  });

  function toggleFav(id) {
    var rec = D.recipe(id);
    rec.favorite = !rec.favorite;
    D.save();
    UI.toast(rec.favorite ? "Saved " + rec.name + " to Favorites" : "Removed " + rec.name + " from Favorites");
  }

  /* ================= Recipe details (T12) ================= */

  UI.register("recipe-detail", {
    title: function (r) { var rec = D.recipe(r.params.id); return rec ? rec.name : "Recipe"; },
    render: function (root, r) {
      root.classList.add("no-fab");
      var rec = D.recipe(r.params.id);
      if (!rec) { missingRecipe(root); return; }
      var st = r.state;
      if (!st.servings) st.servings = r.params.servings || rec.servings;
      var a = D.analyzeRecipe(rec, st.servings);
      var scaled = st.servings !== rec.servings;

      root.innerHTML =
        '<div class="card card-pad">' +
        '<div class="section-head" style="align-items:flex-start"><div><h2 class="section-title" style="margin:0 0 4px">' + esc(rec.name) + "</h2>" +
        '<div class="muted secondary">' + esc(rec.tags.join(" · ")) + "</div></div>" +
        '<button type="button" class="btn btn-secondary save-btn" data-act="fav" aria-pressed="' + !!rec.favorite + '">' + icon(rec.favorite ? "heart-fill" : "heart") + (rec.favorite ? "Saved" : "Save") + "</button></div>" +
        '<div class="recipe-meta" style="margin-top:8px"><span>' + icon("clock") + "Prep " + rec.prep + " min</span><span>Cook " + rec.cook + " min</span><span><strong>Total " + D.totalTime(rec) + " min</strong></span></div></div>" +

        '<div class="card card-pad" style="display:flex;align-items:center;justify-content:space-between;gap:16px">' +
        '<div><div class="label" style="margin:0">Servings</div><div class="muted small">' + (scaled ? "Amounts scaled from " + rec.servings : "Recipe makes " + rec.servings) + "</div></div>" +
        stepper(st.servings, "Servings", "serving", "servings") + "</div>" +

        '<section class="section"><div class="section-head"><h2 class="section-title">Ingredients</h2>' + availBadge(a) + "</div>" +
        '<ul class="list card">' + a.items.map(function (x) {
          var extra = "";
          if (x.status === "short") extra = "You have " + D.fmtQty(x.have, x.unit) + " usable";
          if (x.excluded.length && x.status !== "enough") extra += (extra ? ". " : "") + "Not counted: " + x.excluded.map(function (b) { return D.fmtQty(b.quantity, b.unit) + " (" + D.exclusionReason(b) + ")"; }).join(", ");
          if (x.otherUnits.length && x.status !== "enough") extra += (extra ? ". " : "") + "You have " + x.otherUnits.map(function (b) { return D.fmtQty(b.quantity, b.unit); }).join(", ") + " (different unit — check by hand)";
          return '<li class="ing-row"><div class="row-main"><div><span class="ing-amt">' + esc(D.fmtQty(x.need, x.unit)) + "</span> " + esc(x.ing.name) + "</div>" +
            (extra ? '<div class="row-sub">' + esc(extra) + "</div>" : "") + "</div>" + statusBadge(x) + "</li>";
        }).join("") + "</ul></section>" +

        '<section class="section"><h2 class="section-title">Steps</h2><ol class="step-list card card-pad">' +
        rec.steps.map(function (s, i) { return '<li><span class="step-num" aria-hidden="true">' + (i + 1) + "</span><span>" + esc(s) + "</span></li>"; }).join("") +
        "</ol></section>" +

        '<div class="sticky-actions"><div class="btn-row">' +
        (a.missing.length ? '<button type="button" class="btn btn-secondary" data-act="missing">' + icon("cart") + "Add missing (" + a.missing.length + ")</button>"
          : '<span class="badge badge-ok" style="align-self:center;padding:10px 14px">' + icon("check-circle") + "You have everything</span>") +
        '<button type="button" class="btn btn-primary" data-act="cook">' + icon("play") + "Start cooking</button></div></div>";

      UI.actions(root, {
        fav: function () { toggleFav(rec.id); UI.refresh(); },
        dec: function () { if (st.servings > 1) { st.servings--; UI.refresh(); } },
        inc: function () { if (st.servings < 24) { st.servings++; UI.refresh(); } },
        missing: function () { UI.go("recipe-addmissing", { id: rec.id, servings: st.servings }); },
        cook: function () { UI.go("recipe-cook", { id: rec.id, servings: st.servings }); }
      });
    }
  });

  /* ================= Add missing to list (T10) ================= */

  UI.register("recipe-addmissing", {
    title: "Add missing to list",
    render: function (root, r) {
      root.classList.add("no-fab");
      var rec = D.recipe(r.params.id);
      if (!rec) { missingRecipe(root); return; }
      var a = D.analyzeRecipe(rec, r.params.servings);
      var st = r.state;
      if (!st.items) {
        st.items = {};
        a.missing.forEach(function (x, i) {
          var onList = D.findOnList(x.ing.foodKey, x.unit, false);
          var listAmt = onList ? D.convert(onList.quantity, onList.unit, x.unit) : 0;
          var stillNeed = Math.max(0, D.round6(x.short - listAmt));
          st.items[i] = { sel: stillNeed > 0, amount: String(D.round2(stillNeed > 0 ? stillNeed : x.short)), unit: x.unit };
        });
      }
      if (!a.missing.length) {
        root.innerHTML = '<div class="card">' + UI.emptyState("check-circle", "Nothing missing", "You have enough of every ingredient for " + UI.plural(r.params.servings, "serving") + ".",
          '<button type="button" class="btn btn-primary btn-block" data-act="back">Back to recipe</button>') + "</div>";
        UI.actions(root, { back: UI.back });
        return;
      }

      root.innerHTML =
        '<p class="muted secondary">For <strong>' + esc(rec.name) + "</strong> at " + UI.plural(r.params.servings, "serving") + ". Amounts are what you’re short, after counting usable food in your kitchen.</p>" +
        a.missing.map(function (x, i) {
          var it = st.items[i];
          return '<div class="card card-pad">' +
            '<div class="sugg-head">' + UI.checkbox(it.sel, "Add " + x.ing.name, ' data-act="sel" data-i="' + i + '"') +
            '<div class="row-main" style="padding-top:12px"><div class="row-title">' + esc(x.ing.name) + statusBadge(x) + "</div>" +
            '<div class="row-sub">' + esc(shortageText(x)) + " (recipe needs " + esc(D.fmtQty(x.need, x.unit)) + ", you have " + esc(D.fmtQty(x.have, x.unit)) + " usable)</div></div></div>" +
            '<div class="field" style="margin:16px 0 0"><label class="label" for="am-' + i + '">Amount to add</label><div class="qty-row">' +
            '<input class="input" type="number" inputmode="decimal" min="0" step="any" id="am-' + i + '" data-amt="' + i + '" value="' + esc(it.amount) + '">' +
            '<div class="select-wrap"><select class="select" data-unit="' + i + '" aria-label="Unit">' + UI.unitOptions(it.unit, D.compatibleUnits(x.unit)) + "</select>" + icon("chevron-down") + "</div></div>" +
            '<div class="field-error" data-err="' + i + '"></div></div>' +
            '<div class="note note-info" style="margin-top:16px" data-note="' + i + '"></div></div>';
        }).join("") +
        '<section class="section card card-pad"><h2 class="section-title">Summary of changes</h2><ul class="change-list" id="am-summary"></ul></section>' +
        '<div class="sticky-actions"><button type="button" class="btn btn-primary btn-block" data-act="confirm" id="am-confirm"></button></div>';

      function changes() {
        var out = [], valid = true;
        a.missing.forEach(function (x, i) {
          var it = st.items[i];
          var amt = Number(it.amount);
          var ok = String(it.amount).trim() !== "" && isFinite(amt) && amt > 0;
          var onList = D.findOnList(x.ing.foodKey, it.unit, false);
          var listAmt = onList ? D.convert(onList.quantity, onList.unit, x.unit) : 0;
          var noteEl = root.querySelector('[data-note="' + i + '"]');
          var stillNeed = Math.max(0, D.round6(x.short - listAmt));
          if (onList && stillNeed <= 1e-9) noteEl.innerHTML = icon("check-circle") + "<span>" + esc(D.fmtQty(onList.quantity, onList.unit) + " " + lower(x.ing.name)) + " already on your list — nothing more needed.</span>";
          else if (onList) noteEl.innerHTML = icon("info") + "<span>" + esc(D.fmtQty(onList.quantity, onList.unit) + " " + lower(x.ing.name)) + " already on your list — adding " + esc(D.fmtQty(stillNeed, x.unit)) + " covers the rest.</span>";
          else noteEl.innerHTML = icon("info") + "<span>Not on your list yet.</span>";
          noteEl.className = "note " + (onList && stillNeed <= 1e-9 ? "note-ok" : "note-info");
          root.querySelector('[data-err="' + i + '"]').innerHTML = it.sel && !ok ? icon("alert") + "<span>Amount must be greater than 0.</span>" : "";
          if (!it.sel) return;
          if (!ok) { valid = false; return; }
          if (onList) out.push({ x: x, entry: onList, amt: amt, unit: it.unit,
            text: "Update " + onList.name + " on your list: " + D.fmtQty(onList.quantity, onList.unit) + " → " + D.fmtQty(onList.quantity + D.convert(amt, it.unit, onList.unit), onList.unit) });
          else out.push({ x: x, entry: null, amt: amt, unit: it.unit,
            text: "Add " + x.ing.name + " · " + D.fmtQty(amt, it.unit) + " · " + (D.sectionFor(x.ing.name) || "Other") + " · For " + rec.name });
        });
        return { list: out, valid: valid };
      }

      function refreshSummary() {
        var c = changes();
        root.querySelector("#am-summary").innerHTML = c.list.length ? c.list.map(function (ch) {
          return "<li>" + icon(ch.entry ? "edit" : "plus") + "<span>" + esc(ch.text) + "</span></li>";
        }).join("") : '<li class="muted"><span>No changes selected.</span></li>';
        var btn = root.querySelector("#am-confirm");
        btn.innerHTML = icon("check") + "Confirm (" + UI.plural(c.list.length, "change") + ")";
        btn.disabled = !c.list.length || !c.valid;
        return c;
      }
      refreshSummary();

      root.addEventListener("input", function (e) {
        var i = e.target.getAttribute("data-amt");
        if (i !== null) { st.items[i].amount = e.target.value; refreshSummary(); }
      });
      root.addEventListener("change", function (e) {
        var i = e.target.getAttribute("data-unit");
        if (i !== null) { st.items[i].unit = e.target.value; refreshSummary(); }
      });

      UI.actions(root, {
        sel: function (b) {
          var i = b.getAttribute("data-i");
          st.items[i].sel = !st.items[i].sel;
          b.setAttribute("aria-checked", String(st.items[i].sel));
          refreshSummary();
        },
        confirm: function (b) {
          var c = refreshSummary();
          if (!c.list.length || !c.valid) return;
          b.disabled = true;
          UI.withUndo(function () {
            c.list.forEach(function (ch) {
              if (ch.entry) {
                var e = D.shoppingEntry(ch.entry.id);
                e.quantity = D.round6(e.quantity + D.convert(ch.amt, ch.unit, e.unit));
              } else {
                D.addShopping({ name: ch.x.ing.name, quantity: ch.amt, unit: ch.unit, section: D.sectionFor(ch.x.ing.name) || "Other", source: "For " + rec.name });
              }
            });
            return UI.plural(c.list.length, "change") + " made to your list for " + rec.name;
          });
          UI.back();
        }
      });
    }
  });

  /* ================= Plan a meal (T9) ================= */

  UI.register("recipe-plan", {
    title: "Plan a meal",
    render: function (root, r) {
      root.classList.add("no-fab");
      var st = r.state;
      if (!st.people) st.people = 2;
      var ranked = D.state.recipes.map(function (rec) { return D.analyzeRecipe(rec, st.people); }).sort(function (x, y) {
        return (y.haveCount / y.total) - (x.haveCount / x.total) || x.missing.length - y.missing.length || D.totalTime(x.recipe) - D.totalTime(y.recipe);
      });

      // Unusable food that recipes would otherwise use.
      var used = {};
      D.state.recipes.forEach(function (rec) { rec.ingredients.forEach(function (i) { used[i.foodKey] = true; }); });
      var excluded = D.state.inventory.filter(function (b) { return used[b.foodKey] && D.exclusionReason(b); });

      root.innerHTML =
        '<div class="card card-pad" style="display:flex;align-items:center;justify-content:space-between;gap:16px">' +
        '<div><div class="label" style="margin:0">How many people?</div><div class="muted small">All recipes are scaled to this</div></div>' +
        stepper(st.people, "Number of people", "person", "people") + "</div>" +
        (excluded.length ? '<details class="why card"><summary>' + icon("info") + "<span style=\"flex:1\">Why some food isn’t counted (" + UI.plural(excluded.length, "item") + ")</span>" + icon("chevron-down", "icon-chev") + "</summary>" +
          '<div class="why-body"><p>Plans only use shared food and your own food that hasn’t expired.</p><ul>' +
          excluded.map(function (b) { return "<li>" + esc(b.name + " (" + D.fmtQty(b.quantity, b.unit) + ") — " + D.exclusionReason(b)) + "</li>"; }).join("") +
          "</ul></div></details>" : "") +
        '<section class="section"><div class="section-head"><h2 class="section-title">Best matches</h2><span class="muted secondary">Most available first</span></div>' +
        ranked.map(function (a) {
          var rec = a.recipe;
          return '<button type="button" class="card card-pad row" style="display:block;margin-bottom:16px" data-act="open" data-id="' + rec.id + '">' +
            '<div class="section-head" style="margin-bottom:6px"><span class="recipe-name">' + esc(rec.name) + "</span>" + icon("chevron-right") + "</div>" +
            '<div class="recipe-meta" style="margin-bottom:8px"><span>' + icon("clock") + D.totalTime(rec) + " min</span><span>" + icon("plate") + UI.plural(st.people, "serving") + "</span></div>" +
            availBadge(a, st.people) +
            (a.missing.length ? '<ul style="margin:10px 0 0;padding-left:22px" class="secondary">' + a.missing.map(function (x) { return "<li>" + esc(shortageText(x)) + "</li>"; }).join("") + "</ul>" : "") +
            "</button>";
        }).join("") + "</section>";

      UI.actions(root, {
        dec: function () { if (st.people > 1) { st.people--; UI.refresh(); } },
        inc: function () { if (st.people < 24) { st.people++; UI.refresh(); } },
        open: function (b) { UI.go("recipe-detail", { id: b.getAttribute("data-id"), servings: st.people }); }
      });
    }
  });

  /* ================= Cook mode + review (T11) ================= */

  // Plan which batches an ingredient comes out of: chosen batch first, then soonest-expiring.
  function allocate(x, chosenId) {
    var batches = D.usableBatches(x.ing.foodKey, x.unit);
    var chosen = batches.filter(function (b) { return b.id === chosenId; })[0];
    var order = chosen ? [chosen].concat(batches.filter(function (b) { return b !== chosen; })) : batches;
    var left = x.need, takes = [];
    order.forEach(function (b) {
      if (left <= 1e-9) return;
      var avail = D.convert(b.quantity, b.unit, x.unit);
      var take = Math.min(avail, left);
      takes.push({ batch: b, amount: D.round6(take) });
      left = D.round6(left - take);
    });
    var total = takes.reduce(function (s, t) { return s + t.amount; }, 0);
    return { batches: batches, takes: takes, total: total, enough: left <= 1e-9 };
  }

  function batchLabel(b) {
    return D.fmtQty(b.quantity, b.unit) + " · " + b.location + " · " + (b.expires ? "expires " + D.fmtDate(b.expires) : "no expiration");
  }

  UI.register("recipe-cook", {
    title: function (r) { return r.state.phase === "review" ? "Review what you used" : "Cooking"; },
    onBack: function (r) {
      var st = r.state;
      if (st.committed) return false;
      if (st.phase === "review") { st.phase = "steps"; return true; }
      if (st.step > 0) { st.step--; return true; }
      return false;
    },
    render: function (root, r) {
      root.classList.add("no-fab");
      var rec = D.recipe(r.params.id);
      if (!rec) { missingRecipe(root); return; }
      var st = r.state;
      if (st.phase === undefined) { st.phase = "steps"; st.step = 0; st.choice = {}; }
      var a = D.analyzeRecipe(rec, r.params.servings);

      if (st.phase === "steps") {
        var n = rec.steps.length;
        root.innerHTML =
          '<div class="muted secondary">' + esc(rec.name) + " · " + UI.plural(r.params.servings, "serving") + "</div>" +
          '<div class="cook-label">Step ' + (st.step + 1) + " of " + n + "</div>" +
          '<div class="progress" role="progressbar" aria-valuemin="1" aria-valuemax="' + n + '" aria-valuenow="' + (st.step + 1) + '" aria-label="Step progress">' +
          '<div class="progress-fill" style="width:' + ((st.step + 1) / n) * 100 + '%"></div></div>' +
          '<div class="card card-pad" style="margin:24px 0"><p class="cook-step">' + esc(rec.steps[st.step]) + "</p></div>" +
          '<div class="btn-row">' +
          '<button type="button" class="btn btn-secondary" data-act="prev">' + icon("arrow-left") + (st.step === 0 ? "Exit" : "Back") + "</button>" +
          '<button type="button" class="btn btn-primary" data-act="next">' + (st.step === n - 1 ? "Done — review what you used" : "Next") + icon("chevron-right") + "</button></div>";
        UI.actions(root, {
          prev: function () { UI.back(); },
          next: function () {
            if (st.step < n - 1) st.step++; else st.phase = "review";
            r.scroll = 0;
            UI.refresh();
          }
        });
        return;
      }

      // Review
      a.items.forEach(function (x, i) {
        if (!st.choice[i]) {
          var first = D.usableBatches(x.ing.foodKey, x.unit)[0];
          st.choice[i] = { batchId: first ? first.id : null, skip: false };
        }
      });

      root.innerHTML =
        '<p class="muted secondary">' + esc(rec.name) + " · " + UI.plural(r.params.servings, "serving") + ". Check what you used. Confirming updates your kitchen.</p>" +
        a.items.map(function (x, i) {
          var ch = st.choice[i];
          var al = allocate(x, ch.batchId);
          var body;
          if (!al.batches.length) {
            body = '<div class="note note-warning">' + icon("info") + "<span>None in your kitchen that you can use — nothing to deduct.</span></div>";
          } else {
            var plan = al.takes.map(function (t, k) {
              return (k === 0 ? "Takes " : "and ") + D.fmtQty(t.amount, x.unit) + " from the batch " + (t.batch.expires ? "expiring " + D.fmtDate(t.batch.expires) : "with no expiration") + " (" + t.batch.location + ")";
            }).join(" ");
            if (al.takes.length > 1) plan += " — the first batch isn’t enough, so the rest comes from the next one.";
            body =
              (al.batches.length > 1 ? '<div class="field" style="margin-bottom:12px"><label class="label" for="ck-' + i + '">Take from</label><div class="select-wrap">' +
                '<select class="select" id="ck-' + i + '" data-batch="' + i + '">' + al.batches.map(function (b) {
                  return '<option value="' + b.id + '"' + (b.id === ch.batchId ? " selected" : "") + ">" + esc(batchLabel(b)) + "</option>";
                }).join("") + "</select>" + icon("chevron-down") + "</div></div>"
                : '<p class="secondary" style="margin-bottom:12px">From: ' + esc(batchLabel(al.batches[0])) + "</p>") +
              '<div class="radio-list" role="radiogroup" aria-label="' + esc(x.ing.name) + '">' +
              '<button type="button" class="radio" role="radio" aria-checked="' + !ch.skip + '" data-act="deduct" data-i="' + i + '"><span class="radio-dot"></span><span class="radio-text">' +
              (al.enough ? "<strong>Deduct " + esc(D.fmtQty(x.need, x.unit)) + "</strong>" + esc(plan)
                : "<strong>Only " + esc(D.fmtQty(al.total, x.unit)) + " available — deduct " + esc(D.fmtQty(al.total, x.unit)) + "</strong>" + esc(plan)) + "</span></button>" +
              '<button type="button" class="radio" role="radio" aria-checked="' + !!ch.skip + '" data-act="skip" data-i="' + i + '"><span class="radio-dot"></span><span class="radio-text"><strong>Skip this ingredient</strong>Don’t change my kitchen for it</span></button></div>';
          }
          return '<div class="card card-pad"><div class="row-title" style="margin-bottom:8px">' + esc(x.ing.name) + ' <span class="ing-amt">· ' + esc(D.fmtQty(x.need, x.unit)) + "</span></div>" + body + "</div>";
        }).join("") +
        '<div class="sticky-actions"><button type="button" class="btn btn-primary btn-block" data-act="confirm" id="ck-confirm">' + icon("check") + "Update kitchen</button></div>";

      root.addEventListener("change", function (e) {
        var i = e.target.getAttribute("data-batch");
        if (i !== null) { st.choice[i].batchId = e.target.value; UI.refresh(); }
      });

      UI.actions(root, {
        deduct: function (b) { st.choice[b.getAttribute("data-i")].skip = false; UI.refresh(); },
        skip: function (b) { st.choice[b.getAttribute("data-i")].skip = true; UI.refresh(); },
        confirm: function (b) {
          if (st.committed) return; // double-submit guard
          st.committed = true;
          b.disabled = true;
          var lines = [];
          UI.withUndo(function () {
            a.items.forEach(function (x, i) {
              var ch = st.choice[i];
              if (ch.skip) { lines.push(x.ing.name + ": skipped"); return; }
              var al = allocate(x, ch.batchId);
              if (!al.takes.length) { lines.push(x.ing.name + ": none in kitchen, nothing deducted"); return; }
              al.takes.forEach(function (t) {
                var before = D.fmtQty(t.batch.quantity, t.batch.unit);
                var left = D.deduct(t.batch, t.amount, x.unit);
                lines.push(t.batch.name + " (" + t.batch.location + "): " + before + " → " + (left > 0 ? D.fmtQty(left, t.batch.unit) : "used up, batch removed"));
              });
            });
            return "Kitchen updated after cooking " + rec.name;
          });
          UI.replace("recipe-cooked", { id: rec.id, lines: lines });
        }
      });
    }
  });

  UI.register("recipe-cooked", {
    title: "Enjoy your meal",
    staleAfterUndo: true,
    render: function (root, r) {
      root.classList.add("no-fab");
      var rec = D.recipe(r.params.id);
      root.innerHTML = '<div class="big-check">' + icon("check") + "</div>" +
        '<h2 class="section-title" style="text-align:center">' + esc(rec ? rec.name : "Recipe") + " cooked</h2>" +
        '<p class="muted" style="text-align:center">Here’s what changed in your kitchen.</p>' +
        '<div class="card card-pad"><ul class="change-list">' + r.params.lines.map(function (t) { return "<li>" + icon("check") + "<span>" + esc(t) + "</span></li>"; }).join("") + "</ul></div>" +
        '<div class="btn-row" style="margin-top:24px"><button type="button" class="btn btn-secondary" data-act="recipes">Back to recipes</button>' +
        '<button type="button" class="btn btn-primary" data-act="kitchen">' + icon("kitchen") + "View in Kitchen</button></div>";
      UI.actions(root, {
        recipes: function () { UI.popToRoot(); },
        kitchen: function () { UI.popToRoot(); UI.switchTab("kitchen", true); }
      });
    }
  });
})();
