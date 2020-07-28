import { Predicate, VNode } from './VNodes/VNode';
import { ContextManager, ContextualEntry } from './ContextManager';

export interface ModeRule {
    selector: Predicate[];
    properties: { [K in RuleProperty]?: PropertyDefinition };
}
export type ModeIdentifier = string;
export interface ModeDefinition {
    id: ModeIdentifier;
    rules: ModeRule[];
}
export interface PropertyDefinition {
    value: boolean;
    cascading?: boolean; // default: false
}
/**
 * Properties of a `VNode` that can be modified by a mode.
 */
export enum RuleProperty {
    EDITABLE = 'editable',
    BREAKABLE = 'breakable',
    ALLOW_EMPTY = 'allowEmpty',
}

type RuleEntries = Partial<Record<RuleProperty, ContextualEntry<PropertyDefinition>[]>>;

export class Mode {
    id: ModeIdentifier;
    private readonly _rules: ModeRule[];
    private readonly _entries: RuleEntries;
    constructor(mode: ModeDefinition) {
        this.id = mode.id;
        this._rules = mode.rules;

        // Convert the rules into an object describing them for each property.
        const ruleEntries: RuleEntries = {};
        this._entries = this._rules.reduce((accumulator, rule) => {
            for (const property of Object.keys(rule.properties) as RuleProperty[]) {
                const entry: ContextualEntry<PropertyDefinition> = {
                    selector: rule.selector,
                    value: rule.properties[property],
                };
                if (!ruleEntries[property]) ruleEntries[property] = [];
                ruleEntries[property].push(entry);
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
        const hierarchy = [node, ...node.ancestors()];
        const entries = this._entries[property] || [];
        const result = ContextManager.getRankedMatches(hierarchy, entries);
        // For each result from a non-cascading rule property, keep only the
        // ones that match the given node, not one of its ancestors.
        const filteredResults = result.filter(
            r => r.entry.value.cascading || r.matched.some(match => match === node),
        );
        if (filteredResults.length) {
            return filteredResults[0].entry.value.value;
        } else {
            return node[property];
        }
    }
}
