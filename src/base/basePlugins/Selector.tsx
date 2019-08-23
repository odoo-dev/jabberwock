(function () {
'use strict';

var booleans = "checked|selected|disabled|readonly|required",
    // http://www.w3.org/TR/css3-selectors/#whitespace
    whitespace = "[\\x20\\t\\r\\n\\f]",
    // http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
    identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",
    // Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
    attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
        // Operator (capture 2)
        "*([*^$|!~]?=)" + whitespace +
        // "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
        "*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
        "*\\]",
    pseudos = ":(" + identifier + ")(?:\\((" +
        // To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
        // 1. quoted (capture 3; capture 4 or capture 5)
        "('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
        // 2. simple (capture 6)
        "((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
        // 3. anything else (capture 2)
        ".*" +
        ")\\)|)",
    // Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
    rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
    rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),
    // CSS escapes
    // http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
    runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
    funescape = function( _, escaped, escapedWhitespace ) {
        var high = "0x" + escaped - 0x10000;
        // NaN means non-codepoint
        // Support: Firefox<24
        // Workaround erroneous numeric interpretation of +"0x"
        return high !== high || escapedWhitespace ?
            escaped :
            high < 0 ?
                // BMP codepoint
                String.fromCharCode( high + 0x10000 ) :
                // Supplemental Plane codepoint (surrogate pair)
                String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
    },
    rpseudo = new RegExp( pseudos ),
    nthchild = /^\s*(([+-])?([0-9]+)?n\s*)?([+-])?\s*([0-9]+)$/,
    reqExp = {
        "ID": new RegExp( "^#(" + identifier + ")" ),
        "CLASS": new RegExp( "^\\.(" + identifier + ")" ),
        "TAG": new RegExp( "^(" + identifier + "|[*])" ),
        "ATTR": new RegExp( "^" + attributes ),
        "PSEUDO": new RegExp( "^" + pseudos ),
    };

var Selector = class extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['BaseArch'];
        this._cacheSearchToken = {};

        var tokenizeExpr = [];
        var obj = this;
        do {
            Object.getOwnPropertyNames(obj).forEach(function (type) {
                if (type.indexOf('_tokenizeExpr_') === 0) {
                    tokenizeExpr.push(type);
                }
            });

        } while (obj = Object.getPrototypeOf(obj));
        this._tokenizeExprList = tokenizeExpr;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @param {ArchNode} [archNode]
     * @param {string} string
     * @param {object} [options]
     * @param {boolean} [options.returnArchNodes]
     * @param {integer[]} [options.filterIds]
     */
    search (archNode, string, options) {
        var self = this;
        var BaseArch = this.dependencies.BaseArch;
        if (typeof archNode === 'string') {
            options = string;
            string = archNode;
            archNode = BaseArch.getArchNode(1);
        }
        if (!archNode) {
            archNode = BaseArch.getArchNode(1);
        }
        if (typeof archNode === 'number') {
            archNode = BaseArch.getArchNode(archNode);
        }

        options = options || {};
        string = string.trim();
        var items = [];
        this._tokenize(string).token.forEach(function (token) {
            token = self._tokenizeForSearch(token);
            self._searchFromToken([archNode], token, options).forEach(function (archNode) {
                var item = options.returnArchNodes ? BaseArch.getClonedArchNode(archNode.id) : archNode.id;
                if (item !== 1 && items.indexOf(item) === -1) {
                    items.push(item);
                }
            });
        });
        return items;
    }
    /**
     * @param {ArchNode|Element} [archNode]
     * @param {string} string
     * @param {object} [options]
     **/
    is (archNode, string, options) {
        var self = this;
        var BaseArch = this.dependencies.BaseArch;
        if (typeof archNode === 'string') {
            options = string;
            string = archNode;
            archNode = BaseArch.getArchNode(1);
        } else if (typeof archNode === 'number') {
            archNode = BaseArch.getArchNode(archNode);
        } else {
            archNode = BaseArch.getArchNode(archNode.id) || archNode;
        }

        options = options || {};
        string = string.trim();

        var is = false;
        this._tokenize(string).token.forEach(function (token) {
            is = is || self._isFromToken([archNode], token, options);
        });

        return is;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _tokenizeForSearch (token) {
        if (token[0].type !== 'BROWSE' && (token[0].type !== 'TAG' || token[0].identifier !== 'EDITABLE')) {
            token = [{
                type: 'BROWSE',
                identifier: 'all',
            }].concat(token);
        }
        return token;
    }
    _tokenize (selector) {
        var self = this;
        var matched, match, tokens, type, soFar, groups;

        if (this._cacheSearchToken[selector]) {
            return this._cacheSearchToken[selector];
        }

        soFar = selector;
        groups = [];

        while ( soFar ) {

            // Comma and first run
            if ( !matched || (match = rcomma.exec( soFar )) ) {
                if ( match ) {
                    // Don't consume trailing commas as valid
                    soFar = soFar.slice( match[0].length ) || soFar;
                }
                groups.push( (tokens = []) );
            }

            matched = false;

            // Filters
            this._tokenizeExprList.forEach(function (type) {
                if (match = self[ type ]( soFar )) {
                    matched = true;
                    type = type.slice(14);
                    tokens.push({
                        type: type,
                        identifier: type === 'TAG' && match[1] !== 'EDITABLE' ? match[1].toLowerCase() : match[1],
                        value: match[2],
                    });
                    soFar = soFar.slice( match[0].length );
                }
            });

            if ( !matched ) {
                break;
            }
        }

        if (soFar) {
            console.error( selector );
        }

        this._cacheSearchToken[selector] = {
            token: groups,
            rest: soFar,
        };

        return this._cacheSearchToken[selector];
    }

    _tokenizeExpr_ID (string) {
        return reqExp.ID.exec(string);
    }
    _tokenizeExpr_CLASS (string) {
        return reqExp.CLASS.exec(string);
    }
    _tokenizeExpr_TAG (string) {
        return reqExp.TAG.exec(string);
    }
    _tokenizeExpr_ATTR (string) {
        var match = reqExp.ATTR.exec(string);
        if (!match) {
            return;
        }

        match[1] = match[1].replace( runescape, funescape );
        // Move the given value to match[3] whether quoted or unquoted
        match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );
        if ( match[2] === "~=" ) {
            match[3] = " " + match[3] + " ";
        }
        return [match[0], match[1], match.slice( 2, 4 )]
    }
    _tokenizeExpr_BROWSE (string) {
        return rcombinators.exec(string);
    }
    _tokenizeExpr_PSEUDO (string) {
        var match = reqExp.PSEUDO.exec(string);
        if (!match) {
            return;
        }

        var excess,
            unquoted = !match[6] && match[2];

        // Accept quoted arguments as-is
        if ( match[3] ) {
            match[2] = match[4] || match[5] || "";

        // Strip excess characters from unquoted arguments
        } else if ( unquoted && rpseudo.test( unquoted ) &&
            // Get excess from tokenize (recursively)
            (excess = this._tokenize( unquoted ).rest.length) &&
            // advance to the next closing parenthesis
            (excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

            // excess is a negative index
            match[0] = match[0].slice( 0, excess );
            match[2] = unquoted.slice( 0, excess );
        }

        // Return only captures needed by the pseudo filter method (type and argument)
        return match.slice( 0, 3 );
    }


    _searchFromToken (archNodes, token, options) {
        for (var k = 0; k < token.length; k++) {
            var t = token[k];
            archNodes = this['_searchFromToken_' + t.type](archNodes, t.identifier, t.value, options);
        }
        return archNodes;
    }
    _isFromToken (archNodes, token, options) {
        for (var k = token.length - 1; k >= 0 ; k--) {
            var t = token[k];
            var method = this['_isFromToken_' + t.type] || this['_searchFromToken_' + t.type];
            archNodes = method.call(this, archNodes, t.identifier, t.value, options);
        }
        return !!archNodes.length;
    }


    _getChildren (archNode, loop, options, _nodes) {
        var nodes = _nodes || [];
        if (archNode.childNodes) {
            var filterIds = options && options.filterIds;
            var childNodes = archNode.childNodes;
            for (var k = 0, len = childNodes.length; k < len; k++) {
                var archNode = childNodes[k];
                if (filterIds && !filterIds[archNode.id]) {
                    continue;
                }
                nodes.push(archNode);
                if (loop) {
                    this._getChildren(archNode, loop, options, nodes);
                }
            };
        }
        return nodes;
    }


    //////////////////////////////////////////////////////


    _isFromToken_BROWSE (archNodes, identifier, value, options) {
        var self = this;
        var nodes = [];
        if (identifier === '>') {
            archNodes.forEach(function (archNode) {
                var parent = archNode.parent;
                if (parent && nodes.indexOf(parent) === -1) {
                    nodes.push(parent);
                }
            });
        } else if (identifier === '+' || identifier === '-') {
            archNodes.forEach(function (archNode) {
                var siblings = archNode.parent && archNode.parent.childNodes || [];
                var prev = siblings[siblings.indexOf(archNode) + (identifier === '+' ? -1 : 1)];
                if (prev && nodes.indexOf(prev) === -1) {
                    nodes.push(prev);
                }
            });
        } else {
            archNodes.forEach(function (archNode) {
                while (archNode.parent) {
                    var parent = archNode.parent;
                    if (nodes.indexOf(parent) === -1) {
                        nodes.push(parent);
                    }
                    archNode = parent;
                }
            });
        }
        return nodes;
    }


    _searchFromToken_ID (archNodes, identifier) {
        return archNodes.filter(function (archNode) {
            return archNode.attributes && archNode.attributes.id && archNode.attributes.id.toLowerCase() === identifier;
        });
    }
    _searchFromToken_CLASS (archNodes, identifier) {
        return archNodes.filter(function (archNode) {
            return archNode.className && archNode.className.contains(identifier);
        });
    }
    _searchFromToken_ATTR (archNodes, identifier, value) {
        return archNodes.filter(function (archNode) {
            var val = archNode.attributes && archNode.attributes[identifier];
            if (!val) {
                return false;
            }
            val = val.toString();
            switch (value[0]) {
                case '=': return val == value[1];
                default: debugger;
            }
        });
    }
    _searchFromToken_TAG (archNodes, identifier) {
        if (identifier === '*') {
            return archNodes;
        }
        return archNodes.filter(function (archNode) {
            return archNode.nodeName === identifier;
        });
    }
    _searchFromToken_BROWSE (archNodes, identifier, value, options) {
        var self = this;
        var nodes = [];
        if (identifier === '>') {
            archNodes.forEach(function (archNode) {
                nodes = nodes.concat(self._getChildren(archNode, false, options));
            });
        } else if (identifier === '+') {
            archNodes.forEach(function (archNode) {
                var siblings = self._getChildren(archNode.parent, false, options);
                var next = siblings[siblings.indexOf(archNode) + 1];
                if (next) {
                    nodes.push(next);
                }
            });
        } else if (identifier === '-') {
            archNodes.forEach(function (archNode) {
                var siblings = self._getChildren(archNode.parent, false, options);
                var prev = siblings[siblings.indexOf(archNode) - 1];
                if (prev) {
                    nodes.push(prev);
                }
            });
        } else if (identifier === 'all') {
            nodes = archNodes;
            archNodes.forEach(function (archNode) {
                nodes = nodes.concat(self._getChildren(archNode, true, options));
            });
        } else {
            archNodes.forEach(function (archNode) {
                nodes = nodes.concat(self._getChildren(archNode, true, options));
            });
        }
        return nodes;
    }
    _searchFromToken_PSEUDO (archNodes, identifier, value) {
        return this['_searchFromToken_PSEUDO_' + identifier](archNodes, value);
    }


    _searchFromToken_PSEUDO_lang (archNodes, value) {
        return archNodes.filter(function (archNode) {
            return archNode.attributes.lang === value;
        });
    }
    _searchFromToken_PSEUDO_enabled (archNodes) {
        var self = this;
        return archNodes.filter(function (archNode) {
            return !self._searchFromToken_PSEUDO_disabled([archNode])[0];
        });
    }
    _searchFromToken_PSEUDO_disabled (archNodes) {
        return archNodes.filter(function (archNode) {
            return archNode.attributes.disabled !== 'false' && !!archNode.attributes.disabled;
        });
    }
    _searchFromToken_PSEUDO_checked (archNodes) {
        return archNodes.filter(function (archNode) {
            return archNode.attributes.checked !== 'false' && !!archNode.attributes.checked;
        });
    }

    _getSiblingsType (archNode) {
        var siblings = this._getChildren(archNode.parent);
        var group = {__group__: []};
        for (var k = 0, len = siblings; k < len ; k++) {
            var sibling = siblings[k];
            if (!group[sibling.nodeName]) {
                group.__group__.push(sibling.nodeName);
                group[sibling.nodeName] = [];
            }
            group[sibling.nodeName].push(sibling);
        }
        return group;
    }
    '_searchFromToken_PSEUDO_nth-child' (archNodes, value, nthOfType) {
        if (value === 'odd') {
            odd = '2n+1';
        }
        if (value === 'even') {
            odd = '2n';
        }

        var pos = value.match(nthchild);
        if (!pos) {
            throw new Error('Wrong value "' + value + '" for "nth-child" selector');
        }

        var negVal = pos[4] && pos[4] === '-';
        if (pos[1] && negVal) {
            throw new Error('Wrong value "' + value + '" for "nth-child" selector');
        }

        var self = this;
        var neg = pos[2] && pos[2] === '-';
        var n = pos[3];
        var val = pos[5];
        var nodes = [];
        archNodes.forEach(function (archNode) {
            var group = this._getSiblingsType(archNode);
            var siblings = nthOfType ? this._getSiblingsType(archNode)[archNode.nodeName] : this._getChildren(archNode.parent);
            var archNodeIndex = siblings.indexOf(archNode);
            var max =   neg ? val : siblings.length;
            var index = neg ? 0 : negVal ? max - val : val;

            while (index < max) {
                if (archNodeIndex === index) {
                    nodes.push(archNodes[i]);
                    break;
                }
                if (n === 0) {
                    break;
                } else if (neg && !n) {
                    index++;
                } else {
                    index += n;
                }
            }
        });
        return nodes;
    }
    '_searchFromToken_PSEUDO_nth-last-child' (archNodes, value) {
        var nodes = this['_searchFromToken_PSEUDO_nth-child'](archNodes, value);
        return nodes.length ? [nodes[nodes.length - 1]] : [];
    }
    '_searchFromToken_PSEUDO_nth-of-type' (archNodes, value) {
        return this['_searchFromToken_PSEUDO_nth-child'](archNodes, value, true);
    }
    '_searchFromToken_PSEUDO_nth-last-of-type' (archNodes, value) {
        var nodes = this['_searchFromToken_PSEUDO_nth-child'](archNodes, value, true);
        return nodes.length ? [nodes[nodes.length - 1]] : [];
    }
    '_searchFromToken_PSEUDO_first-child' (archNodes) {
        return this['_searchFromToken_PSEUDO_nth-child'](archNodes, '1');
    }
    '_searchFromToken_PSEUDO_last-child' (archNodes) {
        return this['_searchFromToken_PSEUDO_nth-child'](archNodes, '-1');
    }
    '_searchFromToken_PSEUDO_first-of-type' (archNodes) {
        return this['_searchFromToken_PSEUDO_nth-child'](archNodes, '1', true);
    }
    '_searchFromToken_PSEUDO_last-of-type' (archNodes) {
        return this['_searchFromToken_PSEUDO_nth-child'](archNodes, '-1', true);
    }
    '_searchFromToken_PSEUDO_only-child' (archNodes) {
        var self = this;
        return archNodes.filter(function (archNode) {
            return self._getChildren(archNode).length === 1;
        });
    }
    '_searchFromToken_PSEUDO_only-of-type' (archNodes) {
        var self = this;
        return archNodes.filter(function (archNode) {
            return self._getSiblingsType(archNode)[archNode.nodeName].length === 1;
        });
    }

    _searchFromToken_PSEUDO_eq (archNodes, value) {
        return archNodes.slice(+value, 1);
    }
    _searchFromToken_PSEUDO_empty (archNodes) {
        return archNodes.filter(function (archNode) {
            return archNode.isEmpty();
        });
    }
    _searchFromToken_PSEUDO_is (archNodes, value) {
        var self = this;
        return archNodes.filter(function (archNode) {
            return self.is(archNode, value);
        });
    }
    _searchFromToken_PSEUDO_not (archNodes, value) {
        var self = this;
        return archNodes.filter(function (archNode) {
            return !self._searchFromToken_PSEUDO_is([archNode], value)[0];
        });
    }
    _searchFromToken_PSEUDO_has (archNodes, value) {
        var self = this;
        return archNodes.filter(function (archNode) {
            return !!self.search(archNode, value).length;
        });
    }
    _searchFromToken_PSEUDO_val (archNodes, value) {
        return archNodes.filter(function (archNode) {
            return archNode.attributes.value === value;
        });
    }
    _searchFromToken_PSEUDO_contains (archNodes, value) {
        return archNodes.filter(function (archNode) {
            return archNode.attributes.textContent().indexOf(value) !== -1;
        });
    }
};

we3.pluginsRegistry.Selector = Selector;

})();
