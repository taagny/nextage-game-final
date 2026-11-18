import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
  globalIgnores(["dist", ".firebase", "entregas"]),
  {
    files: ["**/*.{js,jsx,mjs}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } }
    }
  },
  {
    files: ["src/{components,pages,context}/**/*.{js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: ["firebase/firestore", "firebase/auth"],
          patterns: [
            "firebase/firestore/**",
            "firebase/auth/**",
            "firebase/compat/**",
            "**/services/firebase",
            "**/services/firebase.js"
          ]
        }
      ]
    }
  },
  {
    files: ["scripts/**/*.mjs", "rules-tests/**/*.js", "tests/**/*.mjs"],
    languageOptions: { globals: globals.node }
  }
])
