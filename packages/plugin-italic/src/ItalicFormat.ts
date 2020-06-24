import { Format } from '../../core/src/Format';

export class ItalicFormat extends Format {
    constructor(htmlTag: 'I' | 'EM' = 'I') {
        super(htmlTag);
    }
}
