import next from "@next/eslint-plugin-next";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".pnp.*",
      ".yarn/**",
      "jest.config.js",
      "jest.setup.js",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@next/next": next,
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
];

export default eslintConfig;
