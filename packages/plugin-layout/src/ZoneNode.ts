import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractNodeParams } from '../../core/src/VNodes/AbstractNode';
import { makeVersionable } from '../../core/src/Memory/Versionable';

export type ZoneIdentifier = string;
export interface ZoneNodeParams extends AbstractNodeParams {
    managedZones: ZoneIdentifier[];
}

export class ZoneNode extends ContainerNode {
    hidden: Record<number, boolean>;
    editable = false;
    breakable = false;
    allowEmpty = true;
    managedZones: ZoneIdentifier[];

    constructor(params: ZoneNodeParams) {
        super(params);
        this.managedZones = makeVersionable(params.managedZones);
    }

    get name(): string {
        return super.name + ': ' + this.managedZones.join();
    }

    hide(child: VNode): void {
        if (!this.hidden) {
            this.hidden = makeVersionable({});
        }
        this.hidden[child.id] = true;
        return;
    }
    show(child: VNode): void {
        const id = child.id;
        if (this.hidden?.[id]) {
            this.hidden[id] = false;
        }
        const parentZone: ZoneNode = this.ancestor(ZoneNode);
        if (parentZone) {
            parentZone.show(this);
        }
    }
    _removeAtIndex(index: number): void {
        const child = this.childVNodes[index];
        super._removeAtIndex(index);
        if (this.hidden) {
            delete this.hidden[child.id];
        }
    }
}
