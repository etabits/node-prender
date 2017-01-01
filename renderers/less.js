'use strict';
const less = require('less');

module.exports = ()=> ({
  from: ['less'],
  to: ['css'],
  transform: (input, ctxt)=> new Promise((rs, rj)=>{
    less.render(input.toString(), {}, (err, result)=> err? rj(err): rs(result.css))
  }),
})
