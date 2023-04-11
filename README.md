# GICS

[![Build Status](https://travis-ci.org/bluealba/gics.svg?branch=master)](https://travis-ci.org/bluealba/gics)
[![npm](https://img.shields.io/npm/v/gics.svg)](https://npmjs.org/package/gics)
[![npm](https://img.shields.io/npm/dt/gics.svg)](https://npmjs.org/package/gics)
[![Coverage Status](https://coveralls.io/repos/github/bluealba/gics/badge.svg?branch=master)](https://coveralls.io/github/bluealba/gics?branch=master)

This library provides a way to parse, manipulate and analyze [GICS](https://en.wikipedia.org/wiki/Global_Industry_Classification_Standard) codes.
GICS (Global Industry Classification Standard) is a classification system by [MSCI](https://www.msci.com/gics)

## Installation
```
npm install gics --save
```
## Usage
In practice, GICS codes are represented by strings (just as dates can be). This library provides a wrapper for the string that allows the user to manipulate and display the represented GICS code in different ways.
To wrap a string representing a GICS code, just build a new instance of GICS passing the string as the first argument.

## Example
```javascript
const GICS = require("gics");

let validSectorLevelGICS = new GICS("10");
console.log(validSectorLevelGICS.sector.name) // "Energy"

let validFullGICS = new GICS("10101010");
console.log(validFullGICS.sector.name) // "Energy"
console.log(validFullGICS.subIndustry.name) // "Oil & Gas Drilling"
console.log(validFullGICS.level(4).name) // "Oil & Gas Drilling"
console.log(validFullGICS.level(3).name) // "Energy Equipment & Services"
console.log(validFullGICS.sector.code) // "10"
```

## GICS API
This section describes every method and property in the GICS object
### Constructor
#### Description
Represents a GICS code. You can instantiate GICS codes using a string representing a code.
The string has to be a valid GICS. If it's not, that isValid method will return false.
Note that creating an empty GICS will mark it as invalid but can still be used to query the definitions (although that object itself will not be a definition)
```
@class      GICS GICS
@param      {string}  code     GICS code to parse. Valid GICS codes are strings 2 to 8 characters long, with even length.
@param      {string}  version  Version of GICS definition to use. By default the latest definition is used. Versions are named after the date in which they became effective, following the format YYYYMMDD. Current available versions are: 20140228 and 20160901 and 20180929 (default).
@throws     {Error}            Throws error if the version is invalid/unsupported.
```
#### Example
```javascript
const GICS = require("gics");

let gics = new GICS("4040"); // Default GICS definition version (20160901)
let gicsOld = new GICS("4040", "20140228"); // GICS using a previous definition 
```
### sector
#### Description
Gets the definition for the sector of this GICS object (GICS level 1)
```
@return     {object}  Definition of the GICS level. It has 3 properties: name, description and code. Keep in mind that only level 4 usually has a description.
```
#### Example
```javascript
const GICS = require("gics");

let gics = new GICS("1010");
console.log(gics.sector.name); // "Energy"
console.log(gics.sector.code); // "10"
```
### industryGroup
#### Description
Gets the definition for the industry group of this GICS object (GICS level 1)
```
@return     {object}  Definition of the GICS level. It has 3 properties: name, description and code. Keep in mind that only level 4 usually has a description.
```
#### Example
```javascript
const GICS = require("gics");

let gics = new GICS("453010");
console.log(gics.industryGroup.name); // "Semiconductors & Semiconductor Equipment"
console.log(gics.industryGroup.code); // "4530"
// If asked for a component that's not defined by this level, it returns null
console.log(gics.subIndustry); // null
```
### industry
#### Description
Gets the definition for the industry of this GICS object (GICS level 1)
```
@return     {object}  Definition of the GICS level. It has 3 properties: name, description and code. Keep in mind that only level 4 usually has a description.
```
#### Example
```javascript
const GICS = require("gics");

let gics = new GICS("453010");
console.log(gics.industry.name); // "Semiconductors & Semiconductor Equipment"
console.log(gics.industry.code); // "453010"
```
### subIndustry
#### Description
Gets the definition for the sub-industry of this GICS object (GICS level 1)
```
@return     {object}  Definition of the GICS level. It has 3 properties: name, description and code. Keep in mind that only level 4 usually has a description.
```
#### Example
```javascript
const GICS = require("gics");

let gics = new GICS("45301010");
console.log(gics.subIndustry.name); // "Semiconductor Equipment"
console.log(gics.subIndustry.code); // "45301010"
console.log(gics.subIndustry.description); // "Manufacturers of semiconductor equipment, including manufacturers of the raw material and equipment used in the solar power industry"
```
### level(gicsLevel)
#### Description
Gets the definition of the given level for this GICS object.
```
@param      {number}  gicsLevel  Level of GICS to get. Valid levels are: 1 (Sector), 2 (Industry Group), 3 (Industry), 4 (Sub-Industry)
```
#### Example
```javascript
const GICS = require("gics");

let gics = new GICS("45301010");
console.log(gics.level(1) == gics.sector); // true
console.log(gics.level(2) == gics.industryGroup); // true
console.log(gics.level(3) == gics.industry); // true
console.log(gics.level(4) == gics.subIndustry); // true
```
### children
#### Description
Gets all the child level elements from this GICS level.
For example, for a Sector level GICS, it will return all Industry Groups in that Sector.
If the GICS is invalid (or empty, as with a null code), it will return all Sectors.
A Sub-industry level GICS will return an empty array.
```
@return     {array} Array containing objects with properties code (the GICS code), name (the name of this GICS), and description (where applicable)
```
#### Example
```javascript
const GICS = require("gics");

let gics = new GICS("10");
console.log(gics.children.length); // 10
console.log(gics.children[1].code); // "1010"
```
### isSame(anotherGics)
#### Description
Determines if this GICS is the same as the given one.
To be considered the same both GICS must either be invalid, or be valid and with the exact same code. This means that they represent the same values
at the same level.
```
@param      {object}  anotherGics  GICS object to compare with
```
#### Example
```javascript
const GICS = require("gics");

let gics1 = new GICS("1010");
let gics2 = new GICS("1010");
gics1.isSame(gics2); // true
gics2.isSame(gics1); // true
```
### isWithin(anotherGics)
#### Description
Determines if this GICS is a sub-component of the given GICS. For example, GICS 101010 is within GICS 10.
Invalid GICS do not contain any children or belong to any parent, so if any of the GICS are invalid, this will always be false.
Two GICS that are the same are not considered to be within one another (10 does not contain 10).
```
@param      {GICS}  anotherGics  GICS object to compare with
```
#### Example
```javascript
const GICS = require("gics");

new GICS("10101010").isWithin(new GICS("10")); // true
new GICS("101010").isWithin(new GICS("10")); // true
new GICS("101010").isWithin(new GICS("1010")); // true
new GICS("1010").isWithin(new GICS("10")); // true
new GICS("10").isWithin(new GICS("10")); // false
new GICS("1010").isWithin(new GICS("1010")); // false
new GICS("invalid").isWithin(new GICS("10")); // false
new GICS("10").isWithin(new GICS("invalid")); // false
new GICS("invalid").isWithin(new GICS("invalid")); // false
```
### isImmediateWithin(anotherGics)
#### Description
Determines if this GICS is a sub-component of the given GICS at the most immediate level. For example, GICS 1010 is immediate within GICS 10, but 101010 is not.
Invalid GICS do not contain any children or belong to any parent, so if any of the GICS are invalid, this will always be false.
Two GICS that are the same are not considered to be within one another (10 does not contain 10).
```
@param      {GICS}  anotherGics  GICS object to compare with
```
#### Example
```javascript
const GICS = require("gics");

new GICS("10101010").isImmediateWithin(new GICS("10")); // false
new GICS("101010").isImmediateWithin(new GICS("10")); // false
new GICS("101010").isImmediateWithin(new GICS("1010")); // true
new GICS("1010").isImmediateWithin(new GICS("10")); // true
new GICS("10").isImmediateWithin(new GICS("10")); // false
new GICS("1010").isImmediateWithin(new GICS("1010")); // false
new GICS("invalid").isImmediateWithin(new GICS("10")); // false
new GICS("10").isImmediateWithin(new GICS("invalid")); // false
new GICS("invalid").isImmediateWithin(new GICS("invalid")); // false
```
### contains(anotherGics)
#### Description
Determines if this GICS contains the given GICS. For example, GICS 10 contains GICS 101010.
Invalid GICS do not contain any children or belong to any parent, so if any of the GICS are invalid, this will always be false.
Two GICS that are the same are not considered to be within one another (10 does not contain 10).
```
@param      {GICS}  anotherGics  GICS object to compare with
```
#### Example
```javascript
const GICS = require("gics");

new GICS("10").contains(new GICS("10101010")); // true
new GICS("10").contains(new GICS("101010")); // true
new GICS("10").contains(new GICS("1010")); // true
new GICS("10").contains(new GICS("10")); // false
new GICS("1010").contains(new GICS("10")); // false
new GICS("invalid").contains(new GICS("10")); // false
new GICS("10").contains(new GICS("invalid")); // false
new GICS("invalid").contains(new GICS("invalid")); // false;
```
### containsImmediate(anotherGics)
#### Description
Determines if this GICS contains the given GICS at the most immediate level. For example, GICS 10 contains immediate GICS 1010, but not 101010.
Invalid GICS do not contain any children or belong to any parent, so if any of the GICS are invalid, this will always be false.
Two GICS that are the same are not considered to be within one another (10 does not contain 10).
```
@param      {GICS}  anotherGics  GICS object to compare with
```
#### Example
```javascript
const GICS = require("gics");

new GICS("10").containsImmediate(new GICS("10101010")); // false
new GICS("10").containsImmediate(new GICS("101010")); // false
new GICS("10").containsImmediate(new GICS("1010")); // true
new GICS("10").containsImmediate(new GICS("10")); // false
new GICS("1010").containsImmediate(new GICS("10")); // false
new GICS("invalid").containsImmediate(new GICS("10")); // false
new GICS("10").containsImmediate(new GICS("invalid")); // false
new GICS("invalid").containsImmediate(new GICS("invalid")); // false
```

### findChild(childName)
#### Description
Gets the gics definition for the sublevel of this GICS object matching the provided name. Lookup is done wide-first
```
@param {string}  childName  Name of the child GICS level to find.
```






