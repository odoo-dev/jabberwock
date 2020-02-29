import { CommandIdentifier } from './Dispatcher';
import { Contextual } from './ContextManager';

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

interface Shortcut {
    pattern: ShortcutPattern;
    configuredCommand?: ConfiguredCommand;
}

/**
 * Keymap allow to add and remove shortucts and provide a function to match if a
 * particular pattern is found within registred shortucts.
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
 * keymap.bindShortuct('CTRL+A', 'commandIdentifier')
 * // using multiples modifiers and one key
 * keymap.bindShortuct('CTRL+ALT+A', 'commandIdentifier')
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
 * keymap.bindShortuct('CTRL+A', 'commandIdentifier')
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
 * keymap.bindShortuct('CTRL+<KeyA>', 'commandIdentifier')
 * ```
 *
 * The list of possible `code` values are defined in the following link:
 * https://www.w3.org/TR/uievents/#dom-keyboardevent-key
 *
 * ## Removing shortucts
 * To remove a shortuct, call `bindShortcut` without commandIdentifier
 *
 * Example:
 * ```typescript
 * keymap.bindShortuct('CTRL+<KeyA>')
 * ```
 */
export class Keymap {
    shortcuts: Shortcut[] = [];

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Bind a shortuct.
     *
     * If there is no `command.commandId`, it means that we want nothing to
     * execute, thus replacing the command originally bound on this shortcut.
     *
     * @param patternString
     * @param command
     */
    bindShortcut(patternString: string, command: ConfiguredCommand): void {
        this.shortcuts.push({
            pattern: this.parsePattern(patternString),
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
        for (const shortcut of this.shortcuts) {
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
}
