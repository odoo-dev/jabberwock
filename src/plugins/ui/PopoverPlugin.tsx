(function () {
'use strict';

var handleSelector = function (element, selector, callback) {
    return function (ev) {
        var nodelist = element.querySelectorAll(selector);
        for (var k = nodelist.length - 1; k >= 0; k--) {
            var el = nodelist[k];
            if (el === ev.target || el.contains(ev.target)) {
                callback(ev);
                break;
            }
        }
    };
};

class PopoverPlugin extends we3.AbstractPlugin {
    constructor(parent, params) {
        super(...arguments);
        this.dependencies = ['Range', 'Renderer', 'Position'];
        this.POPOVER_MARGIN_LEFT = 5;
        this.POPOVER_MARGIN_TOP = 5;
        this._setOptionalDependencies(params);
        this._createPopover(params);
        this._buttonsEnableOnChange = [];
        this._buttonsActiveOnChange = [];
    }
    blurEditor () {
        this._updatePopovers();
    }
    focusEditor () {
        this._onFocusNode(this.dependencies.Range.getFocusedNode());
    }
    setEditorValue () {
        this._updatePopovers();
    }
    changeEditorValue () {
        if (!this._focusNode) {
            return;
        }
        var self = this;
        this._buttonsEnableOnChange.forEach(function (button) {
            var pluginName = button.getAttribute('data-plugin');
            var plugin = self.dependencies[pluginName];
            self._updatePluginButton(plugin, self._focusNode, button);
        });
        this._buttonsActiveOnChange.forEach(function (button) {
            var pluginName = button.getAttribute('data-plugin');
            var plugin = self.dependencies[pluginName];
            self._updatePluginButton(plugin, self._focusNode, button);
        });
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    start () {
        this._createPopoverCheckMethod();
        this._createPopoverButtons();
        this._toggleDropDownEnabled();
        this.dependencies.Position.on('scroll', this, this._onScroll);
        this.dependencies.Range.on('focus', this, this._onFocusNode);
        this.dependencies.Range.on('range', this, this._onRange);
        return super.start();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Creates the popover container and adds it to the right location.
     * Creates the local popover definitionss
     *
     * @param {object} params
     */
    _createPopover(params) {
        var self = this;
        this.popovers = [];
        var popovers = this.popoverOptions;
        Object.keys(popovers).forEach(function (checkMethodKey) {
            var pluginNames = popovers[checkMethodKey];
            var checkMethodPluginName = checkMethodKey.split('.')[0];

            var popover = document.createElement('we3-popover');
            popover.setAttribute('name', checkMethodPluginName);
            params.insertBeforeEditable(popover);

            self.popovers.push({
                pluginNames: pluginNames,
                checkMethodPluginName: checkMethodPluginName,
                checkMethodName: checkMethodKey.split('.')[1],
                element: popover,
                display: false,
            });
        });
    }
    _createPopoverCheckMethod () {
        var self = this;
        this.popovers.forEach(function (popover) {
            var plugin = self.dependencies[popover.checkMethodPluginName];
            popover.checkMethod = plugin[popover.checkMethodName].bind(plugin);
        });
    }
    /**
     * Create buttons into the created popovers
     */
    _createPopoverButtons () {
        var self = this;
        this.popovers.forEach(function (popover) {
            popover.buttons = [];
            popover.pluginNames.forEach(function (pluginName) {
                if (pluginName === '|') {
                    popover.element.appendChild(self._renderSeparator());
                } else {
                    var render = self._renderButtons(pluginName);
                    popover.element.appendChild(render.element);
                    popover.buttons = popover.buttons.concat(render.buttons);
                }
            });
        });
    }
    _renderButtons (pluginName) {
        var plugin = this.dependencies[pluginName];
        if (!plugin.buttons || !plugin.buttons.template) {
            throw new Error('Button template of "' + pluginName + '" plugin is missing.');
        }

        var group = document.createElement('we3-group');
        group.innerHTML = this.options.renderTemplate(plugin.pluginName, plugin.buttons.template, {
            plugin: plugin,
            options: this.options,
        });
        var element = group.children.length === 1 ? group.children[0] : group;
        element.setAttribute('data-plugin', plugin.pluginName);

        this._addButtonHandlers(plugin, element);
        var buttons = this._recordPluginButtons(plugin, element);

        return {
            element: element,
            buttons: buttons,
        };
    }
    _renderSeparator () {
        return document.createElement('we3-separator');
    }
    _addButtonHandlers (plugin, element) {
        this._addButtonHandlersEvents(plugin, element);
        this._addButtonHandlersDataMethod(plugin, element);
        this._addButtonHandlersDropdown(element);

        // prevent all click (avoid href...)
        element.addEventListener('mousedown', function (ev) {
            ev.preventDefault();
        }, false);
        element.addEventListener('click', function (ev) {
            ev.preventDefault();
        }, false);
        element.addEventListener('mouseup', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            if (ev.target.tagName === 'INPUT') {
                ev.target.focus();
            }
        }, false);
    }
    _addButtonHandlersEvents (plugin, element) {
        // add plugins button event as handler
        var events = plugin.buttons.events;
        if (events) {
            Object.keys(events).forEach(function (key) {
                var handle = events[key];
                var eventName = key.split(' ').shift();
                var selector = key.split(' ').slice(1).join(' ');
                if (typeof handle === 'string') {
                    handle = plugin[handle];
                }
                handle = handle.bind(plugin);

                if (selector) {
                    handle = handleSelector(element, selector, handle);
                }
                element.addEventListener(eventName, handle, false);
            });
        }
    }
    _addButtonHandlersDataMethod (plugin, element) {
        var _onButtonMousedown = this._onButtonMousedown.bind(this, plugin);
        if (!element.getAttribute('data-method')) {
            _onButtonMousedown = handleSelector(element, 'we3-button[data-method]', _onButtonMousedown);
        }
        element.addEventListener('mousedown', _onButtonMousedown, false);
    }
    _addButtonHandlersDropdown (element) {
        var dropdowns = element.tagName === 'WE3-DROPDOWN' ? [element] : element.querySelectorAll('we3-dropdown');
        dropdowns.forEach(function (dropdown) {
            var toggler = dropdown.querySelector('we3-toggler');
            var dropdownContents = dropdown.lastElementChild;
            dropdownContents.style.display = 'none';

            var mousedownCloseDropdown = function (ev) {
                if (!dropdown.contains(ev.target)) {
                    dropdownContents.style.display = 'none';
                    document.removeEventListener('click', mousedownCloseDropdown);
                }
            };

            dropdown.addEventListener('click', function () {
                var open = !toggler.classList.contains('disabled')
                    && dropdownContents.style.display === 'none';
                dropdownContents.style.display = open ? '' : 'none';
                if (open) {
                    toggler.classList.add('active');
                    document.addEventListener('click', mousedownCloseDropdown, false);
                } else {
                    toggler.classList.remove('active');
                }
            }, false);
        });
    }
    _getNewPosition (popover, focusNode) {
        var top = this.POPOVER_MARGIN_TOP;
        var target = this.dependencies.Renderer.getElement(focusNode.id);
        var offset = 0;
        var position;
        if (popover.useRangePosition) {
            var fontSize = this.window.getComputedStyle(target.tagName ? target : target.parentNode).getPropertyValue('font-size');
            top += parseInt(fontSize);
            position = this.dependencies.Position.getPosition();
        } else {
            var focus = this.dependencies.Renderer.getElement(focusNode.id);
            target = popover.targetArchNode ? this.dependencies.Renderer.getElement(popover.targetArchNode.id) : target;
            if (focus !== target && target.contains(focus)) {
                top += focus.offsetHeight || focus.parentNode.offsetHeight;
            }
            position = this.dependencies.Position.getPosition(target, offset);
        }
        var pos = this.editor.getBoundingClientRect();
        var newPos = {
            left: position.left - pos.left + this.POPOVER_MARGIN_LEFT,
            top: position.top - pos.top + top,
            leftEditableParent: pos.left,
            topEditableParent: pos.top,
        };
        return newPos;
    }
    _recordPluginButtons (plugin, element) {
        // add created dom on plugin buttons object
        if (!plugin.buttons.elements) {
            plugin.buttons.elements = [];
            plugin.buttons.buttons = [];
        }
        plugin.buttons.elements.push(element);
        var buttons = [].slice.call(element.getElementsByTagName('we3-button'));
        if (element.tagName === 'WE3-BUTTON') {
            buttons.push(element);
        }
        buttons.forEach(function (button) {
            button.setAttribute('data-plugin', plugin.pluginName);
            plugin.buttons.buttons.push(button);
            if (button.getAttribute('name')) {
                button.classList.add('disabled');
            }
        });

        return buttons;
    }
    _domFind (selector) {
        var elements = [];
        this.popovers.forEach(function (popover) {
            elements = elements.concat([].slice.call(popover.element.querySelectorAll(selector)));
        });
        return elements;
    }
    _setOptionalDependencies () {
        var self = this;
        this.popoverOptions = Object.assign(JSON.parse(JSON.stringify(we3.options.popover)), this.options.popover);
        var dependencies = this.dependencies.slice();
        Object.keys(this.popoverOptions).forEach(function (checkMethod) {
            var plugins = self.popoverOptions[checkMethod];
            if (checkMethod.indexOf('.') !== -1) {
                dependencies.push(checkMethod.split('.')[0]);
            }
            plugins.forEach(function (plugin) {
            if (plugin !== '|' && dependencies.indexOf(plugin) === -1)
                dependencies.push(plugin);
            });
        });
        this.dependencies = dependencies;
    }
    _toggleDropDownEnabled () {
        this.popovers.forEach(function (popover) {
            if (!popover.display) {
                return;
            }
            popover.element.querySelectorAll('we3-dropdown').forEach(function (dropdown) {
                var toggler = dropdown.querySelector('we3-toggler');
                var dropdownContents = dropdown.lastElementChild;
                toggler.classList.toggle('disabled', !dropdownContents.querySelector('we3-button[name]:not(.disabled)'));
            });
        });
    }
    _togglePluginButtonToggle (plugin, focusNode, buttonName, methodName) {
        var enabledMedthodName = plugin.buttons[methodName];
        if (enabledMedthodName) {
            var active = true;
            if (typeof enabledMedthodName === 'string') {
                active = !!plugin[enabledMedthodName](buttonName, focusNode);
            } else {
                active = !!enabledMedthodName.call(plugin, buttonName, focusNode);
            }
            return active;
        }
        return focusNode ? null : false;
    }
    _updatePluginButton (plugin, focusNode, button) {
        var name = button.getAttribute('name');
        var enabled = this._togglePluginButtonToggle(plugin, focusNode, name, 'enabled');
        if (enabled || enabled === null) {
            button.classList.remove('disabled');
            var active = this._togglePluginButtonToggle(plugin, focusNode, name, 'active');
            if (active) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        } else {
            button.classList.add('disabled');
        }
    }
    _updatePluginPlaceholder (plugin, focusNode, button) {
        this.popovers.forEach(function (popover) {
            popover.element.querySelectorAll('we3-dropdown').forEach(function (dropdown) {
                var placeholder = dropdown.querySelector('we3-placeholder');
                if (!placeholder || dropdown.querySelector('we3-toggler').classList.contains('disabled')) {
                    return;
                }

                placeholder.innerHTML = '';
                var activeButton = dropdown.querySelector('we3-button.active');
                if (!activeButton) {
                    return;
                }

                var clone = activeButton.cloneNode(true);
                clone.removeAttribute('data-method');
                clone.removeAttribute('data-value');
                clone.classList.remove('active');
                placeholder.appendChild(clone);
            });
        });
    }
    _updatePopovers (focusNode) {
        var self = this;
        this._focusNode = focusNode;
        this._hasDisplayedPopoverUseRangePosition = false;
        this.popovers.forEach(function (popover) {
            self._updatePopover(popover, focusNode);
            if (popover.useRangePosition) {
                self._hasDisplayedPopoverUseRangePosition = true;
            }
        });
    }
    _updatePopover (popover, focusNode) {
        var targetArchNode = focusNode && popover.checkMethod(focusNode);
        if (!targetArchNode) {
            popover.targetArchNode = null;
            popover.element.style.display = '';
            popover.display = false;
            return;
        }
        if (targetArchNode.isText() || !targetArchNode.isVoidoid() && targetArchNode.isInlineFormatNode()) {
            popover.useRangePosition = true;
        }
        popover.display = true;
        popover.targetArchNode = targetArchNode;
    }
    _updatePopoverButtons (focusNode) {
        var self = this;
        this._buttonsEnableOnChange = [];
        this._buttonsActiveOnChange = [];
        this.popovers.forEach(function (popover) {
            if (!popover.display) {
                return;
            }

            var buttons = [].slice.call(popover.element.getElementsByTagName('we3-button'));
            if (popover.element.tagName === 'WE3-BUTTON') {
                buttons.push(popover.element);
            }

            buttons.forEach(function (button) {
                if (!button.getAttribute('name')) {
                    return;
                }
                var checkOnChange = button.getAttribute('data-check-on-change');
                if (checkOnChange) {
                    if (checkOnChange.indexOf('enabled') !== -1) {
                        self._buttonsEnableOnChange.push(button);
                    }
                    if (checkOnChange.indexOf('active') !== -1) {
                        self._buttonsActiveOnChange.push(button);
                    }
                }
                var pluginName = button.getAttribute('data-plugin');
                var plugin = self.dependencies[pluginName] || self._getParent()._plugins[pluginName];
                self._updatePluginButton(plugin, focusNode, button);
            });
        });
        this._toggleDropDownEnabled();
        this._updatePluginPlaceholder();
    }
    /**
     * Update the position of the popover in CSS.
     *
     * @private
     */
    _updatePosition (popover, focusNode) {
        var popoverElement = popover.element;
        var newPos = this._getNewPosition(popover, focusNode);
        if (newPos.top < 0) {
            popoverElement.style.display = 'none';
            return;
        }
        popoverElement.style.display = 'flex';

        var mouse = this.dependencies.Position.getMousePosition();
        var top = mouse.pageY - newPos.topEditableParent;
        var left = mouse.pageX - newPos.leftEditableParent;

        var height = 40;
        if (newPos.top <= top && newPos.top + height >= top && newPos.left <= left && newPos.left + popover.element.getBoundingClientRect().width >= left) {
            newPos.top = top + this.POPOVER_MARGIN_TOP;
        }

        // var $container = $(this.options.container);
        // var containerWidth = $container.width();
        // var containerHeight = $container.height();

        // var popoverWidth = $popover.width();
        // var popoverHeight = $popover.height();

        // var isBeyondXBounds = pos.left + popoverWidth >= containerWidth - this.POPOVER_MARGIN_LEFT;
        // var isBeyondYBounds = pos.top + popoverHeight >= containerHeight - this.POPOVER_MARGIN_TOP;
        // pos = {
        //     left: isBeyondXBounds ?
        //         containerWidth - popoverWidth - this.POPOVER_MARGIN_LEFT :
        //         pos.left,
        //     top: isBeyondYBounds ?
        //         pos.top = containerHeight - popoverHeight - this.POPOVER_MARGIN_TOP :
        //         (pos.top > 0 ? pos.top : this.POPOVER_MARGIN_TOP),
        // };

        popoverElement.style.left = newPos.left + 'px';
        popoverElement.style.top = newPos.top + 'px';
    }
    _updatePositions (focusNode) {
        var self = this;
        this.popovers.forEach(function (popover) {
            if (popover.display) {
                self._updatePosition(popover, focusNode);
            }
        });
        this._updatePositionAvoidOverlap();
    }
    _updatePositionAvoidOverlap () {
        var popovers = [];
        this.popovers.forEach(function (popover) {
            if (popover.display) {
                popovers.push(popover);
            }
        });
        popovers.sort(function (a, b) {
            return a.targetArchNode.contains(b.targetArchNode) ? 1 : -1;
        });
        var bottom = 0;
        popovers.forEach(function (popover) {
            var pos = popover.element.getBoundingClientRect();
            var top = parseInt(popover.element.style.top);
            if (top < bottom) {
                popover.element.style.top = bottom + 'px';
            } else {
                bottom = top;
            }
            bottom += pos.height;
        });
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    _onButtonMousedown (plugin, ev) {
        ev.preventDefault();
        if (ev.which !== 1) {
            return;
        }
        var button = ev.target;
        while (button !== this.editable.parentNode && button.tagName !== 'WE3-BUTTON') {
            button = button.parentNode;
        }

        if (button.classList.contains('disabled')) {
            return;
        }

        // var pluginName = button.getAttribute('data-plugin');
        var method = button.getAttribute('data-method');
        var value = button.hasAttribute('data-value') ? button.getAttribute('data-value') : undefined;
        var popover;
        this.popovers.forEach(function (p) {
            if (p.buttons.indexOf(button) !== -1) {
                popover = p;
            }
        });
        var checkMethod = popover && popover.checkMethod;
        var focusNode = this.dependencies.Range.getFocusedNode();
        if (checkMethod) {
            focusNode = checkMethod(focusNode);
            if (!focusNode) {
                return;
            }
        }
        var buttonOptions;
        if (button.getAttribute('options')) {
            buttonOptions = JSON.parse(button.getAttribute('options'));
        }

        plugin[method](value, focusNode);
        if (this.dependencies.Range.getFocusedNode().id === focusNode.id) {
            this._updatePopovers(focusNode);
            this._updatePopoverButtons(focusNode);
            this._updatePositions(focusNode);
        }
    }
    /**
     * On change focus node, update the popover position and the active button
     *
     * @private
     */
    _onFocusNode (focusNode) {
        if (this._focusNode && this._focusNode.parent && focusNode.parent && focusNode.isText() && this._focusNode.isText() && focusNode.parent.id === this._focusNode.parent.id) {
            return;
        }
        this._updatePopovers(focusNode);
        this._updatePopoverButtons(focusNode);
        this._updatePositions(focusNode);
    }
    /**
     * @private
     */
    _onRange () {
        var self = this;
        if (this._hasDisplayedPopoverUseRangePosition) {
            var focusNode = this.dependencies.Range.getFocusedNode();
            this.popovers.forEach(function (popover) {
                if (popover.display && popover.useRangePosition) {
                    self._updatePosition(popover, focusNode);
                }
            });
            this._updatePositionAvoidOverlap();
        }
    }
    /**
     * @private
     */
    _onScroll () {
        this._updatePositions(this.dependencies.Range.getFocusedNode());
    }
}

we3.addPlugin('Popover', PopoverPlugin);

})();
