import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractNodeParams } from '../../core/src/VNodes/AbstractNode';

export type ZoneIdentifier = string;
export interface ZoneNodeParams extends AbstractNodeParams {
    managedZones: ZoneIdentifier[];
}

export class ZoneNode extends ContainerNode {
    hidden: Map<VNode, boolean> = new Map();
    breakable = false;
    managedZones: ZoneIdentifier[];

    constructor(params: ZoneNodeParams) {
        super(params);
        this.managedZones = params.managedZones;
    }

    get name(): string {
        return super.name + ': ' + this.managedZones.join();
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
