"use strict";

const definitions = {
	"20140228": require("../definitions/20140228"),
	"20160901": require("../definitions/20160901"),
	"20180929": require("../definitions/20180929"),
	"20230318": require("../definitions/20230318"),
	"default": require("../definitions/20230318"),
};

const versions = Object.keys(definitions).filter((key) => key !== "default");
class GICS {
	/**
	 * Represents a GICS code. You can instantiate GICS codes using a string representing a code.
	 * The string has to be a valid GICS. If it's not, that isValid method will return false.
	 * Note that creating an empty GICS will mark it as invalid but can still be used to query the definitions (although that object itself will not be a definition)
	 *
	 * @class      GICS GICS
	 * @param      {string}  code     GICS code to parse. Valid GICS codes are strings 2 to 8 characters long, with even length.
	 * @param      {string}  version  Version of GICS definition to use. By default the latest definition is used.
	 * 																Versions are named after the date in which they became effective, following the format YYYYMMDD.
	 * 																Current available versions are: 20140228 , 20160901 , 20180929 and 20230318 (default). If no specific version
	 * 																is provided, will default to latest version.
	 *  @param      {object}  options     options for GICS including 
	 * 																fallbackLookup (boolean): defaulted as false, when true if no GICS code is found in selected version, looks back into previous versions until the first one
	 * 																exactMatch (boolean): defaulted as true, when if no GICS code is found, returns the longest part of the code available in current version
	 * 																asOf (Date) :  default is current date, will use the GICS version as of given date. Takes precedence over fallbackLookup
	 */
	constructor(
		code,
		version,
		options = { fallbackLookup: false, exactMatch: true, asOf: new Date() }
	) {
		this.asOf = options.asOf || new Date();
		let defName = version || "default";
		// selects the closest version (in time) to asOf date
		defName = getVersionAsOf(this.asOf, versions, version);

		this.fallbackLookup = options.fallbackLookup || false;
		// forces exactMatch to be true if fallbackLookup is on since if not it will return a partial code
		this.exactMatch = this.fallbackLookup ? true : options.exactMatch;
		this._definitionVersion = defName;

		if (!this._definition) {
			throw new Error(
				`Unsupported GICS version: ${version}. Available versions are ${Object.keys(
					definitions
				)}`
			);
		}

		this._code = code;
		// Check if code is valid depending if exactMatch is true or not
		this.isValid = this._validateCode();
		if (this.isValid) {
			this._levels = [
				this._getDefinition(code.slice(0, 2)),
				code.length >= 4 ? this._getDefinition(code.slice(0, 4)) : null,
				code.length >= 6 ? this._getDefinition(code.slice(0, 6)) : null,
				code.length === 8 ? this._getDefinition(code.slice(0, 8)) : null,
			];
		} else if (
			this.fallbackLookup &&
			new Date().valueOf() === this.asOf.valueOf()
		) {
			// Loops in all definitions to see if it can find one that the code is present
			this._fallbackLookup();
		} else {
			this._code = null;
		}
	}

	_getDefinition(gicsCode) {
		let def;
		def = this._definition[gicsCode];
		if (!def) return null;
		def.code = gicsCode;
		return def;
	}

	_fallbackLookup() {
		// goes from newer to older
		versions.reverse().forEach((version) => {
			this._definitionVersion = version;
			this.isValid = this._validateCode();
			if (this.isValid) {
				this._levels = [
					this._getDefinition(this._code.slice(0, 2)),
					this._code.length >= 4
						? this._getDefinition(this._code.slice(0, 4))
						: null,
					this._code.length >= 6
						? this._getDefinition(this._code.slice(0, 6))
						: null,
					this._code.length === 8
						? this._getDefinition(this._code.slice(0, 8))
						: null,
				];
				this.isValid = true;
				return;
			}
		});
		if (!this.isValid) this._code = null;
	}

	get _definition() {
		return definitions[this._definitionVersion];
	}

	_findBestMatch(code) {
		return (
			this._definition[code] ||
			this._definition[code.slice(0, 6)] ||
			this._definition[code.slice(0, 4)] ||
			this._definition[code.slice(0, 2)] ||
			false
		);
	}

	_validateCode() {
		const code = this._code;
		const exactMatch = this.exactMatch;
		const codeValidation =
			code &&
			code.length >= 2 &&
			code.length <= 8 &&
			typeof code === "string" &&
			code.length % 2 === 0;

		if (exactMatch) {
			return codeValidation && this._definition[code] ? true : false;
		} else {
			return codeValidation && this._findBestMatch(code) ? true : false;
		}
	}

	/**
	 * Gets the definition of the given level for this GICS object.
	 *
	 * @param      {number}  gicsLevel  Level of GICS to get. Valid levels are: 1 (Sector), 2 (Industry Group), 3 (Industry), 4 (Sub-Industry)
	 */
	level(gicsLevel) {
		if (
			!this.isValid ||
			!gicsLevel ||
			typeof gicsLevel !== "number" ||
			gicsLevel < 1 ||
			gicsLevel > 4
		) {
			return null;
		}
		return this._levels[gicsLevel - 1];
	}

	/**
	 * Gets the definition for the sector of this GICS object (GICS level 1)
	 *
	 * @return     {object}  Definition of the GICS level. It has 3 properties: name, description and code. Keep in mind that only level 4 usually has a description.
	 */
	get sector() {
		return this.level(1);
	}

	/**
	 * Gets the definition for the industry group of this GICS object (GICS level 2)
	 *
	 * @return     {object}  Definition of the GICS level. It has 3 properties: name, description and code. Keep in mind that only level 4 usually has a description.
	 */
	get industryGroup() {
		return this.level(2);
	}

	/**
	 * Gets the definition for the industry of this GICS object (GICS level 3)
	 *
	 * @return     {object}  Definition of the GICS level. It has 3 properties: name, description and code. Keep in mind that only level 4 usually has a description.
	 */
	get industry() {
		return this.level(3);
	}

	/**
	 * Gets the definition for the sub-industry of this GICS object (GICS level 4)
	 *
	 * @return     {object}  Definition of the GICS level. It has 3 properties: name, description and code. Keep in mind that only level 4 usually has a description.
	 */
	get subIndustry() {
		return this.level(4);
	}

	/**
	 * Gets all the child level elements from this GICS level.
	 * For example, for a Sector level GICS, it will return all Industry Groups in that Sector.
	 * If the GICS is invalid (or empty, as with a null code), it will return all Sectors.
	 * A Sub-industry level GICS will return an empty array.
	 *
	 * @return     {array} Array containing objects with properties code (the GICS code), name (the name of this GICS), and description (where applicable)
	 */
	get children() {
		return this.getChildren(1);
	}

	/**
	 * Gets all the child level elements from this GICS level at a depth distance of `depth`
	 * For example, for a Sector level GICS, it will return all Industry Groups in that Sector if `depth = 1` and
	 * all SubIndustry Groups in that Sector if `depth = 2`.
	 * If the GICS is invalid (or empty, as with a null code), it will return all Sectors.
	 *
	 * @return     {array} Array containing objects with properties code (the GICS code), name (the name of this GICS), and description (where applicable)
	 */
	getChildren(depth = 1) {
		const keys = this.isValid
			? Object.keys(this._definition).filter(
				(k) =>
					k.startsWith(this._code) && level(this._code) + depth === level(k))
			: Object.keys(this._definition).filter((k) => level(k) === depth);
		return keys.map((k) => ({
			code: k,
			name: this._definition[k].name,
			description: this._definition[k].description,
		}));
	}

	/**
	 * Determines if this GICS is the same as the given one.
	 * To be considered the same both GICS must either be invalid, or be valid and with the exact same code. This means that they represent the same values
	 * at the same level.
	 *
	 * @param      {object}  anotherGics  GICS object to compare with
	 */
	isSame(anotherGics) {
		return (
			anotherGics &&
			this.isValid === anotherGics.isValid &&
			(this.isValid === false || this._code === anotherGics._code)
		);
	}

	/**
	 * Determines if this GICS is a sub-component of the given GICS. For example, GICS 101010 is within GICS 10.
	 * Invalid GICS do not contain any children or belong to any parent, so if any of the GICS are invalid, this will always be false.
	 * Two GICS that are the same are not considered to be within one another (10 does not contain 10).
	 *
	 * @param      {GICS}  anotherGics  GICS object to compare with
	 */
	isWithin(anotherGics) {
		return (
			this.isValid &&
			anotherGics.isValid &&
			this._code !== anotherGics._code &&
			this._code.startsWith(anotherGics._code)
		);
	}

	/**
	 * Determines if this GICS is a sub-component of the given GICS at the most immediate level. For example, GICS 1010 is immediate within GICS 10, but 101010 is not.
	 * Invalid GICS do not contain any children or belong to any parent, so if any of the GICS are invalid, this will always be false.
	 * Two GICS that are the same are not considered to be within one another (10 does not contain 10).
	 *
	 * @param      {GICS}  anotherGics  GICS object to compare with
	 */
	isImmediateWithin(anotherGics) {
		return (
			this.isValid &&
			anotherGics.isValid &&
			this._code !== anotherGics._code &&
			this._code.startsWith(anotherGics._code) &&
			this._code.length === anotherGics._code.length + 2
		);
	}

	/**
	 * Determines if this GICS contains the given GICS. For example, GICS 10 contains GICS 101010.
	 * Invalid GICS do not contain any children or belong to any parent, so if any of the GICS are invalid, this will always be false.
	 * Two GICS that are the same are not considered to be within one another (10 does not contain 10).
	 *
	 * @param      {GICS}  anotherGics  GICS object to compare with
	 */
	contains(anotherGics) {
		return anotherGics.isWithin(this);
	}

	/**
	 * Determines if this GICS contains the given GICS at the most immediate level. For example, GICS 10 contains immediate GICS 1010, but not 101010.
	 * Invalid GICS do not contain any children or belong to any parent, so if any of the GICS are invalid, this will always be false.
	 * Two GICS that are the same are not considered to be within one another (10 does not contain 10).
	 *
	 * @param      {GICS}  anotherGics  GICS object to compare with
	 */
	containsImmediate(anotherGics) {
		return anotherGics.isImmediateWithin(this);
	}

	/**
	 * Gets the gics definition for the sublevel of this GICS object matching the provided name. Lookup is done wide-first
	 *
	 * @param {string}  childName  Name of the child GICS level to find.
	 */
	findChild(childName) {
		const findDeep = (depth) => {
			const children = this.getChildren(depth);
			if (children.length === 0) return null;

			const child = children.find((child) => child.name === childName);
			return child || findDeep(depth + 1);
		};

		return findDeep(1);
	}
}

function level(gicsCode) {
	return gicsCode ? Math.floor(gicsCode.length / 2) : 0;
}

const getVersionAsOf = (date, versions, version) => {
	if (versions.includes(version)) {
		return version;
	}
	let currentVersion = versions[0];

	for (const version of versions) {
		const versionValue = versionToDate(version).valueOf();
		if (versionValue >= date.valueOf()) break;
		currentVersion = version;
	}
	return currentVersion;
};

const versionToDate = (version) => {
	if (version === "default") {
		version = "20230318";
	}
	const year = Number(version.slice(0, 4));
	const month = Number(version.slice(4, 6)) - 1; // month starts with 0
	const day = Number(version.slice(6, 8));
	return new Date(year, month, day);
};

module.exports = GICS;
