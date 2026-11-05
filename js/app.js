/* app.js — boot: load (or seed) data, build the shell, open Kitchen. */
(function () {
  "use strict";
  var KC = window.KC;
  KC.data.load();
  KC.ui.init();
  KC.ui.render();
})();
