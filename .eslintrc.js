module.exports = {
  'extends': 'google',
  'parserOptions': {'ecmaVersion': 2017},
  'rules': {
    'linebreak-style': ['error', 'windows'],
    'require-jsdoc': 0,
    'max-len': ['error', {'code': 120}],
    'no-unused-vars': [0],
    'new-cap': [0]
  }
};