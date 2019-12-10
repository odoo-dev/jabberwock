import { OwlUIComponent } from '../../../owl-ui/src/OwlUIComponent';
import { VRange } from '../../../core/src/VRange';
import { VNode } from '../../../core/src/VNodes/VNode';
import { FormatInformation, FormatName } from '../../../core/src/Format/FormatManager';

interface InfoValue {
    range: VRange;
}
interface InfoState {
    currentTab: string;
}
const vNodeKeys = Object.keys(new VNode('default'));
export class InfoComponent extends OwlUIComponent<{}> {
    values: InfoValue = {
        range: this.env.editor.vDocument.range,
    };
    state: InfoState = {
        currentTab: 'vNode',
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
    /**
     * Return the length of this node and all its descendents.
     *
     * @param __current
     */
    totalLength(vNode: VNode, __current = 0): number {
        __current += vNode.length;
        vNode.children.forEach((child: VNode): void => {
            if (child.hasChildren()) {
                __current = this.totalLength(child, __current);
            }
        });
        return __current;
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
    _formatRepr(format: Map<FormatName, FormatInformation>): string {
        const res = [];
        format.forEach((info, name) => {
            let str = '';
            str += name + ' (' + info.tagName + ')';
            if (info.className.length) {
                str += ': ' + info.className;
            }
            res.push(str);
        });
        return res.length ? res.join('; ') : 'none';
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
