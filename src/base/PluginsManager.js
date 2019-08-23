(function () {
'use strict';

var pluginsRegistry = we3.pluginsRegistry = {};
function whiteList (pluginName) {
    return [ 'Arch', 'Range', 'Renderer', 'Rules', 'BaseArch', 'BaseRange', 'BaseRenderer', 'BaseRules', 'BaseUserInput', 'Selector'].indexOf(pluginName) !== -1;
}
function isBase (pluginName) {
    return ['BaseArch', 'BaseRange', 'BaseRenderer', 'BaseRules', 'BaseUserInput'].indexOf(pluginName) !== -1;
}

we3.PluginsManager = class extends we3.EventDispatcher {
    /**
     * The plugin can call insertBeforeEditable and insertAfterEditable to add content
     * in the dom.
     * Before all plugins are started, the plugins can't have access to the DOM.
     *
     */
    constructor (parent, params, options) {
        super(parent);
        this.options = options || {};
        this.editor = params.editor;
        // nby review: wtf?
        delete params.editor;
        // nby review: wtf?
        params.plugins.BaseArch = true;
        params.plugins.BaseRange = true;
        params.plugins.BaseRenderer = true;
        params.plugins.BaseRules = true;
        params.plugins.BaseUserInput = true;
        params.plugins.Arch = true;
        params.plugins.Range = true;
        params.plugins.Rules = true;
        params.plugins.UserInput = true;
        this._promiseLoadPlugins = this._loadPlugins(params, options);
        this.on('change', this, this.changeEditorValue);
        this.on('callPluginMethod', this, this._onCallPluginMethod);
    }
    /**
     * Return a Promise resolved when the plugin is initialized and can be started
     * This method can't start new call or perform calculations, must just return
     * the deferreds created in the init method.
     *
     * @returns {Promise}
     */
    isInitialized () {
        var promises = [];
        for (var i = 0; i < this._pluginNames.length; i++) {
            promises.push(this._plugins[this._pluginNames[i]].isInitialized());
        }
        promises.push(this._promiseLoadPlugins);
        return Promise.all(promises);
    }
    /**
     * Start all plugins when all plugins are initialized and the editor and plugins
     * are inserted into the deepest container.
     *
     * Begin to call every plugins 'willStart' method in dependencies order then
     * call every plugins 'start' method in anti dependencies order
     *
     * When all plugin are started, the DOM references are added to all plugins
     *
     * @returns {Promise}
     */
    async start () {
        var promises = [];
        for (var i = 0; i < this._pluginNames.length; i++) {
            await this._plugins[this._pluginNames[i]].willStart();
        }
        for (var i = this._pluginNames.length - 1; i >= 0; i--) {
            await this._plugins[this._pluginNames[i]].start();
        }
        this._afterStartAddDomTools();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Call the given method of the given plugin, with the given arguments.
     *
     * @param {string} pluginName
     * @param {string} methodName
     * @param {any []} [args]
     */
    // nby review: why do we need to call a function of a plugin from the plugin manager?
    call (pluginName, methodName, args) {
        var plugin = this._plugins[pluginName];
        if (plugin) {
            return plugin[methodName].apply(plugin, args);
        }
    }

    /**
     * The following methods call methods of the same name in `AbstractPlugin`, which in turn
     * can be overridden from within any plugin to allow it to add specific behavior to any of
     * these basic actions on the editor (eg modifying the value to save, then passing it to
     * the next plugin's saveEditor override etc.).
     */

    /**
     * Inform all plugins that the editor was blurred.
     */
    blurEditor () {
        this._each('blurEditor');
    }
    /**
     * Discard the changes in the editor
     *
     * @returns {Promise}
     */
    cancelEditor () {
        return this._eachAsync('cancelEditor');
    }
    /**
     * Inform all plugins of a change in the editor's value.
     *
     * @param {we3.Event} ev
     * @param {Object} ev.data
     * @param {Object[]} ev.data.changes
     */
    changeEditorValue (ev) {
        this._each('changeEditorValue', ev.data.changes);
    }
    /**
     * Inform all plugins that the editor was focused.
     */
    focusEditor () {
        this._each('focusEditor');
    }
    /**
     * Note: This method must be idempotent.
     *
     * @param {object} [options]
     * @param {boolean} [options.keepVirtual] true to include virtual text nodes
     * @param {boolean} [options.architecturalSpace] true to include architectural space
     * @param {boolean} [options.showIDs] true to show the arch node id's
     * @returns {string}
     */
    getEditorValue (options) {
        this._each('getEditorValue', null, ['BaseArch']);
        return this._plugins.BaseArch.getEditorValue(options);
    }
    /**
     * Note: Please only change the string value without using the DOM.
     * The value is received from Arch getEditorValue.
     *
     * @returns {Promise<ArchNode>}
     */
    saveEditor () {
        var self = this;
        var Arch = this._plugins.Arch;
        this._each('getEditorValue', null, ['BaseArch']);
        return this._eachAsync('saveEditor').then(function () {
            var arch = Arch.getClonedArchNode(1);
            arch.nextUntil(function () {}); // force to clone all this
            return arch;
        });
    }
    /**
     * Set the value of the editor.
     *
     * @param {string} value
     */
    // nby review: why the plugin manager do set the baseArch editor value?
    // the plugin manager should not know anything about the BaseArch
    setEditorValue (value) {
        this._plugins.BaseArch.setEditorValue(value);
        this._each('setEditorValue', null, ['BaseArch']); // avoid double BaseArch call
    }
    /**
     * Translate a string within a plugin.
     *
     * @param {string} pluginName
     * @param {string} string
     * @param {string} originalValue
     * @param {Node} elem
     * @param {string} attributeName
     * @returns {string|null}
     */
    translatePluginString (pluginName, string, originalValue, elem, attributeName) {
        for (var i = 0; i < this._pluginNames.length; i++) {
            var plugin = this._plugins[this._pluginNames[i]];
            string = plugin.translatePluginTerm(pluginName, string, originalValue, elem, attributeName);
        }
        return string;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Add references to the DOM node of the editor into every plugin, after start.
     *
     * @private
     */
    _afterStartAddDomTools () {
        var obj = {};
        var Arch = this._plugins.Arch;
        for (var k in Arch) {
            if (k[0] !== '_' && !this[k] && typeof Arch[k] === 'function') {
                obj[k] = Arch[k] = Arch[k].bind(Arch);
            }
        }
        Object.assign(obj, this.options);
        this._each('_afterStartAddDomReferences', this.editor);
    }
    /**
     * 
     * @private
     * @param {Object} params
     * @param {Object} options
     * @returns {Plugin []}
     */
    _createPluginInstance (params, options) {
        var pluginNames = [];

        Object.keys(params.plugins).forEach(function (pluginName) {
            if (params.plugins[pluginName]) {
                pluginNames.push(pluginName);
            }
        });

        var conflictsPlugins = [];
        var autoInstallPlugins = [];
        Object.keys(pluginsRegistry).forEach(function (pluginName) {
            var Plugin = pluginsRegistry[pluginName];
            if (Plugin.autoInstall && pluginNames.indexOf(pluginName) === -1 && params.plugins[pluginName] !== false) {
                autoInstallPlugins.push({
                    name: pluginName,
                    need: Plugin.autoInstall.slice(),
                });
            }
            if (Plugin.conflicts) {
                conflictsPlugins.push(Plugin.conflicts.concat([pluginName]));
            }
        });

        this.target = params.target;

        var pluginInstances = {};
        while (pluginNames.length) {
            this._createPluginInstanceLoadDependencies(params, options, pluginInstances, pluginNames, autoInstallPlugins);
            this._createPluginInstanceAutoInstall(params, options, pluginInstances, pluginNames, autoInstallPlugins, conflictsPlugins);
        }
        return pluginInstances;
    }
    /**
     * Add `autoInstallPlugins` and remove `conflictsPlugins` from `pluginNames`.
     *
     * @private
     * @param {Object} params
     * @param {Object} options
     * @param {Plugin []} pluginInstances
     * @param {String []} pluginNames
     * @param {Object []} autoInstallPlugins {name: {String}, need: {String []}
     * @param {String []} conflictsPlugins
     */
    _createPluginInstanceAutoInstall (params, options, pluginInstances, pluginNames, autoInstallPlugins, conflictsPlugins) {
        autoInstallloop:
        for (var k = autoInstallPlugins.length - 1; k >= 0 ; k--) {
            var autoInstall = autoInstallPlugins[k];
            var pluginName = autoInstall.name;

            if (autoInstall.need.length) {
                continue;
            }

            autoInstallPlugins.splice(k, 1);

            if (pluginNames.indexOf(pluginName) !== -1 || pluginInstances[pluginName]) {
                continue;
            }

            for (var i = 0; i < conflictsPlugins.length; i++) {
                var list = conflictsPlugins[i];
                if (list.indexOf(pluginName) === -1) {
                    continue;
                }
                for (var u = 0; u < list.length; u++) {
                    if (!pluginInstances[list[u]]) {
                        continue;
                    }
                    continue autoInstallloop;
                }
            }

            pluginNames.push(pluginName);
        }
    }
    /**
     * Create an instance of a plugin and load its dependencies.
     *
     * @private
     * @param {Object} params
     * @param {Object} options
     * @param {Plugin []} pluginInstances
     * @param {String []} pluginNames
     * @param {Object []} autoInstallPlugins {name: {String}, need: {String []}
     */
    _createPluginInstanceLoadDependencies (params, options, pluginInstances, pluginNames, autoInstallPlugins) {
        var pluginName;
        while (pluginName = pluginNames.shift()) {
            var Plugin = this._getPluginConstructor(params, pluginName);
            if (!Plugin) {
                throw new Error('Plugin not found: "' + pluginName + '"');
            }
            var pluginInstance = new Plugin(this, params, options);
            pluginInstance.pluginName = pluginName;

            // add dependencies

            for (var k = 0; k < pluginInstance.dependencies.length; k++) {
                var pName = pluginInstance.dependencies[k];
                if (pluginNames.indexOf(pName) === -1 && !pluginInstances[pName]) {
                    pluginNames.push(pName);
                }
            }
            pluginInstances[pluginName] = pluginInstance;

            // add autoInstall plugins

            for (var k = 0; k < autoInstallPlugins.length; k++) {
                var autoInstall = autoInstallPlugins[k];
                var index;
                while ((index = autoInstall.need.indexOf(pluginName)) !== -1) {
                    autoInstall.need.splice(index, 1);
                }
            }
        }
    }
    /**
     * Call the given method on every plugin that has it,
     * with the given arguments.
     *
     * @private
     * @param {string} methodName
     * @param {any} value
     * @returns {any}
     */
    _each (methodName, value, except) {
        for (var i = 0; i < this._pluginNames.length; i++) {
            var pluginName = this._pluginNames[i];
            if (except && except.indexOf(pluginName) !== -1) {
                continue;
            }
            var plugin = this._plugins[pluginName];
            value = plugin[methodName](value) || value;
        }
        return value;
    }
    /**
     * Call the given method asynchronously on every plugin
     * that has it, with the given arguments.
     *
     * @private
     * @param {string} methodName
     * @param {any} value
     * @returns {Promise}
     */
    _eachAsync (methodName, value) {
        var promise = Promise.resolve(value);
        for (var i = 0; i < this._pluginNames.length; i++) {
            var pluginName = this._pluginNames[i];
            var plugin = this._plugins[pluginName];
            promise.then(plugin[methodName].bind(plugin));
        }
        return promise;
    }
    /**
     * Get the constructor for the given plugin.
     *
     * @private
     * @param {Object} params
     * @param {String} pluginName
     * @returns {Object}
     */
    _getPluginConstructor (params, pluginName) {
        var Plugin = typeof params.plugins[pluginName] === 'function' ? params.plugins[pluginName] : pluginsRegistry[pluginName];
        if (!Plugin) {
            throw new Error("The plugin '" + pluginName + "' is unknown or couldn't be loaded.");
        }
        return Plugin;
    }
    /**
     * Sort the plugin names with the deepest dependencies in first.
     *
     * @private
     * @param {Plugin []} pluginInstances
     * @returns {String []}
     */
    _getSortedPluginNames (pluginInstances) {
        var pluginNames = Object.keys(pluginInstances);
        function deepestPluginsDependent(pluginNames) {
            var deep = [];
            pluginNames.forEach(function (pluginName) {
                var pluginInstance = pluginInstances[pluginName];
                if (!pluginInstance._deepestPluginsDependent) {
                    var dependencies = pluginInstance.dependencies;
                    if (dependencies && dependencies.length && !isBase(pluginInstance.pluginName)) {
                        pluginInstance._deepestPluginsDependent = Math.max.apply(Math, deepestPluginsDependent(dependencies)) + 1;
                    } else {
                        pluginInstance._deepestPluginsDependent = 1;
                    }
                }
                deep.push(pluginInstance._deepestPluginsDependent);
            });
            return deep;
        }
        deepestPluginsDependent(pluginNames);

        pluginNames.sort(function (a, b) {
            return pluginInstances[a]._deepestPluginsDependent - pluginInstances[b]._deepestPluginsDependent;
        });
        pluginNames.splice(pluginNames.indexOf('BaseArch'), 1);
        pluginNames.unshift('BaseArch');

        for (var i = 0; i < pluginNames.length; i++) {
            delete pluginInstances[pluginNames[i]]._deepestPluginsDependent;
        }

        return pluginNames;
    }
    /**
     * Load all plugins required by options and autoinstall.
     *
     * @see we3/options.js
     * @private
     * @param {Object} params
     * @param {Object} options
     * @returns {Promise}
     */
    _loadPlugins (params, options) {
        var self = this;
        this._plugins = this._createPluginInstance(params, options);
        this._pluginNames = this._getSortedPluginNames(this._plugins);
        var promises = [this._loadTemplatesDependencies(this._pluginNames, this._plugins, options)];

        for (var i = 0; i < this._pluginNames.length; i++) {
            var pluginName = this._pluginNames[i];
            var pluginInstance = this._plugins[pluginName];
            var dependencies = {};
            for (var k = 0; k < pluginInstance.dependencies.length; k++) {
                var depName = pluginInstance.dependencies[k];
                if (whiteList(pluginName) || !isBase(depName)) {
                    dependencies[depName] = this._plugins[depName];
                } else {
                    throw new Error("Non-base plugin '" + pluginName +
                        "' is trying to access base plugin '" + depName +
                        "'. I won't let you.\n" +
                        "Signed: Your Father, Luke.");
                }
            }
            pluginInstance.dependencies = Object.freeze(dependencies);
            promises.push(pluginInstance.isInitialized());
        }

        return Promise.all(promises).then(function () {
            Object.freeze(self._plugins);
        });
    }
    /**
     * Load templates dependencies.
     *
     * @private
     * @param {String []} pluginNames
     * @param {Plugin []} pluginInstances
     * @param {Object} options
     * @returns {any}
     */
    _loadTemplatesDependencies (pluginNames, pluginInstances, options) {
        var templatesDependencies = [];
        for (var i = 0; i < pluginNames.length; i++) {
            var pluginInstance = pluginInstances[pluginNames[i]];
            for (var k = 0; k < pluginInstance.templatesDependencies.length; k++) {
                var src = pluginInstance.templatesDependencies[k];
                src = src[0] === '/' ? src : this.options.xhrPath + src;
                if (templatesDependencies.indexOf(src) === -1) {
                    templatesDependencies.push(src);
                }
            }
        }
        return options.loadTemplates(templatesDependencies);
    }

    //--------------------------------------------------------------------------
    // Handler
    //--------------------------------------------------------------------------

    _onCallPluginMethod (ev) {
        var res = this.call(ev.data.pluginName, ev.data.methodName, ev.data.args);
        if (ev.data.callback) {
            ev.data.callback(res);
        }
    }
};

we3.addPlugin = function (pluginName, Plugin) {
    if (whiteList(pluginName)) {
        throw new Error("Trying to overwritten base plugin '" + pluginName +
            "'. I won't let you, learn your lesson.\n" +
            "Signed: Obi-Wan.");
    }
    if (pluginsRegistry[pluginName]) {
        console.info('The wysiwyg "' + pluginName + '" plugin was overwritten');
    }
    pluginsRegistry[pluginName] = Plugin;
    return this;
};
we3.getPlugin = function (pluginName) {
    if (whiteList(pluginName)) {
        throw new Error("Trying to acces base plugin '" + pluginName +
            "'. I won't let you, learn your lesson.\n" +
            "Signed: Obi-Wan.");
    }
    return pluginsRegistry[pluginName];
};



})();
