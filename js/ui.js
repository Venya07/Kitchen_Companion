/* ui.js — router (one back stack per tab), top app bar, bottom nav, FAB,
   toasts with undo, in-device dialogs, the soft-keyboard image, and small
   HTML builders shared by every screen. */
(function () {
  "use strict";
  var KC = (window.KC = window.KC || {});
  var D = KC.data;
  var icon = KC.icon;

  var TABS = [
    { id: "kitchen", label: "Kitchen", icon: "kitchen", root: "kitchen" },
    { id: "shopping", label: "Shopping", icon: "cart", root: "shopping" },
    { id: "recipes", label: "Recipes", icon: "book", root: "recipes" }
  ];

  var screens = {};
  var stacks = {};
  var currentTab = "kitchen";
  var rendered = null; // route currently on screen
  var el = {};

  function esc(s) {
    return String(s === null || s === undefined ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  /* ---------------- Router ---------------- */

  function entry(name, params) { return { name: name, params: params || {}, state: {}, scroll: 0 }; }

  function resetStacks() {
    TABS.forEach(function (t) { stacks[t.id] = [entry(t.root)]; });
  }

  function stack() { return stacks[currentTab]; }
  function top() { var s = stack(); return s[s.length - 1]; }

  function register(name, def) { screens[name] = def; }

  function go(name, params) { stack().push(entry(name, params)); render(); }

  function replace(name, params) { var s = stack(); s[s.length - 1] = entry(name, params); render(); }

  // Replace the whole stack of the current tab above the root.
  function setStack(routes) {
    var s = stack();
    s.length = 1;
    routes.forEach(function (r) { s.push(entry(r.name, r.params)); });
    render();
  }

  function back() {
    var r = top();
    var def = screens[r.name];
    if (def && def.onBack && def.onBack(r)) { r.scroll = 0; render(true); return; }
    if (stack().length > 1) { stack().pop(); render(); }
  }

  function popToRoot() { stack().length = 1; render(); }

  function switchTab(id, toRoot) {
    if (id === currentTab || toRoot) stacks[id].length = 1;
    currentTab = id;
    render();
  }

  function refresh() { render(true); }

  function render(keepScroll) {
    hideKeyboard();
    if (rendered) rendered.scroll = el.view.scrollTop;
    var r = top();
    var def = screens[r.name];
    rendered = r;
    setFab(null);

    var title = typeof def.title === "function" ? def.title(r) : def.title;
    var isRoot = stack().length === 1;
    el.appbar.innerHTML =
      (isRoot ? "" : '<button class="appbar-back" type="button" data-act="back" aria-label="Back">' + icon("arrow-left") + "</button>") +
      '<h1 class="appbar-title' + (isRoot ? " is-root" : "") + '">' + esc(title) + "</h1>" +
      '<div class="appbar-actions">' +
      (isRoot ? '<button class="appbar-btn" type="button" data-act="household">' + icon("users") + "<span>Household</span></button>" : "") +
      "</div>";

    el.view.innerHTML = "";
    var root = document.createElement("div");
    root.className = "screen-root screen-" + r.name;
    el.view.appendChild(root);
    def.render(root, r);
    el.view.scrollTop = keepScroll !== false ? r.scroll || 0 : 0;

    el.nav.querySelectorAll(".nav-tab").forEach(function (b) {
      var on = b.getAttribute("data-tab") === currentTab;
      b.classList.toggle("is-active", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
  }

  /* ---------------- FAB ---------------- */

  function setFab(opts) {
    el.fabSlot.innerHTML = "";
    if (!opts) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "fab";
    b.innerHTML = icon(opts.icon || "plus") + "<span>" + esc(opts.label) + "</span>";
    b.addEventListener("click", opts.onClick);
    el.fabSlot.appendChild(b);
  }

  /* ---------------- Toast + undo ---------------- */

  var toastTimer = null;

  function toast(message, opts) {
    opts = opts || {};
    clearTimeout(toastTimer);
    el.toastLayer.innerHTML = "";
    var t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.innerHTML = '<span class="toast-msg">' + esc(message) + "</span>" +
      (opts.undo ? '<button type="button" class="toast-undo">' + icon("undo") + "Undo</button>" : "");
    el.toastLayer.appendChild(t);
    el.main.classList.add("has-toast");
    if (opts.undo) {
      t.querySelector(".toast-undo").addEventListener("click", function () {
        D.restore(opts.undo);
        hideToast();
        var def = screens[top().name];
        if (def.staleAfterUndo) stack().length = 1;
        render(true);
        toast("Undone. Your data is back to how it was.");
      });
    }
    toastTimer = setTimeout(hideToast, opts.undo ? 6000 : 3500);
  }

  function hideToast() {
    clearTimeout(toastTimer);
    el.toastLayer.innerHTML = "";
    el.main.classList.remove("has-toast");
  }

  // Run an inventory/list-changing action with a snapshot taken first, then show "<msg> · Undo".
  function withUndo(fn) {
    var snap = D.snapshot();
    var message = fn();
    D.save();
    if (message) toast(message, { undo: snap });
    return snap;
  }

  /* ---------------- Dialogs ---------------- */

  function dialog(opts) {
    hideKeyboard();
    var overlay = document.createElement("div");
    overlay.className = "overlay";
    var id = D.uid("dlg");
    overlay.innerHTML =
      '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="' + id + '">' +
      '<h2 class="dialog-title" id="' + id + '">' + esc(opts.title) + "</h2>" +
      '<div class="dialog-body">' + opts.body + "</div>" +
      '<div class="dialog-actions"></div></div>';
    var actions = overlay.querySelector(".dialog-actions");
    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    (opts.actions || [{ label: "Close", kind: "primary" }]).forEach(function (a) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-" + (a.kind || "secondary");
      b.textContent = a.label;
      b.addEventListener("click", function () { close(); if (a.onClick) a.onClick(); });
      actions.appendChild(b);
    });
    overlay.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    el.dialogLayer.appendChild(overlay);
    var focusBtn = actions.querySelector(".btn-primary, .btn-danger") || actions.querySelector("button");
    if (focusBtn) focusBtn.focus();
    return close;
  }

  function underDev(feature) {
    dialog({
      title: "Under development",
      body: "<p>" + esc(feature) + " isn't available in this prototype yet.</p>",
      actions: [{ label: "Close", kind: "primary" }]
    });
  }

  function confirmDialog(opts) {
    dialog({
      title: opts.title,
      body: opts.body,
      actions: [
        { label: opts.cancelLabel || "Cancel", kind: "secondary" },
        { label: opts.confirmLabel || "OK", kind: opts.danger ? "danger" : "primary", onClick: opts.onConfirm }
      ]
    });
  }

  /* ---------------- Soft keyboard ---------------- */

  var TEXT_TYPES = { text: 1, search: 1, number: 1, email: 1, tel: 1 };
  function isTextField(t) {
    if (!t || !t.tagName) return false;
    if (t.tagName === "TEXTAREA") return true;
    return t.tagName === "INPUT" && !!TEXT_TYPES[(t.getAttribute("type") || "text").toLowerCase()];
  }

  function showKeyboard(field) {
    var numeric = field.getAttribute("type") === "number";
    el.kbImg.src = numeric ? "assets/keypad.svg" : "assets/keyboard.svg";
    el.keyboard.className = "keyboard is-open " + (numeric ? "is-numeric" : "is-text");
    el.screen.classList.add("kb-open");
    // Content has shrunk; keep the focused field visible above the keyboard.
    requestAnimationFrame(function () {
      var v = el.view.getBoundingClientRect();
      var f = field.getBoundingClientRect();
      var scale = v.height / el.view.clientHeight || 1;
      if (f.bottom > v.bottom - 16 * scale || f.top < v.top) {
        el.view.scrollTop += (f.top - v.top) / scale - el.view.clientHeight / 3;
      }
    });
  }

  function hideKeyboard() {
    if (!el.keyboard) return;
    el.keyboard.className = "keyboard";
    el.screen.classList.remove("kb-open");
  }

  function initKeyboard() {
    el.screen.addEventListener("focusin", function (e) { if (isTextField(e.target)) showKeyboard(e.target); });
    el.screen.addEventListener("focusout", function () {
      setTimeout(function () { if (!isTextField(document.activeElement)) hideKeyboard(); }, 0);
    });
    // Tapping the keyboard picture must never steal focus from the field.
    ["mousedown", "pointerdown", "touchstart"].forEach(function (evt) {
      el.keyboard.addEventListener(evt, function (e) { e.preventDefault(); }, { passive: false });
    });
    // Enter closes the keyboard, like "Done" on a phone.
    el.screen.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.tagName === "INPUT" && isTextField(e.target)) { e.preventDefault(); e.target.blur(); }
    });
    // Mouse wheel over a focused number field would silently change its value.
    el.screen.addEventListener("wheel", function (e) {
      if (e.target === document.activeElement && e.target.type === "number") e.target.blur();
    }, { passive: true });
  }

  /* ---------------- Status bar clock + device scaling ---------------- */

  function tickClock() {
    var d = new Date();
    var h = d.getHours() % 12 || 12;
    var m = d.getMinutes();
    el.clock.textContent = h + ":" + (m < 10 ? "0" : "") + m;
  }

  function fitDevice() {
    var dev = el.device;
    var w = dev.offsetWidth, h = dev.offsetHeight;
    var s = Math.min(1, (window.innerHeight - 32) / h, (window.innerWidth - 32) / w);
    s = Math.max(s, 0.3);
    dev.style.transform = s < 1 ? "scale(" + s + ")" : "";
    el.scaler.style.width = w * s + "px";
    el.scaler.style.height = h * s + "px";
  }

  /* ---------------- Init ---------------- */

  function init() {
    ["screen", "device", "scaler", "appbar", "main", "view", "fabSlot", "keyboard", "kbImg", "nav", "toastLayer", "dialogLayer", "clock"]
      .forEach(function (k) { el[k] = document.getElementById(k.replace(/[A-Z]/g, function (c) { return "-" + c.toLowerCase(); })); });

    el.nav.innerHTML = TABS.map(function (t) {
      return '<button class="nav-tab" type="button" data-tab="' + t.id + '">' +
        '<span class="nav-ind">' + icon(t.icon) + "</span><span class=\"nav-label\">" + t.label + "</span></button>";
    }).join("");
    el.nav.addEventListener("click", function (e) {
      var b = e.target.closest(".nav-tab");
      if (b) switchTab(b.getAttribute("data-tab"));
    });
    el.appbar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      if (b.getAttribute("data-act") === "back") back();
      if (b.getAttribute("data-act") === "household") go("household");
    });

    initKeyboard();
    tickClock();
    setInterval(tickClock, 10000);
    fitDevice();
    window.addEventListener("resize", fitDevice);
    resetStacks();
  }

  /* ---------------- Shared HTML builders ---------------- */

  var LEVEL_STYLE = {
    expired: { cls: "badge-danger", icon: "x-circle" },
    soon: { cls: "badge-warning", icon: "alert" },
    ok: { cls: "badge-neutral", icon: "clock" },
    none: { cls: "badge-neutral", icon: "calendar" }
  };

  function expiryBadge(iso) {
    var info = D.expiryInfo(iso);
    var st = LEVEL_STYLE[info.level];
    return '<span class="badge ' + st.cls + '">' + icon(st.icon) + esc(info.text) + "</span>";
  }

  function badge(kind, iconName, text) {
    return '<span class="badge badge-' + kind + '">' + icon(iconName) + esc(text) + "</span>";
  }

  function ownerTag(owner) {
    if (owner === "shared") return "";
    return '<span class="tag tag-owner">' + icon("user") + esc(D.ownerLabel(owner)) + "</span>";
  }

  function unitOptions(selected, units) {
    var groups = D.UNIT_GROUPS.map(function (g) {
      var list = g.units.filter(function (u) { return !units || units.indexOf(u) >= 0; });
      if (!list.length) return "";
      return '<optgroup label="' + g.label + '">' + list.map(function (u) {
        return '<option value="' + esc(u) + '"' + (u === selected ? " selected" : "") + ">" + esc(u) + "</option>";
      }).join("") + "</optgroup>";
    });
    return groups.join("");
  }

  function options(list, selected) {
    return list.map(function (v) {
      return '<option value="' + esc(v) + '"' + (v === selected ? " selected" : "") + ">" + esc(v) + "</option>";
    }).join("");
  }

  // Segmented control: buttons with aria-pressed. items: [{value, label, icon?}]
  function segmented(name, items, value, label) {
    return '<div class="seg" role="group" aria-label="' + esc(label || name) + '" data-seg="' + esc(name) + '">' +
      items.map(function (it) {
        var on = it.value === value;
        return '<button type="button" class="seg-btn' + (on ? " is-on" : "") + '" aria-pressed="' + on + '" data-value="' + esc(it.value) + '">' +
          (it.icon ? icon(it.icon) : "") + "<span>" + esc(it.label) + "</span></button>";
      }).join("") + "</div>";
  }

  // Wire up a segmented control; onChange(value).
  function bindSeg(root, name, onChange) {
    var seg = root.querySelector('[data-seg="' + name + '"]');
    if (!seg) return;
    seg.addEventListener("click", function (e) {
      var b = e.target.closest(".seg-btn");
      if (!b) return;
      seg.querySelectorAll(".seg-btn").forEach(function (x) {
        var on = x === b;
        x.classList.toggle("is-on", on);
        x.setAttribute("aria-pressed", on);
      });
      onChange(b.getAttribute("data-value"));
    });
  }

  // Large 56px checkbox. Rendered as a button with role=checkbox.
  function checkbox(checked, label, attrs) {
    return '<button type="button" class="check" role="checkbox" aria-checked="' + !!checked + '" aria-label="' + esc(label) + '"' + (attrs || "") + ">" +
      '<span class="check-box">' + icon("check") + "</span></button>";
  }

  function ownerItems() {
    return [{ value: "shared", label: "Shared" }].concat(D.state.members.map(function (m) {
      return { value: m.id, label: m.name };
    }));
  }

  function emptyState(iconName, title, text, actionsHtml) {
    return '<div class="empty">' + '<div class="empty-icon">' + icon(iconName) + "</div>" +
      '<p class="empty-title">' + esc(title) + "</p>" + (text ? '<p class="empty-text">' + esc(text) + "</p>" : "") +
      (actionsHtml ? '<div class="empty-actions">' + actionsHtml + "</div>" : "") + "</div>";
  }

  function plural(n, one, many) { return n + " " + (n === 1 ? one : many || one + "s"); }

  // Delegated click handling on a screen root: data-act="name" -> handlers[name](el, event)
  function actions(root, handlers) {
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b || !root.contains(b) || b.disabled) return;
      var fn = handlers[b.getAttribute("data-act")];
      if (fn) fn(b, e);
    });
  }

  // Read a positive number from an input; returns NaN when empty or invalid.
  function num(input) {
    var v = String(input.value).trim();
    if (v === "") return NaN;
    var n = Number(v);
    return isFinite(n) ? n : NaN;
  }

  KC.ui = {
    esc: esc, init: init, register: register, go: go, replace: replace, back: back, setStack: setStack,
    popToRoot: popToRoot, switchTab: switchTab, refresh: refresh, render: render, resetStacks: resetStacks,
    top: top, get currentTab() { return currentTab; },
    setFab: setFab, toast: toast, hideToast: hideToast, withUndo: withUndo,
    dialog: dialog, underDev: underDev, confirm: confirmDialog, hideKeyboard: hideKeyboard,
    expiryBadge: expiryBadge, badge: badge, ownerTag: ownerTag, unitOptions: unitOptions, options: options,
    segmented: segmented, bindSeg: bindSeg, checkbox: checkbox, ownerItems: ownerItems, emptyState: emptyState,
    plural: plural, actions: actions, num: num
  };
})();
