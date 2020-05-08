import { OwlComponent } from '../../../plugin-owl/src/ui/OwlComponent';
import { Keymap } from '../../../plugin-keymap/src/Keymap';
import { argsRepr } from '../utils';

export class ShortcutsComponent extends OwlComponent<{}> {
    mappings = this.env.editor.plugins
        .get(Keymap)
        .mappings.flat()
        .sort((a, b) => {
            if (a.configuredCommand.commandId < b.configuredCommand.commandId) return -1;
            if (a.configuredCommand.commandId > b.configuredCommand.commandId) return 1;
            return 0;
        });
    localStorage = ['currentTab'];
    argsRepr = argsRepr;
    stringifyPattern = this.env.editor.plugins.get(Keymap).stringifyPattern;
}
