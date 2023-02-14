/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["./setupJest.js"],
  testPathIgnorePatterns: ["node_modules/", "build/"],
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
};
