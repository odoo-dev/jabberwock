import { OwlComponent } from './OwlComponent';
import { AtomicNode } from '../../../core/src/VNodes/AtomicNode';
import { markNotVersionable } from '../../../core/src/Memory/Versionable';

export class OwlNode extends AtomicNode {
    params: {
        Component: typeof OwlComponent;
        props: Record<string, {}>;
    };
    constructor(Component: typeof OwlComponent, props?: Record<string, {}>) {
        super();
        const params = {
            Component: Component,
            props: props,
        };
        markNotVersionable(params);
        this.params = params;
    }
    get name(): string {
        return super.name + ': ' + this.params.Component.name;
    }
}
