import { Format } from '../../plugin-inline/src/Format';

export class LinkFormat extends Format {
    constructor(url?: string) {
        super('A');
        this.url = url;
    }
    get url(): string {
        return this.attributes.href;
    }
    set url(url: string) {
        this.attributes.href = url;
    }
}
