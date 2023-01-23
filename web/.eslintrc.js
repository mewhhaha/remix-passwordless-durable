/** @type {import('eslint').Linter.Config} */
module.exports = {
  plugins: ["tailwindcss"],
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "plugin:tailwindcss/recommended",
  ],
};
