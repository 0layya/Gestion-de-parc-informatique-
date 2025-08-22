import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', '**/*.ts', '**/*.tsx'] }, // Exclude TypeScript files
  
  // Configuration for Node.js files (server, scripts)
  {
    files: ['**/*.js', 'server/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        process: 'readonly'
      }
    },
    rules: {
      'no-console': 'off', // Allow console in Node.js files
      'no-undef': 'off', // Node.js globals are available
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
];
