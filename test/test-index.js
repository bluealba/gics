"use strict";

const GICS = require("../lib/GICS"),
	index = require("../index"),
	chai = require("chai"),
	expect = require("chai").expect,
	chaiThings = require("chai-things");

chai.should();
chai.use(chaiThings);

describe("index.js", function() {
	it("exports the GICS class", function() {
		index.should.equal(GICS);
	});

});
