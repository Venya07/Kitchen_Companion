/* Icon sprite: one line-style set (24px grid, 2px stroke, round caps/joins).
   Defined once here and injected as an inline <svg> sprite so index.html and
   style-guide.html share it. Use with KC.icon("name"). */
(function () {
  "use strict";
  var KC = (window.KC = window.KC || {});

  var ICONS = {
    "arrow-left": '<path d="M20 12H4"/><path d="M10 6l-6 6 6 6"/>',
    "chevron-right": '<path d="M9 5l7 7-7 7"/>',
    "chevron-down": '<path d="M5 9l7 7 7-7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M4 12.5l5 5L20 6.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    alert: '<path d="M12 3.5L2.5 20h19L12 3.5z"/><path d="M12 10v4.5"/><path d="M12 17.5v.01"/>',
    "x-circle": '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    "check-circle": '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    fridge: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 10h14"/><path d="M9 5v2M9 13v3"/>',
    freezer: '<path d="M12 2v20"/><path d="M3.3 7l17.4 10M20.7 7L3.3 17"/><path d="M9 3.5l3 2 3-2M9 20.5l3-2 3 2"/>',
    pantry: '<path d="M8 3h8v3H8z"/><path d="M7 6h10a1 1 0 011 1v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7a1 1 0 011-1z"/><path d="M6 12h12"/>',
    cupboard: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/><path d="M9 11v2M15 11v2"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    kitchen: '<path d="M4 10h16v7a3 3 0 01-3 3H7a3 3 0 01-3-3v-7z"/><path d="M2 10h20"/><path d="M9 7c0-1.2 1-1.8 1-3M14 7c0-1.2 1-1.8 1-3"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M2 3h3l2.5 12h11L21 7H6.2"/>',
    book: '<path d="M4 4.5A1.5 1.5 0 015.5 3H20v15H5.5A1.5 1.5 0 004 19.5v-15z"/><path d="M4 19.5A1.5 1.5 0 005.5 21H20v-3"/><path d="M9 8h7M9 12h5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 4.6a3.5 3.5 0 010 6.8"/><path d="M18 14a6.5 6.5 0 013.5 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    heart: '<path d="M12 20s-7-4.4-9-9a4.8 4.8 0 019-3 4.8 4.8 0 019 3c-2 4.6-9 9-9 9z"/>',
    "heart-fill": '<path d="M12 20s-7-4.4-9-9a4.8 4.8 0 019-3 4.8 4.8 0 019 3c-2 4.6-9 9-9 9z" fill="currentColor"/>',
    sort: '<path d="M7 4v16M3 8l4-4 4 4"/><path d="M17 20V4M13 16l4 4 4-4"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
    discard: '<path d="M5 8h14l-1.5 12h-11L5 8z"/><path d="M3 5h18"/><path d="M10 12l4 4M14 12l-4 4"/>',
    utensils: '<path d="M7 3v8M4.5 3v5a2.5 2.5 0 005 0V3M7 11v10"/><path d="M18 21V3c-2.2 1.5-3.5 4-3.5 7v4H18"/>',
    bell: '<path d="M6 16v-5a6 6 0 0112 0v5l2 2H4l2-2z"/><path d="M10 21h4"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
    restock: '<path d="M20 12a8 8 0 01-14 5.3M4 12a8 8 0 0114-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
    putaway: '<path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/><path d="M12 11v6M9.5 14.5L12 17l2.5-2.5"/>',
    flame: '<path d="M12 3c1 3 5 5 5 10a5 5 0 01-10 0c0-2 1-3.5 2-4.5.5 2 1.5 3 2.5 3C11 9 11 6 12 3z"/>',
    play: '<path d="M7 4l13 8-13 8V4z"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>',
    reset: '<path d="M3 12a9 9 0 103-6.7"/><path d="M3 4v5h5"/>',
    plate: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
    note: '<path d="M5 3h10l4 4v14H5V3z"/><path d="M14 3v5h5M8 13h8M8 17h5"/>',
    signal: '<path d="M4 19v-2M9 19v-5M14 19v-8M19 19V6"/>',
    wifi: '<path d="M2 9a15 15 0 0120 0"/><path d="M5.5 12.5a10 10 0 0113 0"/><path d="M9 16a5 5 0 016 0"/><path d="M12 19.5v.01"/>',
    battery: '<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22.5 11v2"/><rect x="4.5" y="9.5" width="11" height="5" rx="1" fill="currentColor" stroke="none"/>'
  };

  KC.ICON_NAMES = Object.keys(ICONS);

  KC.icon = function (name, cls) {
    return '<svg class="icon' + (cls ? " " + cls : "") + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';
  };

  function inject() {
    var symbols = KC.ICON_NAMES.map(function (n) {
      return '<symbol id="i-' + n + '" viewBox="0 0 24 24">' + ICONS[n] + "</symbol>";
    }).join("");
    var holder = document.createElement("div");
    holder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">' + symbols + "</svg>";
    document.body.insertBefore(holder.firstChild, document.body.firstChild);
  }

  if (document.body) inject();
  else document.addEventListener("DOMContentLoaded", inject);
})();
