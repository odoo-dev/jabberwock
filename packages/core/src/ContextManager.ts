import JWEditor from './JWEditor';
import { VRange } from './VRange';
import { Predicate, VNode } from './VNodes/VNode';

export interface Context {
    range?: VRange;
}

export interface CheckingContext extends Context {
    selector?: VNode[];
}

export interface Contextual {
    context?: Context;
    selector?: Predicate<VNode | boolean>[];
    check?: (context: CheckingContext) => boolean;
}

export class ContextManager {
    editor: JWEditor;
    defaultContext: Context;

    constructor(editor: JWEditor) {
        this.editor = editor;
        this.defaultContext = {
            range: this.editor.selection.range,
        };
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Match a command from the current context (the `vDocument` selection).
     *
     * Search through all command with `commandId` and return the last
     * `CommandImplementation` that match a particular context.
     *
     * Commands with more specificity will have priority.  If there is multiples
     * commands with the same specificity, the last defined will be retured.
     *
     * The context is the `editor.selection.range.start.ancestors()`.
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
     * const commandUlP: CommandImplementation = {
     *     selector: [isUl, isP],
     *     handler: () =>{},
     * }
     * const commandP: CommandImplementation = {
     *     selector: [isP],
     *     handler: () =>{},
     * }
     * const commandUl: CommandImplementation = {
     *     selector: [isUl],
     *     handler: () =>{},
     * }
     * const commandImage: CommandImplementation = {
     *     selector: [isImage],
     *     handler: () =>{},
     * }
     * const commandAny: CommandImplementation = {
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
     * @param items
     * @param paramsContext
     */
    match<T extends Contextual>(items: T[], paramsContext?: Context): [T, Context] {
        let maxFirstMatchDepth = -1;
        let maxSelectorLength = 0;
        let matchingItem: T;
        let matchingContext: Context;

        for (const item of items) {
            const context = { ...this.defaultContext, ...item.context, ...paramsContext };
            let firstMatchDepth = -1;
            let index = 0;
            const selector = item.selector || [];
            const matches: VNode[] = [];
            const start = context.range.start;
            const nodes = start.ancestors();
            const node = start.previousSibling() || start.nextSibling();
            if (node) {
                nodes.unshift(node);
            }
            const maximumDepth = nodes.length - 1;
            for (const predicate of [...selector].reverse()) {
                let matchFound = false;
                while (!matchFound && index < nodes.length) {
                    if (nodes[index].test(predicate)) {
                        matchFound = true;
                        matches.unshift(nodes[index]);
                        if (firstMatchDepth === -1) {
                            // Deeper match has higher specificity. So lower
                            // index in ancestors, means higher specificity.
                            firstMatchDepth = maximumDepth - index;
                        }
                    }
                    index++;
                }
                // Stop checking the predicates of this particular command
                // since at least one of them don't match the context.
                if (!matchFound) break;
            }

            if (
                matches.length === selector.length &&
                maxFirstMatchDepth <= firstMatchDepth &&
                maxSelectorLength <= selector.length &&
                (!item.check || item.check({ ...context, selector: matches }))
            ) {
                maxFirstMatchDepth = firstMatchDepth;
                maxSelectorLength = selector.length;
                matchingItem = item;
                matchingContext = context;
            }
        }
        return [matchingItem, matchingContext];
    }
}
