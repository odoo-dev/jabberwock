(function () {
'use strict';

class SidebarPlugin extends we3.AbstractPlugin {
    /**
     * @constructor
     * @param {Object} parent
     * @param {Object} params
     * @param {Object} options
     **/
    constructor (parent, params, options) {
        super(...arguments);

        this.dependencies = [];

        this._sidebar = document.createElement('we3-sidebar');
        params.insertBeforeContainer(this._sidebar);

        this._stack = [];
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Toggles a class on the sidebar element.
     *
     * @param {string} className
     * @param {boolean} [add]
     * @returns {boolean}
     */
    toggleClass(className, add) {
        return this._sidebar.classList.toggle(className, add);
    }
    /**
     * Closes the sidebar.
     *
     * @param {DOMElement[]} elements
     */
    close(elements) {
        this.toggle(elements, false);
    }
    /**
     * Opens the sidebar.
     *
     * @param {DOMElement[]} elements
     */
    open(elements) {
        this.toggle(elements, true);
    }
    /**
     * @param {object} self
     * @param {object} events
     */
    registerEvents(self, events) {
        self._bindDOMEvents(this._sidebar, events);
    }
    /**
     * Opens/closes the sidebar. The first argument is the elements to display
     * in the sidebar.
     *
     * @param {DOMElement[]} elements
     * @param {boolean} [show]
     */
    toggle(elements, show) {
        var self = this;

        // Add current elements in the stack
        var oldElements = [].slice.call(this._sidebar.children);
        if (oldElements.length) {
            this._stack.push(oldElements);
        }

        // Search the stack for the elements which are being toggled
        var elementsIndex = -1;
        this._stack.forEach(function (stackElements, stackIndex) {
            if (stackElements.length !== elements.length) {
                return;
            }
            var isEqual = stackElements.every(function (el, index) {
                return el === elements[index];
            });
            if (isEqual) {
                elementsIndex = stackIndex;
            }
        });

        // We want to show the elements if explicitely asked to or if we want to
        // toggle them and they are not on top of the stack (otherwise we want
        // to hide them / remove them from the stack)
        if (show === undefined) {
            show = !(elementsIndex >= 0 && elementsIndex === (this._stack.length - 1));
        }

        // In any case, start by emptying the sidebar
        while (this._sidebar.firstChild) {
            this._sidebar.removeChild(this._sidebar.firstChild);
        }

        if (show) {
            if (elementsIndex >= 0) {
                // If we want to show elements which are already in the stack
                // remove the top ones from the stack (including them).
                this._stack.splice(elementsIndex);
            }
        } else {
            // Otherwise only remove the elements from the stack and select the
            // elements at the end of it.
            if (elementsIndex >= 0) {
                this._stack.splice(elementsIndex, 1);
            }
            elements = this._stack.pop();
        }
        // Then add the elements in the sidebar
        if (elements) {
            elements.forEach(function (el) {
                self._sidebar.appendChild(el);
            });
        }

        // The sidebar is opened if it contains elements
        this.isOpened = !!elements;
        this._sidebar.classList.toggle('we3-sidebar-visible', this.isOpened);
    }
}

we3.addPlugin('Sidebar', SidebarPlugin);

})();
