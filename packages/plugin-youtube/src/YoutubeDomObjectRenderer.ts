import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { YoutubeNode } from './YoutubeNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

export class YoutubeDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = YoutubeNode;

    async render(): Promise<DomObject> {
        const youtube: DomObject = {
            tag: 'IFRAME',
        };
        return youtube;
    }
}
