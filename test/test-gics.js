"use strict";

const GICS = require("../src/GICS"),
	chai = require("chai"),
	expect = require("chai").expect,
	chaiThings = require("chai-things");

chai.should();
chai.use(chaiThings);

describe("GICS", function () {
	it("uses most recent version if the one given does not exist", function () {
		const gics = new GICS("60201040", "20040101");
		gics.subIndustry.name.should.equal("Real Estate Services");
	});

	it("uses version of corresponding time if asOf parameter is given ", function () {
		const gics = new GICS("55105020", null, { asOF: new Date(1999, 11, 11) });
		gics.subIndustry.name.should.equal("Renewable Electricity ");
	});

	it("defaults on non specified version", function () {
		let gics = new GICS("60");
		gics.sector.name.should.equal("Real Estate");
	});

	it("marks unexistent codes as invalid", function () {
		let gics = new GICS("9999");
		gics.isValid.should.be.false;
	});

	it("marks existent codes as valid", function () {
		let gics = new GICS("10");
		gics.isValid.should.be.true;
	});

	it("supports older versions if specified", function () {
		let gicsOld = new GICS("4040", "20140228");
		let gicsNew = new GICS("4040", "20160901");
		gicsOld.sector.name.should.equal("Financials");
		gicsOld.industryGroup.name.should.equal("Real Estate");
		expect(gicsNew.isValid).to.be.false;
	});

	it("returns null for all levels on invalid GICS code", function () {
		let gics = new GICS("123");
		expect(gics.sector).to.be.null;
		expect(gics.industryGroup).to.be.null;
		expect(gics.industry).to.be.null;
		expect(gics.subIndustry).to.be.null;
	});

	it("resolves level 1 and leaves the rest null", function () {
		let gics = new GICS("10");
		expect(gics.sector).to.not.be.null;
		expect(gics.industryGroup).to.be.null;
		expect(gics.industry).to.be.null;
		expect(gics.subIndustry).to.be.null;
	});

	it("resolves level 2 and leaves the rest null", function () {
		let gics = new GICS("1010");
		expect(gics.sector).to.not.be.null;
		expect(gics.industryGroup).to.not.be.null;
		expect(gics.industry).to.be.null;
		expect(gics.subIndustry).to.be.null;
	});

	it("resolves level 3 and leaves the rest null", function () {
		let gics = new GICS("101010");
		expect(gics.sector).to.not.be.null;
		expect(gics.industryGroup).to.not.be.null;
		expect(gics.industry).to.not.be.null;
		expect(gics.subIndustry).to.be.null;
	});

	it("resolves level 4 and sets description", function () {
		let gics = new GICS("10101010");
		expect(gics.sector).to.not.be.null;
		expect(gics.industryGroup).to.not.be.null;
		expect(gics.industry).to.not.be.null;
		expect(gics.subIndustry).to.not.be.null;
		gics.subIndustry.description.should.not.be.null;
	});

	it("resolves GICS partial code of sub components", function () {
		let gics = new GICS("10101010");
		gics.sector.code.should.equal("10");
		gics.industryGroup.code.should.equal("1010");
		gics.industry.code.should.equal("101010");
		gics.subIndustry.code.should.equal("10101010");
	});

	it("translates name to level properly", function () {
		let gics = new GICS("10101010");
		gics.sector.should.equal(gics.level(1));
		gics.industryGroup.should.equal(gics.level(2));
		gics.industry.should.equal(gics.level(3));
		gics.subIndustry.should.equal(gics.level(4));
	});

	it("accepts null code GICS and marks it as invalid", function () {
		let gics = new GICS();
		gics.isValid.should.be.false;
	});

	it("Lists all sectors as children for an invalid GICS", function () {
		let gics = new GICS();
		gics.children.should.be.instanceOf(Array);
		gics.children.should.have.lengthOf(11);
		gics.children.forEach((c) => c.code.should.have.lengthOf(2));
	});

	it("Lists all industry groups as children for a sector level GICS", function () {
		let gics = new GICS("10");
		gics.children.should.be.instanceOf(Array);
		gics.children.should.have.lengthOf(1);
		gics.children.forEach((c) => c.code.should.have.lengthOf(4));
	});

	it("Lists all industries as children for an industry group level GICS", function () {
		let gics = new GICS("1010");
		gics.children.should.be.instanceOf(Array);
		gics.children.should.have.lengthOf(2);
		gics.children.forEach((c) => c.code.should.have.lengthOf(6));
	});

	it("Lists all sub-industries as children for an industry level GICS", function () {
		let gics = new GICS("101010");
		gics.children.should.be.instanceOf(Array);
		gics.children.should.have.lengthOf(2);
		gics.children.forEach((c) => c.code.should.have.lengthOf(8));
	});

	it("Sub-industry level GICS returns empty array for children", function () {
		let gics = new GICS("10101010");
		gics.children.should.be.instanceOf(Array);
		gics.children.should.have.lengthOf(0);
	});

	it("resolves if it's the same with another GICS", function () {
		let gics1 = new GICS("1010");
		let gics2 = new GICS("1010");
		gics1.isSame(gics2).should.be.true;
		gics2.isSame(gics1).should.be.true;
	});

	it("resolves if it's not the same with another GICS", function () {
		let gics1 = new GICS("1010");
		let gics2 = new GICS("101010");
		gics1.isSame(gics2).should.be.false;
		gics2.isSame(gics1).should.be.false;
	});

	it("resolves if it's the same correctly with invalid GICS", function () {
		new GICS("invalid").isSame(new GICS("10")).should.be.false;
		new GICS("10").isSame(new GICS("invalid")).should.be.false;
		new GICS("invalid").isSame(new GICS("invalid")).should.be.true;
	});

	it("resolves if a GICS contains another GICS", function () {
		new GICS("10").contains(new GICS("10101010")).should.be.true;
		new GICS("10").contains(new GICS("101010")).should.be.true;
		new GICS("10").contains(new GICS("1010")).should.be.true;
		new GICS("10").contains(new GICS("10")).should.be.false;
		new GICS("1010").contains(new GICS("10")).should.be.false;
		new GICS("invalid").contains(new GICS("10")).should.be.false;
		new GICS("10").contains(new GICS("invalid")).should.be.false;
		new GICS("invalid").contains(new GICS("invalid")).should.be.false;
	});

	it("resolves if a GICS is immediately contained in another one", function () {
		new GICS("10").containsImmediate(new GICS("10101010")).should.be.false;
		new GICS("10").containsImmediate(new GICS("101010")).should.be.false;
		new GICS("10").containsImmediate(new GICS("1010")).should.be.true;
		new GICS("10").containsImmediate(new GICS("10")).should.be.false;
		new GICS("1010").containsImmediate(new GICS("10")).should.be.false;
		new GICS("invalid").containsImmediate(new GICS("10")).should.be.false;
		new GICS("10").containsImmediate(new GICS("invalid")).should.be.false;
		new GICS("invalid").containsImmediate(new GICS("invalid")).should.be.false;
	});

	it("resolves if a GICS is within another GICS", function () {
		new GICS("10101010").isWithin(new GICS("10")).should.be.true;
		new GICS("101010").isWithin(new GICS("10")).should.be.true;
		new GICS("101010").isWithin(new GICS("1010")).should.be.true;
		new GICS("1010").isWithin(new GICS("10")).should.be.true;
		new GICS("10").isWithin(new GICS("10")).should.be.false;
		new GICS("1010").isWithin(new GICS("1010")).should.be.false;
		new GICS("invalid").isWithin(new GICS("10")).should.be.false;
		new GICS("10").isWithin(new GICS("invalid")).should.be.false;
		new GICS("invalid").isWithin(new GICS("invalid")).should.be.false;
	});

	it("resolves if a GICS is immediate within another GICS", function () {
		new GICS("10101010").isImmediateWithin(new GICS("10")).should.be.false;
		new GICS("101010").isImmediateWithin(new GICS("10")).should.be.false;
		new GICS("101010").isImmediateWithin(new GICS("1010")).should.be.true;
		new GICS("1010").isImmediateWithin(new GICS("10")).should.be.true;
		new GICS("10").isImmediateWithin(new GICS("10")).should.be.false;
		new GICS("1010").isImmediateWithin(new GICS("1010")).should.be.false;
		new GICS("invalid").isImmediateWithin(new GICS("10")).should.be.false;
		new GICS("10").isImmediateWithin(new GICS("invalid")).should.be.false;
		new GICS("invalid").isImmediateWithin(new GICS("invalid")).should.be.false;
	});

	it("defaults to latest definition", function () {
		let gicsDeprecated = new GICS("45101010");
		let gicsNew = new GICS("50203010");
		gicsDeprecated.isValid.should.be.false;
		gicsNew.isValid.should.be.true;
		gicsNew.subIndustry.name.should.equal("Interactive Media & Services");
	});

	it("finds Health Care sector code", function () {
		const parent = new GICS();

		const industryGICS = parent.findChild("Health Care");
		industryGICS.code.should.equal("35");
	});

	it("finds Pharmaceuticals industry code", function () {
		const parent = new GICS();

		const sectorGICS = parent.findChild("Pharmaceuticals");
		sectorGICS.code.should.equal("352020");
	});

	it("finds Industry only among Sector children", function () {
		const healthCareSector = new GICS("35");
		const pharmaIndustry = healthCareSector.findChild("Pharmaceuticals");
		pharmaIndustry.code.should.equal("352020");

		const energySector = new GICS("10");
		const notFound = energySector.findChild("Pharmaceuticals");
		expect(notFound).to.be.null;
	});

	it("if not found then it returns null", function () {
		const parent = new GICS();
		const notFound = parent.findChild("Non-Existent");
		expect(notFound).to.be.null;
	});

	it("if not found but it is a valid partial code and exactMatch is false, returns the closest code ", function () {
		const gics = new GICS("10102530", null, { exactMatch: false });
		gics.sector.name.should.equal("Energy");
		gics.industryGroup.name.should.equal("Energy");
		expect(gics.subIndustry).to.be.null;
	});

	it("if code not found but fallbackLookup is true, searches in all previous definitions to search for a match ", function () {
		const gics = new GICS("45204010", null, { fallbackLookup: true });
		gics.subIndustry.name.should.equal(
			"Office Electronics - Discontinued effective 02/28/2014"
		);
	});

	it("if fallbackLookup is on and exactMatch is off, fallbackLookup should take priority ", function () {
		const gics = new GICS("45204010", null, {
			fallbackLookup: true,
			exactMatch: false,
		});
		gics.subIndustry.name.should.equal(
			"Office Electronics - Discontinued effective 02/28/2014"
		);
	});

	it("if fallbackLookup is on and asOf is on, asOf should take priority ", function () {
		const gics = new GICS("45204010", null, {
			fallbackLookup: true,
			exactMatch: false,
			asOf: new Date (2020,11,10)
		});
		expect(gics.sector).to.be.null;

	});
});
