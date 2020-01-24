import { CommandIdentifier, CommandArgs } from './Dispatcher';

export interface BoundCommand {
    /**
     * An undefined `commandId` effectively unbinds the shortcut.
     */
    readonly commandId: CommandIdentifier | undefined;
    readonly commandArgs?: CommandArgs;
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
    boundCommand?: BoundCommand;
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
     * Add or remove a shortuct.
     *
     * If `commandId` is set, add the shortcut.
     *
     * If there is no `commandId`, it means that we want nothing to execute.
     * Thus unbinding the command.
     *
     * @param patternString
     * @param commandId
     * @param commandArgs
     */
    bindShortcut(
        patternString: string,
        commandId?: CommandIdentifier,
        commandArgs?: CommandArgs,
    ): void {
        this.shortcuts.unshift({
            pattern: this.parsePattern(patternString),
            boundCommand: { commandId, commandArgs },
        });
    }

    /**
     * Get first BoundCommand found when providing `keyEvent`.
     *
     * @param keyEvent
     */
    match(keyEvent: KeyboardEvent): BoundCommand {
        const matchingMappings = this.shortcuts.find(shortcut => {
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

            return match;
        });
        return matchingMappings && matchingMappings.boundCommand;
    }

    /**
     * Parse a string that represend a pattern and return a `ShortuctPattern`.
     * Supported pattern is: [modifier+]*[<code>|key]
     *
     * @param pattern
     */
    parsePattern(pattern: string): ShortcutPattern {
        const tokens = pattern
            .trim()
            .replace(/cmd/gi, 'META')
            .split(/[+]/);
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
