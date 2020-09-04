import { Format } from '../../core/src/Format';

export class StrikethroughFormat extends Format {
    constructor(htmlTag: 'S' | 'DEL' = 'S') {
        super(htmlTag);
    }
}
