import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// Wrap the base config via typescript-eslint’s helper
export default tseslint.config(
  { ignores: ['dist'] },  // Don’t lint compiled output
  {
    // Extend recommended ESLint and TypeScript rulesets
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    // Only apply to TS and TSX files
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,  // Use modern ECMAScript features
      globals: globals.browser, // Browser global variables (window, document, etc.)
    },
    // Register additional plugins
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Include the recommended rules from react-hooks plugin
      ...reactHooks.configs.recommended.rules,
      // Warn if components aren’t the only exports in refreshable files
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
)
