(function () {
'use strict';

var OVERLAY_OFFSET = 10000; // The same value is used in CSS

class OverlayPlugin extends we3.AbstractPlugin {
    /**
     * @constructor
     * @param {Object} parent
     * @param {Object} params
     * @param {Object} options
     **/
    constructor(parent, params, options) {
        super(...arguments);

        this.dependencies = ['Renderer'];

        this.editableDomEvents = {
            'mousemove': '_onMouseMove',
        };

        this._overlay = document.createElement('we3-overlay');
        params.insertAfterEditable(this._overlay);

        this._uiElements = [];
        this._uiNodeIDs = [];
        this._uiAllData = [];

        this._isActive = true;
    }
    /**
     * @override
     */
    start() {
        var prom = super.start(...arguments);
        this.__onWindowResize = this._onWindowResize.bind(this);
        window.addEventListener('resize', this.__onWindowResize);
        return prom;
    }
    /**
     * @override
     */
    destroy() {
        super.destroy(...arguments);
        window.removeEventListener('resize', this.__onWindowResize);
    }

    //--------------------------------------------------------------------------
    // Editor methods
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    changeEditorValue() {
        this._adaptToDOMChanges(); // FIXME this does not seem to work
    }
    /**
     * @override
     */
    setEditorValue() {
        this._adaptToDOMChanges();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @param {DOMElement} uiElement
     * @param {number} nodeID
     * @param {object} [data]
     */
    addUIElement(uiElement, nodeID, data, extraClass) {
        var node = this.dependencies.Renderer.getElement(nodeID);
        node.classList.add('we3-overlay-enabled');
        if (extraClass) {
            node.classList.add(extraClass);
        }

        this._uiElements.push(uiElement);
        this._uiNodeIDs.push(nodeID);
        this._uiAllData.push(data);

        this._overlay.appendChild(uiElement);
    }
    /**
     * Disables the overlay behaviors.
     */
    block() {
        this._hideUIElements();
        this._isActive = false;
    }
    /**
     * @param {DOMElement|number} id
     *      The ui element itself or the related node id
     */
    getUIElementData(id) {
        var index;
        if (typeof id === 'number') {
            index = this._uiNodeIDs.indexOf(id);
        } else {
            index = this._uiElements.indexOf(id);
        }
        return this._uiAllData[index];
    }
    /**
     * @param {DOMElement} uiElement
     */
    getUIElementNodeID(uiElement) {
        var index = this._uiElements.indexOf(uiElement);
        return this._uiNodeIDs[index];
    }
    /**
     * @param {object} self
     * @param {object} events
     */
    registerUIEvents(self, events) {
        self._bindDOMEvents(this._overlay, events);
    }
    /**
     * Repositions the UI elements according to potential DOM changes.
     */
    reposition() {
        var self = this;
        var Renderer = this.dependencies.Renderer;

        var originBox = this._overlay.getBoundingClientRect();

        this._uiElements.forEach(function (ui, index) {
            if (!ui.classList.contains('we3-overlay-ui-visible')) {
                return;
            }
            var node = Renderer.getElement(self._uiNodeIDs[index]);
            var nodeBox = node.getBoundingClientRect();

            ui.style.left = (nodeBox.left - originBox.left) + 'px';
            ui.style.top = (nodeBox.top - originBox.top - OVERLAY_OFFSET) + 'px';
            ui.style.width = (nodeBox.width) + 'px';
            ui.style.height = (nodeBox.height) + 'px';
        });
    }
    /**
     * Enables the overlay behaviors.
     */
    unblock() {
        this._isActive = true;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _adaptToDOMChanges() {
        // Destroy all UI elements
        this._uiElements.forEach(function (el) {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
        this._uiElements = [];
        this._uiNodeIDs = [];
        this._uiAllData = [];

        // Unmark all DOM elements which were marked as "overlay-enabled"
        this.editable.querySelectorAll('.we3-overlay-enabled').forEach(function (el) {
            el.classList.remove('we3-overlay-enabled');
        });

        // Notify that the overlay elements were destroyed
        this.trigger('overlay_refresh');
    }
    /**
     * @private
     */
    _hideUIElements() {
        this._uiElements.forEach(function (ui) {
            ui.classList.remove('we3-overlay-ui-visible');
        });
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * Checks if the user is moving over an overlay-enabled element and if so
     * enabled its related overlay. Note: this is done on mousemove instead on
     * mouseover/mouseout/mouseenter/mouseleave for simplicity.
     *
     * @private
     */
    _onMouseMove(ev) {
        var self = this;
        if (!this._isActive) {
            return;
        }

        this._hideUIElements();

        var node = ev.target;
        while (node && node.classList) {
            if (node.classList.contains('we3-overlay-enabled')) {
                break;
            }
            node = node.parentNode;
        }
        if (!node || !node.classList) {
            return;
        }

        var nodeID = this.dependencies.Renderer.getID(node);
        var originBox = this._overlay.getBoundingClientRect();
        var nodeBox = node.getBoundingClientRect();

        this._uiElements.forEach(function (ui, index) {
            if (self._uiNodeIDs[index] !== nodeID) {
                return;
            }

            ui.style.left = (nodeBox.left - originBox.left) + 'px';
            ui.style.top = (nodeBox.top - originBox.top - OVERLAY_OFFSET) + 'px';
            ui.style.width = (nodeBox.width) + 'px';
            ui.style.height = (nodeBox.height) + 'px';
            ui.classList.add('we3-overlay-ui-visible');
        });
    }
    /**
     * @private
     */
    _onWindowResize() {
        this.reposition();
    }
}

we3.addPlugin('Overlay', OverlayPlugin);

})();
