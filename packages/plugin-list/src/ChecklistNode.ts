import { VNode } from '../../core/src/VNodes/VNode';
import { ListNode, ListType } from './ListNode';
import { ChildError } from '../../utils/src/errors';

export class ChecklistNode extends ListNode {
    static isChecked(node: VNode): boolean | undefined {
        if (node.is(ChecklistNode)) {
            const children = node.children();
            if (children.length) {
                for (const child of children) {
                    if (!node._checked[child.id]) {
                        return false;
                    }
                }
                return true;
            }
        }
        const parent = node.parent;
        if (parent?.is(ChecklistNode)) {
            if (node.is(ListNode)) {
                const prev = node.previousSibling();
                if (prev && !prev.is(ListNode)) {
                    return parent._checked[prev.id];
                }
            }
            if (parent._checked[node.id]) {
                return true;
            }
            return false;
        }
        return undefined;
    }

    private _checked: Record<number, boolean> = {};
    constructor() {
        super(ListType.CHECKLIST);
    }
    get name(): string {
        return this.constructor.name;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    removeChild(child: VNode): void {
        if (child.tangible) {
            delete this._checked[child.id];
            const next = child.nextSibling();
            const prev = child.previousSibling();
            super.removeChild(child);
            if (next?.is(ChecklistNode) && prev && !prev.is(ListNode)) {
                this._checked[prev.id] = ChecklistNode.isChecked(next);
            }
            this._updateAncestorChecklist();
        } else {
            super.removeChild(child);
        }
    }
    check(child?: VNode): void {
        this._toggleCheck(true, child);
        this._updateAncestorChecklist();
    }
    uncheck(child?: VNode): void {
        this._toggleCheck(false, child);
        this._updateAncestorChecklist();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _insertAtIndex(child: VNode, index: number): void {
        if (child.tangible) {
            let isChecked = ChecklistNode.isChecked(child);
            if (isChecked === undefined) {
                // keep the state in deepest arch (keep for selection and delete for eg)
                const ancestor = child.ancestor(node => node.parent?.is(ChecklistNode));
                isChecked = (ancestor && ChecklistNode.isChecked(ancestor)) || false;
            }
            super._insertAtIndex(child, index);
            this._checked[child.id] = isChecked;
            if (child.is(ChecklistNode)) {
                const prev = child.previousSibling();
                if (prev && !prev.is(ListNode)) {
                    this._checked[prev.id] = isChecked;
                }
            } else if (!child.is(ListNode) && child.nextSibling()?.is(ChecklistNode)) {
                isChecked = ChecklistNode.isChecked(child.nextSibling());
            }
            this._updateAncestorChecklist();
        } else {
            super._insertAtIndex(child, index);
        }
    }
    private _toggleCheck(check: boolean, child?: VNode): void {
        if (child) {
            if (child.parent !== this) {
                throw new ChildError(this, child);
            }
            if (this._checked[child.id] !== check) {
                this._checked[child.id] = check;
                const checklist: VNode = child.is(ListNode) ? child : child.nextSibling();
                if (checklist?.is(ChecklistNode)) {
                    this._checked[checklist.id] = check;
                    checklist._toggleCheck(check);
                }
            }
        } else {
            for (const node of this.children()) {
                this._toggleCheck(check, node);
            }
        }
    }
    private _updateAncestorChecklist(): void {
        const parent = this.parent;
        if (parent?.is(ChecklistNode)) {
            const isChecked = ChecklistNode.isChecked(this);
            if (parent._checked[this.id] !== isChecked) {
                parent._checked[this.id] = isChecked;
                const prev = this.previousSibling();
                if (prev && !prev.is(ListNode)) {
                    parent._checked[prev.id] = isChecked;
                }
                parent._updateAncestorChecklist();
            }
        }
    }
}
