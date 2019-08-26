var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define("src/core/JWEditor", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ;
    function JWEditor(el = document.body) {
        const pluginsRegistry = [];
        return {
            start: () => {
                el.setAttribute('contenteditable', 'true');
            },
            addPlugin: (plugin) => {
                pluginsRegistry.push(plugin);
            },
            addPlugins: (plugins) => {
                plugins.forEach(plugin => pluginsRegistry.push(plugin));
            },
            loadConfig: (config) => {
                console.log(config.theme);
            },
        };
    }
    exports.default = JWEditor;
});
define("src/plugins/Awesome", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function Awesome(options) {
        return {
            init: () => { },
        };
    }
    exports.default = Awesome;
    ;
});
define("example", ["require", "exports", "src/core/JWEditor", "src/plugins/Awesome"], function (require, exports, JWEditor_1, Awesome_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    JWEditor_1 = __importDefault(JWEditor_1);
    Awesome_1 = __importDefault(Awesome_1);
    (() => {
        const editor = JWEditor_1.default(document.querySelector('jw-editor'));
        editor.addPlugin(Awesome_1.default);
        editor.loadConfig({
            theme: 'CoolTheme',
        });
        editor.start();
    })();
});
define("src/core/actions/ActionID", ["require", "exports"], function (require, exports) {
    "use strict";
    var ActionID;
    (function (ActionID) {
        ActionID[ActionID["INSERT"] = 0] = "INSERT";
        ActionID[ActionID["UPDATE"] = 1] = "UPDATE";
        ActionID[ActionID["REMOVE"] = 2] = "REMOVE";
    })(ActionID || (ActionID = {}));
    return ActionID;
});
define("src/core/dispatcher/Dispatcher", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function Dispatcher() {
        return {
            dispatch: (action) => { },
            isDispatching: () => {
                return false;
            },
            register: (callback) => {
                return '';
            },
            unregister: (id) => { },
            waitFor: (ids) => { },
        };
    }
    exports.default = Dispatcher;
});
define("src/core/actions/Actions", ["require", "exports", "src/core/actions/ActionID", "src/core/dispatcher/Dispatcher"], function (require, exports, ActionID_1, Dispatcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ActionID_1 = __importDefault(ActionID_1);
    Dispatcher_1 = __importDefault(Dispatcher_1);
    const Dispatcher = Dispatcher_1.default();
    ;
    function Actions() {
        return {
            insert: (value, position, origin) => {
                Dispatcher.dispatch({
                    type: ActionID_1.default.INSERT,
                    value: value,
                    position: position,
                    origin: origin,
                });
            },
            remove: (origin, target) => {
                Dispatcher.dispatch({
                    type: ActionID_1.default.REMOVE,
                    target: target,
                    origin: origin,
                });
            },
            update: (value, origin, target) => {
                Dispatcher.dispatch({
                    type: ActionID_1.default.UPDATE,
                    value: value,
                    target: target,
                    origin: origin,
                });
            }
        };
    }
    exports.default = Actions;
});
