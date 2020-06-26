import { OwlComponent } from '../../../plugin-owl/src/OwlComponent';
import { Keymap } from '../../../plugin-keymap/src/Keymap';
import { argsRepr } from '../utils';
import { flat } from '../../../utils/src/utils';

export class ShortcutsComponent extends OwlComponent<{}> {
    mappings = flat(this.env.editor.plugins.get(Keymap).mappings).sort((a, b) => {
        if (a.configuredCommand.commandId < b.configuredCommand.commandId) return -1;
        if (a.configuredCommand.commandId > b.configuredCommand.commandId) return 1;
        return 0;
    });
    localStorage = ['currentTab'];
    argsRepr = argsRepr;
    stringifyPattern = this.env.editor.plugins.get(Keymap).stringifyPattern;
}
