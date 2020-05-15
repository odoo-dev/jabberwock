import { Format } from '../../plugin-inline/src/Format';

export class LinkFormat extends Format {
    constructor(public url = '#') {
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
}
