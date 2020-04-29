import { OwlComponent } from './OwlComponent';
import { AtomicNode } from '../../../core/src/VNodes/AtomicNode';

export class OwlNode extends AtomicNode {
    constructor(public Component: typeof OwlComponent, public props?: Record<string, {}>) {
        super();
    }
    get name(): string {
        return super.name + ': ' + this.Component.name;
    }
}
