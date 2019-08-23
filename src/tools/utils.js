(function () {
'use strict';

we3.utils = {
    /**
     * Char codes.
     */
    keyboardMap: {
        "8": "BACKSPACE",
        "9": "TAB",
        "13": "ENTER",
        "16": "SHIFT",
        "17": "CONTROL",
        "18": "ALT",
        "19": "PAUSE",
        "20": "CAPS_LOCK",
        "27": "ESCAPE",
        "32": "SPACE",
        "33": "PAGE_UP",
        "34": "PAGE_DOWN",
        "35": "END",
        "36": "HOME",
        "37": "LEFT",
        "38": "UP",
        "39": "RIGHT",
        "40": "DOWN",
        "45": "INSERT",
        "46": "DELETE",
        "91": "OS_KEY", // 'left command': Windows Key (Windows) or Command Key (Mac)
        "93": "CONTEXT_MENU", // 'right command'
    },
    /**
     * This dictionary contains oft-used regular expressions,
     * for performance and readability purposes. It can be
     * accessed and extended by the getRegex() method.
     *
     * @property {Object} {
     *      expressionName: {
     *          flagName|'noflag': expression (RegEx),
     *      }
     * }
     */
    regex: {
        char: {
            noflag: /\S|\u00A0|\uFEFF/,
        },
        emptyElemWithBR: {
            noflag: /^\s*<br\/?>\s*$/,
        },
        endInvisible: {
            noflag: /\uFEFF$/,
        },
        endNotChar: {
            noflag: /[^\S\u00A0\uFEFF]+$/,
        },
        endSingleSpace: {
            noflag: /[\S\u00A0\uFEFF]\s$/,
        },
        endSpace: {
            noflag: /\s+$/,
        },
        invisible: {
            noflag: /\uFEFF/,
        },
        notWhitespace: {
            noflag: /\S/,
        },
        onlyEmptySpace: {
            noflag: /^[\s\u00A0\uFEFF]*(<br>)?[\s\u00A0\uFEFF]*$/,
        },
        semicolon: {
            noflag: / ?; ?/,
        },
        space: {
            noflag: /\s+/,
            g: /\s+/g,
        },
        spaceOrNewline: {
            noflag: /[\s\n\r]+/,
            g: /[\s\n\r]+/g,
        },
        startAndEndInvisible: {
            noflag: /^\uFEFF|\uFEFF$/,
            g: /^\uFEFF|\uFEFF$/g,
        },
        startAndEndSpace: {
            noflag: /^\s+|\s+$/,
            g: /^\s+|\s+$/g,
        },
        startAndEndSemicolon: {
            noflag: /^ ?;? ?| ?;? ?$/,
        },
        startInvisible: {
            noflag: /^\uFEFF/,
        },
        startNotChar: {
            noflag: /^[^\S\u00A0\uFEFF]+/,
        },
        startSingleSpace: {
            noflag: /^\s[\S\u00A0\uFEFF]/,
        },
        startSpace: {
            noflag: /^\s+/,
        },
    },

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return a function that returns true if both functions
     * passed as parameters return true.
     *
     * @param {Function (any) => Boolean} fn1
     * @param {Function (any) => Bolean} fn2
     * @returns {Function (any) => Boolean}
     */
    and: function (fn1, fn2) {
        return function (arg) {
            return fn1(arg) && fn2(arg);
        };
    },
    /**
     * Get a unicode or HTML escaped String for a special character.
     *
     * Possible values for `name`:
     * - 'nbsp'         non-breakable space
     * - 'zeroWidth'    zero-width character
     *
     * @param {Object} name
     * @param {Boolean} isEscaped
     * @returns {String}
     */
    char: function (name, isEscaped) {
        var esc = {
            nbsp: '&nbsp;',
            zeroWidth: '&#65279;',
        };
        var unicode = {
            nbsp: '\u00A0',
            zeroWidth: '\uFEFF',
        };
        return isEscaped ? esc[name] : unicode[name];
    },
    /**
     * Clone an object and all its properties and return the frozen object.
     *
     * @private
     * @param {Object} object
     * @returns {Object}
     */
    deepClone: function (object) {
        var self = this;
        if (object && typeof object === 'object' && !('ignoreCase' in object && object.test) && (typeof object.style !== "object" || typeof object.ownerDocument !== "object")) {
            return object;
        }
        if (object.length && object.forEach) {
            return object.slice().map(this._deepClone.bind(this));
        } else {
            var obj = {};
            Object.getOwnPropertyNames(object).forEach(function (name) {
                obj[name] = self.deepClone(object[name]);
            });
            return obj;
        }
    },
    /**
     * Return true if two objects are deep equal.
     * Do not traverse ArchNodes: compare stringified JSON representations.
     *
     * @private
     * @param {object} obj1
     * @param {object} obj2
     * @returns {boolean}
     */
    deepCompare: function (obj1, obj2) {
        var self = this;
        var isEqual = Object.keys(obj1).every(function (key) {
            if (obj1.hasOwnProperty(key) !== obj2.hasOwnProperty(key)) {
                return typeof obj1[key] === 'undefined';
            }
            if (obj1[key] instanceof we3.ArchNode) {
                var json1 = obj1[key].toJSON();
                var isObj2ArchNode = obj2[key] instanceof we3.ArchNode;
                var json2 = isObj2ArchNode && obj2[key].toJSON();
                return  isObj2ArchNode && JSON.stringify(json1) === JSON.stringify(json2);
            }
            switch (typeof obj1[key]) {
                case 'object':
                    if (obj1[key] === null) {
                        return obj2[key] === null;
                    }
                    return self.deepCompare(obj1[key], obj2[key]);
                case 'function':
                    return typeof obj2[key] !== 'undefined' && obj1[key].toString() === obj2[key].toString();
                default:
                    return obj1[key] === obj2[key];
            }
        });
        // Check `obj2` for extra properties
        return isEqual && Object.keys(obj2).every(key => typeof obj1[key] !== 'undefined' || typeof obj2[key] === 'undefined');
    },
    /**
     * Freeze an object and all its properties and return the frozen object.
     *
     * @private
     * @param {Object} object
     * @returns {Object}
     */
    deepFreeze: function (object) {
        var self = this;
        if (object && typeof object === 'object' && !('ignoreCase' in object && object.test) && (typeof object.style !== "object" || typeof object.ownerDocument !== "object")) {
            return object;
        }
        Object.getOwnPropertyNames(object).forEach(function (name) {
            self.deepFreeze(object[name]);
        });
        return Object.freeze(object);
    },
    /**
     * Fill in `object`'s `undefined` writable properties with the value of the
     * property with the same name in `defaults`, if any, then return `object`.
     *
     * @param {Object} object
     * @param {Object} defaults
     * @returns {Object}
     */
    defaults: function (object, defaults) {
        var propDesc;
        Object.keys(defaults).forEach(function (key) {
            propDesc = Object.getOwnPropertyDescriptor(object, key);
            if (object[key] == null && (!propDesc || propDesc.writable)) {
                object[key] = defaults[key];
            }
        });
        return object;
    },
    /**
     * Takes an object and converts it to an array of objects.
     * Eg: {firstKey: firstValue, secondKey: secondValue}
     * becomes [{key: firstKey, value: firstValue}, {key: secondKey, value: secondValue}].
     * It is possible to specify another default key name and value name.
     *
     * @param {Object} dict
     * @param {String} [keyName]
     * @param {String} [valueName]
     * @returns {Object []}
     */
    dictToArray: function (dict, keyName, valueName) {
        var array = [];
        Object.keys(dict).forEach(function (key) {
            var pair = {};
            pair[keyName || 'key'] = key;
            pair[valueName || 'value'] = dict[key];
            array.push(pair);
        });
        return array;
    },
    /**
     * Flattens a nested array (the nesting can be to any depth).
     *
     * @param {any []} array
     * @returns {any []}
     */
    flatten: function (array) {
        return array.reduce(function (a, b) {
            return a.concat(b);
        }, []);
    },
    /**
     * Map each element of an array using a mapping function, then flatten the
     * result into a new array.
     *
     * @param {any []} array
     * @param {function} fn
     * @returns {any []}
     */
    flatMap: function (array, fn) {
        return Array.prototype.concat.apply([], array.map(fn));
    },
    /**
     * Returns (and creates if necessary) a regular expression.
     * If a regular expression with the given name exists, simply returns it.
     * Otherwise, creates a new one with the given name, exp and flag.
     *
     * @param {String} name
     * @param {String} [flag] optional
     * @param {String} [exp] optional
     * @returns {RegExp}
     */
    getRegex: function (name, flag, exp) {
        var flagName = flag || 'noflag';
        flag = flag || '';
        // If the regular expression exists, but not with this flag:
        // retrieve whichever version of it and apply the new flag to it,
        // then save that new version in the `regex` object.
        if (this.regex[name] && !this.regex[name][flagName]) {
            if (exp) {
                console.warn("A regular expression already exists with the name: " + name + ". The expression passed will be ignored.");
            }
            var firstVal = this.regex[name][Object.keys(this.regex[name])[0]];
            this.regex[name][flagName] = new RegExp(firstVal, flag);
        } else if (!this.regex[name]) {
            // If the regular expression does not exist:
            // save it into the `regex` object, with the name, expression
            // and flag passed as arguments (if any).
            if (!exp) {
                throw new Error("Cannot find a regular expression with the name " + name + ". Pass an expression to create it.");
            }
            this.regex[name] = {};
            this.regex[name][flagName] = new RegExp(exp, flag);
        }
        return this.regex[name][flagName];
    },
    /**
     * Returns (and creates if necessary) a regular expression
     * targetting a string made ONLY of some combination of the
     * characters enabled with options.
     * If a regular expression with the given options exists, simply returns it.
     * eg: getRegexBlank({space: true, nbsp: true}) => /^[\s\u00A0]*$/
     *
     * @param {Object} [options] optional
     * @param {Boolean} options.not ^ (not all that follows)
     * @param {Boolean} options.space \s (a whitespace)
     * @param {Boolean} options.notspace \S (not a whitespace)
     * @param {Boolean} options.nbsp \u00A0 (a non-breakable space)
     * @param {Boolean} options.invisible \uFEFF (a zero-width character)
     * @param {Boolean} options.newline \n|\r (a new line or a carriage return)
     * @param {Boolean} options.atLeastOne + (do not target blank strings)
     * @returns {RegExp}
     */
    getRegexBlank: function (options) {
        options = options || {};
        var charMap = {
            notspace: {
                name: 'NotSpace',
                exp: '\\S',
            },
            space: {
                name: 'Space',
                exp: '\\s',
            },
            nbsp: {
                name: 'Nbsp',
                exp: '\\u00A0',
            },
            invisible: {
                name: 'Invisible',
                exp: '\\uFEFF',
            },
            newline: {
                name: 'Newline', 
                exp: '\\n\\r',
            },
        };
        var name = 'only';
        var exp = '';
        var atLeastOne = options.atLeastOne;
        options.atLeastOne = false;

        // Build the expression and its name
        if (options.not) {
            name += 'Not';
            exp += '^';
            options.not = false;
        }
        Object.keys(options).forEach(function (key) {
            var value = options[key];
            if (value && charMap[key]) {
                name += charMap[key].name;
                exp += charMap[key].exp;
            }
        });

        exp = '^[' + exp + ']' + (atLeastOne ? '+' : '*') + '$';
        name += atLeastOne ? 'One' : '';
        return this.getRegex(name, undefined, exp);
    },
    /**
     * Return a function that returns the opposite of the function in argument.
     *
     * @param {Function (any) => Boolean} fn
     */
    not: function (fn) {
        return function (arg) {
            return !fn(arg);
        };
    },
    /**
     * Return a function that returns true if either function
     * passed as parameters return true.
     *
     * @param {Function (any) => Boolean} fn1
     * @param {Function (any) => Bolean} fn2
     * @returns {Function (any) => Boolean}
     */
    or: function (fn1, fn2) {
        return function (arg) {
            return fn1(arg) || fn2(arg);
        };
    },
    /**
     * Produces a duplicate-free version of the array, using `===` to test object equality.
     * In particular only the first occurrence of each value is kept.
     *
     * @param {any []} array
     * @param {object} [options]
     * @param {boolean} [options.deepCompare] true to check objects for deep equality
     * @returns {any []}
     */
    uniq: function (array, options) {
        var self = this;
        options = options || {};
        return array.filter(function (value, index) {
            var indexOfValue;
            if (typeof value !== 'object' || !options.deepCompare) {
                indexOfValue = array.indexOf(value)
            } else {
                indexOfValue = array.map(function (val, i) {
                    return self.deepCompare(value, val) && i;
                }).filter(val => val || val === 0);
                indexOfValue = indexOfValue.length ? indexOfValue[0] : -1;
            }
            return indexOfValue === index;
        });
    },
};

new Array(128 - 40).forEach(function (keyCode) {
    keyCode += 40;
    if (!we3.utils.keyboardMap[keyCode]) {
        we3.utils.keyboardMap[keyCode] = String.fromCharCode(keyCode);
    }
});

})();
