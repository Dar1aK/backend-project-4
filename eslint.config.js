import globals from 'globals';

export default [
  {
    languageOptions: { globals: globals.node },
    rules: {
      semi: 'error',
      'prefer-const': 'error',
      'operator-linebreak': ['error', 'before'],
      'implicit-arrow-linebreak': ['error', 'beside'],
      'prefer-destructuring': ['error', {
      'array': true,
      'object': true
    }],
    'arrow-body-style': ['error', 'always'],
    'no-shadow': 'error'
    },
  },
];
