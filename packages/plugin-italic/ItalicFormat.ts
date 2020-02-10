import { Format } from '../plugin-inline/Format';

export class ItalicFormat extends Format {
    constructor(htmlTag: 'I' | 'EM' = 'I') {
        super(htmlTag);
    }
}
