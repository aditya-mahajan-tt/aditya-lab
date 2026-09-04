import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", ".screenshots/**", "playwright-report/**"],
  },
  {
    rules: {
      // Design tokens only — see DESIGN_SYSTEM.md
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^z-index:\\s*\\d{4,}/]",
          message: "Use the z-index scale in DESIGN_SYSTEM.md, not a magic z-index.",
        },
      ],
    },
  },
];

export default eslintConfig;
