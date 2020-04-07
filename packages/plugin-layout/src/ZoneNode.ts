import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { makeVersionable } from '../../core/src/Memory/Versionable';

export type ZoneIdentifier = string;

export class ZoneNode extends ContainerNode {
    hidden: Record<number, boolean> = makeVersionable({});
    managedZones: ZoneIdentifier[];
    breakable = false;

    constructor(managedZones: ZoneIdentifier[]) {
        super();
        this.managedZones = makeVersionable(managedZones);
    }

    get name(): string {
        return super.name + ': ' + this.managedZones.join();
    }

    hide(child: VNode): void {
        this.hidden[child.id] = true;
        return;
    }
    show(child: VNode): void {
        this.hidden[child.id] = false;
        const parentZone: ZoneNode = this.ancestor(ZoneNode);
        if (parentZone) {
            parentZone.show(this);
        }
    }
    _removeAtIndex(index: number): void {
        const child = this.childVNodes[index];
        super._removeAtIndex(index);
        delete this.hidden[child.id];
    }
}
