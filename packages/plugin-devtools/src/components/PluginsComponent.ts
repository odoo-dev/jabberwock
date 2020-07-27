import { OwlComponent } from '../../../plugin-owl/src/OwlComponent';

export class PluginsComponent extends OwlComponent<{}> {
    plugins = Array.from(this.env.editor.plugins.values())
        .map(plugin => plugin.constructor.name)
        .sort();
    localStorage = ['currentTab'];
}
