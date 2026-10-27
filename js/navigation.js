// Renders the shared bottom nav into <nav id="bottom-nav">.
// Each page sets <body data-page="..." data-root="."> (or ".." inside pages/).

const ICONS = {
  inventory: '<path d="M6 3h12v18H6z M6 10h12 M9 6v2 M9 13v3"/>',
  shopping: '<path d="M3 4h2l2.5 11h11L21 7H6.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  recipes: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z M5 17a3 3 0 0 1 3-3h11"/>',
};

const TABS = [
  { id: "inventory", label: "Inventory", href: "index.html" },
  { id: "shopping", label: "Shopping", href: "pages/shopping.html" },
  { id: "recipes", label: "Recipes", href: "pages/recipes.html" },
];

export function renderNav() {
  const nav = document.getElementById("bottom-nav");
  if (!nav) return;
  const { page, root = "." } = document.body.dataset;

  nav.setAttribute("aria-label", "Main");
  nav.innerHTML = TABS.map((tab) => {
    const active = tab.id === page;
    return `
      <a class="nav-link${active ? " active" : ""}" href="${root}/${tab.href}"${active ? ' aria-current="page"' : ""}>
        <svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[tab.id]}</svg>
        <span>${tab.label}</span>
      </a>`;
  }).join("");
}
