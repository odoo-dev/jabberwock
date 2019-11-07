import { defaultKeyMap } from './DefaultKeyMap';

export interface Keypress {
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
}
export interface CommandConfig {
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    arguments: Record<string, any>;
}
export type ShortcutIdentifier = string; // format: /[Ctrl+][Alt+][Shift+]key/
export type KeyMap = Map<ShortcutIdentifier, CommandConfig>;

export class KeyMapping {
    keyMap: KeyMap = new Map();
    constructor(customKeyMap?: KeyMap) {
        const map = customKeyMap || defaultKeyMap;
        map.forEach((value, key) => this.set(key, value));
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return the intent information corresponding to the given keypress
     * information, if any.
     *
     * @param keypress
     */
    fromKeypress(keypress: Keypress): CommandConfig {
        return this.keyMap.get(this._keypressToIdentifier(keypress));
    }
    /**
     * Set one or more new shortcuts in the map.
     *
     * @param shortcut
     * @param commandConfig
     */
    set(shortcuts: Record<ShortcutIdentifier, CommandConfig>): void;
    set(shortcut: ShortcutIdentifier, commandConfig?: CommandConfig): void;
    set(
        shortcut: Record<ShortcutIdentifier, CommandConfig> | ShortcutIdentifier,
        commandConfig?: CommandConfig,
    ): void {
        if (typeof shortcut === 'object') {
            Object.keys(shortcut).forEach(key => this.set(key, shortcut[key]));
        } else {
            this.keyMap.set(shortcut.toUpperCase(), commandConfig);
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Convert information about a keypress to a shortcut identifier.
     *
     * @param keypress
     */
    _keypressToIdentifier(keypress: Keypress): string {
        let identifier = '';
        if (keypress.ctrlKey) {
            identifier += 'Ctrl+';
        }
        if (keypress.altKey) {
            identifier += 'Alt+';
        }
        if (keypress.shiftKey) {
            identifier += 'Shift+';
        }
        return (identifier + keypress.key).toUpperCase();
    }
}
