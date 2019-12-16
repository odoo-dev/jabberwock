import { OwlUIComponent } from '../../../owl-ui/src/OwlUIComponent';
import { VRange } from '../../../core/src/VRange';
import { VNode } from '../../../core/src/VNodes/VNode';

interface InfoState {
    currentTab: string;
    range: VRange;
}
export class InfoComponent extends OwlUIComponent<{}> {
    aboutMeProps = ['id', 'name', 'type', 'length', 'atomic', 'text'];
    familyProps = ['index', 'parent', 'children', 'siblings'];
    customPropsBlacklist = this.aboutMeProps.concat(this.familyProps).concat(['renderingEngines']);
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
    /**
     * Return the name of the class of the given VNode.
     *
     * @param vNode
     */
    className(vNode: VNode): string {
        return vNode.constructor.name;
    }
    /**
     * Return a string representing the contents of a property of a VNode.
     *
     * @param vNode
     * @param propName
     */
    propRepr(vNode: VNode, propName: string): string {
        let prop = vNode[propName];
        if ({}.toString.call(prop) === '[object Function]') {
            prop = vNode[propName]();
        }
        return this._propRepr(prop);
    }
    /**
     * Return an object representing the given VNode's public properties as
     * alphabetically sorted pairs of key and value strings.
     *
     * @param vNode
     */
    nodeProperties(vNode: VNode): { [key: string]: string }[] {
        return Object.keys(vNode)
            .filter(key => !key.startsWith('_') && !this.customPropsBlacklist.includes(key))
            .sort()
            .map(key => {
                return { key: key, value: this._propRepr(vNode[key]) };
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
    /**
     * Return a string representing the contents of a property of a VNode.
     *
     * @param vNode
     * @param propName
     */
    _propRepr(prop): string {
        let value = '' + prop;
        if (typeof prop === 'object') {
            if (Array.isArray(prop) && !prop.length) {
                value = '[]';
            } else if (prop === null) {
                value = 'null';
            } else if (prop === undefined) {
                value = 'undefined';
            } else if (prop instanceof Set) {
                const items = [];
                prop.forEach(item => {
                    items.push(item);
                });
                value = items.join('\n');
            } else if (!prop || !Object.keys(prop).length) {
                value = '{}';
            } else if (prop.toString === {}.toString) {
                value = this._objectRepr(prop);
            }
        } else if (typeof prop === 'string') {
            value = '"' + value + '"';
        }
        return value;
    }
    /**
     * Return a string representing all key/value pairs of an object.
     *
     * @param vNode
     * @param propName
     */
    _objectRepr(obj: object): string {
        return Object.keys(obj)
            .filter(key => key !== 'toString')
            .map(key => {
                return key + ': ' + obj[key];
            })
            .join('\n');
    }
}
