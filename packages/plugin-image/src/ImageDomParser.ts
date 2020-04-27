import { ImageNode } from './ImageNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';
import { nodeName } from '../../utils/src/utils';

export class ImageDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'IMG';
    };

    async parse(item: Element): Promise<ImageNode[]> {
        const image = new ImageNode();
        image.attributes = this.engine.parseAttributes(item);
        return [image];
    }
}
