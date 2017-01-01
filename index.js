'use strict';
const path = require('path');
const fs = require('fs');

// Promise Resolve/Reject
var pRsRj = (resolve, reject)=> (err, result)=> err? reject(err): resolve(result);

// fs Promise wrappers
var readFile = (fname)=> new Promise((rs, rj)=>fs.readFile(fname, pRsRj(rs, rj)));
var readDir = (dirname)=> new Promise((rs, rj)=>fs.readdir(dirname, 'utf8', pRsRj(rs, rj)));
var mkDir = (dirname)=> new Promise((rs, rj)=>fs.mkdir(dirname, pRsRj(rs, rj)));

// Helpers
var simplePathParts = (p)=> {
  var dotPos = p.lastIndexOf('.');
  var prefix = p.substr(0, dotPos+1);
  var ext = p.substr(dotPos+1);

  return {
    dotPos,
    prefix,
    ext,
  };
}

var transformFile = async function (fname) {
  fname = path.normalize(fname);

  let staticFilePath = path.join(settings.publicPath, fname);
  let staticFilePathParts = simplePathParts(staticFilePath);

  let possibleSources = [];
  if (!settings.dontTransform.test(fname)) {
    for (var t of transformers) {
      if (!t.to.includes(staticFilePathParts.ext)) continue;
      for (var from of t.from) {
        possibleSources.push({
          filename: staticFilePathParts.prefix+from,
          t: t,
          ext: from,
        })
      }
    }
  }
  possibleSources.push({
    filename: staticFilePath,
  });

  let result = {
    content: '404 Not Found',
    code: 404,
    contentType: 'text/plain',
  };
  for (var p of possibleSources) {
    try {
      let sourceContent = await readFile(p.filename);
      result.content = p.t? await p.t.transform(sourceContent) : sourceContent;
    } catch (e) {
      if(e.code=='ENOENT') {

      } else {
        console.error(p.filename)
        console.error(e)
      }
      continue;
    }
    if (p.t) {
      result.code=203;
      result.contentType = p.t.contentType
    } else {
      result.code=200;
    }
    console.log(`(${p.ext||''})\t${fname}`)
    break;
  }

  return result;
}

exports.requestHandler = async function(req, res) {
  let result = await transformFile(req.url)
  res.statusCode = result.code;
  res.setHeader('Content-Type', result.contentType+'; charset=UTF-8');
  return res.end(result.content)
}

exports.transformDirectory = async function(root) {
  var from = path.join(settings.publicPath, root);
  var to = path.join(settings.targetPath, root);
  let contents = await readDir(from);
  for (var f of contents) {
    var relFname = path.join(root, f)
    var filename = path.join(from, f);
    let input;
    try {
      input = await readFile(filename);
      let output = input;
      let filenameParts = simplePathParts(f)
      var ext = filenameParts.ext;
      for (var t of transformers) {
        if (t.from.includes(filenameParts.ext)) {
          output = await t.transform(input)
          ext = t.to[0];
          break;
        }
      }
      let outputFname = path.join(to, filenameParts.prefix+ext)
      fs.writeFile(outputFname, output, ()=>{});
      console.log(relFname)

    } catch(e) {
      if ('EISDIR'==e.code) {
        let targetDirectory = path.join(to, f);
        let relDirectory = path.join(root, f);
        try {
          await mkDir(targetDirectory)
        } catch (e) {

        }
        await transformDirectory(relDirectory);
      } else {
        console.error(filename)
        console.error(e)
      }
    }
  }
}

var settings;
exports.setSettings = function (s) {
	settings = s;
}

var transformers = [
  require('./renderers/pug')(),
  require('./renderers/less')(),
  require('./renderers/es6')(),
];
