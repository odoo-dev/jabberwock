import { VNode, VNodeType } from './VNode';

export class FragmentNode extends VNode {
    type = VNodeType.FRAGMENT;
}
