import { Predicate } from './../../core/src/VNodes/VNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { ContextualEntry, ContextManager } from '../../core/src/ContextManager';
import { Attributes } from '../../plugin-xml/src/Attributes';

export interface ModeRule {
    selector: Predicate[];
    editable?: boolean;
}
export type ModeIdentifier = string;
export interface ModeDefinition {
    id: ModeIdentifier;
    rules: ModeRule[];
    /**
     * Check if the node is editable from the rules `editable` property.
     */
    checkEditable?: boolean;
}
export class Mode {
    constructor(public readonly definition: ModeDefinition) {}

    isNodeEditable(node: VNode): boolean {
        const hierarchy = [...node.ancestors(), node];
        const ruleEntries = this.definition.rules
            .filter(rule => typeof rule.editable !== 'undefined')
            .map(rule => {
                const entry: ContextualEntry<boolean> = {
                    selector: rule.selector,
                    data: rule.editable,
                };
                return entry;
            });
        const result = ContextManager.matchAll(hierarchy, ruleEntries);
        if (typeof result[0] === 'undefined') {
            return node.editable;
        } else {
            return result[0].entry.data;
        }
    }
}
