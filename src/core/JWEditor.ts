import { Action } from './actions/Action';
import { Dispatcher } from './dispatcher/Dispatcher';
import { JWPlugin } from './JWPlugin';

export interface JWEditorConfig {
    theme: string;
};

export class JWEditor {
    el: HTMLElement;
    dispatcher: Dispatcher<Action>;
    pluginsRegistry: JWPlugin[];

    constructor (el = document.body) {
        this.el = el;
        this.dispatcher = new Dispatcher();
        this.pluginsRegistry = [];
    }

    start () {
        this.el.setAttribute('contenteditable', 'true');
    }

    addPlugin(plugin: typeof JWPlugin) {
        this.pluginsRegistry.push(new plugin(this.dispatcher));
    }

    loadConfig(config: JWEditorConfig) {
        console.log(config.theme);
    }
};

export default JWEditor;
