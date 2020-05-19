import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { YoutubeNode } from './YoutubeNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class YoutubeDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = YoutubeNode;

    async render(node: YoutubeNode): Promise<DomObject> {
        const youtube: DomObject = {
            tag: 'IFRAME',
        };
        this.engine.renderAttributes(Attributes, node, youtube);
        return youtube;
    }
}
