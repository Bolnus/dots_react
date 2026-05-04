import { globalIgnores, defineConfig } from "eslint/config";
import eslintJs from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import typescriptEslint from "typescript-eslint";
import typescriptParser from "@typescript-eslint/parser";
import stylisticPlugin from "@stylistic/eslint-plugin";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import sonarjsPlugin from "eslint-plugin-sonarjs";
import jsdocPlugin from "eslint-plugin-jsdoc";
// import nextVitals from "eslint-config-next/core-web-vitals"; // For core web vitals rules
// import nextTypeScript from "eslint-config-next/typescript"; // If you're using TypeScript
import nextPlugin from "@next/eslint-plugin-next";

export default defineConfig([
  eslintJs.configs.recommended,
  typescriptEslint.configs.recommendedTypeChecked,
  typescriptEslint.configs.stylistic,
  jsxA11yPlugin.flatConfigs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  reactHooksPlugin.configs["recommended-latest"],
  sonarjsPlugin.configs.recommended,
  nextPlugin.configs["core-web-vitals"],
  prettier,
  globalIgnores([
    "*.json",
    "node_modules/*",
    "*.mjs",
    "*.cjs",
    ".next/*",
    "reverse-proxy/*"
  ]),
  {
    languageOptions: {
      ecmaVersion: 2022,
      parser: typescriptParser,
      parserOptions: {
        projectService: true,
        project: "tsconfig.json",
        tsconfigRootDir: import.meta.dirname
        // project: 'tsconfig.json',
        // tsconfigRootDir: '.'
      }
      // globals: {
      //     ...globals.browser,
      //     ...globals.es6,
      //     ...globals.jest
      // }
    },
    linterOptions: {
      reportUnusedDisableDirectives: "warn"
    },
    plugins: {
      "@stylistic": stylisticPlugin,
      react: reactPlugin,
      jsdoc: jsdocPlugin
    },
    // settings: {
    //   // "import/resolver": { typescript: { alwaysTryTypes: true } },
    //   react: {
    //     version: "detect"
    //   }
    // },
    // ignores: ['eslint.config.*', '*.json', 'node_modules/*'],
    rules: {
      // ESLint базовые правила:
      curly: ["warn", "all"],
      "arrow-body-style": "off",
      "no-use-before-define": "off",
      "no-bitwise": "off",
      "no-unused-vars": "off",
      "no-else-return": [1, { allowElseIf: false }],
      "object-shorthand": "warn",
      "no-unneeded-ternary": "warn",
      "consistent-return": "warn",
      "no-useless-constructor": "warn",
      "prefer-destructuring": [
        "warn",
        {
          VariableDeclarator: {
            object: true,
            array: true
          },
          AssignmentExpression: {
            object: false,
            array: false
          }
        }
      ],
      "prefer-const": "warn",
      "prefer-object-spread": "off",
      "no-return-assign": "warn",
      "no-restricted-syntax": "off",
      "no-plusplus": "off",
      "no-case-declarations": "off",
      "no-param-reassign": "warn",
      "no-prototype-builtins": "off",
      "lines-between-class-members": "off",
      camelcase: "off",
      "no-underscore-dangle": "off",
      "no-duplicate-case": "error",
      "default-case": "error",
      "no-empty": "error",
      "no-ex-assign": "error",
      "no-unsafe-finally": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "getter-return": "error",
      "no-setter-return": "error",
      "no-constructor-return": "error",
      "no-empty-pattern": "error",
      "array-callback-return": "off",
      "no-void": "off",
      "no-restricted-globals": ["warn", "isNaN", "isFinite"],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: [
        "error",
        "always",
        {
          null: "ignore"
        }
      ],
      radix: "warn",
      "no-unused-expressions": "error",
      "no-continue": "off",
      yoda: "warn",
      "func-names": "warn",
      "func-style": ["warn", "declaration", { allowArrowFunctions: true }],
      "no-promise-executor-return": "off",
      "no-nested-ternary": "error",
      "dot-notation": "warn",
      "no-lonely-if": "warn",
      "unicode-bom": "warn",
      "default-param-last": "warn",
      "class-methods-use-this": "warn",
      "max-params": ["warn", 5],
      "no-shadow": ["warn", { builtinGlobals: true, hoist: "functions", ignoreOnInitialization: false }],
      "prefer-arrow-callback": "off",
      "no-fallthrough": "off",
      "prefer-promise-reject-errors": "warn",
      "no-implied-eval": "error",

      // React:
      "react/jsx-filename-extension": "off",
      "react/prop-types": [
        "warn",
        {
          ignore: ["children", "history", "match", "location"]
        }
      ],
      "react/destructuring-assignment": "off",
      "react/state-in-constructor": "off",
      "react/jsx-props-no-spreading": "off",
      "react/self-closing-comp": "warn",
      "react/no-unused-prop-types": "warn",
      "react/no-unused-state": "warn",
      "react/forbid-prop-types": "warn",
      "react/jsx-boolean-value": "warn",
      "react/jsx-fragments": "warn",
      "react/button-has-type": "off",
      "react/jsx-curly-brace-presence": "warn",
      "react/jsx-no-useless-fragment": ["warn", { allowExpressions: true }],
      "react/function-component-definition": ["warn", { namedComponents: "function-declaration" }],
      "react/no-array-index-key": "warn",
      "react/jsx-no-constructed-context-values": "warn",
      "react/display-name": "off",
      "react/no-unstable-nested-components": "off",
      "react/prefer-stateless-function": "off",
      "react/jsx-no-constructed-context-values": "off",

      // jsx-a11y:
      "jsx-a11y/anchor-is-valid": ["warn", { aspects: ["invalidHref"] }],
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/label-has-for": "off",
      "jsx-a11y/control-has-associated-label": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/no-static-element-interactions": "off",

      // JSDOC
      "jsdoc/require-jsdoc": "off",
      "jsdoc/no-types": "warn",

      // Import:
      // "import/order": [
      //   "warn",
      //   {
      //     groups: [
      //       ["builtin", "external"],
      //       ["parent", "sibling", "index", "type"]
      //     ]
      //   }
      // ],
      // "import/no-extraneous-dependencies": "off",
      // "import/extensions": "off",
      // "import/no-unresolved": "warn",
      // "import/no-useless-path-segments": "warn",
      // "import/prefer-default-export": "off",
      // "import/no-cycle": "off",
      // "import/no-self-import": "warn",
      // "import/no-import-module-exports": "warn",

      // Prettier:
      "prettier/prettier": "warn",

      // Stylistic:
      "@stylistic/member-delimiter-style": "error",
      "@stylistic/type-annotation-spacing": "error",
      "@stylistic/brace-style": ["warn", "1tbs"],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/max-len": [
        "warn",
        {
          code: 120,
          ignorePattern: "^\\s*(// eslint-disable-)|(describe)|(test).+"
        }
      ],
      "@stylistic/no-extra-semi": "error",
      "@stylistic/object-curly-newline": ["warn", { consistent: true }],
      "@stylistic/spaced-comment": "warn",

      // sonarjs:
      "sonarjs/prefer-immediate-return": "warn",
      "sonarjs/no-commented-code": "off",
      "sonarjs/no-nested-switch": "warn",
      "sonarjs/no-collapsible-if": "warn",
      "sonarjs/no-duplicate-string": "warn",
      "sonarjs/max-switch-cases": "off",
      "sonarjs/unused-import": "off",
      "sonarjs/void-use": "off",
      "sonarjs/no-unused-vars": "off",
      "sonarjs/no-selector-parameter": "off",
      "sonarjs/no-hardcoded-passwords": "off",
      "sonarjs/function-return-type": "off",
      "sonarjs/deprecation": "off",
      "sonarjs/no-redundant-optional": "off",
      "sonarjs/todo-tag": "off",
      "sonarjs/post-message": "off",
      "sonarjs/no-nested-conditional": "off",
      "sonarjs/no-array-delete": "off",
      "sonarjs/no-useless-catch": "off",
      "sonarjs/updated-const-var": "off",
      "sonarjs/production-debug": "off",
      "sonarjs/prefer-immediate-return": "off",
      "sonarjs/no-fallthrough": "off",
      "sonarjs/no-clear-text-protocols": "off",
      "sonarjs/different-types-comparison": "off",
      "sonarjs/prefer-read-only-props": "warn",
      "sonarjs/cognitive-complexity": "warn",
      "sonarjs/no-control-regex": "off",

      // TypeScript:
      "@typescript-eslint/member-ordering": "error",
      "@typescript-eslint/no-unused-vars": ["warn", { varsIgnorePattern: "^React$" }],
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-for-in-array": "error",
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: ["variable", "property"],
          format: ["camelCase", "PascalCase", "snake_case", "UPPER_CASE"],
          leadingUnderscore: "allow",
          trailingUnderscore: "forbid"
        }
      ],
      "@typescript-eslint/no-misused-promises": [
        "warn",
        {
          checksVoidReturn: {
            attributes: false
          }
        }
      ],
      "@typescript-eslint/prefer-for-of": "off",
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn"
    }
  }
]);
