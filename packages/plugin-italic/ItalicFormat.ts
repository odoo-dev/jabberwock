import { Format } from '../core/src/Format';

export class ItalicFormat extends Format {
    name = 'italic';
    htmlTag: 'I' | 'EM';
    constructor(htmlTag: 'I' | 'EM' = 'I') {
        super();
        this.htmlTag = htmlTag;
    }
}
