export const FUNC_NAMES = { __proto__: null };
"sin cos tan cot sec csc log lg ln lim exp max min sup inf det gcd arcsin arccos arctan sinh cosh tanh coth deg arg".replace(
  /\w+/g,
  (e) => (FUNC_NAMES[e] = 1),
);
