import { Predicate, VNode } from './VNodes/VNode';
import { ContextManager, ContextualEntry } from './ContextManager';

export interface ModeRule {
    selector: Predicate[];
    editable?: boolean;
    breakable?: boolean;
}
export type ModeIdentifier = string;
export interface ModeDefinition {
    id: ModeIdentifier;
    rules: ModeRule[];
}

/**
 * Properties of a `VNode` that can be modified by a mode.
 */
export enum RuleProperty {
    EDITABLE = 'editable',
    BREAKABLE = 'breakable',
}
const modeProperties = ['editable', 'breakable'];

type RuleEntries = Partial<Record<RuleProperty, ContextualEntry<boolean>[]>>;

export class Mode {
    id: ModeIdentifier;
    private readonly _rules: ModeRule[];
    private readonly _entries: RuleEntries;
    constructor(mode: ModeDefinition) {
        this.id = mode.id;
        this._rules = mode.rules;

        // Convert the rules into an object describing them for each property.
        const ruleEntries: RuleEntries = modeProperties.reduce((accumulator, property) => {
            accumulator[property] = [];
            return accumulator;
        }, {});
        this._entries = this._rules.reduce((accumulator, rule) => {
            for (const property of modeProperties) {
                if (typeof rule[property] === 'boolean') {
                    const entry: ContextualEntry<boolean> = {
                        selector: rule.selector,
                        value: rule[property],
                    };
                    ruleEntries[property].push(entry);
                }
            }
            return accumulator;
        }, ruleEntries);
    }
    /**
     * Return true if this mode defines the given node's property as true. If
     * the mode does not define a value for the given node's property then
     * return true if the actual value of the property on the node itself is
     * true.
     *
     * @param node
     * @param property
     */
    is(node: VNode, property: RuleProperty): boolean {
        const hierarchy = [...node.ancestors(), node];
        const result = ContextManager.getRankedMatches(hierarchy, this._entries[property]);
        if (result.length) {
            return result[0].entry.value;
        } else {
            return node[property];
        }
    }
}
