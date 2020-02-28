import { ImageNode } from './ImageNode';
import { AbstractParser } from '../core/src/AbstractParser';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';

export class ImageDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && item.tagName === 'IMG';
    };

    async parse(item: Element): Promise<ImageNode[]> {
        const image = new ImageNode();
        image.attributes = this.engine.parseAttributes(item);
        return [image];
    }
}
