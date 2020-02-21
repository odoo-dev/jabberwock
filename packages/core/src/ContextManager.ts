import { VNode } from './VNodes/VNode';
import { CommandDefinition, CommandContext } from './Dispatcher';
import JWEditor from './JWEditor';

export class ContextManager {
    editor: JWEditor;
    defaultContext: CommandContext;

    constructor(editor: JWEditor) {
        this.editor = editor;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Match a command from the current context (the `vDocument` selection).
     *
     * Search through all command with `commandId` and return the last
     * `CommandDefinition` that match a particular context.
     *
     * Commands with more specificity will have priority.  If there is multiples
     * commands with the same specificity, the last defined will be retured.
     *
     * The context is the `vDocument.selection.range.start.ancestors()`.
     *
     * Specificity is defined with:
     * - `lvl2`: if the last predicate of a command "a"'s selector is deeper in
     *   the tree than the last predicate of a command "b"'s selector; command
     *   "a" have more specificity
     * - `lvl1`: if two or more commands have the same `lvl2` specificity; the
     *   command with the longest selector will have more specificity
     * - `lvl0`: if the command has no selector, there is no specificity
     *
     * For example:
     * ```typescript
     * const commandUlP: CommandDefinition = {
     *     selector: [isUl, isP],
     *     handler: () =>{},
     * }
     * const commandP: CommandDefinition = {
     *     selector: [isP],
     *     handler: () =>{},
     * }
     * const commandUl: CommandDefinition = {
     *     selector: [isUl],
     *     handler: () =>{},
     * }
     * const commandImage: CommandDefinition = {
     *     selector: [isImage],
     *     handler: () =>{},
     * }
     * const commandAny: CommandDefinition = {
     *     selector: [],
     *     handler: () =>{},
     * }
     * dispatcher.registerCommand('command', commandUlP)
     * dispatcher.registerCommand('command', commandP)
     * dispatcher.registerCommand('command', commandUl)
     * dispatcher.registerCommand('command', commandImage)
     * dispatcher.registerCommand('command', commandAny)
     * const result = dispatcher._mach('command')
     * ```
     *
     * If the document looks like:
     * ```html
     * <ul>
     *     <li>
     *         <!-- The char "[]" represent the collapsed selection -->
     *         <p>[]a</p>
     *     </li>
     * </ul>
     * ```
     *
     * The ancestors list is `['ul', 'li', 'p']`.
     *
     * The 4 command `commandUlP`, `commandP`, `commandUl`, `commandAny` could
     * match the `command` identifier but not `commandImage`.
     *
     * The priority is calculated with "`lvl2`,`lvl1`".
     * - `commandUlP` specificity: 2,2 `lvl2`: 2 means the last predicate
     *   (`isP`) is found at depth 2 in ancestors `lvl1`: 2 means there are 2
     *   predicates in `commandUlP`'s selector
     * - `commandP` specificity: 2,1 `lvl2`: 2 means the last predicate (`isP`)
     *   is found at depth 2 in ancestors `lvl1`: 1 means there is 1 predicate
     *   in `commandP`'s selector
     * - `commandUl` specificity: 0,1 `lvl0`: 0 means the last predicate
     *   (`isUl`) is found at depth 0 in ancestors `lvl1`: 1 means there is 1
     *   predicate in `commandP`'s selector
     * - `commandAny` specificity: -1,0 No selector means no specificity.
     *   `lvl0`: -1 means it has no depth.  `lvl1`: 0 means there is 0
     *   predicates in `commandAny`'s selector
     *
     * The result will be `commandUlP` because it has the highest specificity.
     *
     * @param commands
     * @param paramsContext
     */
    match(
        commands: CommandDefinition[],
        paramsContext?: CommandContext,
    ): [CommandDefinition, CommandContext] | [undefined, undefined] {
        let maxFirstMatchDepth = -1;
        let maxSelectorLength = 0;
        let matchingCommand: CommandDefinition;
        let matchingContext: CommandContext;

        let ancestors: VNode[] = [];
        if (this.editor.vDocument) {
            ancestors = this.editor.vDocument.selection.range.start.ancestors();
        }
        const maximumDepth = ancestors.length - 1;
        for (const command of commands) {
            const context = { ...this.defaultContext, ...command.context, ...paramsContext };
            let firstMatchDepth = -1;
            let ancestorIndex = 0;
            let match;
            const selector = command.selector || [];
            if (selector.length === 0) {
                match = true;
            } else {
                const range = context.range;
                const ancestors = range.start.ancestors();
                const maximumDepth = ancestors.length - 1;
                for (const predicate of [...selector].reverse()) {
                    match = false;
                    while (!match && ancestorIndex < ancestors.length) {
                        if (ancestors[ancestorIndex].test(predicate)) {
                            match = true;
                            if (firstMatchDepth === -1) {
                                // Deeper match has higher specificity. So lower
                                // index in ancestors, means higher specificity.
                                firstMatchDepth = maximumDepth - ancestorIndex;
                            }
                        }
                        ancestorIndex++;
                    }
                    // Stop checking the predicates of this particular command
                    // since at least one of them don't match the context.
                    if (!match) break;
                }
            }

            if (
                match &&
                maxFirstMatchDepth <= firstMatchDepth &&
                maxSelectorLength <= selector.length
            ) {
                maxFirstMatchDepth = firstMatchDepth;
                maxSelectorLength = selector.length;
                matchingCommand = command;
                matchingContext = context;
            }
        }
        return [matchingCommand, matchingContext];
    }
}
