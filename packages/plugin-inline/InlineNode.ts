import { VNode } from '../core/src/VNodes/VNode';
import { Formats } from './Formats';

export class InlineNode extends VNode {
    formats = new Formats();
}
