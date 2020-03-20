import { VNode } from './VNode';

export class MarkerNode extends VNode {
    static readonly atomic = true;
    tangible = false;
}
