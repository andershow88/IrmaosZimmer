// Configuração mínima de ESLint 9 (flat config).
// Não usa eslint-config-next devido a incompatibilidade conhecida
// entre eslint 9 e next 16 via FlatCompat. O TypeScript (tsc --noEmit)
// já cobre erros de tipo; o build do Next valida o restante.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "prisma/seed.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-undef": "off",
    },
  },
];
