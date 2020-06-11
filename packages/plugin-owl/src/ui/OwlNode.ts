import { OwlComponent } from './OwlComponent';
import { AtomicNode } from '../../../core/src/VNodes/AtomicNode';
import { AbstractNodeParams } from '../../../core/src/VNodes/AbstractNode';

export interface OwlNodeParams extends AbstractNodeParams {
    Component: typeof OwlComponent;
    props?: Record<string, {}>;
}

export class OwlNode extends AtomicNode {
    Component: typeof OwlComponent;
    props: Record<string, {}>;
    constructor(params: OwlNodeParams) {
        super(params);
        this.Component = params.Component;
        this.props = params.props;
    }
    get name(): string {
        return super.name + ': ' + this.Component.name;
    }
}
