import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { InlineNode } from './InlineNode';
import { Predicate, VNode } from '../../core/src/VNodes/VNode';
import { Format } from './Format';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class InlineFormatDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    predicate: Predicate<boolean | VNode> = InlineNode;

    async render(node: InlineNode): Promise<DomObject> {
        const inline = await this.super.render(node);
        return this.renderFormats(inline, ...node.modifiers.filter(Format));
    }
    /**
     * Render an inline node's formats and return them in a fragment.
     *
     */
    async renderFormats(rendering: DomObject, ...formats: Format[]): Promise<DomObject> {
        let children: Array<DomObject | VNode> = [];
        if ('tag' in rendering || 'text' in rendering) {
            children = [rendering];
        } else if ('children' in rendering) {
            children = [...rendering.children];
        }
        let domObject: DomObject = rendering;
        for (const format of [...formats].reverse()) {
            domObject = {
                tag: format.htmlTag.toUpperCase(),
                attributes: {},
                children: children,
            };
            const attributes = format.modifiers.find(Attributes);
            if (attributes) {
                for (const name of attributes.keys()) {
                    domObject.attributes[name] = attributes.get(name);
                }
            }
            children = [domObject];
        }
        return domObject;
    }
}
