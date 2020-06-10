import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { VNode } from '../../core/src/VNodes/VNode';

export type ZoneIdentifier = string;

export class ZoneNode extends ContainerNode {
    hidden: Map<VNode, boolean> = new Map();
    breakable = false;

    constructor(public managedZones: ZoneIdentifier[]) {
        super();
    }

    hide(child: VNode): void {
        this.hidden.set(child, true);
        return;
    }
    show(child: VNode): void {
        this.hidden.set(child, false);
        const parentZone: ZoneNode = this.ancestor(ZoneNode);
        if (parentZone) {
            parentZone.show(this);
        }
    }
    _removeAtIndex(index: number): void {
        const child = this.childVNodes[index];
        super._removeAtIndex(index);
        this.hidden.delete(child);
    }
}
