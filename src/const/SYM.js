import { TYPE_IDENT, TYPE_OP, TYPE_FUNC, TYPE_SPACE } from "./TYPE.js";
import { ATTR_NORMAL, ATTR_BIN, ATTR_REL } from "./ATTR.js";

export const SYM_MAP = { __proto__: null };

const parseSymbols = (str, type, attr) => {
  str.replace(/([a-zA-Z]+)([^a-zA-Z]+)/g, (m, k, v) => {
    SYM_MAP[k] = attr ? [type, v, attr] : [type, v];
  });
};

parseSymbols(
  "alphaαbetaβgammaγthetaθpiπdeltaδepsilonϵzetaζetaηiotaιkappaκlambdaλmuμnuνxiξrhoρsigmaσtauτupsilonυphiϕchiχpsiψomegaωellℓhbarℏneg¬varphiφvarpiϖvarrhoϱvarthetaϑvarepsilonεvarsigmaς",
  TYPE_IDENT,
);
parseSymbols(
  "DeltaΔGammaΓThetaΘLambdaΛXiΞPiΠSigmaΣUpsilonΥPhiΦPsiΨOmegaΩinfty∞nabla∇partial∂forall∀exists∃emptyset∅degree°alephℵwp℘top⊤bot⊥angle∠",
  TYPE_IDENT,
  ATTR_NORMAL,
);
parseSymbols(
  "prime′cdot⋅times×pm±div÷sum∑prod∏coprod∐int∫iint∬iiint∭oint∮leftrightarrow↔Leftarrow⇐Rightarrow⇒Leftrightarrow⇔cdots⋯in∈notin∉subset⊂supset⊃subseteq⊆supseteq⊇cup∪cap∩to→rightarrow→leftarrow←gets←dots…ldots…le≤leq≤ge≥geq≥bigcap⋂bigcup⋃bigvee⋁bigwedge⋀bigoplus⨁bigotimes⨂bigodot⨀biguplus⨄bigsqcup⨆downarrow↓uparrow↑updownarrow↕Downarrow⇓Uparrow⇑Updownarrow⇕longrightarrow⟶longleftarrow⟵longleftrightarrow⟷Longrightarrow⟹Longleftarrow⟸Longleftrightarrow⟺mapsto↦longmapsto⟼nearrow↗searrow↘nwarrow↖swarrow↙hookrightarrow↪hookleftarrow↩rightharpoonup⇀rightharpoondown⇁leftharpoonup↼leftharpoondown↽",
  TYPE_OP,
);
parseSymbols("neq≠ne≠lt<gt>", TYPE_OP, ATTR_NORMAL);
parseSymbols(
  "mp∓lor∨land∧oplus⊕ominus⊖otimes⊗oslash⊘odot⊙circ∘bullet∙star⋆ast∗setminus∖wr≀diamond⋄sqcap⊓sqcup⊔triangleleft◁triangleright▷",
  TYPE_OP,
  ATTR_BIN,
);
parseSymbols(
  "approx≈sim∼cong≅propto∝equiv≡ni∋perp⟂parallel∥mid∣nmid∤ll≪gg≫simeq≃prec≺succ≻preceq⪯succeq⪰vdash⊢dashv⊣models⊨owns∋sqsubset⊏sqsupset⊐sqsubseteq⊑sqsupseteq⊒",
  TYPE_OP,
  ATTR_REL,
);

// 函数名直接并入 SYM_MAP，消除 FUNC_NAMES
"sin cos tan cot sec csc log lg ln lim exp max min sup inf det gcd arcsin arccos arctan sinh cosh tanh coth deg arg".replace(
  /\w+/g,
  (e) => (SYM_MAP[e] = [TYPE_FUNC, e]),
);

// 空格命令直接并入 SYM_MAP，消除 SPACE_MAP
[
  [",", "3px"],
  [":", "4px"],
  [";", "5px"],
  ["!", "-3px"],
  [" ", "4px"],
  ["quad", "16px"],
  ["qquad", "32px"],
  ["thinspace", "3px"],
  ["medspace", "4px"],
  ["thickspace", "5px"],
  ["enspace", "8px"],
  ["negthinspace", "-3px"],
  ["negmedspace", "-4px"],
  ["negthickspace", "-5px"],
].map(([k, v]) => (SYM_MAP[k] = [TYPE_SPACE, v]));
