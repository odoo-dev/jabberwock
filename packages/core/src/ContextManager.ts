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
    selector?: Predicate[];
    // If the selector match and a `check` callback has been provided, call
    // it with the current context to perform an additional checking.
    check?: (context: CheckingContext) => boolean;
}

export interface ContextualEntry<T> extends Contextual {
    selector: Predicate[];
    value: T;
}

export interface RankedResult<T> {
    lvl1Score: number;
    lvl2Score: number;
    index: number;
    matched: VNode[];
    entry: ContextualEntry<T>;
}

/**
 * Class that rank a hierarchy of vnode through a "specificity" algorithm.
 *
 * Specificity level is defined with:
 * - `lvl2`: if the last predicate of an item selector is deeper in the tree
 *   than the last predicate of another item selector; the first item have
 *   more specificity
 * - `lvl1`: if two or more items have the same `lvl2` specificity; the
 *   command with the longest selector will have more specificity
 * - `lvl0`: if the item has no selector (an empty list), there is no
 *   specificity
 * ```
 */
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
     * Test all contextuals against a hierarchy of VNodes and return the result
     * ordered by specificity.
     */
    static getRankedMatches<T>(
        hierarchy: VNode[],
        contextuals: ContextualEntry<T>[],
    ): RankedResult<T>[] {
        const matches: RankedResult<T>[] = [];

        for (let index = 0; index < contextuals.length; index++) {
            const contextual = contextuals[index];
            const match = ContextManager._matchNodes(hierarchy, contextual.selector);

            if (match) {
                matches.push({
                    lvl1Score: match[0],
                    lvl2Score: match[1].length,
                    matched: match[1],
                    index: index,
                    entry: contextual,
                });
            }
        }

        // Sort the matches:
        // - from highest to lowest score
        // - when the score is the same, from highest to lowest index
        const rankedMatch = matches.sort(function(a, b) {
            if (b.lvl1Score === a.lvl1Score && b.lvl2Score === a.lvl2Score) {
                return b.index - a.index;
            } else if (b.lvl1Score === a.lvl1Score) {
                return b.lvl2Score - a.lvl2Score;
            } else {
                return b.lvl1Score - a.lvl1Score;
            }
        });
        return rankedMatch;
    }
    /**
     * Match items selector depending on the editor current context range and
     * return the most specific item.
     *
     * @param items
     * @param paramsContext
     */
    match<T extends Contextual>(items: T[], paramsContext?: Context): [T, Context] {
        const context = { ...this.defaultContext, ...paramsContext };
        const start = context.range.start;
        const hierarchy = start.ancestors();
        const node = start.previousSibling() || start.nextSibling();
        if (node) {
            hierarchy.unshift(node);
        }
        const entries: ContextualEntry<T>[] = items.map(item => {
            const entry: ContextualEntry<T> = {
                selector: item.selector || [],
                value: item,
            };
            return entry;
        });

        const matches = ContextManager.getRankedMatches(hierarchy, entries);
        const match = matches.find(match => {
            return (
                !match.entry.value.check ||
                match.entry.value.check({ ...context, selector: match.matched })
            );
        });
        return [match?.entry.value, context];
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Check whether a hierarchy of `VNode` match with `selector`.
     *
     * The `hierarchy` is an array from the deepest node in a tree to the
     * shallowest.
     *
     * Return a tuple with the first value being level of specificity lvl2 and
     * the second value being the VNnode that matched with a selector
     * (specificity lvl1).
     */
    static _matchNodes(hierarchy: VNode[], selector: Predicate[]): [number, VNode[]] | undefined {
        const matches: VNode[] = [];
        const maximumDepth = hierarchy.length - 1;
        let firstMatchDepth = -1;
        let index = 0;
        for (const predicate of [...selector].reverse()) {
            let matchFound = false;
            while (!matchFound && index < hierarchy.length) {
                if (hierarchy[index].test(predicate)) {
                    matchFound = true;
                    matches.unshift(hierarchy[index]);
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
        return matches.length === selector.length && [firstMatchDepth, matches];
    }
}
