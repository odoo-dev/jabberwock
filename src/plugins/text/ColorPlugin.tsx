(function () {
'use strict';

class ColorPlugin extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.templatesDependencies = ['src/xml/colorpicker.xml'];
        this.dependencies = ['Arch', 'Range', 'Text'];

        var self = this;
        this._colors = this.options.color.colors;
        this._classPrefixes = this.options.color.classPrefix;
        this._classPrefix = this._classPrefixes && this._classPrefixes.text || 'color-';
        this._styleName = 'color';
        if (this.options.getColor) {
                console.log('COLOR to load');
            this._initializePromise = this.options.getColors().then(function (colors) {
                console.log('COLOR');
                self._colors = colors;
            });
        }
    }
    /**
     * @returns {Promise}
     */
    isInitialized () {
        return $.when(super.isInitialized(), this._initializePromise);
    }
    start () {
        this._insertColors();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Reset all colors on the selection.
     */
    reset () {
        var self = this;
        this.dependencies.Arch.splitRangeUntil(node => node.isFont(), {doNotBreakBlocks: true});
        var rangeToPreserve = this.dependencies.Range.getRange();
        var selection = this.dependencies.Range.getSelectedNodes();
        var styled = selection.filter(function (node) {
            return node.style && node.style.length || self._colorClasses(node).length;
        });
        // remove colors on every styled node in the selection
        var json = styled.map(function (node) {
            var parentID = node.parent.id;
            self._removeColorClasses(node);
            self._removeColorStyles(node);
            self._removeEmptyFont(node); // remove the node if it has not attributes
            return self.dependencies.Arch.getClonedArchNode(parentID).toJSON();
        });
        this.dependencies.Arch.importUpdate(json);
        this.dependencies.Range.setRange(rangeToPreserve);
    }
    /**
     * Change the selection's fore color.
     *
     * @param {string} color (hexadecimal or class name)
     */
    update (color) {
        var _update = getArchNode => this._update(color, getArchNode);
        this.dependencies.Arch.do(_update, {
            // If range is collapsed we need a virtual text node to style and on
            // which to put the carret. Otherwise they can all go.
            removeAllVirtualText: !this.dependencies.Range.isCollapsed(),
        });
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _active (buttonName, focusNode) {
        var self = this;
        var colorName = buttonName.split('-')[1];
        var nodeColor;
        if (colorName[0] === '#') {
            var styledAncestor = focusNode.ancestor(node => node.style && node.style[self._styleName]);
            nodeColor = styledAncestor ? styledAncestor.style[self._styleName] : '';
        } else {
            colorName = this._classPrefix + colorName;
            var classedAncestor = focusNode.ancestor(node => node.className && self._colorClasses(node));
            nodeColor = classedAncestor ? this._colorClasses(classedAncestor)[0] : '';
        }
        return colorName === nodeColor;
    }
    /**
     * Apply a color to an ArchNode
     *
     * @private
     * @param {ArchNode} node
     * @param {string} color
     */
    _applyColor (node, color) {
        node = node.isText() ? node.parent : node;
        if (!color || color.startsWith('#') || color.startsWith('rgba')) {
            this._applyColorStyle(node, color || '');
        } else {
            this._applyColorClass(node, color);
        }
    }
    /**
     * Apply a color class to a node.
     *
     * @private
     * @param {ArchNode} node
     * @param {string} colorClass
     */
    _applyColorClass (node, colorClass) {
        this._colorClasses(node).forEach(className => node.className.remove(className));
        node.className.add(this._classPrefix + colorClass);
        this._removeColorStyles(node);
    }
    /**
     * Apply a color style to a node.
     *
     * @private
     * @param {ArchNode} node
     * @param {string} colorHex
     */
    _applyColorStyle (node, colorHex) {
        node.style.add(this._styleName, colorHex);
        this._removeColorClasses(node);
    }
    /**
     * Return a list of color classes present in the node.
     *
     * @private
     * @param {ArchNode} node
     * @returns {string []}
     */
    _colorClasses (node) {
        var classPrefix = this._classPrefix;
        var classes = node.className && node.className.value || [];
        return classes.filter(className => className.startsWith(classPrefix));
    }
    /**
     * Create a color button.
     *
     * @private
     * @param {string} color
     * @returns {Node}
     */
    _createColorButton (color) {
        var button = document.createElement('we3-button');
        if (color.startsWith('#')) {
            button.setAttribute('style', 'background-color: ' + color + ';')
        } else {
            var bgClassPrefix = this._classPrefixes && this._classPrefixes.background || 'bg-';
            button.setAttribute('class', bgClassPrefix + color);
        }
        button.setAttribute('data-plugin', this.pluginName);
        button.setAttribute('data-method', 'update');
        button.setAttribute('data-value', color);
        button.setAttribute('name', 'color-' + color);
        return button;
    }
    /**
     * Create a color grid.
     *
     * @private
     * @param {(String []|string) []} rows
     * @returns {DocumentFragment}
     */
    _createGrid (rows) {
        var self = this;
        var grid = document.createDocumentFragment();
        var currentPalette = document.createElement('we3-palette');
        rows.forEach(function (row) {
            if (typeof row === 'string') {
                // Add a title, then the incoming palette
                var title = document.createElement('we3-title');
                title.appendChild(document.createTextNode(row));
                grid.appendChild(title);
                currentPalette = document.createElement('we3-palette');
                grid.appendChild(currentPalette);
            } else {
                // Add a row to the palette
                var rowNode = document.createElement('we3-row');
                row.forEach(function (color) {
                    var button = self._createColorButton(color);
                    rowNode.appendChild(button);
                });
                currentPalette.appendChild(rowNode);
            }
        });
        grid.appendChild(currentPalette);
        return grid;
    }
    /**
     * @override
     */
    _enabled (buttonName, focusNode) {
        return !!focusNode.ancestor('isFormatNode') || focusNode.childNodes && focusNode.childNodes.every(child => child.isFormatNode());
    }
    /**
     * After splitting the nodes (until their font ancestor if any), return the ids of
     * the nodes to color, between `start` at `startFffset`, and `end` at `endOffset`.
     *
     * @param {ArchNode} start
     * @param {number} startOffset
     * @param {ArchNode} end
     * @param {number} endOffset
     * @returns {number []}
     */
    _getNodesToColor (start, startOffset, end, endOffset) {
        var endFont = end.ancestor('isFont');
        if (endFont) {
            end = end.splitUntil(endFont, endOffset);
            end = end.lastLeaf().next({ leafToLeaf: true });
        } else {
            end = end.split(endOffset) || end;
        }
        var startFont = start.ancestor('isFont');
        if (startFont) {
            start = start.splitUntil(startFont, startOffset);
            start = start.firstLeaf().next({ leafToLeaf: true });
        } else {
            start = start.split(startOffset) || start;
        }

        return start.getNodesUntil(end, {
            includeStart: true,
            includeEnd: false,
        });
    }
    /**
     * Insert the colors grid declared in the editor options into the colors dropdown.
     *
     * @private
     * @see options.colors
     */
    _insertColors () {
        var target = this.buttons.elements[0].querySelector('we3-palettes');
        this._insertGrid(this._colors, target, true);
    }
    /**
     * Insert a color grid at target.
     *
     * @private
     * @param {(String []|string) []} rows
     * @param {Node} target
     * @param {boolean} prepend true to prepend to target, false to append to it
     */
    _insertGrid (rows, target, prepend) {
        var grid = this._createGrid(rows);
        if (prepend && target.firstChild) {
            target.insertBefore(grid, target.firstChild);
        } else {
            target.appendChild(grid);
        }
    }
    /**
     * Remove color classes from a node.
     *
     * @private
     * @param {ArchNode} node
     */
    _removeColorClasses (node) {
        node.className.remove(this._colorClasses(node).join(' '));
    }
    /**
     * Remove color styles from a node.
     *
     * @private
     * @param {ArchNode} node
     */
    _removeColorStyles (node) {
        node.style.add(this._styleName, '');
    }
    /**
     * Remove a `font` node if it has no attributes. Keep its children.
     *
     * @private
     * @param {ArchNode} node
     */
    _removeEmptyFont (node) {
        var self = this;
        if (!node.isFont() || node.attributes.toString()) {
            return;
        }
        if (node.childNodes.length) {
            node.childNodes.slice().forEach(function (child) {
                self.dependencies.Arch.unwrapFrom(child.id, 'font');
            });
        } else {
            node.remove();
        }
    }
    /**
     * Change the selection's fore color.
     *
     * @param {string} color (hexadecimal or class name)
     * @param {function} getArchNode
     */
    _update (color, getArchNode) {
        var self = this;
        var range = this.dependencies.Range.getRange();
        var scArch = getArchNode(range.scID);
        var ecArch = getArchNode(range.ecID);
        var toColor = this._getNodesToColor(scArch, range.so, ecArch, range.eo)
            .map(id => getArchNode(id));

        toColor.forEach(function (node) {
            var fontNode = node.ancestor('isFont') || node.wrap('font');
            self._applyColor(fontNode, color);
            fontNode._deleteEdges({
                doNotBreakBlocks: true,
                mergeOnlyIfSameType: true,
            });
        });
        // keep the original selection
        return {
            scID: toColor[0].id,
            so: 0,
            ecID: toColor[toColor.length - 1].id,
            eo: toColor[toColor.length - 1].length(),
        };
    }
}

we3.addPlugin('Color', ColorPlugin);

})();
