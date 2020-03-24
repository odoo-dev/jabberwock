import { AtomicNode } from './AtomicNode';

export class MarkerNode extends AtomicNode {
    static readonly atomic = true;
    tangible = false;
}
