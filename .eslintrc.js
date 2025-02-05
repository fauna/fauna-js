module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  overrides: [],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsConfigRootDir: __dirname,
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "eslint-plugin-tsdoc", "eslint-comments"],
  rules: {
    "@typescript-eslint/no-explicit-any": ["off"],
    "tsdoc/syntax": "error",
    "@typescript-eslint/triple-slash-reference": [
      "error",
      { lib: "never", path: "never", types: "never" },
    ],
  },
};
