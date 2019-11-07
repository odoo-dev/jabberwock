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
     * Set a new shortcut in the map.
     *
     * @param shortcut
     * @param commandInformation
     */
    set(shortcut: ShortcutIdentifier, commandInformation: CommandConfig): void {
        this.keyMap.set(shortcut.toLowerCase(), commandInformation);
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
        return (identifier + keypress.key).toLowerCase();
    }
}
