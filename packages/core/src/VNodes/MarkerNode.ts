import { AtomicNode } from './AtomicNode';

export class MarkerNode extends AtomicNode {
    static readonly atomic = true;
    editable = false;
    tangible = false;
}
