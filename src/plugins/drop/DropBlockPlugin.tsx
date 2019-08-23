(function () {
'use strict';

var dropzoneTagName = 'we3-dropblock-dropzone';
var dropzoneUpperCaseTagName = dropzoneTagName.toUpperCase();

var MAX_DISTANCE_TO_DROP = 50;
var MAX_SQUARED_DISTANCE_TO_DROP = Math.pow(MAX_DISTANCE_TO_DROP, 2);

class DropBlockPlugin extends we3.AbstractPlugin {
    /**
     * @constructor
     * @param {Object} parent
     * @param {Object} params
     * @param {Object} options
     */
    constructor(parent, params, options) {
        super(...arguments);

        this.dependencies = ['Arch', 'Overlay', 'Renderer', 'Rules', 'Sidebar'];
        this.templatesDependencies = ['/web_editor/static/src/xml/wysiwyg_dropblock.xml'];

        this.buttons = {
            template: 'wysiwyg.buttons.dropblock',
        };

        this.documentDomEvents = {
            'mousemove': '_onMouseMove',
            'mouseup': '_onMouseUp',
            'touchmove': '_onTouchMove',
            'touchend': '_onTouchEnd',
            'touchcancel': '_onTouchEnd',
        };
        this.blocksContainerEvents = {
            'mousedown': '_onBlockMouseDown',
            'touchstart': '_onBlockTouchStart',
        };
        this.blocksUIEvents = {
            'mousedown we3-dropblock-move-handle': '_onHandleMouseDown',
            'touchstart we3-dropblock-move-handle': '_onHandleTouchStart',
        };

        this._origin = document.createElement('we3-dropblock-origin');
        params.insertAfterEditable(this._origin);

        this._dragAndDropSelectClosestDropzone = this._throttled(50, this._dragAndDropSelectClosestDropzone.bind(this));
    }
    /**
     * @override
     */
    start() {
        var promise = super.start(...arguments);

        var Overlay = this.dependencies.Overlay;
        var Sidebar = this.dependencies.Sidebar;

        // FIXME what is this ?
        var Arch = this.dependencies.Arch;
        this.dependencies.Rules.addUnbreakableNodeCheck(function (a) {
            return Arch.getTechnicalData(a.id, 'dropblock') || a.nodeName === 'section';
        });

        // Render blocks and menus
        if (this.options.blocksDataList) {
            this._createBlocks(this.options.blocksDataList);
        } else {
            // Note: the template must have the same structure created by
            // the '_createBlocks' method
            var container = document.createElement('div');
            var dropBlockTemplate = this.options.dropBlockTemplate || 'wysiwyg.dropblock.defaultblocks';
            container.innerHTML = this.options.renderTemplate('DropBlock', dropBlockTemplate);
            this._sidebarElements = [].slice.call(container.children);
            this._blockNodes = [].slice.call(container.querySelectorAll('we3-block'));
        }

        // Fetch information about where each individual block can be dropped
        var targets = this._blockNodes.map(function (block) {
            return block.getAttribute('data-content');
        });
        this._blocksDropzonesData = this._fetchDropzonesData(targets);

        // Initialize dependencies
        Overlay.on('overlay_refresh', this, this._onOverlayRefresh);
        Overlay.registerUIEvents(this, this.blocksUIEvents);
        this._createMoveUIElements();

        Sidebar.registerEvents(this, this.blocksContainerEvents);

        // Finish preparing the DOM
        this._markDragableBlocks();
        if (this.options.dropblockAutoOpen) {
            this.open();
        }
        return promise.then(function () {
            Sidebar.toggleClass('we3-snippets-loaded', true);
        });
    }
    /**
     * @override
     */
    destroy() {
        super.destroy(...arguments);
        this._dragAndDropEnd();
    }

    //--------------------------------------------------------------------------
    // Editor methods
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    blurEditor() {
        this._dragAndDropEnd();
    }
    /**
     * @override
     */
    setEditorValue() {
        this._markDragableBlocks();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Closes the blocks menu.
     */
    close() {
        this.toggle(false);
    }
    /**
     * Opens the blocks menu.
     */
    open() {
        this.toggle(true);
    }
    /**
     * Opens/closes the blocks menu.
     *
     * @param {boolean} [open]
     */
    toggle(open) {
        this.dependencies.Sidebar.toggle(this._sidebarElements, open);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {object[]} blocksDataList
     * @param {string} blocksDataList[].title
     * @param {object[]} blocksDataList[].blocks
     * @param {string} blocksDataList[].blocks[].title
     * @param {string} blocksDataList[].blocks[].thumbnail
     * @param {string} blocksDataList[].blocks[].content
     */
    _createBlocks(blocksDataList) {
        var sidebarElements = [];
        var blocks = [];
        blocksDataList.forEach(function (blocksData) {
            var blocksNode = document.createElement('we3-blocks');

            var title = document.createElement('we3-title');
            title.innerHTML = blocksData.title;
            blocksNode.appendChild(title);

            blocksData.blocks.forEach(function (block) {
                var blockNode = document.createElement('we3-block');
                blockNode.setAttribute('data-content', block.content);

                var thumbnail = document.createElement('we3-dropblock-thumbnail');
                var preview = document.createElement('we3-preview');
                preview.style.backgroundImage = 'url(' + block.thumbnail + ')';
                var title = document.createElement('we3-title');
                title.innerHTML = block.title;
                thumbnail.appendChild(preview);
                thumbnail.appendChild(title);

                blockNode.appendChild(thumbnail);

                blocks.push(blockNode);
                blocksNode.appendChild(blockNode);
            });

            sidebarElements.push(blocksNode);
        });
        this._sidebarElements = sidebarElements;
        this._blockNodes = blocks;
    }
    /**
     * Creates and inserts a dropzone according to the given node and position.
     *
     * @private
     * @param {enum<before|after|append>} position
     * @param {Node} node
     */
    _createDropzone(position, node) {
        var id = this.dependencies.Renderer.getID(node);
        if (!id) {
            return;
        }

        var dropzone = document.createElement(dropzoneTagName);
        dropzone.setAttribute('contentEditable', "false");
        dropzone.setAttribute('data-position', position);
        dropzone.setAttribute('data-id', id);

        var parent, child;
        switch (position) {
            case 'before':
                if (node.previousSibling && node.previousSibling.tagName === dropzoneUpperCaseTagName) {
                    return;
                }
                parent = node.parentNode;
                child = node;
                parent.insertBefore(dropzone, node);
                break;
            case 'after':
                if (node.nextSibling && node.nextSibling.tagName === dropzoneUpperCaseTagName) {
                    return;
                }
                parent = node.parentNode;
                child = node;
                if (node.nextSibling) {
                    parent.insertBefore(dropzone, node.nextSibling);
                } else {
                    parent.appendChild(dropzone);
                }
                break;
            case 'append':
                if (node.lastChild && node.lastChild.tagName === dropzoneUpperCaseTagName) {
                    return;
                }
                parent = node;
                child = node.lastChild;
                node.appendChild(dropzone);
                break;
        }

        var css = child ? this.window.getComputedStyle(child) : false;
        var float = css ? (css.float || css.cssFloat) : false;
        var parentCss = this.window.getComputedStyle(parent);
        var parentDisplay = parentCss.display;
        var parentFlex = parentCss.flexDirection;
        var parentHeight = parentCss.height;
        var vertical = false;
        if (child && ((!child.tagName && child.textContent.match(/\S/)) || child.tagName === 'BR')) {
            vertical = true;
        } else if (float === 'left' || float === 'right' || (parentDisplay === 'flex' && parentFlex === 'row')) {
            if (parent.clientWidth !== child.clientWidth) {
                vertical = true;
                dropzone.style.height = parentHeight;
            }
            if (float) {
                dropzone.style.float = float;
            }
        }
        if (vertical) {
            dropzone.classList.add('we3-dropzone-vertical');
        }

        dropzone.classList.add('we3-dropzone-visible');

        var box = dropzone.getBoundingClientRect();
        var originBox = this._origin.getBoundingClientRect();
        this._enabledDropzones.push({
            node: dropzone,
            vertical: vertical,
            top: box.top - originBox.top,
            left: box.left - originBox.left,
            width: box.width,
            height: box.height,
        });
    }
    /**
     * Creates and inserts all the dropzones needed according to the given
     * description.
     *
     * @private
     * @param {object} dropzones
     * @param {number[]} [dropzones.dropIn]
     *      The arch identifiers of the elements in which to append a dropzone.
     * @param {number[]} [dropzones.dropNear]
     *      The arch identifiers of the elements to surround with dropzones.
     */
    _createDropzones(dropzones) {
        var self = this;
        var Renderer = this.dependencies.Renderer;

        this._enabledDropzones = [];

        insertForEach(dropzones.dropIn, function (el) {
            [].slice.call(el.children).forEach(function (child) {
                self._createDropzone('before', child);
            });
            self._createDropzone('append', el);
        });
        insertForEach(dropzones.dropNear, function (el) {
            self._createDropzone('before', el);
            self._createDropzone('after', el);
        });

        function insertForEach(elements, callback) {
            if (!elements) {
                return;
            }
            elements.forEach(function (id) {
                var el = Renderer.getElement(id);
                if (!el || !el.parentNode) {
                    return;
                }
                callback(el);
            });
        }
    }
    /**
     * @private
     */
    _createMoveUIElements() {
        var Arch = this.dependencies.Arch;
        var Overlay = this.dependencies.Overlay;

        var items = this._fetchDropzonesData();
        items.forEach(function (item) {
            Arch.setTechnicalData(item.target, 'dropblock', {
                dropIn: item.dropIn,
                dropNear: item.dropNear,
            });

            var ui = document.createElement('we3-dropblock-move-ui');
            for (var i = 0; i < 4; i++) {
                ui.appendChild(document.createElement('we3-dropblock-move-handle'));
            }
            Overlay.addUIElement(ui, item.target, {
                dropIn: item.dropIn,
                dropNear: item.dropNear,
            });
        });
    }
    /**
     * Initializes the drag and drop configuration with the given data. Also
     * initializes all the dropzones.
     *
     * @private
     * @param {object} data
     * @param {float} clientX
     * @param {float} clientY
     * @param {boolean} [autoClose=false]
     *      Specify if the blocks menu should be closed
     */
    _dragAndDropStart(data, clientX, clientY, autoClose) {
        this.open(); // Force showing droppable blocks on drag start

        // Close the dropblock area if needed
        if (autoClose) {
            this.close();
        }

        this.editable.setAttribute('contentEditable', 'false');

        this._dragAndDrop = data;
        this.dependencies.Overlay.block();

        this._origin.appendChild(this._dragAndDrop.thumbnail);
        this._dragAndDrop.thumbnail.style.width = this._dragAndDrop.width + 'px';
        this._dragAndDrop.thumbnail.style.height = this._dragAndDrop.height + 'px';

        // Create dropzones
        this._createDropzones({
            dropIn: this._dragAndDrop.dropIn && this._dragAndDrop.dropIn(),
            dropNear: this._dragAndDrop.dropNear && this._dragAndDrop.dropNear(),
        });

        // Simulate original move
        this._dragAndDropMove(clientX, clientY);
    }
    /**
     * Updates the current drag and drop configuration with the given cursor
     * position values.
     *
     * Also updates the selected dropzone with that new position.
     *
     * @see _dragAndDropSelectClosestDropzone
     * @private
     */
    _dragAndDropMove(clientX, clientY) {
        if (!this._dragAndDrop) {
            return;
        }
        var originBox = this._origin.getBoundingClientRect();
        this._dragAndDrop.dx = clientX - originBox.left;
        this._dragAndDrop.dy = clientY - originBox.top;

        var left = this._dragAndDrop.left = this._dragAndDrop.dx - this._dragAndDrop.width / 2;
        var top = this._dragAndDrop.top = this._dragAndDrop.dy - this._dragAndDrop.height / 2;
        this._dragAndDrop.thumbnail.style.left = (left >= 0 ? '+' : '') + left + 'px';
        this._dragAndDrop.thumbnail.style.top = (top >= 0 ? '+' : '') + top + 'px';

        this._dragAndDropSelectClosestDropzone();
    }
    /**
     * Given the current drag and drop configuration, searches for the closest
     * dropzone (related to the cursor) and moves the preview elements at its
     * location.
     *
     * Note: if the closest dropzone is too far, no preview is shown.
     *
     * @private
     */
    _dragAndDropSelectClosestDropzone() {
        var self = this;
        if (!this._dragAndDrop) {
            return;
        }

        var left = this._dragAndDrop.dx;
        var top = this._dragAndDrop.dy;

        // Search for the closest dropzone
        var closestDropzone = null;
        var minSquaredDistance = Infinity;
        this._enabledDropzones.forEach(function (dropzone) {
            var dist = _computePointToBoxSquaredDistance({x: left, y: top}, dropzone);
            if (dist < minSquaredDistance) {
                minSquaredDistance = dist;
                closestDropzone = dropzone;
            }
        });
        this._closestDropzone = closestDropzone && closestDropzone.node;
        if (minSquaredDistance > MAX_SQUARED_DISTANCE_TO_DROP) {
            closestDropzone = null;
        }

        // If the closest dropzone is different that the currently selected one,
        // move dragged elements to that new dropzone.
        if (closestDropzone && this._selectedDropzone !== closestDropzone.node
                || !closestDropzone && this._selectedDropzone) {
            if (this._selectedDropzone) {
                this._selectedDropzone.classList.add('we3-dropzone-visible');
            }
            this._selectedDropzone = closestDropzone && closestDropzone.node;

            if (this._selectedDropzone) {
                this._dragAndDrop.elements.forEach(function (node) {
                    self._selectedDropzone.parentNode.insertBefore(node, self._selectedDropzone);
                });
                this._selectedDropzone.classList.remove('we3-dropzone-visible');
            } else {
                this._dragAndDrop.elements.forEach(function (node) {
                    node.parentNode.removeChild(node);
                });
            }
        }
    }
    /**
     * @private
     */
    _dragAndDropEnd(ev) {
        var Arch = this.dependencies.Arch;
        this.editable.setAttribute('contentEditable', 'true');

        if (!this._dragAndDrop) {
            return;
        }

        // Remove the thumbnail from the DOM and also the dragged elements
        this._origin.removeChild(this._dragAndDrop.thumbnail);
        this._dragAndDrop.elements.forEach(function (node) {
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
        });

        // Move the dragged elements back to their original position if any
        var parentNode = this._dragAndDrop.originalParentNode;
        if (parentNode) {
            var nextSibling = this._dragAndDrop.originalNextSibling;
            this._dragAndDrop.elements.forEach(nextSibling ? function (node) {
                parentNode.insertBefore(node, nextSibling);
            } : function (node) {
                parentNode.appendChild(node);
            });
        }

        // If the dragged elements were dropped in a selected dropzone, check
        // the related node and position where to add the dragged elements.
        // In any case, select the closest dropzone if none is selected.
        var id, position;
        var dropzone = this._selectedDropzone || this._closestDropzone;
        id = parseInt(dropzone.getAttribute('data-id'));
        position = dropzone.getAttribute('data-position');
        this._closestDropzone = null;
        this._selectedDropzone = null;

        // Remove all dropzones
        this._enabledDropzones.forEach(function (zone) {
            if (zone.node.parentNode) {
                zone.node.parentNode.removeChild(zone.node);
            }
        });
        this._enabledDropzones = [];

        // Final insertion in the arch
        // FIXME this does not work if trying to reinsert at the current
        // location and crashes a lot (see Arch.insert...)
        var add = this._dragAndDrop.originalID || this._dragAndDrop.content;
        switch (position) {
            case 'before':
                Arch.insertBefore(add, id);
                break;
            case 'after':
                Arch.insertAfter(add, id);
                break;
            case 'append':
                Arch.insert(add, id, Infinity);
                break;
        }
        this.dependencies.Overlay.setEditorValue(); // FIXME
        this._markDragableBlocks();

        this._dragAndDrop = null;
        this.dependencies.Overlay.unblock();
    }
    /**
     * @private
     * @param {Array} [targets]
     */
    _fetchDropzonesData(targets) {
        var items = (targets || []).map(function (target) {
            return {target: target};
        });
        this.trigger('dropzones_data_demand', items);
        return items;
    }
    /**
     * @private
     */
    _handleBlockDragStart(ev, target, x, y, autoClose) {
        // Search for the block which is starting being dragged
        var blockIndex = this._blockNodes.findIndex(function (blockNode) {
            return blockNode.contains(target);
        });
        if (blockIndex < 0) {
            return;
        }

        ev.preventDefault();
        ev.stopPropagation();

        // Stop potential current drag
        this._dragAndDropEnd();

        // Start the drag using information about the block
        var blockNode = this._blockNodes[blockIndex];
        var dropzonesData = this._blocksDropzonesData[blockIndex];
        var thumbnail = blockNode.querySelector('we3-dropblock-thumbnail');
        var box = thumbnail.getBoundingClientRect();
        var content = blockNode.getAttribute('data-content');
        var el = document.createElement('we3-content');
        el.innerHTML = content;
        var elements = [].slice.call(el.childNodes);

        this._dragAndDropStart({
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
            thumbnail: thumbnail.cloneNode(true),
            elements: elements,
            content: content,
            dropIn: dropzonesData.dropIn,
            dropNear: dropzonesData.dropNear,
        }, x, y, autoClose);
    }
    /**
     * @private
     */
    _handleDOMDragStart(ev, button, x, y, autoClose) {
        var Overlay = this.dependencies.Overlay;
        var ui = button.parentNode;
        var id = Overlay.getUIElementNodeID(ui);
        var data = Overlay.getUIElementData(ui);
        if (!id || id === 1) {
            return;
        }
        var node = this.dependencies.Renderer.getElement(id);

        ev.preventDefault();
        ev.stopPropagation();

        // Stop potential current drag
        this._dragAndDropEnd();

        var content = document.createElement('we3-content');
        content.innerHTML = node.outerHTML;
        var elements = [].slice.call(content.childNodes);

        var parentNode = node.parentNode;
        var nextSibling = node.nextSibling;
        parentNode.removeChild(node);

        var thumbnailSize = 30;
        this._dragAndDropStart({
            originalNextSibling: nextSibling,
            originalParentNode: parentNode,
            originalID: id,
            left: x - thumbnailSize / 2,
            top: y - thumbnailSize / 2,
            width: thumbnailSize,
            height: thumbnailSize,
            thumbnail: document.createElement('we3-drag-thumbnail'),
            elements: elements,
            content: node.outerHTML,
            dropIn: data.dropIn,
            dropNear: data.dropNear,
        }, x, y, autoClose);
    }
    /**
     * Makes blocks appear disabled in the menu when there is no location where
     * they may be dropped.
     *
     * @private
     */
    _markDragableBlocks() {
        var self = this;
        this._blockNodes.forEach(function (block, index) {
            var data = self._blocksDropzonesData[index];
            block.classList.toggle('we3-disabled',
                !data.dropIn().length && !data.dropNear().length);
        });
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _onBlockMouseDown(ev) {
        this._handleBlockDragStart(ev, ev.target, ev.clientX, ev.clientY);
    }
    /**
     * @private
     */
    _onBlockTouchStart(ev) {
        var t = ev.touches[0];
        this._handleBlockDragStart(ev, ev.target, t.clientX, t.clientY, true);
    }
    /**
     * @private
     */
    _onHandleMouseDown(ev) {
        this._handleDOMDragStart(ev, ev.target, ev.clientX, ev.clientY);
    }
    /**
     * @private
     */
    _onHandleTouchStart(ev) {
        var t = ev.touches[0];
        this._handleDOMDragStart(ev, ev.target, t.clientX, t.clientY, true);
    }
    /**
     * @private
     */
    _onMouseMove(ev) {
        this._dragAndDropMove(ev.clientX, ev.clientY);
    }
    /**
     * @private
     */
    _onMouseUp(ev) {
        this._dragAndDropEnd();
    }
    /**
     * @private
     */
    _onOverlayRefresh() {
        this._createMoveUIElements();
    }
    /**
     * @private
     */
    _onTouchMove(ev) {
        this._dragAndDropMove(ev.touches[0].clientX, ev.touches[0].clientY);
    }
    /**
     * @private
     */
    _onTouchEnd(ev) {
        if (!this._selectedDropzone && ev.path[0].tagName === dropzoneUpperCaseTagName) {
            this._selectedDropzone = ev.path[0];
        }
        this._dragAndDropEnd();
    }
}

/**
 * Returns the minimum distance between a point and box.
 *
 * @param {object} point
 * @param {float} point.x
 * @param {float} point.y
 * @param {object} box
 * @param {float} box.left
 * @param {float} box.top
 * @param {float} box.width
 * @param {float} box.height
 * @returns {float}
 */
function _computePointToBoxSquaredDistance(point, box) {
    var boxLimits = {
        left: box.left,
        top: box.top,
        right: box.left + box.width,
        bottom: box.top + box.height,
    };
    var boxPoint = {x: undefined, y: undefined};

    if (point.x < boxLimits.left) {
        boxPoint.x = boxLimits.left;
    } else if (point.x > boxLimits.right) {
        boxPoint.x = boxLimits.right;
    } else {
        boxPoint.x = point.x;
    }

    if (point.y < boxLimits.top) {
        boxPoint.y = boxLimits.top;
    } else if (point.y > boxLimits.bottom) {
        boxPoint.y = boxLimits.bottom;
    } else {
        boxPoint.y = point.y;
    }

    return Math.pow(boxPoint.x - point.x, 2) + Math.pow(boxPoint.y - point.y, 2);
}

we3.addPlugin('DropBlock', DropBlockPlugin);

})();
