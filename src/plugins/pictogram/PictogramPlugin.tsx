(function () {
'use strict';

var utils = we3.utils;

class PictogramPlugin extends we3.AbstractPlugin {
    /**
     *
     * @param {Object} parent
     * @param {Object} params
     * @param {object} [params.pictogram] @see _computeFonts
     */
    constructor () {
        super(...arguments);
        this.templatesDependencies = ['src/xml/media.xml'];
        this.dependencies = ['Arch', 'Media'];
        this.buttons = {
            template: 'we3.buttons.pictogram',
        };
        this.iconsParser = this.options.pictogram.map(function (picto) {
            return {
                base: picto.base,
                cssParser: new RegExp('\\.(' + picto.parser + ')::?before', 'i'),
            };
        });
    }
    /**
     * @override
     */
    start () {
        var title = this.options.translate('Pictogram', 'Pictogram');
        this.dependencies.Media.addPanel('pictogram', title, this._renderMediaTab.bind(this), this._onSaveMedia.bind(this), 30);
        return super.start();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    getArchNode (archNode) {
        return archNode.ancestor('isPictogram');
    }
    toggleClass (value, archNode) {
        archNode.className.toggle(value);
        this.dependencies.Arch.importUpdate(archNode.toJSON());
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Searches the fonts described
     *
     * @private
     * @param {object[]} fontIcons
     *   List of font icons to load by editor. The icons are displayed in the media
     *   editor and identified like font and image (can be colored, spinned, resized
     *   with fa classes).
     *   To add font, push a new object {base, parser}
     *
     *   - base: class who appear on all fonts
     *   - parser: string to create the regular expression used to select all font
     *           in css stylesheets and the regular expression for parsing
     *
     * @type Array
     */
    _computeFonts () {
        var self = this;
        this.cacheCssSelectors = {};
        this.iconsParser.forEach(function (data) {
            data.cssData = self._getCssSelectors(data.cssParser);
            data.alias = utils.flatten(data.cssData.map(function (cssData) {
                return cssData.names;
            }));
        });
        this.alias = utils.flatten(this.iconsParser.map(function (data) {
            return data.alias;
        }));
    }
    _displayPictogram (documents, iconsParser) {
        documents.innerHTML = '';
        iconsParser.forEach(function (data) {
            data.cssData.forEach(function (cssData) {
                var doc = document.createElement('we3-document');
                doc.setAttribute('data-id', cssData.names[0]);
                doc.setAttribute('data-alias', cssData.names.join(','));
                var span = document.createElement('i');
                span.setAttribute('title', cssData.names[0]);
                span.setAttribute('aria-label', cssData.names[0]);
                span.setAttribute('role', 'img');
                span.classList.add(data.base);
                span.classList.add(cssData.names[0]);

                doc.appendChild(span);
                documents.appendChild(doc);
            });
        });
    }
    /**
     * Retrieves all the CSS rules which match the given parser (Regex).
     *
     * @private
     * @param {Regex} filter
     * @returns {Object[]} Array of CSS rules descriptions (objects). A rule is
     *          defined by 3 values: 'selector', 'css' and 'names'. 'selector'
     *          is a string which contains the whole selector, 'css' is a string
     *          which contains the css properties and 'names' is an array of the
     *          first captured groups for each selector part. E.g.: if the
     *          filter is set to match .fa-* rules and capture the icon names,
     *          the rule:
     *              '.fa-alias1::before, .fa-alias2::before { hello: world; }'
     *          will be retrieved as
     *              {
     *                  selector: '.fa-alias1::before, .fa-alias2::before',
     *                  css: 'hello: world;',
     *                  names: ['.fa-alias1', '.fa-alias2'],
     *              }
     */
    _getCssSelectors (filter) {
        if (this.cacheCssSelectors[filter]) {
            return this.cacheCssSelectors[filter];
        }
        this.cacheCssSelectors[filter] = [];
        var sheets = document.styleSheets;
        for (var i = 0; i < sheets.length; i++) {
            var rules;
            try {
                // try...catch because Firefox not able to enumerate
                // document.styleSheets[].cssRules[] for cross-domain
                // stylesheets.
                rules = sheets[i].rules || sheets[i].cssRules;
            } catch (e) {
                console.warn("Can't read the css rules of: " + sheets[i].href, e);
                continue;
            }
            if (!rules) {
                continue;
            }

            for (var r = 0 ; r < rules.length ; r++) {
                var selectorText = rules[r].selectorText;
                if (!selectorText) {
                    continue;
                }
                var selectors = selectorText.split(/\s*,\s*/);
                var data = null;
                for (var s = 0; s < selectors.length; s++) {
                    var match = selectors[s].trim().match(filter);
                    if (!match) {
                        continue;
                    }
                    if (!data) {
                        data = {
                            selector: match[0],
                            css: rules[r].cssText.replace(/(^.*\{\s*)|(\s*\}\s*$)/g, ''),
                            names: [match[1]]
                        };
                    } else {
                        data.selector += (', ' + match[0]);
                        data.names.push(match[1]);
                    }
                }
                if (data) {
                    this.cacheCssSelectors[filter].push(data);
                }
            }
        }
        return this.cacheCssSelectors[filter];
    }
    /**
     * @private
     */
    _getFont (classNames) {
        if (!(classNames instanceof Array)) {
            classNames = (classNames || "").split(/\s+/);
        }
        var fontIcon, cssData;
        for (var k = 0; k < this.iconsParser.length; k++) {
            fontIcon = this.iconsParser[k];
            for (var s = 0; s < fontIcon.cssData.length; s++) {
                cssData = fontIcon.cssData[s];
                if (_.intersection(classNames, cssData.names).length) {
                    return {
                        base: fontIcon.base,
                        cssParser: fontIcon.cssParser,
                        font: cssData.names[0],
                    };
                }
            }
        }
        return null;
    }
    _renderMediaTab (mediaArchNode) {
        if (!this.cacheCssSelectors) {
            this._computeFonts();
        }
        var fragment = this._renderTemplate('we3.modal.media.pictogram');
        var iconsParser = this._searchPictogram(null);
        var documents = fragment.querySelector('we3-documents');
        this._displayPictogram(documents, iconsParser);

        var pictogram = mediaArchNode && mediaArchNode.isPictogram && mediaArchNode.isPictogram() && mediaArchNode;
        if (pictogram) {
            // documents.querySelector('.');
        }

        return {
            active: !!pictogram,
            content: fragment,
        };
    }
    _searchPictogram (needle) {
        var iconsParser = this.iconsParser;
        if (needle && needle.length) {
            iconsParser = [];
            this.iconsParser.forEach(function (data) {
                var cssData = data.cssData.filter(function (cssData) {
                    return cssData.names.filter(function (alias) {
                        return alias.indexOf(needle) >= 0;
                    })[0];
                });
                if (cssData.length) {
                    iconsParser.push({
                        base: data.base,
                        cssData: cssData,
                    });
                }
            });
        }
        return iconsParser;
    }

    //--------------------------------------------------------------------------
    // Handle
    //--------------------------------------------------------------------------

    _onSaveMedia (panel) {
        return new Promise(function (resolve) {
            resolve(panel.querySelector('we3-document.we3-selected').firstChild);
        });
    }
    _onSearch (value, ev) {
        var documents = ev.target.closest('we3-group.we3-pictogram').querySelector('we3-documents');
        var iconsParser = this._searchPictogram(ev.target.value);
        this._displayPictogram(documents, iconsParser);
    }
    _onSelectDocument (value, ev) {
        var doc = ev.srcElement.closest('we3-document');
        var selected = doc.closest('we3-group.we3-pictogram').querySelector('we3-document.we3-selected');
        if (selected) {
            selected.classList.remove('we3-selected');
        }
        doc.classList.add('we3-selected');
    }
}

we3.addPlugin('Pictogram', PictogramPlugin);

})();
