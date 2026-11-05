/* shopping.js — Feature set 2: shopping list and restocking.
   Screens: shopping, shop-form, shop-suggestions, shop-putaway, shop-putaway-done. */
(function () {
  "use strict";
  var KC = window.KC;
  var D = KC.data, UI = KC.ui, icon = KC.icon, esc = UI.esc;

  function toBuy() { return D.state.shopping.filter(function (s) { return !s.purchased; }); }
  function purchased() { return D.state.shopping.filter(function (s) { return s.purchased; }); }

  function shopRow(s) {
    var sub = [D.fmtQty(s.quantity, s.unit)];
    if (s.note) sub.push(s.note);
    return '<li class="shop-row">' +
      UI.checkbox(s.purchased, (s.purchased ? "Uncheck " : "Check off ") + s.name, ' data-act="toggle" data-id="' + s.id + '"') +
      '<button type="button" class="row' + (s.purchased ? " is-done" : "") + '" data-act="edit" data-id="' + s.id + '">' +
      '<span class="row-main"><span class="row-title">' + esc(s.name) + "</span>" +
      '<span class="row-sub">' + esc(sub.join(" · ")) + "</span></span>" +
      '<span class="row-end"><span class="tag tag-source">' + esc(D.sourceLabel(s.source)) + "</span></span>" +
      '<span class="row-chev">' + icon("chevron-right") + "</span></button></li>";
  }

  function grouped(list) {
    return D.SECTIONS.map(function (sec) {
      var items = list.filter(function (s) { return s.section === sec; });
      if (!items.length) return "";
      return '<h3 class="list-group-title"><span>' + esc(sec) + "</span><span>" + UI.plural(items.length, "item") + "</span></h3>" +
        '<ul class="list card">' + items.map(shopRow).join("") + "</ul>";
    }).join("");
  }

  /* ================= Shopping list (T5, T8) ================= */

  UI.register("shopping", {
    title: "Shopping",
    render: function (root, r) {
      var st = r.state;
      if (!st.view) st.view = "tobuy";
      var left = toBuy(), bought = purchased();
      var sugg = D.restockSuggestions();
      var list = st.view === "tobuy" ? left : bought;

      var html =
        '<div class="card card-pad count-card"><div class="count-line"><span class="big-number">' + left.length + "</span>" +
        "<span>" + (left.length === 1 ? "item" : "items") + " left to buy</span></div>" +
        '<button type="button" class="btn btn-secondary" data-act="share">' + icon("share") + "Share list</button></div>" +
        UI.segmented("view", [
          { value: "tobuy", label: "To buy · " + left.length, icon: "list" },
          { value: "purchased", label: "Purchased · " + bought.length, icon: "check-circle" }
        ], st.view, "Show") + '<div style="height:16px"></div>';

      if (st.view === "tobuy") {
        if (sugg.length) {
          html += '<button type="button" class="banner banner-info" data-act="suggestions">' + icon("restock") +
            '<span class="banner-main"><strong>' + UI.plural(sugg.length, "restock suggestion") + "</strong>" +
            '<span class="banner-sub">' + esc(sugg.map(function (s) { return s.name; }).join(", ")) + (sugg.length === 1 ? " is" : " are") + " below your alert level</span></span>" +
            icon("chevron-right") + "</button>";
        }
        html += list.length ? grouped(list) : '<div class="card">' + UI.emptyState("check-circle", "Nothing left to buy",
          bought.length ? "Everything is in your cart. Switch to Purchased to put it away." : "Add items with the button below.") + "</div>";
      } else {
        if (list.length) {
          html += '<button type="button" class="btn btn-primary btn-block" data-act="putaway" style="margin-bottom:8px">' + icon("putaway") +
            "Put away " + UI.plural(list.length, "item") + "</button>" +
            '<p class="muted secondary">Adds what you bought to your kitchen and clears it from this list. Uncheck an item to move it back to To buy.</p>' +
            grouped(list);
        } else {
          html += '<div class="card">' + UI.emptyState("cart", "No purchased items", "Check items off in To buy as you shop. They’ll show up here.") + "</div>";
        }
      }
      root.innerHTML = html;

      UI.bindSeg(root, "view", function (v) { st.view = v; UI.refresh(); });
      UI.actions(root, {
        share: function () { UI.underDev("Sharing the list"); },
        suggestions: function () { UI.go("shop-suggestions"); },
        putaway: function () { UI.go("shop-putaway"); },
        edit: function (b) { UI.go("shop-form", { id: b.getAttribute("data-id") }); },
        toggle: function (b) {
          var e = D.shoppingEntry(b.getAttribute("data-id"));
          if (!e) return;
          b.setAttribute("aria-checked", String(!e.purchased));
          var snap = D.snapshot();
          e.purchased = !e.purchased;
          D.save();
          UI.toast(e.name + (e.purchased ? " moved to Purchased" : " moved back to To buy"), { undo: snap });
          UI.refresh();
        }
      });
      if (st.view === "tobuy") UI.setFab({ label: "Add item", onClick: function () { UI.go("shop-form", {}); } });
      else root.classList.add("no-fab");
    }
  });

  /* ================= Add / edit entry (T5) ================= */

  UI.register("shop-form", {
    title: function (r) { return r.params.id ? "Edit list item" : "Add to list"; },
    render: function (root, r) {
      root.classList.add("no-fab");
      var st = r.state;
      var editing = r.params.id ? D.shoppingEntry(r.params.id) : null;
      if (r.params.id && !editing) {
        root.innerHTML = '<div class="card">' + UI.emptyState("cart", "This item is no longer on your list", "",
          '<button type="button" class="btn btn-primary btn-block" data-act="back">Back to list</button>') + "</div>";
        UI.actions(root, { back: UI.back });
        return;
      }
      if (!st.init) {
        var src = editing || {};
        st.init = true;
        st.errors = {};
        st.name = src.name || "";
        st.quantity = editing ? String(D.round2(src.quantity)) : "1";
        st.unit = src.unit || "each";
        st.section = src.section || "";
        st.note = src.note || "";
      }
      function err(k) { return st.errors[k] ? icon("alert") + "<span>" + esc(st.errors[k]) + "</span>" : ""; }

      root.innerHTML =
        '<div class="field"><label class="label" for="sf-name">Name</label>' +
        '<input class="input' + (st.errors.name ? " has-error" : "") + '" id="sf-name" type="text" autocomplete="off" placeholder="e.g. Bananas" value="' + esc(st.name) + '">' +
        '<div class="field-error" role="alert">' + err("name") + "</div></div>" +
        '<div class="field"><label class="label" for="sf-qty">Quantity</label><div class="qty-row">' +
        '<input class="input' + (st.errors.quantity ? " has-error" : "") + '" id="sf-qty" type="number" inputmode="decimal" min="0" step="any" value="' + esc(st.quantity) + '">' +
        '<div class="select-wrap"><select class="select" id="sf-unit" aria-label="Unit">' + UI.unitOptions(st.unit) + "</select>" + icon("chevron-down") + "</div></div>" +
        '<div class="field-error" role="alert">' + err("quantity") + "</div></div>" +
        '<div class="field"><label class="label" for="sf-sec">Store section</label><div class="select-wrap"><select class="select" id="sf-sec">' +
        '<option value="">Choose a section</option>' + UI.options(D.SECTIONS, st.section) + "</select>" + icon("chevron-down") + "</div>" +
        '<div class="hint">The list is grouped by section so you can shop aisle by aisle.</div>' +
        '<div class="field-error" role="alert">' + err("section") + "</div></div>" +
        '<div class="field"><label class="label" for="sf-note">Note (optional)</label>' +
        '<input class="input" id="sf-note" type="text" autocomplete="off" placeholder="e.g. brand, size, ripeness" value="' + esc(st.note) + '"></div>' +
        (editing ? '<p class="muted secondary">' + icon("info") + " " + esc(D.sourceLabel(editing.source)) + (editing.purchased ? " · Purchased" : "") + "</p>" : "") +
        '<div class="btn-row"><button type="button" class="btn btn-secondary" data-act="cancel">Cancel</button>' +
        '<button type="button" class="btn btn-primary" data-act="save">' + icon("check") + (editing ? "Save changes" : "Add to list") + "</button></div>" +
        (editing ? '<button type="button" class="btn btn-danger-outline btn-block" style="margin-top:16px" data-act="delete">' + icon("trash") + "Remove from list</button>" : "");

      var secEl = root.querySelector("#sf-sec");
      root.querySelector("#sf-name").addEventListener("input", function (e) { st.name = e.target.value; });
      root.querySelector("#sf-name").addEventListener("change", function () {
        var guess = D.sectionFor(st.name);
        if (guess && !st.section) { st.section = guess; secEl.value = guess; }
      });
      root.querySelector("#sf-qty").addEventListener("input", function (e) { st.quantity = e.target.value; });
      root.querySelector("#sf-unit").addEventListener("change", function (e) { st.unit = e.target.value; });
      secEl.addEventListener("change", function (e) { st.section = e.target.value; });
      root.querySelector("#sf-note").addEventListener("input", function (e) { st.note = e.target.value; });

      function fields() {
        return { name: st.name.trim(), quantity: D.round6(Number(st.quantity)), unit: st.unit, section: st.section, note: st.note.trim() };
      }

      UI.actions(root, {
        cancel: UI.back,
        "delete": function () {
          UI.withUndo(function () {
            D.state.shopping = D.state.shopping.filter(function (s) { return s.id !== editing.id; });
            return "Removed " + editing.name + " from your list";
          });
          UI.back();
        },
        save: function () {
          st.errors = {};
          var q = Number(st.quantity);
          if (!st.name.trim()) st.errors.name = "Enter a name for this item.";
          if (String(st.quantity).trim() === "" || !isFinite(q) || q <= 0) st.errors.quantity = "Quantity must be greater than 0.";
          if (!st.section) st.errors.section = "Choose a store section.";
          if (Object.keys(st.errors).length) { UI.refresh(); return; }
          var f = fields();
          if (editing) {
            UI.withUndo(function () {
              var e = D.shoppingEntry(editing.id);
              e.name = f.name; e.foodKey = D.foodKey(f.name); e.quantity = f.quantity; e.unit = f.unit; e.section = f.section; e.note = f.note;
              return "Saved " + e.name;
            });
            UI.back();
            return;
          }
          var dup = D.findOnList(D.foodKey(f.name), f.unit, false);
          if (dup) {
            var merged = dup.quantity + D.convert(f.quantity, f.unit, dup.unit);
            UI.dialog({
              title: f.name + " is already on your list",
              body: "<p>Your list already has <strong>" + esc(dup.name) + " · " + esc(D.fmtQty(dup.quantity, dup.unit)) + "</strong>" +
                (dup.note ? " (" + esc(dup.note) + ")" : "") + ".</p><p>Merge them into one entry of <strong>" + esc(D.fmtQty(merged, dup.unit)) + "</strong>?</p>",
              actions: [
                { label: "Add separately", kind: "secondary", onClick: function () { addNew(f); } },
                { label: "Merge (" + D.fmtQty(merged, dup.unit) + ")", kind: "primary", onClick: function () {
                  UI.withUndo(function () {
                    var e = D.shoppingEntry(dup.id);
                    e.quantity = D.round6(merged);
                    if (f.note && e.note.indexOf(f.note) < 0) e.note = e.note ? e.note + "; " + f.note : f.note;
                    return "Updated " + e.name + " on your list to " + D.fmtQty(e.quantity, e.unit);
                  });
                  UI.back();
                } }
              ]
            });
            return;
          }
          addNew(f);
        }
      });

      function addNew(f) {
        UI.withUndo(function () {
          var e = D.addShopping({ name: f.name, quantity: f.quantity, unit: f.unit, section: f.section, note: f.note, source: "manual" });
          return "Added " + e.name + " (" + D.fmtQty(e.quantity, e.unit) + ") to your list";
        });
        UI.back();
      }
    }
  });

  /* ================= Restock suggestions (T6) ================= */

  UI.register("shop-suggestions", {
    title: "Restock suggestions",
    render: function (root, r) {
      root.classList.add("no-fab");
      var sugg = D.restockSuggestions();
      var st = r.state;
      if (!st.items) st.items = {};
      sugg.forEach(function (s) {
        if (!st.items[s.foodKey]) {
          var inCart = D.findOnList(s.foodKey, s.rule.targetUnit, true);
          st.items[s.foodKey] = { sel: !inCart, amount: String(D.round2(s.buy)), unit: s.rule.targetUnit };
        }
      });

      if (!sugg.length) {
        root.innerHTML = '<div class="card">' + UI.emptyState("check-circle", "No restock suggestions",
          "Everything with a stock alert is above its alert level. Set alerts from an item’s details in Kitchen.",
          '<button type="button" class="btn btn-primary btn-block" data-act="back">Back to list</button>') + "</div>";
        UI.actions(root, { back: UI.back });
        return;
      }

      root.innerHTML =
        '<p class="muted secondary">These foods are below the alert level you set. Amounts count shared and your own food that hasn’t expired.</p>' +
        sugg.map(function (s) {
          var it = st.items[s.foodKey];
          var rule = s.rule;
          var excluded = D.excludedBatches(s.foodKey);
          return '<div class="card card-pad" data-key="' + esc(s.foodKey) + '">' +
            '<div class="sugg-head">' + UI.checkbox(it.sel, "Select " + s.name, ' data-act="sel" data-key="' + esc(s.foodKey) + '"') +
            '<div class="row-main" style="padding-top:12px"><div class="row-title">' + esc(s.name) + "</div>" +
            "<p style=\"margin:4px 0 0\">" + esc(D.fmtQty(s.have, rule.targetUnit)) + " usable, below your " + esc(D.fmtQty(rule.alertQty, rule.alertUnit)) +
            " alert → buy " + esc(D.fmtQty(s.buy, rule.targetUnit)) + " to reach " + esc(D.fmtQty(rule.targetQty, rule.targetUnit)) + "</p>" +
            (excluded.length ? '<p class="muted small" style="margin:4px 0 0">Not counted: ' + esc(excluded.map(function (b) { return D.fmtQty(b.quantity, b.unit) + " (" + D.exclusionReason(b) + ")"; }).join(", ")) + "</p>" : "") +
            "</div></div>" +
            '<div class="field" style="margin:16px 0 0"><label class="label" for="sg-' + esc(s.foodKey) + '">Amount to buy</label><div class="qty-row">' +
            '<input class="input" type="number" inputmode="decimal" min="0" step="any" id="sg-' + esc(s.foodKey) + '" data-amt="' + esc(s.foodKey) + '" value="' + esc(it.amount) + '">' +
            '<div class="select-wrap"><select class="select" data-unit="' + esc(s.foodKey) + '" aria-label="Unit">' + UI.unitOptions(it.unit, D.compatibleUnits(rule.targetUnit)) + "</select>" + icon("chevron-down") + "</div></div>" +
            '<div class="field-error" data-err="' + esc(s.foodKey) + '"></div></div>' +
            '<div class="note note-info" style="margin-top:16px" data-note="' + esc(s.foodKey) + '"></div>' +
            "</div>";
        }).join("") +
        '<div class="sticky-actions"><button type="button" class="btn btn-primary btn-block" data-act="add" id="sg-add"></button></div>';

      function refreshNotes() {
        var count = 0, valid = true;
        sugg.forEach(function (s) {
          var it = st.items[s.foodKey];
          var noteEl = root.querySelector('[data-note="' + s.foodKey + '"]');
          var errEl = root.querySelector('[data-err="' + s.foodKey + '"]');
          var amt = Number(it.amount);
          var ok = String(it.amount).trim() !== "" && isFinite(amt) && amt > 0;
          errEl.innerHTML = it.sel && !ok ? icon("alert") + "<span>Amount must be greater than 0.</span>" : "";
          if (it.sel) { count++; if (!ok) valid = false; }
          var onList = D.findOnList(s.foodKey, it.unit, false);
          var inCart = D.findOnList(s.foodKey, it.unit, true);
          var msg;
          if (onList) msg = esc(s.name) + " is already on your list (" + esc(D.fmtQty(onList.quantity, onList.unit)) + ") — will update to " + (ok ? esc(D.fmtQty(amt, it.unit)) : "the new amount") + ". No duplicate is created.";
          else if (inCart) msg = "You already bought " + esc(D.fmtQty(inCart.quantity, inCart.unit)) + " (in Purchased). Put it away to update your kitchen, or add more here.";
          else msg = "Not on your list yet — will be added as a new item.";
          noteEl.innerHTML = icon("info") + "<span>" + msg + "</span>";
          noteEl.className = "note " + (inCart && !onList ? "note-warning" : "note-info");
        });
        var btn = root.querySelector("#sg-add");
        btn.innerHTML = icon("plus") + "Add selected (" + count + ")";
        btn.disabled = !count || !valid;
      }
      refreshNotes();

      root.addEventListener("input", function (e) {
        var k = e.target.getAttribute("data-amt");
        if (k) { st.items[k].amount = e.target.value; refreshNotes(); }
      });
      root.addEventListener("change", function (e) {
        var k = e.target.getAttribute("data-unit");
        if (k) { st.items[k].unit = e.target.value; refreshNotes(); }
      });

      UI.actions(root, {
        sel: function (b) {
          var k = b.getAttribute("data-key");
          st.items[k].sel = !st.items[k].sel;
          b.setAttribute("aria-checked", String(st.items[k].sel));
          refreshNotes();
        },
        add: function (b) {
          b.disabled = true;
          var added = 0, updated = 0;
          UI.withUndo(function () {
            sugg.forEach(function (s) {
              var it = st.items[s.foodKey];
              if (!it.sel) return;
              var amt = D.round6(Number(it.amount));
              var existing = D.findOnList(s.foodKey, it.unit, false);
              if (existing) {
                existing.quantity = amt;
                existing.unit = it.unit;
                updated++;
              } else {
                var section = s.category && D.CATEGORIES[s.category] ? D.CATEGORIES[s.category].section : D.sectionFor(s.name) || "Other";
                D.addShopping({ name: s.name, quantity: amt, unit: it.unit, section: section, source: "restock" });
                added++;
              }
            });
            var parts = [];
            if (added) parts.push("Added " + UI.plural(added, "item"));
            if (updated) parts.push((added ? "updated " : "Updated ") + UI.plural(updated, "item"));
            return parts.join(" and ") + " on your list";
          });
          UI.back();
        }
      });
    }
  });

  /* ================= Put away (T7) ================= */

  function defaultsFor(entry) {
    var existing = D.batchesFor(entry.foodKey)[0];
    var category = existing ? existing.category : D.sectionToCategory(entry.section);
    var cat = D.CATEGORIES[category] || D.CATEGORIES.Other;
    return {
      quantity: String(D.round2(entry.quantity)), unit: entry.unit,
      location: existing ? existing.location : cat.location,
      expires: cat.shelf === null ? "" : D.addDays(D.today(), cat.shelf),
      noExp: cat.shelf === null, owner: D.state.defaultOwner, mode: "new", category: category, shelf: cat.shelf
    };
  }

  UI.register("shop-putaway", {
    title: "Put away groceries",
    onBack: function (r) {
      var st = r.state;
      if (st.committed || !st.phase || st.phase === "select") return false;
      if (st.phase === "preview") { st.phase = "item"; st.idx = st.order.length - 1; return true; }
      if (st.phase === "item" && st.idx > 0) { st.idx--; return true; }
      st.phase = "select";
      return true;
    },
    render: function (root, r) {
      root.classList.add("no-fab");
      var st = r.state;
      if (!st.phase) { st.phase = "select"; st.sel = {}; st.details = {}; purchased().forEach(function (e) { st.sel[e.id] = true; }); }
      var avail = purchased();
      // Drop anything that left the list meanwhile (already put away, undone, deleted).
      Object.keys(st.sel).forEach(function (id) {
        var e = D.shoppingEntry(id);
        if (!e || !e.purchased) delete st.sel[id];
      });
      if (!avail.length || st.committed) {
        root.innerHTML = '<div class="card">' + UI.emptyState("check-circle", "Nothing to put away", "Check items off on your shopping list first.",
          '<button type="button" class="btn btn-primary btn-block" data-act="done">Back to list</button>') + "</div>";
        UI.actions(root, { done: function () { UI.popToRoot(); } });
        return;
      }

      var steps = ["Choose", "Details", "Review"];
      var phaseIdx = { select: 0, item: 1, preview: 2 }[st.phase];
      var header = '<div class="steps-caption">Step ' + (phaseIdx + 1) + " of 3</div><div class=\"steps\">" + steps.map(function (s, i) {
        return '<div class="steps-item' + (i <= phaseIdx ? " is-on" : "") + '"><div class="steps-bar"></div>' + (i + 1) + ". " + s + "</div>";
      }).join("") + "</div>";

      if (st.phase === "select") renderSelect();
      else if (st.phase === "item") renderItem();
      else renderPreview();

      function renderSelect() {
        var count = Object.keys(st.sel).length;
        root.innerHTML = header + '<h2 class="section-title">What are you putting away?</h2>' +
          '<ul class="list card">' + avail.map(function (e) {
            return '<li class="shop-row">' + UI.checkbox(!!st.sel[e.id], "Put away " + e.name, ' data-act="pick" data-id="' + e.id + '"') +
              '<div class="row" style="cursor:default"><span class="row-main"><span class="row-title">' + esc(e.name) + "</span>" +
              '<span class="row-sub">' + esc(D.fmtQty(e.quantity, e.unit) + " · " + e.section) + "</span></span></div></li>";
          }).join("") + "</ul>" +
          '<div class="sticky-actions"><button type="button" class="btn btn-primary btn-block" data-act="next"' + (count ? "" : " disabled") + ">" +
          "Next: details for " + UI.plural(count, "item") + icon("chevron-right") + "</button></div>";
        UI.actions(root, {
          pick: function (b) {
            var id = b.getAttribute("data-id");
            if (st.sel[id]) delete st.sel[id]; else st.sel[id] = true;
            UI.refresh();
          },
          next: function () {
            st.order = avail.filter(function (e) { return st.sel[e.id]; }).map(function (e) { return e.id; });
            st.order.forEach(function (id) { if (!st.details[id]) st.details[id] = defaultsFor(D.shoppingEntry(id)); });
            st.phase = "item";
            st.idx = 0;
            r.scroll = 0;
            UI.refresh();
          }
        });
      }

      function renderItem() {
        var id = st.order[st.idx];
        var e = D.shoppingEntry(id);
        if (!e) { st.phase = "select"; UI.refresh(); return; }
        var d = st.details[id];
        var batches = D.batchesFor(e.foodKey).filter(function (b) { return D.compatible(b.unit, d.unit); });
        if (d.mode !== "new" && !batches.some(function (b) { return b.id === d.mode; })) d.mode = "new";
        var catInfo = D.CATEGORIES[d.category] || D.CATEGORIES.Other;
        function err(k) { return d.errors && d.errors[k] ? icon("alert") + "<span>" + esc(d.errors[k]) + "</span>" : ""; }

        root.innerHTML = header +
          '<div class="muted secondary">Item ' + (st.idx + 1) + " of " + st.order.length + "</div>" +
          '<h2 class="section-title">' + esc(e.name) + "</h2>" +
          '<p class="muted secondary">On your list: ' + esc(D.fmtQty(e.quantity, e.unit)) + ". Change it if you bought a different amount.</p>" +
          '<div class="field"><label class="label" for="pa-qty">Quantity bought</label><div class="qty-row">' +
          '<input class="input' + (d.errors && d.errors.quantity ? " has-error" : "") + '" id="pa-qty" type="number" inputmode="decimal" min="0" step="any" value="' + esc(d.quantity) + '">' +
          '<div class="select-wrap"><select class="select" id="pa-unit" aria-label="Unit">' + UI.unitOptions(d.unit) + "</select>" + icon("chevron-down") + "</div></div>" +
          '<div class="field-error" role="alert">' + err("quantity") + "</div></div>" +
          (batches.length ? '<div class="field"><span class="label">You already have ' + esc(e.name) + "</span>" +
            '<div class="radio-list" role="radiogroup" aria-label="Batch">' +
            '<button type="button" class="radio" role="radio" aria-checked="' + (d.mode === "new") + '" data-act="mode" data-mode="new"><span class="radio-dot"></span>' +
            '<span class="radio-text"><strong>Keep as a new batch</strong>With its own expiration date</span></button>' +
            batches.map(function (b) {
              return '<button type="button" class="radio" role="radio" aria-checked="' + (d.mode === b.id) + '" data-act="mode" data-mode="' + b.id + '"><span class="radio-dot"></span>' +
                '<span class="radio-text"><strong>Add to existing batch</strong>' + esc(D.fmtQty(b.quantity, b.unit) + " · " + b.location + " · " +
                (b.expires ? "expires " + D.fmtDate(b.expires) : "no expiration") + " · " + D.ownerLabel(b.owner)) + "</span></button>";
            }).join("") + "</div></div>" : "") +
          (d.mode === "new" ?
            '<div class="field"><span class="label">Location</span>' +
            UI.segmented("loc", D.LOCATIONS.map(function (l) { return { value: l, label: l }; }), d.location, "Location") + "</div>" +
            '<div class="field"><label class="label" for="pa-exp">Expiration date</label>' +
            '<input class="input' + (d.errors && d.errors.expires ? " has-error" : "") + '" id="pa-exp" type="date" value="' + esc(d.expires) + '"' + (d.noExp ? " disabled" : "") + ">" +
            '<div class="quick-row">' + [[3, "+3 days"], [7, "+1 week"], [14, "+2 weeks"]].map(function (x) {
              return '<button type="button" class="chip" aria-pressed="false" data-act="quick" data-d="' + x[0] + '"' + (d.noExp ? " disabled" : "") + ">" + x[1] + "</button>";
            }).join("") + "</div>" +
            '<div class="check-line">' + UI.checkbox(d.noExp, "No expiration", ' data-act="noexp"') + '<span data-act="noexp">No expiration</span></div>' +
            (catInfo.shelf ? '<div class="hint">Pre-filled from typical shelf life for ' + esc(d.category) + " (" + UI.plural(catInfo.shelf, "day") + ").</div>" : "") +
            '<div class="field-error" role="alert">' + err("expires") + "</div></div>" +
            '<div class="field"><span class="label">Owner</span>' + UI.segmented("owner", UI.ownerItems(), d.owner, "Owner") + "</div>"
            : '<div class="note note-info" style="margin-bottom:24px">' + icon("info") + "<span>The combined batch keeps its current location, owner, and expiration date.</span></div>") +
          '<div class="btn-row"><button type="button" class="btn btn-secondary" data-act="prev">' + icon("arrow-left") + "Back</button>" +
          '<button type="button" class="btn btn-primary" data-act="next">' + (st.idx === st.order.length - 1 ? "Review changes" : "Next item") + icon("chevron-right") + "</button></div>";

        root.querySelector("#pa-qty").addEventListener("input", function (ev) { d.quantity = ev.target.value; });
        root.querySelector("#pa-unit").addEventListener("change", function (ev) { d.unit = ev.target.value; UI.refresh(); });
        var expEl = root.querySelector("#pa-exp");
        if (expEl) {
          expEl.addEventListener("change", function () { d.expires = expEl.value; });
          expEl.addEventListener("input", function () { d.expires = expEl.value; });
        }
        UI.bindSeg(root, "loc", function (v) { d.location = v; });
        UI.bindSeg(root, "owner", function (v) { d.owner = v; });

        UI.actions(root, {
          mode: function (b) { d.mode = b.getAttribute("data-mode"); UI.refresh(); },
          quick: function (b) { d.expires = D.addDays(D.today(), Number(b.getAttribute("data-d"))); UI.refresh(); },
          noexp: function () { d.noExp = !d.noExp; UI.refresh(); },
          prev: function () { UI.back(); },
          next: function () {
            d.errors = {};
            var q = Number(d.quantity);
            if (String(d.quantity).trim() === "" || !isFinite(q) || q <= 0) d.errors.quantity = "Quantity must be greater than 0.";
            if (d.mode === "new" && !d.noExp && !d.expires) d.errors.expires = "Pick an expiration date or check No expiration.";
            if (Object.keys(d.errors).length) { UI.refresh(); return; }
            if (st.idx < st.order.length - 1) st.idx++; else st.phase = "preview";
            r.scroll = 0;
            UI.refresh();
          }
        });
      }

      function plan() {
        return st.order.map(function (id) {
          var e = D.shoppingEntry(id);
          if (!e || !e.purchased) return null;
          var d = st.details[id];
          var q = D.round6(Number(d.quantity));
          var target = d.mode !== "new" ? D.batch(d.mode) : null;
          if (target) {
            var after = target.quantity + D.convert(q, d.unit, target.unit);
            return { e: e, d: d, q: q, target: target,
              text: target.name + ": " + D.fmtQty(target.quantity, target.unit) + " → " + D.fmtQty(after, target.unit) +
                " (" + target.location + ", " + (target.expires ? "expires " + D.fmtDate(target.expires) : "no expiration") + ")" };
          }
          return { e: e, d: d, q: q, target: null,
            text: "New batch: " + e.name + " " + D.fmtQty(q, d.unit) + " · " + d.location + " · " +
              (d.noExp ? "no expiration" : "expires " + D.fmtDate(d.expires)) + (d.owner !== "shared" ? " · " + D.ownerLabel(d.owner) : "") };
        }).filter(Boolean);
      }

      function renderPreview() {
        var changes = plan();
        root.innerHTML = header + '<h2 class="section-title">Review kitchen changes</h2>' +
          '<div class="card card-pad"><ul class="change-list">' + changes.map(function (c) {
            return "<li>" + icon(c.target ? "plus" : "box") + "<span>" + esc(c.text) + "</span></li>";
          }).join("") + "</ul></div>" +
          '<p class="muted secondary" style="margin-top:16px">' + UI.plural(changes.length, "item") + " will be removed from your shopping list.</p>" +
          '<div class="btn-row" style="margin-top:24px"><button type="button" class="btn btn-secondary" data-act="prev">' + icon("arrow-left") + "Back</button>" +
          '<button type="button" class="btn btn-primary" data-act="confirm" id="pa-confirm">' + icon("check") + "Confirm &amp; put away</button></div>";

        UI.actions(root, {
          prev: function () { UI.back(); },
          confirm: function (b) {
            if (st.committed) return; // double-click guard
            st.committed = true;
            b.disabled = true;
            var fresh = plan();
            var lines = fresh.map(function (c) { return c.text; });
            UI.withUndo(function () {
              fresh.forEach(function (c) {
                if (c.target) {
                  var t = D.batch(c.target.id);
                  t.quantity = D.round6(t.quantity + D.convert(c.q, c.d.unit, t.unit));
                } else {
                  D.newBatch({ name: c.e.name, quantity: c.q, unit: c.d.unit, location: c.d.location, expires: c.d.noExp ? null : c.d.expires,
                    owner: c.d.owner, category: c.d.category });
                }
              });
              var ids = fresh.map(function (c) { return c.e.id; });
              D.state.shopping = D.state.shopping.filter(function (s) { return ids.indexOf(s.id) < 0; });
              return "Put away " + UI.plural(fresh.length, "item");
            });
            UI.setStack([{ name: "shop-putaway-done", params: { lines: lines } }]);
          }
        });
      }
    }
  });

  UI.register("shop-putaway-done", {
    title: "All put away",
    staleAfterUndo: true,
    render: function (root, r) {
      root.classList.add("no-fab");
      var lines = r.params.lines || [];
      root.innerHTML = '<div class="big-check">' + icon("check") + "</div>" +
        '<h2 class="section-title" style="text-align:center">' + UI.plural(lines.length, "item") + " put away</h2>" +
        '<p class="muted" style="text-align:center">Your kitchen is updated and these items left your shopping list.</p>' +
        '<div class="card card-pad"><ul class="change-list">' + lines.map(function (t) { return "<li>" + icon("check") + "<span>" + esc(t) + "</span></li>"; }).join("") + "</ul></div>" +
        '<div class="btn-row" style="margin-top:24px"><button type="button" class="btn btn-secondary" data-act="list">Back to list</button>' +
        '<button type="button" class="btn btn-primary" data-act="kitchen">' + icon("kitchen") + "View in Kitchen</button></div>";
      UI.actions(root, {
        list: function () { UI.popToRoot(); },
        kitchen: function () { UI.popToRoot(); UI.switchTab("kitchen", true); }
      });
    }
  });
})();
