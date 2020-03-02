import JWEditor from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CommandIdentifier } from '../../core/src/Dispatcher';
import { Contextual } from '../../core/src/ContextManager';

export interface ConfiguredCommand extends Contextual {
    /**
     * An undefined `commandId` effectively unbinds the shortcut.
     */
    readonly commandId: CommandIdentifier | undefined;
    readonly commandArgs?: {};
}

interface ModifiedShortcut {
    modifiers: Set<string>;
}

interface KeyShortcutPattern extends ModifiedShortcut {
    key: string;
}

interface CodeShortcutPattern extends ModifiedShortcut {
    code: string;
}

type ShortcutPattern = KeyShortcutPattern | CodeShortcutPattern;

interface Mapping {
    pattern: ShortcutPattern;
    configuredCommand?: ConfiguredCommand;
}

export enum Platform {
    MAC = 'mac',
    PC = 'pc',
}

export interface Shortcut extends ConfiguredCommand {
    platform?: Platform;
    pattern: string;
}

export enum LEVEL {
    DEFAULT,
    USER,
}

export interface KeymapConfig extends JWPluginConfig {
    platform?: Platform;
}

/**
 * Keymap allow to add and remove shortucts and provide a function to match a
 * keyboard event with the registered shortcuts patterns.
 *
 * ## Adding shortcuts
 * The expression to describe a shortuct is zero or more `modifiers` and one
 * `hotkey` joined with the symbol `+`.
 *
 * ### Modifiers
 * - SHIFT
 * - ALT
 * - CTRL
 * - META
 * - CMD (alias of META)
 *
 * Example:
 * ```typescript
 * // using a modifier and one key
 * keymap.bind('CTRL+A', 'commandIdentifier')
 * // using multiples modifiers and one key
 * keymap.bind('CTRL+ALT+A', 'commandIdentifier')
 * ```
 *
 * ### Hotkeys
 * A hotkey can be wether a `key` or `code`.
 *
 * #### Key
 * The syntax to describe a `key` is to write the `key` as it is. The convention
 * is to write it in uppercase.
 *
 * Example:
 * ```typescript
 * keymap.bind('CTRL+A', 'commandIdentifier')
 * ```
 * The list of possible `key` values are defined in the following link:
 * https://www.w3.org/TR/uievents/#dom-keyboardevent-key
 *
 * #### Code
 * The syntax to describe a `code` is to write `<code>` (surrounded by "<" and
 * ">").
 *
 * Example:
 * ```typescript
 * keymap.bind('CTRL+<KeyA>', 'commandIdentifier')
 * ```
 *
 * The list of possible `code` values are defined in the following link:
 * https://www.w3.org/TR/uievents/#dom-keyboardevent-key
 *
 * ## Removing shortucts
 * To remove a shortuct, call `bind` without specifying a commandIdentifier.
 *
 * Example:
 * ```typescript
 * keymap.bind('CTRL+<KeyA>')
 * ```
 */
export class Keymap<T extends KeymapConfig = KeymapConfig> extends JWPlugin<T> {
    readonly loaders = {
        shortcuts: this._loadShortcuts,
    };
    mappings: Mapping[][] = [...new Array(LEVEL.USER + 1)].map(() => []);
    defaultMappings: Mapping[] = [];
    userMappings: Mapping[] = [];

    constructor(public editor: JWEditor, public config: T) {
        super(editor, config);
        if (!config.platform) {
            const isMac = navigator.platform.match(/Mac/);
            config.platform = isMac ? Platform.MAC : Platform.PC;
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Bind a shortuct.
     *
     * If there is no `command.commandId`, it means that we want nothing to
     * execute, thus replacing the command originally bound on this shortcut.
     *
     * @param pattern
     * @param command
     */
    bind(pattern: string, command: ConfiguredCommand, level = LEVEL.DEFAULT): void {
        this.mappings[level].push({
            pattern: this.parsePattern(pattern),
            configuredCommand: command,
        });
    }

    /**
     * Return all configured commands which shortcut match the given `keyEvent`.
     *
     * @param keyEvent
     */
    match(keyEvent: KeyboardEvent): ConfiguredCommand[] {
        const matchingCommands: ConfiguredCommand[] = [];
        for (let level = LEVEL.USER; level >= 0; level--) {
            for (const shortcut of this.mappings[level]) {
                const modifiers = shortcut.pattern.modifiers;

                let match: boolean;
                if ('code' in shortcut.pattern) {
                    match = shortcut.pattern.code === keyEvent.code;
                } else {
                    match = shortcut.pattern.key === keyEvent.key.toUpperCase();
                }

                match =
                    match &&
                    modifiers.has('CTRL') === keyEvent.ctrlKey &&
                    modifiers.has('SHIFT') === keyEvent.shiftKey &&
                    modifiers.has('META') === keyEvent.metaKey &&
                    modifiers.has('ALT') === keyEvent.altKey;

                if (match) {
                    if (!shortcut.configuredCommand.commandId) {
                        // An `undefined` command unbounds the other commands
                        // previously registered on this shortcut.
                        matchingCommands.length = 0;
                    }
                    matchingCommands.push(shortcut.configuredCommand);
                }
            }

            if (matchingCommands.length) {
                // Matches were found at this level so do not look lower.
                break;
            }
        }
        return matchingCommands;
    }

    /**
     * Parse a string that represend a pattern and return a `ShortuctPattern`.
     * Supported pattern is: [modifier+]*[<code>|key]
     *
     * @param pattern
     */
    parsePattern(pattern: string): ShortcutPattern {
        const tokens = pattern
            .replace(/cmd/gi, 'META')
            .split(/[+]/)
            .map(token => token.trim());
        const keyCode = tokens.pop();
        const modifiers = new Set(tokens.map(token => token.toUpperCase()));
        if (!keyCode) {
            throw new Error('You must have at least one key or code.');
        }
        // There are two ways to specify a shortcut hotkey : key or code
        // - "CTRL+1" is the modifier CTRL with the event.key "1".
        // - "CTRL+<Key1>" is the modifier CTRL with the event.code "Key1"
        const codeMatch = keyCode.match(/^<(\w+)>$/);
        if (codeMatch && codeMatch.length > 1) {
            return { code: codeMatch[1], modifiers };
        } else {
            return { key: keyCode.toUpperCase(), modifiers };
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Load a shortcut in the keymap depending on the platform.
     *
     * - If the shortuct has no platform property; load the shortuct in both
     *   platform ('mac' and 'pc').
     * - If the shortuct has no platform property and the current platform is
     *   mac, modify the ctrl key to meta key.
     * - If the shortuct has a platform property, only load the shortcut for
     *   that platform.
     * - If no `mapping.commandId` is declared, it means removing the shortcut.
     *
     * @param shortcuts The shortuct definitions.
     * @param source The source of the shortcuts.
     */
    _loadShortcuts(shortcuts: Shortcut[], source?: JWPlugin | {}): void {
        for (const shortcut of [...shortcuts]) {
            // A shortcut is a configured command on which the properties
            // `pattern`, and optionally `platform`, were set.
            const platform = shortcut.platform;
            if (!platform || platform === this.config.platform) {
                let pattern = shortcut.pattern;
                const command: ConfiguredCommand = shortcut;
                // Patterns using the CTRL modifier target CMD instead for Mac.
                if (!platform && this.config.platform === Platform.MAC) {
                    pattern = shortcut.pattern.replace(/ctrl/gi, 'CMD');
                }
                if (source instanceof JWPlugin) {
                    this.bind(pattern, command, LEVEL.DEFAULT);
                } else {
                    this.bind(pattern, command, LEVEL.USER);
                }
            }
        }
    }
}
