/* kitchen.js — Feature set 1: kitchen inventory (landing screen).
   Screens: kitchen, kitchen-item, kitchen-form, kitchen-use, kitchen-attention, kitchen-stock. */
(function () {
  "use strict";
  var KC = window.KC;
  var D = KC.data, UI = KC.ui, icon = KC.icon, esc = UI.esc;

  var SORTS = [
    { id: "expiry", label: "Expiring soonest" },
    { id: "az", label: "A–Z" },
    { id: "recent", label: "Recently added" }
  ];

  function sortBatches(list, sort) {
    var copy = list.slice();
    if (sort === "az") copy.sort(function (a, b) { return a.name.localeCompare(b.name) || D.expSortKey(a) - D.expSortKey(b); });
    else if (sort === "recent") copy.sort(function (a, b) { return a.added < b.added ? 1 : a.added > b.added ? -1 : a.name.localeCompare(b.name); });
    else copy.sort(function (a, b) { return D.expSortKey(a) - D.expSortKey(b) || a.name.localeCompare(b.name); });
    return copy;
  }

  function attentionCounts() {
    var expired = 0, soon = 0;
    D.state.inventory.forEach(function (b) {
      var lvl = D.expiryInfo(b.expires).level;
      if (lvl === "expired") expired++;
      else if (lvl === "soon") soon++;
    });
    return { expired: expired, soon: soon };
  }

  function batchRow(b, sub) {
    var locIcon = D.LOCATION_ICONS[b.location] || "box";
    return '<li><button type="button" class="row" data-act="open" data-id="' + b.id + '">' +
      '<span class="row-icon">' + icon(locIcon) + "</span>" +
      '<span class="row-main"><span class="row-title">' + esc(b.name) + UI.ownerTag(b.owner) + "</span>" +
      '<span class="row-sub">' + esc(sub || b.location) + "</span></span>" +
      '<span class="row-end"><span class="row-qty">' + esc(D.fmtQty(b.quantity, b.unit)) + "</span>" + UI.expiryBadge(b.expires) + "</span>" +
      "</button></li>";
  }

  function openBatch(id) {
    var b = D.batch(id);
    if (b) UI.go("kitchen-item", { foodKey: b.foodKey, batchId: b.id });
  }

  /* ================= Kitchen (top level) ================= */

  UI.register("kitchen", {
    title: "Kitchen",
    render: function (root, r) {
      var st = r.state;
      if (st.q === undefined) { st.q = ""; st.loc = "All"; st.sort = "expiry"; }
      var counts = attentionCounts();
      var sortLabel = SORTS.filter(function (s) { return s.id === st.sort; })[0].label;
      var banner = "";
      if (counts.expired || counts.soon) {
        var parts = [];
        if (counts.expired) parts.push(counts.expired + " expired");
        if (counts.soon) parts.push(counts.soon + " expiring soon");
        banner = '<button type="button" class="banner ' + (counts.expired ? "banner-danger" : "banner-warning") + '" data-act="attention">' +
          icon("alert") + '<span class="banner-main"><strong>' + esc(parts.join(" · ")) + "</strong>" +
          '<span class="banner-sub">Tap to review food that needs attention</span></span>' + icon("chevron-right") + "</button>";
      }
      root.innerHTML =
        '<div class="search">' + icon("search") +
        '<input class="input" type="search" id="k-search" placeholder="Search your kitchen" aria-label="Search your kitchen" value="' + esc(st.q) + '" autocomplete="off"></div>' +
        banner +
        '<div class="chip-row" role="group" aria-label="Filter by location">' +
        ["All"].concat(D.LOCATIONS).map(function (l) {
          return '<button type="button" class="chip" data-act="loc" data-loc="' + l + '" aria-pressed="' + (st.loc === l) + '">' +
            (l === "All" ? "" : icon(D.LOCATION_ICONS[l])) + l + "</button>";
        }).join("") + "</div>" +
        '<div class="toolbar"><span class="toolbar-count" id="k-count"></span>' +
        '<button type="button" class="sort-btn" data-act="sort" aria-label="Sort: ' + esc(sortLabel) + '. Tap to change.">' + icon("sort") + "Sort: " + esc(sortLabel) + "</button></div>" +
        '<div id="k-list"></div>';

      var listEl = root.querySelector("#k-list");
      var countEl = root.querySelector("#k-count");

      function renderList() {
        var q = st.q.trim().toLowerCase();
        var items = D.state.inventory.filter(function (b) {
          return (st.loc === "All" || b.location === st.loc) && (!q || b.name.toLowerCase().indexOf(q) >= 0 || b.category.toLowerCase().indexOf(q) >= 0);
        });
        var where = st.loc === "All" ? "in your kitchen" : "in " + st.loc;
        countEl.textContent = UI.plural(items.length, "item") + " " + where;
        if (!items.length) {
          var title = q ? "No '" + st.q.trim() + "' " + where : "Nothing " + where + " yet";
          var acts = "";
          if (q || st.loc !== "All") acts += '<button type="button" class="btn btn-secondary btn-block" data-act="clear">' + icon("close") + "Clear filters</button>";
          acts += '<button type="button" class="btn btn-primary btn-block" data-act="add-named">' + icon("plus") +
            (q ? "Add '" + esc(st.q.trim()) + "'" : "Add item") + "</button>";
          listEl.innerHTML = '<div class="card">' + UI.emptyState("search", title, q ? "Check the spelling, try another location, or add it now." : "", acts) + "</div>";
          return;
        }
        listEl.innerHTML = '<ul class="list card">' + sortBatches(items, st.sort).map(function (b) { return batchRow(b); }).join("") + "</ul>";
      }
      renderList();

      root.querySelector("#k-search").addEventListener("input", function (e) { st.q = e.target.value; renderList(); });

      UI.actions(root, {
        open: function (b) { openBatch(b.getAttribute("data-id")); },
        attention: function () { UI.go("kitchen-attention"); },
        loc: function (b) { st.loc = b.getAttribute("data-loc"); UI.refresh(); },
        sort: function () {
          var i = SORTS.map(function (s) { return s.id; }).indexOf(st.sort);
          st.sort = SORTS[(i + 1) % SORTS.length].id;
          UI.refresh();
        },
        clear: function () { st.q = ""; st.loc = "All"; UI.refresh(); },
        "add-named": function () {
          UI.go("kitchen-form", { name: st.q.trim(), location: st.loc === "All" ? null : st.loc });
        }
      });
      UI.setFab({ label: "Add item", onClick: function () { UI.go("kitchen-form", { location: st.loc === "All" ? null : st.loc }); } });
    }
  });

  /* ================= Needs attention (T3) ================= */

  UI.register("kitchen-attention", {
    title: "Needs attention",
    render: function (root) {
      root.classList.add("no-fab");
      var expired = [], soon = [];
      D.state.inventory.forEach(function (b) {
        var info = D.expiryInfo(b.expires);
        if (info.level === "expired") expired.push(b);
        else if (info.level === "soon") soon.push(b);
      });
      var byDate = function (a, b) { return D.expSortKey(a) - D.expSortKey(b); };
      expired.sort(byDate);
      soon.sort(byDate);
      function section(title, iconName, list, emptyText) {
        return '<section class="section"><div class="section-head"><h2 class="section-title">' + esc(title) + "</h2>" +
          '<span class="muted secondary">' + UI.plural(list.length, "item") + "</span></div>" +
          (list.length ? '<ul class="list card">' + list.map(function (b) { return batchRow(b, b.location + " · " + D.ownerLabel(b.owner)); }).join("") + "</ul>"
            : '<div class="note note-ok">' + icon("check-circle") + "<span>" + esc(emptyText) + "</span></div>") + "</section>";
      }
      root.innerHTML =
        '<p class="muted secondary">Most urgent first. Tap an item to use it up, discard it, or change its date.</p>' +
        section("Expired", "x-circle", expired, "Nothing has expired.") +
        section("Expiring soon (within " + D.SOON_DAYS + " days)", "alert", soon, "Nothing expires in the next " + D.SOON_DAYS + " days.");
      UI.actions(root, { open: function (b) { openBatch(b.getAttribute("data-id")); } });
    }
  });

  /* ================= Item details ================= */

  function stockSummary(key) {
    var rule = D.state.stockRules[key];
    var batches = D.batchesFor(key);
    var unit = rule ? rule.alertUnit : batches[0] ? batches[0].unit : "each";
    var usable = D.usableAmount(key, unit);
    var html;
    if (!rule) {
      html = '<p class="muted">No stock alert set. Set one to get restock suggestions on your shopping list when this runs low.</p>';
    } else {
      var below = usable < rule.alertQty - 1e-9;
      html = '<p><strong>Alert me below ' + esc(D.fmtQty(rule.alertQty, rule.alertUnit)) + "</strong> · restock up to " + esc(D.fmtQty(rule.targetQty, rule.targetUnit)) + "</p>" +
        (below ? UI.badge("warning", "alert", "Below alert: " + D.fmtQty(usable, unit) + " usable") : UI.badge("ok", "check-circle", "OK: " + D.fmtQty(usable, unit) + " usable"));
    }
    return html;
  }

  UI.register("kitchen-item", {
    title: function (r) {
      var b = D.batchesFor(r.params.foodKey)[0];
      return b ? b.name : "Item details";
    },
    render: function (root, r) {
      root.classList.add("no-fab");
      var key = r.params.foodKey;
      var batches = D.batchesFor(key);
      var st = r.state;
      if (!st.sel || !D.batch(st.sel) || D.batch(st.sel).foodKey !== key) st.sel = (D.batch(r.params.batchId) && D.batch(r.params.batchId).foodKey === key) ? r.params.batchId : batches[0] && batches[0].id;
      var rule = D.state.stockRules[key];

      if (!batches.length) {
        root.innerHTML = '<div class="card">' + UI.emptyState("box", "None left", "There are no batches of this item in your kitchen anymore.",
          '<button type="button" class="btn btn-primary btn-block" data-act="kitchen">Back to Kitchen</button>') + "</div>" +
          (rule ? '<section class="section card card-pad"><h2 class="section-title">' + icon("bell") + " Stock alert</h2>" + stockSummary(key) + "</section>" : "");
        UI.actions(root, { kitchen: function () { UI.popToRoot(); } });
        return;
      }

      var first = batches[0];
      var unit = first.unit;
      var compatibleBatches = batches.filter(function (b) { return D.compatible(b.unit, unit); });
      var total = compatibleBatches.reduce(function (s, b) { return s + D.convert(b.quantity, b.unit, unit); }, 0);
      var usable = D.usableAmount(key, unit);
      var excluded = D.excludedBatches(key);
      var sel = D.batch(st.sel);

      root.innerHTML =
        '<div class="card card-pad summary-card"><span class="row-icon">' + icon(D.LOCATION_ICONS[first.location] || "box") + "</span>" +
        '<div class="row-main"><div class="stat-line"><span class="big-number">' + esc(D.fmtQty(total, unit)) + "</span>" +
        '<span class="muted">total in ' + UI.plural(batches.length, "batch", "batches") + "</span></div>" +
        '<div class="row-sub">' + esc(first.category) + (excluded.length ? " · " + esc(D.fmtQty(usable, unit)) + " usable for your recipes" : "") + "</div></div></div>" +

        '<section class="section"><div class="section-head"><h2 class="section-title">' + (batches.length > 1 ? "Choose a batch" : "Batch") + "</h2>" +
        '<button type="button" class="btn btn-tertiary" data-act="add-batch">' + icon("plus") + "Add batch</button></div>" +
        '<div class="radio-list" role="radiogroup" aria-label="Batches">' +
        batches.map(function (b) {
          var on = b.id === st.sel;
          var why = D.exclusionReason(b);
          return '<button type="button" class="radio" role="radio" aria-checked="' + on + '" data-act="sel" data-id="' + b.id + '">' +
            '<span class="radio-dot"></span><span class="radio-text"><strong>' + esc(D.fmtQty(b.quantity, b.unit)) + " · " + esc(b.location) + "</strong>" +
            '<span class="batch-meta">' + UI.expiryBadge(b.expires) + (b.owner === "shared" ? '<span class="tag tag-source">Shared</span>' : UI.ownerTag(b.owner)) +
            '<span class="muted">Added ' + esc(D.fmtDate(b.added)) + "</span></span>" +
            (why ? '<span class="muted small">Not counted in your recipes: ' + esc(why) + "</span>" : "") +
            "</span></button>";
        }).join("") + "</div></section>" +

        '<section class="section"><h2 class="section-title">Actions for ' + esc(D.fmtQty(sel.quantity, sel.unit)) + " batch</h2>" +
        '<div class="btn-grid">' +
        '<button type="button" class="btn btn-primary" data-act="use">' + icon("utensils") + "Use</button>" +
        '<button type="button" class="btn btn-secondary" data-act="discard">' + icon("discard") + "Discard</button>" +
        '<button type="button" class="btn btn-secondary" data-act="edit">' + icon("edit") + "Edit</button>" +
        '<button type="button" class="btn btn-danger-outline" data-act="delete">' + icon("trash") + "Delete</button>" +
        "</div></section>" +

        '<section class="section card card-pad"><div class="section-head"><h2 class="section-title">' + icon("bell") + " Stock alert</h2></div>" +
        stockSummary(key) +
        '<button type="button" class="btn btn-secondary btn-block" style="margin-top:16px" data-act="stock">' + icon("bell") + (rule ? "Edit stock alert" : "Set stock alert") + "</button></section>";

      UI.actions(root, {
        sel: function (b) { st.sel = b.getAttribute("data-id"); UI.refresh(); },
        use: function () { UI.go("kitchen-use", { batchId: st.sel, mode: "use" }); },
        discard: function () { UI.go("kitchen-use", { batchId: st.sel, mode: "discard" }); },
        edit: function () { UI.go("kitchen-form", { batchId: st.sel }); },
        stock: function () { UI.go("kitchen-stock", { foodKey: key }); },
        "add-batch": function () { UI.go("kitchen-form", { name: first.name, category: first.category, location: first.location }); },
        "delete": function () {
          var b = D.batch(st.sel);
          if (!b) return;
          UI.withUndo(function () {
            D.removeBatch(b.id);
            return "Deleted " + b.name + " (" + D.fmtQty(b.quantity, b.unit) + ")";
          });
          st.sel = null;
          if (D.batchesFor(key).length) UI.refresh(); else UI.back();
        }
      });
    }
  });

  /* ================= Use / discard (T2) ================= */

  var REASONS = ["Expired", "Spoiled", "Didn't like it", "Other"];

  UI.register("kitchen-use", {
    title: function (r) { return r.params.mode === "discard" ? "Discard" : "Use"; },
    render: function (root, r) {
      root.classList.add("no-fab");
      var b = D.batch(r.params.batchId);
      var discard = r.params.mode === "discard";
      if (!b) {
        root.innerHTML = '<div class="card">' + UI.emptyState("box", "This batch is gone", "It may have been used up or deleted.",
          '<button type="button" class="btn btn-primary btn-block" data-act="back">Go back</button>') + "</div>";
        UI.actions(root, { back: UI.back });
        return;
      }
      var st = r.state;
      if (!st.unit) { st.unit = b.unit; st.amount = ""; st.reason = discard && D.expiryInfo(b.expires).level === "expired" ? "Expired" : null; }
      var units = D.compatibleUnits(b.unit);

      root.innerHTML =
        '<div class="card card-pad"><div class="row-title">' + esc(b.name) + UI.ownerTag(b.owner) + "</div>" +
        '<div class="row-sub">' + esc(D.fmtQty(b.quantity, b.unit)) + " in this batch · " + esc(b.location) + "</div>" +
        '<div class="batch-meta">' + UI.expiryBadge(b.expires) + "</div></div>" +

        '<section class="section"><div class="field"><label class="label" for="u-amt">' + (discard ? "Amount to discard" : "Amount used") + "</label>" +
        '<div class="qty-row"><input class="input" id="u-amt" type="number" inputmode="decimal" min="0" step="any" placeholder="0" value="' + esc(st.amount) + '">' +
        '<div class="select-wrap"><select class="select" id="u-unit" aria-label="Unit">' + UI.unitOptions(st.unit, units) + "</select>" + icon("chevron-down") + "</div></div>" +
        '<div class="quick-row" role="group" aria-label="Quick amounts">' +
        '<button type="button" class="chip" aria-pressed="false" data-act="frac" data-f="0.25">¼ of batch</button>' +
        '<button type="button" class="chip" aria-pressed="false" data-act="frac" data-f="0.5">½ of batch</button>' +
        '<button type="button" class="chip" aria-pressed="false" data-act="frac" data-f="1">All</button></div>' +
        '<div class="field-error" id="u-err" role="alert"></div></div>' +

        (discard ? '<div class="field"><span class="label" id="u-reason-l">Why are you discarding it?</span>' +
          UI.segmented("reason", REASONS.map(function (x) { return { value: x, label: x }; }), st.reason, "Reason") +
          '<div class="field-error" id="u-reason-err"></div></div>' : "") +

        '<div class="preview is-idle" id="u-prev" aria-live="polite"></div></section>' +

        '<div class="btn-row" style="margin-top:24px">' +
        '<button type="button" class="btn btn-secondary" data-act="cancel">Cancel</button>' +
        '<button type="button" class="btn ' + (discard ? "btn-danger" : "btn-primary") + '" id="u-confirm" data-act="confirm" disabled>' + (discard ? "Confirm discard" : "Confirm use") + "</button></div>";

      var amtEl = root.querySelector("#u-amt"), unitEl = root.querySelector("#u-unit");
      var errEl = root.querySelector("#u-err"), prevEl = root.querySelector("#u-prev"), btn = root.querySelector("#u-confirm");

      function evaluate() {
        var amt = UI.num(amtEl);
        var res = { ok: false };
        errEl.innerHTML = "";
        amtEl.classList.remove("has-error");
        prevEl.className = "preview";
        if (isNaN(amt)) {
          prevEl.className = "preview is-idle";
          prevEl.textContent = "Enter an amount to see what's left (now " + D.fmtQty(b.quantity, b.unit) + ").";
        } else if (amt <= 0) {
          errEl.innerHTML = icon("alert") + "<span>Amount must be greater than 0.</span>";
          amtEl.classList.add("has-error");
          prevEl.className = "preview is-idle";
          prevEl.textContent = "Now " + D.fmtQty(b.quantity, b.unit) + ".";
        } else {
          var inBatch = D.convert(amt, unitEl.value, b.unit);
          var left = D.round6(b.quantity - inBatch);
          if (left < -1e-6) {
            errEl.innerHTML = icon("alert") + "<span>You only have " + esc(D.fmtQty(b.quantity, b.unit)) + " in this batch.</span>";
            amtEl.classList.add("has-error");
            prevEl.className = "preview is-error";
            prevEl.textContent = "Can't " + (discard ? "discard" : "use") + " " + D.fmtQty(amt, unitEl.value) + ". Lower the amount or tap All.";
          } else {
            left = Math.max(0, left);
            prevEl.textContent = left <= 1e-6 ? "Remaining: none. This batch will be removed (was " + D.fmtQty(b.quantity, b.unit) + ")."
              : "Remaining: " + D.fmtQty(left, b.unit) + " (was " + D.fmtQty(b.quantity, b.unit) + ")";
            res = { ok: true, amt: amt, unit: unitEl.value, left: left };
          }
        }
        btn.disabled = !res.ok;
        return res;
      }
      evaluate();

      amtEl.addEventListener("input", function () { st.amount = amtEl.value; evaluate(); });
      unitEl.addEventListener("change", function () { st.unit = unitEl.value; evaluate(); });
      if (discard) UI.bindSeg(root, "reason", function (v) { st.reason = v; root.querySelector("#u-reason-err").innerHTML = ""; });

      UI.actions(root, {
        frac: function (el) {
          var f = Number(el.getAttribute("data-f"));
          unitEl.value = b.unit;
          st.unit = b.unit;
          amtEl.value = D.round2(b.quantity * f);
          if (f === 1) amtEl.value = b.quantity;
          st.amount = amtEl.value;
          evaluate();
        },
        cancel: UI.back,
        confirm: function () {
          var res = evaluate();
          if (!res.ok) return;
          if (discard && !st.reason) {
            root.querySelector("#u-reason-err").innerHTML = icon("alert") + "<span>Choose a reason.</span>";
            return;
          }
          btn.disabled = true;
          var key = b.foodKey;
          UI.withUndo(function () {
            var left = D.deduct(b, res.amt, res.unit);
            if (discard) D.state.log.push({ type: "discard", name: b.name, amount: res.amt, unit: res.unit, reason: st.reason, date: D.today() });
            var what = (discard ? "Discarded " : "Used ") + D.fmtQty(res.amt, res.unit) + " " + b.name;
            return what + (left > 0 ? " · " + D.fmtQty(left, b.unit) + " left" : " · batch used up");
          });
          if (D.batchesFor(key).length) UI.back(); else UI.popToRoot();
        }
      });
    }
  });

  /* ================= Add / edit form (T1) ================= */

  UI.register("kitchen-form", {
    title: function (r) { return r.params.batchId ? "Edit item" : "Add item"; },
    onBack: function (r) {
      if (r.state.step === 2) { r.state.step = 1; return true; }
      return false;
    },
    render: function (root, r) {
      root.classList.add("no-fab");
      var st = r.state;
      var p = r.params;
      var editing = p.batchId ? D.batch(p.batchId) : null;
      if (p.batchId && !editing) {
        root.innerHTML = '<div class="card">' + UI.emptyState("box", "This item is gone", "It may have been used up or deleted.",
          '<button type="button" class="btn btn-primary btn-block" data-act="back">Go back</button>') + "</div>";
        UI.actions(root, { back: UI.back });
        return;
      }
      if (!st.step) {
        var src = editing || {};
        st.step = 1;
        st.errors = {};
        st.name = src.name || p.name || "";
        st.category = src.category || p.category || "";
        st.quantity = editing ? String(D.round2(src.quantity)) : "";
        st.unit = src.unit || "each";
        st.owner = src.owner || D.state.defaultOwner;
        st.location = src.location || p.location || "";
        st.expires = editing ? src.expires || "" : "";
        st.noExp = editing ? !src.expires : false;
        if (!editing && st.name) autofill(st);
      }

      var steps = '<div class="steps-caption">Step ' + st.step + " of 2</div><div class=\"steps\">" +
        '<div class="steps-item' + (st.step >= 1 ? " is-on" : "") + '"><div class="steps-bar"></div>1. What is it?</div>' +
        '<div class="steps-item' + (st.step >= 2 ? " is-on" : "") + '"><div class="steps-bar"></div>2. Where &amp; when</div></div>';

      function err(k) { return st.errors[k] ? icon("alert") + "<span>" + esc(st.errors[k]) + "</span>" : ""; }

      if (st.step === 1) {
        root.innerHTML = steps +
          '<h2 class="section-title">What is it?</h2>' +
          '<div class="field"><label class="label" for="f-name">Name</label>' +
          '<input class="input' + (st.errors.name ? " has-error" : "") + '" id="f-name" type="text" autocomplete="off" placeholder="e.g. Milk" value="' + esc(st.name) + '">' +
          '<div class="field-error" role="alert">' + err("name") + "</div></div>" +
          '<div class="field"><label class="label" for="f-cat">Category</label><div class="select-wrap"><select class="select" id="f-cat">' +
          '<option value="">Choose a category</option>' + UI.options(D.CATEGORY_NAMES, st.category) + "</select>" + icon("chevron-down") + "</div>" +
          '<div class="field-error" role="alert">' + err("category") + "</div></div>" +
          '<div class="field"><label class="label" for="f-qty">Quantity</label><div class="qty-row">' +
          '<input class="input' + (st.errors.quantity ? " has-error" : "") + '" id="f-qty" type="number" inputmode="decimal" min="0" step="any" placeholder="0" value="' + esc(st.quantity) + '">' +
          '<div class="select-wrap"><select class="select" id="f-unit" aria-label="Unit">' + UI.unitOptions(st.unit) + "</select>" + icon("chevron-down") + "</div></div>" +
          '<div class="hint">Liquids in mL, L, cups…; weights in g, kg, oz, lb; or a count.</div>' +
          '<div class="field-error" role="alert">' + err("quantity") + "</div></div>" +
          '<div class="field"><span class="label">Who does it belong to?</span>' +
          UI.segmented("owner", UI.ownerItems(), st.owner, "Owner") +
          '<div class="hint">Shared items can be used by everyone. Personal items are never used in other people’s recipes.</div></div>' +
          '<div class="btn-row"><button type="button" class="btn btn-secondary" data-act="cancel">Cancel</button>' +
          '<button type="button" class="btn btn-primary" data-act="next">Next' + icon("chevron-right") + "</button></div>";

        var nameEl = root.querySelector("#f-name");
        nameEl.addEventListener("input", function () { st.name = nameEl.value; });
        nameEl.addEventListener("change", function () {
          if (!editing && autofill(st)) root.querySelector("#f-cat").value = st.category;
        });
        root.querySelector("#f-cat").addEventListener("change", function (e) { st.category = e.target.value; });
        root.querySelector("#f-qty").addEventListener("input", function (e) { st.quantity = e.target.value; });
        root.querySelector("#f-unit").addEventListener("change", function (e) { st.unit = e.target.value; });
        UI.bindSeg(root, "owner", function (v) { st.owner = v; });

        UI.actions(root, {
          cancel: UI.back,
          next: function () {
            st.errors = {};
            if (!st.name.trim()) st.errors.name = "Enter a name for this item.";
            if (!st.category) st.errors.category = "Choose a category.";
            var q = Number(st.quantity);
            if (String(st.quantity).trim() === "" || !isFinite(q) || q <= 0) st.errors.quantity = "Quantity must be greater than 0.";
            if (!Object.keys(st.errors).length) {
              st.step = 2;
              if (!st.location) st.location = (D.CATEGORIES[st.category] || {}).location || "Fridge";
            }
            r.scroll = 0;
            UI.refresh();
          }
        });
        return;
      }

      // Step 2
      var existing = editing ? [] : D.batchesFor(D.foodKey(st.name));
      root.innerHTML = steps +
        '<h2 class="section-title">Where &amp; when</h2>' +
        '<div class="card card-pad" style="margin-bottom:24px"><div class="row-title">' + esc(st.name) + "</div>" +
        '<div class="row-sub">' + esc(D.fmtQty(Number(st.quantity), st.unit)) + " · " + esc(st.category) + " · " + esc(D.ownerLabel(st.owner)) + "</div></div>" +
        '<div class="field"><span class="label">Location</span>' +
        UI.segmented("loc", D.LOCATIONS.map(function (l) { return { value: l, label: l }; }), st.location, "Location") + "</div>" +
        '<div class="field"><label class="label" for="f-exp">Expiration date</label>' +
        '<input class="input' + (st.errors.expires ? " has-error" : "") + '" id="f-exp" type="date" value="' + esc(st.expires) + '"' + (st.noExp ? " disabled" : "") + ">" +
        '<div class="quick-row" role="group" aria-label="Quick dates">' +
        [[3, "+3 days"], [7, "+1 week"], [14, "+2 weeks"]].map(function (x) {
          return '<button type="button" class="chip" aria-pressed="false" data-act="quick" data-d="' + x[0] + '"' + (st.noExp ? " disabled" : "") + ">" + x[1] + "</button>";
        }).join("") + "</div>" +
        '<div class="check-line">' + UI.checkbox(st.noExp, "No expiration", ' id="f-noexp" data-act="noexp"') + '<span data-act="noexp">No expiration</span></div>' +
        '<div class="field-error" role="alert">' + err("expires") + "</div></div>" +
        (existing.length ? '<div class="note note-info" style="margin-bottom:24px">' + icon("info") + "<span>You already have " + esc(existing.map(function (b) {
          return D.fmtQty(b.quantity, b.unit) + " (" + b.location + ", " + D.expiryInfo(b.expires).text.toLowerCase() + ")";
        }).join(" and ")) + ". This will be saved as a separate batch with its own expiration date.</span></div>" : "") +
        '<div class="btn-row"><button type="button" class="btn btn-secondary" data-act="prev">' + icon("arrow-left") + "Back</button>" +
        '<button type="button" class="btn btn-primary" data-act="save">' + icon("check") + (editing ? "Save changes" : "Save item") + "</button></div>";

      var expEl = root.querySelector("#f-exp");
      expEl.addEventListener("change", function () { st.expires = expEl.value; });
      expEl.addEventListener("input", function () { st.expires = expEl.value; });
      UI.bindSeg(root, "loc", function (v) { st.location = v; });

      UI.actions(root, {
        prev: function () { st.step = 1; UI.refresh(); },
        quick: function (el) { st.expires = D.addDays(D.today(), Number(el.getAttribute("data-d"))); st.errors.expires = null; UI.refresh(); },
        noexp: function () { st.noExp = !st.noExp; if (st.noExp) st.errors.expires = null; UI.refresh(); },
        save: function () {
          st.errors = {};
          if (!st.noExp && !st.expires) st.errors.expires = "Pick an expiration date or check No expiration.";
          if (Object.keys(st.errors).length) { UI.refresh(); return; }
          var fields = {
            name: st.name.trim(), category: st.category, quantity: D.round6(Number(st.quantity)), unit: st.unit,
            owner: st.owner, location: st.location, expires: st.noExp ? null : st.expires
          };
          if (editing) {
            UI.withUndo(function () {
              var b = D.batch(editing.id);
              Object.keys(fields).forEach(function (k) { b[k] = fields[k]; });
              b.foodKey = D.foodKey(b.name);
              return "Saved changes to " + b.name;
            });
            UI.back();
          } else {
            var created;
            UI.withUndo(function () {
              created = D.newBatch(fields);
              return "Added " + created.name + " (" + D.fmtQty(created.quantity, created.unit) + ") to " + created.location;
            });
            UI.replace("kitchen-item", { foodKey: created.foodKey, batchId: created.id });
          }
        }
      });
    }
  });

  // Fill category from an existing batch of the same food. Returns true if it changed anything.
  function autofill(st) {
    var b = D.batchesFor(D.foodKey(st.name))[0];
    if (b && !st.category) { st.category = b.category; return true; }
    return false;
  }

  /* ================= Stock alert (T6, part 1) ================= */

  UI.register("kitchen-stock", {
    title: "Stock alert",
    render: function (root, r) {
      root.classList.add("no-fab");
      var key = r.params.foodKey;
      var rule = D.state.stockRules[key];
      var batches = D.batchesFor(key);
      var name = batches[0] ? batches[0].name : key;
      var baseUnit = rule ? rule.alertUnit : batches[0] ? batches[0].unit : "each";
      var units = D.compatibleUnits(baseUnit);
      var st = r.state;
      if (!st.init) {
        st.init = true;
        st.alertQty = rule ? String(rule.alertQty) : "";
        st.alertUnit = rule ? rule.alertUnit : baseUnit;
        st.targetQty = rule ? String(rule.targetQty) : "";
        st.targetUnit = rule ? rule.targetUnit : baseUnit;
        st.errors = {};
      }
      var usable = D.usableAmount(key, baseUnit);
      var excluded = D.excludedBatches(key);
      function err(k) { return st.errors[k] ? icon("alert") + "<span>" + esc(st.errors[k]) + "</span>" : ""; }

      root.innerHTML =
        '<div class="card card-pad"><div class="muted secondary">' + esc(name) + " you can use now</div>" +
        '<div class="big-number">' + esc(D.fmtQty(usable, baseUnit)) + "</div>" +
        '<div class="row-sub">Total of shared and your own batches that haven’t expired.' +
        (excluded.length ? " Not counted: " + esc(excluded.map(function (b) { return D.fmtQty(b.quantity, b.unit) + " (" + D.exclusionReason(b) + ")"; }).join(", ")) + "." : "") +
        "</div></div>" +
        '<section class="section">' +
        '<div class="field"><label class="label" for="s-alert">Alert me below</label><div class="qty-row">' +
        '<input class="input' + (st.errors.alert ? " has-error" : "") + '" id="s-alert" type="number" inputmode="decimal" min="0" step="any" value="' + esc(st.alertQty) + '">' +
        '<div class="select-wrap"><select class="select" id="s-alert-u" aria-label="Alert unit">' + UI.unitOptions(st.alertUnit, units) + "</select>" + icon("chevron-down") + "</div></div>" +
        '<div class="field-error" role="alert">' + err("alert") + "</div></div>" +
        '<div class="field"><label class="label" for="s-target">Restock up to</label><div class="qty-row">' +
        '<input class="input' + (st.errors.target ? " has-error" : "") + '" id="s-target" type="number" inputmode="decimal" min="0" step="any" value="' + esc(st.targetQty) + '">' +
        '<div class="select-wrap"><select class="select" id="s-target-u" aria-label="Restock unit">' + UI.unitOptions(st.targetUnit, units) + "</select>" + icon("chevron-down") + "</div></div>" +
        '<div class="hint">When you go below the alert level, the Shopping tab suggests buying enough to reach this amount.</div>' +
        '<div class="field-error" role="alert">' + err("target") + "</div></div></section>" +
        '<div class="btn-row"><button type="button" class="btn btn-secondary" data-act="cancel">Cancel</button>' +
        '<button type="button" class="btn btn-primary" data-act="save">Save alert</button></div>' +
        (rule ? '<button type="button" class="btn btn-danger-outline btn-block" style="margin-top:16px" data-act="remove">' + icon("trash") + "Remove stock alert</button>" : "");

      [["#s-alert", "alertQty", "input"], ["#s-alert-u", "alertUnit", "change"], ["#s-target", "targetQty", "input"], ["#s-target-u", "targetUnit", "change"]].forEach(function (x) {
        root.querySelector(x[0]).addEventListener(x[2], function (e) { st[x[1]] = e.target.value; });
      });

      UI.actions(root, {
        cancel: UI.back,
        save: function () {
          st.errors = {};
          var a = Number(st.alertQty), t = Number(st.targetQty);
          if (String(st.alertQty).trim() === "" || !isFinite(a) || a <= 0) st.errors.alert = "Alert level must be greater than 0.";
          if (String(st.targetQty).trim() === "" || !isFinite(t) || t <= 0) st.errors.target = "Restock level must be greater than 0.";
          else if (!st.errors.alert && D.convert(t, st.targetUnit, st.alertUnit) <= a + 1e-9)
            st.errors.target = "Restock level must be above the alert level (" + D.fmtQty(a, st.alertUnit) + ").";
          if (Object.keys(st.errors).length) { UI.refresh(); return; }
          D.state.stockRules[key] = { alertQty: a, alertUnit: st.alertUnit, targetQty: t, targetUnit: st.targetUnit };
          D.save();
          UI.toast("Stock alert saved: below " + D.fmtQty(a, st.alertUnit) + ", restock to " + D.fmtQty(t, st.targetUnit));
          UI.back();
        },
        remove: function () {
          UI.withUndo(function () { delete D.state.stockRules[key]; return "Removed stock alert for " + name; });
          UI.back();
        }
      });
    }
  });

  KC.kitchen = { batchRow: batchRow };
})();
