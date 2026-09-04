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
      "no-restricted-syntax": [
        "error",
        {
          // Design tokens only — see DESIGN_SYSTEM.md
          selector: "Literal[value=/^z-index:\\s*\\d{4,}/]",
          message: "Use the z-index scale in DESIGN_SYSTEM.md, not a magic z-index.",
        },
        {
          // A key-shaped env var must never reach the client bundle — see
          // ARCHITECTURE.md §7. Catches `process.env.NEXT_PUBLIC_..._KEY`
          // (Identifier) and `process.env["NEXT_PUBLIC_..._KEY"]` (Literal).
          selector: "Identifier[name=/^NEXT_PUBLIC_.*(_API_KEY|_SECRET|_TOKEN)$/]",
          message: "A key-shaped env var must never be prefixed NEXT_PUBLIC_ — see ARCHITECTURE.md §7.",
        },
        {
          selector: "Literal[value=/^NEXT_PUBLIC_.*(_API_KEY|_SECRET|_TOKEN)$/]",
          message: "A key-shaped env var must never be prefixed NEXT_PUBLIC_ — see ARCHITECTURE.md §7.",
        },
      ],
    },
  },
];

export default eslintConfig;
