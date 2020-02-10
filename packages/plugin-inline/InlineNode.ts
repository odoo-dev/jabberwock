import { VNode } from '../core/src/VNodes/VNode';
import { Format } from './Format';

export class InlineNode extends VNode {
    formats: Format[] = [];
    get name(): string {
        let name = this.constructor.name;
        for (const format of this.formats) {
            name += '.' + format.name;
        }
        return name;
    }
}
