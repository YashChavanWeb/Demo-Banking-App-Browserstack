// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Fix 25: exclude server from Expo/React rules; it has its own Node.js context
    ignores: ['dist/*', 'server/**'],
  },
  // Fix 25: Server-specific overrides — CommonJS Node.js environment
  {
    files: ['server/**/*.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'commonjs',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'no-console': 'off',
      'no-process-exit': 'warn',
    },
  },
]);
