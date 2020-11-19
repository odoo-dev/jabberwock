import { AbstractNode } from './AbstractNode';
import { VNode } from './VNode';
import { AtomicityError } from '../../../utils/src/errors';

const emptyChildren: VNode[] = [];
Object.freeze(emptyChildren);

/**
 * This class provides typing overrides for multiple VNode methods which are
 * supposed to take parameters but that are unused in the case of atomic nodes.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export class AtomicNode extends AbstractNode {
    get childVNodes(): VNode[] {
        return emptyChildren;
    }

    //--------------------------------------------------------------------------
    // Updating children.
    //--------------------------------------------------------------------------

    /**
     * See {@link AbstractNode.prepend}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    prepend(...children: VNode[]): void {
        throw new AtomicityError(this);
    }
    /**
     * See {@link AbstractNode.prepend}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    append(...children: VNode[]): void {
        throw new AtomicityError(this);
    }
    /**
   /**
     * See {@link AbstractNode.insertBefore}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    insertBefore(node: VNode, reference: VNode): void {
        throw new AtomicityError(this);
    }
    /**
     * See {@link AbstractNode.insertAfter}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    insertAfter(node: VNode, reference: VNode): void {
        throw new AtomicityError(this);
    }
    /**
     * See {@link AbstractNode.empty}.
     */
    empty(): void {
        return;
    }
    /**
     * See {@link AbstractNode.removeChild}.
     *
     * @throws AtomicityError An atomic node cannot have children.
     */
    removeChild(child: VNode): void {
        throw new AtomicityError(this);
    }
    /**
     * See {@link AbstractNode.splitAt}.
     *
     * @throws AtomicityError An atomic node cannot be split.
     */
    splitAt(child: VNode): this {
        throw new AtomicityError(this);
    }
    /**
     * See {@link AbstractNode.mergeWith}.
     */
    mergeWith(newContainer: VNode): void {
        return;
    }
    /**
     * See {@link AbstractNode.unwrap}.
     */
    unwrap(): void {
        return;
    }
}
