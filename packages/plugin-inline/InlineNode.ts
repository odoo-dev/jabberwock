import { VNode } from '../core/src/VNodes/VNode';
import { Format } from './Format';

export class InlineNode extends VNode {
    formats: Format[] = [];
    get name(): string {
        let formatNames = '';
        if (this.formats.length) {
            formatNames = '.' + this.formatNames.join('.');
        }
        return this.constructor.name + formatNames;
    }
    get formatNames(): string[] {
        return this.formats.map(format => format.name);
    }
}
