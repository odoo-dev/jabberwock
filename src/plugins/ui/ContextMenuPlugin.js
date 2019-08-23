(function () {
'use strict';

var PopoverPlugin = we3.getPlugin('Popover');

class ContextMenuPlugin extends PopoverPlugin {
    /**
     * @override
     */
    constructor () {
        super(...arguments);

        this.dependencies.push('History');
        this.templatesDependencies = ['src/xml/contextmenu.xml'];
        this.buttons = {
            template: 'wysiwyg.buttons.contextmenu',
            active: () => false,
            enabled: '_enabled',
        };
        this.editableDomEvents = {
            'contextmenu': '_onContextMenu',
        };
        this.documentDomEvents = {
            'mousedown': '_onMouseDown',
        };
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    redo () {
        this.dependencies.History.redo();
    }
    selectAll () {
        this.dependencies.Range.selectAll();
    }
    undo () {
        this.dependencies.History.undo();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _createPopover (params) {
        var contextMenu = document.createElement('we3-contextmenu');
        params.insertBeforeContainer(contextMenu);
        contextMenu.setAttribute('name', 'ContextMenu');
        this.contextMenu = {
            pluginNames: ['ContextMenu'],
            element: contextMenu,
            display: false,
        };
        this.popovers = [this.contextMenu];
    }
    /**
     * @override
     */
    _createPopoverButtons () {
        var render = this._renderButtons();
        this.contextMenu.element.appendChild(render.element);
        this.contextMenu.buttons = render.buttons;
    }
    /**
     * @override
     */
    _createPopoverCheckMethod () {
        return;
    }
    _enabled (buttonName) {
        if (buttonName === 'undo' || buttonName === 'redo') {
            return this.dependencies.History._enabled(buttonName);
        }
        return true;
    }
    /**
     * @override
     */
    _renderButtons () {
        var group = document.createElement('we3-group');
        group.innerHTML = this.options.renderTemplate('ContextMenu', this.buttons.template, {
            plugin: this,
            options: this.options,
        });
        var element = group.firstElementChild;
        element.setAttribute('data-plugin', 'ContextMenu');

        this._addButtonHandlers(this, element);
        var buttons = this._recordPluginButtons(this, element);

        return {
            element: element,
            buttons: buttons,
        };
    }
    /**
     * @override
     */
    _updatePopover () {
        this.contextMenu.display = true;
    }
    /**
     * @override
     */
    _updatePopoverButtons () {
        var self = this;
        var buttons = [].slice.call(this.contextMenu.element.getElementsByTagName('we3-button'));
        buttons.forEach(function (button) {
            var name = button.getAttribute('name');
            if (name) {
                var method = self.buttons.enabled;
                var enabled = typeof method === 'string' ? self[method](name) : method(name);
                button.classList[enabled ? 'remove' : 'add']('disabled');
            }
        });
        this._toggleDropDownEnabled();
        this._updatePluginPlaceholder();
    }
    _updatePosition (left, top) {
        this.contextMenu.element.style.left = left + 'px';
        this.contextMenu.element.style.top = top + 'px';
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    _onContextMenu (e) {
        e.preventDefault();
        this._updatePopover();
        this.contextMenu.element.style.display = 'flex';
        this._updatePopoverButtons();
        this._updatePosition(e.pageX, e.pageY);
    }
    _onMouseDown () {
        this.contextMenu.display = false;
        this.contextMenu.element.style.display = 'none';
    }
}

we3.addPlugin('ContextMenu', ContextMenuPlugin);

})();
