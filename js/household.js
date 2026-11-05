/* household.js — Household screen (top-bar icon): members, default owner, reset demo data. */
(function () {
  "use strict";
  var KC = window.KC;
  var D = KC.data, UI = KC.ui, icon = KC.icon, esc = UI.esc;

  var MEMBER_TEXT = {
    me: "Your personal items and shared items are used in your recipes, meal plans, and restock suggestions.",
    jordan: "Jordan’s personal items show in the kitchen with a “Jordan’s” tag, but are never used in your recipes or restock math."
  };

  UI.register("household", {
    title: "Household",
    render: function (root) {
      root.classList.add("no-fab");
      var s = D.state;
      root.innerHTML =
        '<section class="section"><h2 class="section-title">Members</h2><div class="card">' +
        s.members.map(function (m) {
          return '<div class="member-row"><span class="row-icon">' + icon("user") + "</span>" +
            '<div class="row-main"><div class="row-title">' + esc(m.name) + ' <span class="tag tag-source">' + esc(m.role) + "</span></div>" +
            '<div class="row-sub">' + esc(MEMBER_TEXT[m.id] || "") + "</div></div></div>";
        }).join("") + "</div>" +
        '<button type="button" class="btn btn-secondary btn-block" style="margin-top:16px" data-act="invite">' + icon("plus") + "Invite a member</button></section>" +

        '<section class="section card card-pad"><h2 class="section-title">Shared vs. personal</h2>' +
        '<p><strong>Shared</strong> items belong to the whole household. Anyone can use them, and they count toward recipes and restocking.</p>' +
        '<p style="margin:0"><strong>Personal</strong> items belong to one person. Everyone can see them, so nobody buys a duplicate, but only the owner’s plans use them.</p></section>' +

        '<section class="section"><h2 class="section-title">Default owner for new items</h2>' +
        UI.segmented("owner", UI.ownerItems(), s.defaultOwner, "Default owner") +
        '<div class="hint">Used when you add an item or put groceries away. You can change it on each item.</div></section>' +

        '<section class="section card card-pad"><h2 class="section-title">Demo data</h2>' +
        '<p class="muted">Puts back the original items, shopping list, and recipes. Use this before each test session.</p>' +
        '<button type="button" class="btn btn-danger btn-block" data-act="reset">' + icon("reset") + "Reset demo data</button></section>";

      UI.bindSeg(root, "owner", function (v) {
        s.defaultOwner = v;
        D.save();
        UI.toast("New items will be " + (v === "shared" ? "Shared" : D.ownerLabel(v)));
      });
      UI.actions(root, {
        invite: function () { UI.underDev("Inviting household members"); },
        reset: function () {
          UI.confirm({
            title: "Reset demo data?",
            body: "<p>This replaces all kitchen items, your shopping list, stock alerts, and recipes with the original demo data. Your changes can’t be recovered.</p>",
            confirmLabel: "Reset", danger: true,
            onConfirm: function () {
              D.reset();
              UI.resetStacks();
              UI.switchTab("kitchen", true);
              UI.toast("Demo data reset");
            }
          });
        }
      });
    }
  });
})();
