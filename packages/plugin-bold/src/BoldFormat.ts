import { Format } from '../../core/src/Format';

export class BoldFormat extends Format {
    constructor(htmlTag: 'B' | 'STRONG' = 'B') {
        super(htmlTag);
    }
}
