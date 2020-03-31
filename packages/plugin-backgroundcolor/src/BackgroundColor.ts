import { Color, ColorConfig } from '../../plugin-color/src/Color';
import { Loadables } from '../../core/src/JWEditor';
import { Keymap } from '../../plugin-keymap/src/Keymap';

export class BackgroundColor<T extends ColorConfig = ColorConfig> extends Color<T> {
    styleName = 'background-color';
    configuration = { defaultColor: 'white', ...this.configuration };
    commands = {
        colorBackground: {
            handler: this.color,
        },
        uncolorBackground: {
            handler: this.uncolor,
        },
    };
    readonly loadables: Loadables<Keymap> = {
        shortcuts: [
            {
                pattern: 'CTRL+H',
                commandId: 'colorBackground',
                // TODO: use dialog to get params
                commandArgs: {
                    color: 'yellow',
                },
            },
            {
                pattern: 'CTRL+SHIFT+H',
                commandId: 'uncolorBackground',
            },
        ],
    };
}
