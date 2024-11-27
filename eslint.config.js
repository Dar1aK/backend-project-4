import globals from 'globals';

export default [
  {
    languageOptions: { globals: globals.node },
    rules: {
      semi: 'error',
      'prefer-const': 'error',
      'operator-linebreak': ['error', 'before'],
      'implicit-arrow-linebreak': ['error', 'beside'],
    },
  },
];
