import { Format } from '../../plugin-inline/src/Format';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class LinkFormat extends Format {
    constructor(url?: string) {
        super('A');
        this.url = url;
    }
    get url(): string {
        return this.modifiers.find(Attributes)?.get('href');
    }
    set url(url: string) {
        this.modifiers.get(Attributes).set('href', url);
    }
}
