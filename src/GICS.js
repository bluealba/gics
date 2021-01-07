"use strict";

const definitions = {
	"20140228": require("../definitions/20140228"),
	"20160901": require("../definitions/20160901"),
	"20180929": require("../definitions/20180929"),
	"default": require("../definitions/20180929")
}

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
	 * 																Current available versions are: 20140228 and 20160901 and 20180929 (default).
	 * @throws     {Error} 						Throws error if the version is invalid/unsupported.
	 */
	constructor(code, version) {
		let defName = version || "default";
		this._definitionVersion = defName;
		if (!this._definition) {
			throw new Error(`Unsupported GICS version: ${version}. Available versions are ${Object.keys(definitions)}`);
		}
		this._code = code;
		this.isValid = code && typeof(code) === "string" && code.length >= 2 && code.length <= 8 && code.length % 2 === 0 && this._definition[code] ? true : false;
		if (this.isValid) {
			this._levels = [
				this._getDefinition(code.slice(0, 2)),
				code.length >= 4 ? this._getDefinition(code.slice(0, 4)) : null,
				code.length >= 6 ? this._getDefinition(code.slice(0, 6)) : null,
				code.length === 8 ? this._getDefinition(code.slice(0, 8)) : null
			];
		} else {
			this._code = null;
		}
	}

	_getDefinition(gicsCode) {
		let def = this._definition[gicsCode];
		def.code = gicsCode;
		return def;
	}

	get _definition() {
		return definitions[this._definitionVersion];
	}

	/**
	 * Gets the definition of the given level for this GICS object.
	 *
	 * @param      {number}  gicsLevel  Level of GICS to get. Valid levels are: 1 (Sector), 2 (Industry Group), 3 (Industry), 4 (Sub-Industry)
	 */
	level(gicsLevel) {
		if (!this.isValid || !gicsLevel || typeof(gicsLevel) !== "number" || gicsLevel < 1 || gicsLevel > 4) {
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
		let keys = this.isValid ? Object.keys(this._definition).filter(k => k.startsWith(this._code) && k.length === this._code.length + 2) : Object.keys(this._definition).filter(k => k.length === 2);
		return keys.map(k => ({
			code: k,
			name: this._definition[k].name,
			description: this._definition[k].description
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
		return anotherGics && (this.isValid === anotherGics.isValid) && (this.isValid === false || this._code === anotherGics._code);
	}

	/**
	 * Determines if this GICS is a sub-component of the given GICS. For example, GICS 101010 is within GICS 10.
	 * Invalid GICS do not contain any children or belong to any parent, so if any of the GICS are invalid, this will always be false.
	 * Two GICS that are the same are not considered to be within one another (10 does not contain 10).
	 *
	 * @param      {GICS}  anotherGics  GICS object to compare with
	 */
	isWithin(anotherGics) {
		return this.isValid && anotherGics.isValid && this._code !== anotherGics._code && this._code.startsWith(anotherGics._code);

	}

	/**
	 * Determines if this GICS is a sub-component of the given GICS at the most immediate level. For example, GICS 1010 is immediate within GICS 10, but 101010 is not.
	 * Invalid GICS do not contain any children or belong to any parent, so if any of the GICS are invalid, this will always be false.
	 * Two GICS that are the same are not considered to be within one another (10 does not contain 10).
	 *
	 * @param      {GICS}  anotherGics  GICS object to compare with
	 */
	isImmediateWithin(anotherGics) {
		return this.isValid && anotherGics.isValid && this._code !== anotherGics._code && this._code.startsWith(anotherGics._code) && this._code.length === anotherGics._code.length + 2;
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
	 * Get the code value of the given GICS name searching in every level of the GICS array
	 *
	 * @param      {string}  levelName  Name of GICS to get it's code.
	 */
	findChildren(levelName) {
		const gicsArray = this.children;

		const find = (gicsArray, levelName) =>
			gicsArray.reduce((acc, item) => {
				if (acc) return acc;
				if (item.name == levelName) return item.code;
				const newGicsArray = new GICS(item.code).children;
				if (newGicsArray && newGicsArray.length)
					return find(newGicsArray, levelName);
			}, null);

		return find(gicsArray, levelName);
	}
}

module.exports = GICS;

