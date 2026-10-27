export const sampleRecipes = [
  {
    id: "recipe-001",
    name: "Pancakes",
    description: "Classic homemade pancakes",
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    ingredients: [
      { name: "Flour", quantity: 200, unit: "g" },
      { name: "Milk", quantity: 300, unit: "mL" },
      { name: "Eggs", quantity: 2, unit: "pcs" },
      { name: "Sugar", quantity: 2, unit: "tbsp" },
    ],
    instructions: ["Combine dry ingredients.", "Mix wet ingredients.", "Cook pancakes in a skillet."],
  },
  {
    id: "recipe-002",
    name: "Fried Rice",
    description: "Quick weeknight fried rice",
    prepTime: 10,
    cookTime: 10,
    servings: 2,
    ingredients: [
      { name: "Rice", quantity: 300, unit: "g" },
      { name: "Eggs", quantity: 2, unit: "pcs" },
      { name: "Frozen Peas", quantity: 100, unit: "g" },
      { name: "Soy Sauce", quantity: 2, unit: "tbsp" },
    ],
    instructions: ["Scramble eggs and set aside.", "Fry rice and peas.", "Stir in eggs and soy sauce."],
  },
];
