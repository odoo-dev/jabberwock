import { AbstractRenderer } from '../core/src/AbstractRenderer';
import { YoutubeNode } from './YoutubeNode';

export class YoutubeDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    predicate = YoutubeNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: YoutubeNode): Promise<Node[]> {
        const youtube = document.createElement('iframe');
        for (const name of Object.keys(node.attributes)) {
            const value = node.attributes[name];
            if (typeof value === 'string') {
                youtube.setAttribute(name, value);
            }
        }
        return [youtube];
    }
}
