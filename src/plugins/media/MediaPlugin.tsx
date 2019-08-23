(function () {
'use strict';

//--------------------------------------------------------------------------
// Media & add media modal
//--------------------------------------------------------------------------

class MediaPlugin extends we3.AbstractPlugin {
    /**
     * @override
     */
    constructor (parent, params) {
        super(...arguments);
        this.templatesDependencies = ['src/xml/media.xml'];
        this.dependencies = ['Arch', 'Range', 'Renderer', 'Rules', 'Modal'];
        this.editableDomEvents = {
            'dblclick': '_onDblclick',
        };
        this.buttons = {
            template: 'we3.buttons.media',
        };
        this._panels = [];
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Open the image dialog and listen to its saved/closed events.
     */
    addMedia (value, archNode) {
        return new Promise(this._createModal.bind(this, archNode.ancestor('isMedia')));
    }
    /**
     *
     * @param {string} title
     * @param {function} callback
     *      returns Promise({active: boolean, content: DocumentFragment})
     * @param {function} onSave
     *      return a Promise resolved by DOM element or JSON
     **/
    addPanel (name, title, renderPanel, onSave, priority) {
        this._panels.push({
            text: title,
            renderPanel: renderPanel,
            onSave: onSave,
            priority: priority,
            name: name,
        });
        this._panels.sort(function (a, b) { return a.priority - b.priority; });
    }
    getArchNode (archNode) {
        return archNode.ancestor('isMedia');
    }
    /**
     * Remove the current target media and hide its popover.
     */
    removeMedia (value, archNode) {
        var mediaArchNode = archNode.ancestor('isMedia');
        if (mediaArchNode) {
            this.dependencies.Arch.remove(mediaArchNode.id);
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _createModal (mediaArchNode, resolve) {
        if (this._modalId) {
            return resolve && resolve();
        }
        var self = this;
        var title = this.options.translate('Media', 'Select a Media');
        return this._createModalContent(mediaArchNode).then(function (fragment) {
            var buttons = [{
                text: self.options.translate('Media', mediaArchNode ? 'Save' : 'Add'),
                click: self._onClickSave.bind(self, mediaArchNode),
                className: 'we3-primary',
            }, {
                text: self.options.translate('Media', 'Cancel'),
            }];
            self._modalId = self.dependencies.Modal.add(self.pluginName, title, fragment, buttons, function onClose () {
                self._modalId = null;
                resolve && resolve();
            });
        });
    }
    _createModalContent (mediaArchNode) {
        var self = this;
        var promises = [];
        var fragment = this._renderTemplate('we3.modal.media');
        var tablist = fragment.querySelector('we3-tablist');
        var tabpanels = fragment.querySelector('we3-tabpanels');

        tabpanels.addEventListener('dblclick', self._onDoubleClickPanel.bind(self, mediaArchNode), false);

        var hasActive = false;
        var panels = [];

        this._panels.forEach(function (tab, index) {
            var res = tab.renderPanel(mediaArchNode);
            var button = document.createElement('we3-button');
            button.setAttribute('role', 'tab');
            button.setAttribute('name', tab.name);
            button.textContent = tab.text;
            button.addEventListener('click', self._onClickTab.bind(self), false);

            var tabpanel = document.createElement('we3-tabpanel');
            tabpanel.setAttribute('role', 'tabpanel');
            tabpanel.appendChild(res.content);

            if (!hasActive && res.active) {
                tabpanel.classList.add('active');
                button.classList.add('active');
                hasActive = true;
            }
            panels[index] = [button, tabpanel];
        });

        return Promise.all(promises).then(function () {
            panels.forEach(function (panel) {
                tablist.appendChild(panel[0]);
                tabpanels.appendChild(panel[1]);
            });
            if (!hasActive) {
                var tabpanel = tabpanels.querySelector('we3-tabpanel');
                if (tabpanel) {
                    tabpanel.classList.add('active');
                    tablist.querySelector('we3-button').classList.add('active');
                }
            }
            return fragment;
        });
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    _onClickSave (mediaArchNode) {
        var self = this;
        var modal = this.dependencies.Modal.get(this._modalId);
        var tabpanels = modal.querySelector('we3-tabpanels');
        var activePanel = tabpanels.querySelector('we3-tabpanel.active');
        var pluginOnSave = this._panels[[].indexOf.call(tabpanels.children, activePanel)].onSave;
        pluginOnSave(activePanel).then(function (media) {
            console.log('TODO use', mediaArchNode);
            if (mediaArchNode) {
                self.dependencies.Range.setRange({
                    scID: mediaArchNode.parent.id,
                    so:   mediaArchNode.index() + 1,
                });
                self.dependencies.Arch.insert(media);
                self.dependencies.Arch.remove(mediaArchNode.id);
            } else {
                self.dependencies.Arch.insert(media);
            }
        });
    }
    _onDblclick (ev) {
        var id = this.dependencies.Renderer.getID(ev.target);
        var mediaArchNode = id && this.dependencies.Arch.getClonedArchNode(id).ancestor('isMedia', true);
        if (mediaArchNode) {
            ev.preventDefault();
            ev.stopPropagation();
            this._createModal(mediaArchNode, null);
        }
    }
    _onDoubleClickPanel (mediaArchNode, ev) {
        ev.preventDefault();
        ev.stopPropagation();
        this._onClickSave(mediaArchNode);
        this.dependencies.Modal.remove(this._modalId);
    }
    _onClickTab (ev) {
        var tablist = ev.target.parentNode;
        var tabpanels = tablist.nextElementSibling;
        var active = tablist.querySelector('.active');
        if (active !== ev.target) {
            active.classList.remove('active');
            tabpanels.querySelector('.active').classList.remove('active');
        }
        ev.target.classList.add('active');
        var index = [].indexOf.call(tablist.childNodes, ev.target);
        tabpanels.childNodes[index].classList.add('active');
    }
}

we3.addPlugin('Media', MediaPlugin);

})();
