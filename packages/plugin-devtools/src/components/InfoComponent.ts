import { OwlUIComponent } from '../../../owl-ui/src/OwlUIComponent';
import { VRange } from '../../../core/src/VRange';
import { VNode } from '../../../core/src/VNode';

interface InfoState {
    currentTab: string;
    range: VRange;
}
export class InfoComponent extends OwlUIComponent<{}> {
    state: InfoState = {
        currentTab: 'vNode',
        range: this.env.editor.vDocument.range,
    };
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
    className(vNode: VNode): string {
        return vNode.constructor.name;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _repr(rangeNode: VNode): string {
        const nextSibling = rangeNode.nextSibling();
        const prevSibling = rangeNode.previousSibling();
        const position = nextSibling ? 'BEFORE' : prevSibling ? 'AFTER' : 'INSIDE';
        const reference = nextSibling || prevSibling || rangeNode.parent;
        return `${position} ${reference.id} (${reference.name})`;
    }
}
