import { OwlUIComponent } from '../../../owl-ui/src/OwlUIComponent';
import { VRange } from '../../../core/src/VRange';
import { VNode } from '../../../core/src/VNodes/VNode';

interface InfoState {
    currentTab: string;
    range: VRange;
}
const vNodeKeys = Object.keys(new VNode('default'));
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
    /**
     * Return an object representing the given VNode's public properties as
     * alphabetically sorted pairs of key and value strings.
     *
     * @param vNode
     */
    nodeCustomProperties(vNode: VNode): { [key: string]: string }[] {
        return Object.keys(vNode)
            .filter(key => !key.startsWith('_') && !vNodeKeys.includes(key))
            .sort()
            .map(key => {
                let value = '' + vNode[key];
                if (typeof vNode[key] === 'object') {
                    if (!vNode[key] || !Object.keys(vNode[key]).length) {
                        value = '{}';
                    } else if (vNode[key].toString === {}.toString) {
                        value = this._objectRepr(vNode[key]);
                    }
                }
                if (typeof vNode[key] === 'string') {
                    value = '"' + value + '"';
                }
                return { key: key, value: value };
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
        return `${position} ${reference.id} (${reference.name})`;
    }
    _objectRepr(obj: object): string {
        return Object.keys(obj)
            .filter(key => key !== 'toString')
            .map(key => {
                return key + ': ' + obj[key];
            })
            .join('\n');
    }
}
