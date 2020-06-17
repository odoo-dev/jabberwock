import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { InlineNode } from './InlineNode';
import { VNode, Predicate } from '../../core/src/VNodes/VNode';
import { Format } from './Format';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Modifier } from '../../core/src/Modifier';

type InlineRenderingUnit = [InlineNode, Modifier[], InlineFormatDomObjectRenderer];

export class InlineFormatDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate: Predicate = InlineNode;
    // TODO: this is specific to CharNode and should only be handled for them.
    createSpanForAttributes = false;

    /**
     * Render formatted inline nodes. Don't override this method if you want to
     * have nested modifiers rendering. Override 'renderInline' method instead.
     * @see renderInline
     *
     * @param node
     */
    async render(node: InlineNode): Promise<DomObject> {
        const renderingUnits = this._getRenderingUnits(node);
        const rendering = this._renderFormattedInlineNodes(renderingUnits);

        // Group the rendered nodes by renderer to call `renderered`.
        const rendererGroup = new Map<InlineFormatDomObjectRenderer, VNode[]>();
        for (const [inlineNode, , renderer] of renderingUnits) {
            if (!rendererGroup.get(renderer)) {
                rendererGroup.set(renderer, []);
            }
            rendererGroup.get(renderer).push(inlineNode);
        }
        for (const [render, nodes] of rendererGroup) {
            this.engine.rendered(nodes, render, rendering);
        }

        return rendering;
    }
    /**
     * Recive the list of node to render nested into the formting tag.
     * Don't forget to locate the node.
     *
     * @param nodes
     */
    async renderInline(nodes: InlineNode[]): Promise<DomObject[]> {
        return Promise.all(nodes.map(node => this.super.render(node)));
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
    private _getRenderingUnits(inlineNode: InlineNode): InlineRenderingUnit[] {
        // Consecutive char nodes are rendered in same time.
        const renderingUnits: InlineRenderingUnit[] = [];
        const siblings = inlineNode.parent.children();
        let sibling: VNode;
        let renderer: InlineFormatDomObjectRenderer;
        let index = siblings.indexOf(inlineNode);
        while (
            (sibling = siblings[index]) &&
            sibling instanceof InlineNode &&
            (renderer = this._getCompatibleRenderer(sibling))
        ) {
            renderingUnits.unshift([
                sibling,
                sibling.modifiers.filter(
                    modifier =>
                        modifier instanceof Format ||
                        (modifier instanceof Attributes && !!modifier.length),
                ),
                renderer,
            ]);
            index--;
        }
        index = siblings.indexOf(inlineNode) + 1;
        while (
            (sibling = siblings[index]) &&
            sibling instanceof InlineNode &&
            (renderer = this._getCompatibleRenderer(sibling))
        ) {
            renderingUnits.push([
                sibling,
                sibling.modifiers.filter(
                    modifier =>
                        modifier instanceof Format ||
                        (modifier instanceof Attributes && !!modifier.length),
                ),
                renderer,
            ]);
            index++;
        }

        return renderingUnits;
    }
    private async _renderFormattedInlineNodes(
        renderingUnits: InlineRenderingUnit[],
    ): Promise<DomObject> {
        let domObject: DomObject;
        for (let inlineIndex = 0; inlineIndex < renderingUnits.length; inlineIndex++) {
            let nextCharIndex = inlineIndex;
            let nestObjects: DomObject[];
            const unit = renderingUnits[inlineIndex];
            if (this._hasDisplayedFormat(unit)) {
                // Group same formating.
                const format = unit[1][0];
                const newRenderingUnits: InlineRenderingUnit[] = [
                    [unit[0], unit[1].slice(1), unit[2]],
                ];
                while (
                    nextCharIndex + 1 < renderingUnits.length &&
                    format.isSameAs(renderingUnits[nextCharIndex + 1][1][0])
                ) {
                    nextCharIndex++;
                    const inline = renderingUnits[nextCharIndex];
                    newRenderingUnits.push([inline[0], inline[1].slice(1), inline[2]]);
                }

                // Create formatObject.
                const childObject = await this._renderFormattedInlineNodes(newRenderingUnits);
                if (format instanceof Format) {
                    nestObjects = [await this.renderFormats(childObject, format)];
                } else {
                    nestObjects = [
                        {
                            tag: 'SPAN',
                            children: [childObject],
                        },
                    ];
                    this.engine.renderAttributes(Attributes, unit[0], nestObjects[0]);
                }
            } else {
                // Call each inline node's `renderInline` method.
                nestObjects = [];
                let inlineNodes: InlineNode[] = [];
                let currentRenderer: InlineFormatDomObjectRenderer;
                nextCharIndex -= 1; // to render also the current inlineNode
                while (
                    nextCharIndex + 1 < renderingUnits.length &&
                    !this._hasDisplayedFormat(renderingUnits[nextCharIndex + 1])
                ) {
                    nextCharIndex++;
                    const [inlineNode, , renderer] = renderingUnits[nextCharIndex];
                    if (currentRenderer && currentRenderer !== renderer) {
                        nestObjects.push(...(await currentRenderer.renderInline(inlineNodes)));
                        inlineNodes = [];
                    }
                    inlineNodes.push(inlineNode);
                    currentRenderer = renderer;
                }
                if (currentRenderer) {
                    nestObjects.push(...(await currentRenderer.renderInline(inlineNodes)));
                }
            }

            // Add to the list of domObject.
            if (domObject) {
                if ('tag' in domObject || 'text' in domObject || 'dom' in domObject) {
                    domObject = { children: [domObject] };
                }
                domObject.children.push(...nestObjects);
            } else if (nestObjects.length === 1) {
                domObject = nestObjects[0];
            } else {
                domObject = { children: nestObjects };
            }

            inlineIndex = nextCharIndex;
        }
        return domObject;
    }
    private _getCompatibleRenderer(inlineNode: InlineNode): InlineFormatDomObjectRenderer {
        const renderer = this.engine.renderers.find(renderer =>
            inlineNode.test(renderer.predicate),
        );
        return renderer instanceof InlineFormatDomObjectRenderer && renderer;
    }
    // TODO: remove this function when `createSpanForAttributes` is removed.
    private _hasDisplayedFormat(unit: InlineRenderingUnit): boolean {
        return (
            unit[1].length > 1 ||
            (unit[1].length === 1 &&
                (!(unit[1][0] instanceof Attributes) || unit[2].createSpanForAttributes))
        );
    }
}
