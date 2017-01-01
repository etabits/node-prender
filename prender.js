#!/usr/bin/env node
'use strict';
const http = require('http');
const path = require('path');

var args = process.argv.slice(2);
var mode;
var settings = {
  dontTransform: /^\/vendor\//,
};
if (1==args.length) {
  mode = 'serve';
  settings.publicPath = path.resolve(process.cwd(), args[0]);
} else if (2==args.length) {
  if ((/\.js$/).test(args[0])) {
    settings = require(args[0]);
    mode = args[1];
  } else {
    settings.publicPath = path.resolve(process.cwd(), args[0]);
    settings.targetPath = path.resolve(process.cwd(), args[1]);
    mode = 'dist';
  }
}

console.log(settings)

var prender = require('./');
prender.setSettings(settings)

if ('serve'==mode) {
  const server = http.createServer(prender.requestHandler);
  server.listen(8000);
} else if ('dist'==mode) {
  prender.transformDirectory('/');
}
