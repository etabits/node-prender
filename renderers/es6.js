'use strict';
const babel = require('babel-core');

module.exports = ()=> ({
  from: ['js'],
  to: ['js'],
  transform: (input, ctxt)=> babel.transform(input, {"presets": ["es2015"]}).code,
})
