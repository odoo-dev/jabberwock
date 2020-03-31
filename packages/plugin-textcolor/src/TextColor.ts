import { Color, ColorConfig } from '../../plugin-color/src/Color';
import { Loadables } from '../../core/src/JWEditor';
import { Keymap } from '../../plugin-keymap/src/Keymap';

export class TextColor<T extends ColorConfig = ColorConfig> extends Color<T> {
    styleName = 'color';
    configuration = { defaultColor: 'black', ...this.configuration };
    commands = {
        colorText: {
            handler: this.color,
        },
        uncolorText: {
            handler: this.uncolor,
        },
    };
    readonly loadables: Loadables<Keymap> = {
        shortcuts: [
            {
                pattern: 'CTRL+G',
                commandId: 'colorText',
                // TODO: use dialog to get params
                commandArgs: {
                    color: 'red',
                },
            },
            {
                pattern: 'CTRL+SHIFT+G',
                commandId: 'uncolorText',
            },
        ],
    };
}
