import { OwlComponent } from './OwlComponent';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { AbstractNodeParams } from '../../core/src/VNodes/AbstractNode';
import { markNotVersionable } from '../../core/src/Memory/Versionable';

export interface OwlNodeParams extends AbstractNodeParams {
    Component: typeof OwlComponent;
    props?: Record<string, {}>;
}

export class OwlNode extends AtomicNode {
    params: OwlNodeParams;
    constructor(params: OwlNodeParams) {
        super(params);
        markNotVersionable(params);
        this.params = params;
    }
    get name(): string {
        return super.name + ': ' + this.params.Component.name;
    }
}
