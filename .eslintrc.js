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
  plugins: ["@typescript-eslint", "eslint-plugin-tsdoc"],
  rules: {
    "@typescript-eslint/no-explicit-any": ["off"],
    // TODO take this out when the compilation of the new
    // ES6 error constructor is fixed.
    "@typescript-eslint/ban-ts-comment": ["off"],
    "tsdoc/syntax": "error",
  },
};
