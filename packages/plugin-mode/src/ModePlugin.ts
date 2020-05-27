import { JWPluginConfig, JWPlugin } from '../../core/src/JWPlugin';
import { Mode, ModeIdentifier, ModeDefinition } from './Mode';

export type ModeConfig = JWPluginConfig;
export class ModePlugin<T extends ModeConfig = ModeConfig> extends JWPlugin<T> {
    readonly loaders = {
        modes: this._loadModes,
    };
    _definitions: Record<ModeIdentifier, ModeDefinition> = {
        default: {
            id: 'default',
            rules: [],
            checkEditable: false,
        },
    };
    getMode(modeIdentifier: ModeIdentifier): Mode | undefined {
        const modeDefinition = this._definitions[modeIdentifier];
        if (modeDefinition) {
            return new Mode(modeDefinition);
        } else {
            return new Mode(this._definitions.default);
        }
    }

    _loadModes(modes: ModeDefinition[]): void {
        for (const mode of modes) {
            this._definitions[mode.id] = mode;
        }
    }
}
