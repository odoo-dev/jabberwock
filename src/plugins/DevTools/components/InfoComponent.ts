import { VNode } from '../../../core/stores/VNode';
import { OwlUIComponent } from '../../../ui/OwlUIComponent';
import { VRange } from '../../../core/stores/VRange';
import { useState } from 'owl-framework/src/hooks';

interface InfoState {
    currentTab: string;
    range: VRange;
}
export class InfoComponent extends OwlUIComponent<{}> {
    state: InfoState = useState({
        currentTab: 'vNode',
        range: this.env.editor.vDocument.range,
    });
    localStorage = ['currentTab'];
    /**
     * Open the tab with the given `tabName`
     *
     * @param {string} tabName
     */
    openTab(tabName: string): void {
        this.state.currentTab = tabName;
    }
    /**
     * Trigger a 'node-selected' custom event
     * with the given `vNode` to select it
     *
     * @param {VNode} vNode
     */
    selectNode(vNode: VNode): void {
        this.trigger('node-selected', {
            vNode: vNode,
        });
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _repr(rangeNode: VNode): string {
        const nextSibling = rangeNode.nextSibling();
        const prevSibling = rangeNode.previousSibling();
        const position = nextSibling ? 'BEFORE' : prevSibling ? 'AFTER' : 'INSIDE';
        const reference = nextSibling || prevSibling || rangeNode.parent;
        const nodeRepr = reference.value || reference.type;
        return `${position} ${reference.id} (${nodeRepr})`;
    }
}
