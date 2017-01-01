'use strict';
const pug = require('pug');

module.exports = ()=> ({
  from: ['pug', 'jade'],
  to: ['html'],
  contentType: 'text/html',
  transform: (input, ctxt)=> pug.render(input, ctxt),
})
