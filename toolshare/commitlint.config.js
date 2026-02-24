module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'test', 'docs', 'chore', 'refactor', 'style'],
    ],
    'subject-max-length': [2, 'always', 72],
  },
};
