// Shared data layer. All pages read/write app data through this file only.
import { sampleInventory } from "../data/sampleInventory.js";
import { sampleShopping } from "../data/sampleShopping.js";
import { sampleRecipes } from "../data/sampleRecipes.js";

const KEYS = {
  inventory: "kc_inventory",
  shopping: "kc_shopping",
  recipes: "kc_recipes",
  initialized: "kc_initialized",
};

export const LOCATIONS = ["Refrigerator", "Freezer", "Pantry", "Cupboard", "Other"];

export const UNITS = [
  { code: "pcs", label: "Pieces" },
  { code: "g", label: "Grams" },
  { code: "kg", label: "Kilograms" },
  { code: "mL", label: "Milliliters" },
  { code: "L", label: "Liters" },
  { code: "oz", label: "Ounces" },
  { code: "lb", label: "Pounds" },
  { code: "cup", label: "Cups" },
  { code: "tbsp", label: "Tablespoons" },
  { code: "tsp", label: "Teaspoons" },
];

// Units convert only within the same group. Different groups are never compared.
const UNIT_BASE = {
  pcs: { group: "count", factor: 1 },
  g: { group: "mass", factor: 1 },
  kg: { group: "mass", factor: 1000 },
  oz: { group: "mass", factor: 28.35 },
  lb: { group: "mass", factor: 453.6 },
  mL: { group: "volume", factor: 1 },
  L: { group: "volume", factor: 1000 },
  cup: { group: "volume", factor: 240 },
  tbsp: { group: "volume", factor: 15 },
  tsp: { group: "volume", factor: 5 },
};

// Returns { group, amount } in base units (g, mL, pcs), or null for unknown units.
export function toBaseUnit(quantity, unit) {
  const base = UNIT_BASE[unit];
  return base ? { group: base.group, amount: quantity * base.factor } : null;
}

// ---------- internal helpers ----------

function read(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function generateId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function isValidItem(item) {
  return (
    item &&
    typeof item.name === "string" &&
    item.name.trim() !== "" &&
    typeof item.quantity === "number" &&
    item.quantity >= 0 &&
    item.unit in UNIT_BASE
  );
}

// Seeds sample data once. Later refreshes keep the user's changes.
export function initStorage() {
  if (localStorage.getItem(KEYS.initialized)) return;
  write(KEYS.inventory, sampleInventory);
  write(KEYS.shopping, sampleShopping);
  write(KEYS.recipes, sampleRecipes);
  localStorage.setItem(KEYS.initialized, "true");
}

// Clears everything and reseeds sample data (handy while testing).
export function resetStorage() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  initStorage();
}

// ---------- inventory ----------

export function getInventory() {
  return read(KEYS.inventory);
}

export function saveInventory(list) {
  write(KEYS.inventory, list.filter(isValidItem));
}

export function addInventoryItem(item) {
  if (!isValidItem(item)) throw new Error("Item needs a name, a non-negative quantity, and a valid unit.");
  const newItem = { location: "Other", expirationDate: null, lowStockThreshold: 0, isShared: true, owner: null, ...item, id: generateId("item") };
  saveInventory([...getInventory(), newItem]);
  return newItem;
}

export function updateInventoryItem(id, changes) {
  const list = getInventory();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const updated = { ...list[index], ...changes, id };
  if (!isValidItem(updated)) throw new Error("Invalid inventory item.");
  list[index] = updated;
  saveInventory(list);
  return updated;
}

export function deleteInventoryItem(id) {
  saveInventory(getInventory().filter((item) => item.id !== id));
}

export function isLowStock(item) {
  return item.quantity <= item.lowStockThreshold;
}

// ---------- shopping list ----------

export function getShoppingList() {
  return read(KEYS.shopping);
}

export function saveShoppingList(list) {
  write(KEYS.shopping, list.filter(isValidItem));
}

export function addShoppingItem(item) {
  if (!isValidItem(item)) throw new Error("Item needs a name, a non-negative quantity, and a valid unit.");
  const newItem = { purchased: false, source: "manual", ...item, id: generateId("shopping") };
  saveShoppingList([...getShoppingList(), newItem]);
  return newItem;
}

export function updateShoppingItem(id, changes) {
  const list = getShoppingList();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const updated = { ...list[index], ...changes, id };
  if (!isValidItem(updated)) throw new Error("Invalid shopping item.");
  list[index] = updated;
  saveShoppingList(list);
  return updated;
}

export function deleteShoppingItem(id) {
  saveShoppingList(getShoppingList().filter((item) => item.id !== id));
}

// ---------- recipes ----------

export function getRecipes() {
  return read(KEYS.recipes);
}
