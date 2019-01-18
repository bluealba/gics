"use strict";

let def = require("./definitions/20160901");

Object.keys(def).filter(k => k.length === 6).forEach(k => console.log(`{ "code": "${k}", "name": "${def[k].name}" },`.replace(/(?:\r\n|\r|\n)/g, ' ')));

module.exports = require("./dist/GICS");
