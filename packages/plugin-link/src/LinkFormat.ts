import { Format } from '../../plugin-inline/src/Format';

export class LinkFormat extends Format {
    constructor(public url = '#', public target = '') {
        super('A');
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    render(): Element {
        const element = super.render();
        element.setAttribute('href', this.url);
        return element;
    }

    /**
     * @override
     */
    clone(): this {
        const clone = super.clone();
        clone.url = this.url;
        return clone;
    }
}
