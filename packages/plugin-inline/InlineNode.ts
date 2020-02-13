import { VNode } from '../core/src/VNodes/VNode';
import { Format } from './Format';

export class InlineNode extends VNode {
    formats: Format[] = [];
}
