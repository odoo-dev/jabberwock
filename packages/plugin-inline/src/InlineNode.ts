import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { Formats } from './Formats';

export class InlineNode extends AtomicNode {
    formats = new Formats();
}
