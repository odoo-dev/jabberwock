import { CharNode } from './CharNode';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { InlineFormatDomObjectRenderer } from '../../plugin-inline/src/InlineFormatDomObjectRenderer';
import { Format } from '../../plugin-inline/src/Format';
import { Modifier } from '../../core/src/Modifier';

export class CharDomObjectRenderer extends InlineFormatDomObjectRenderer {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = CharNode;

    async render(node: CharNode): Promise<DomObject> {
        // Consecutive char nodes are rendered in same time.
        const charNodes: CharNode[] = [];
        const charFormats: Modifier[][] = [];
        const siblings = node.parent.children();
        let sibling: VNode;
        let index = siblings.indexOf(node);
        while ((sibling = siblings[index]) && sibling instanceof CharNode) {
            charNodes.unshift(sibling);
            charFormats.unshift(
                sibling.modifiers.filter(
                    modifier =>
                        modifier instanceof Format ||
                        (modifier instanceof Attributes && !!modifier.length),
                ),
            );
            index--;
        }
        index = siblings.indexOf(node) + 1;
        while ((sibling = siblings[index]) && sibling instanceof CharNode) {
            charNodes.push(sibling);
            charFormats.push(
                sibling.modifiers.filter(
                    modifier =>
                        modifier instanceof Format ||
                        (modifier instanceof Attributes && !!modifier.length),
                ),
            );
            index++;
        }

        const promise = this._renderFormattedCharNodes(charNodes, charFormats);
        this.engine.rendered(charNodes, this, promise);
        return promise;
    }
    private async _renderFormattedCharNodes(
        charNodes: CharNode[],
        charFormats: Modifier[][],
    ): Promise<DomObject> {
        let domObject: DomObject;
        for (let charIndex = 0; charIndex < charNodes.length; charIndex++) {
            let nextCharIndex = charIndex;
            let nestObject: DomObject;
            const format = charFormats[charIndex][0];
            if (format) {
                // Group same formating.
                const newChars: CharNode[] = [charNodes[charIndex]];
                const newCharFormats: Modifier[][] = [charFormats[charIndex].slice(1)];
                while (
                    nextCharIndex + 1 < charNodes.length &&
                    format.isSameAs(charFormats[nextCharIndex + 1][0])
                ) {
                    nextCharIndex++;
                    newChars.push(charNodes[nextCharIndex]);
                    newCharFormats.push(charFormats[nextCharIndex].slice(1));
                }

                // Create formatObject.
                const childObject = await this._renderFormattedCharNodes(newChars, newCharFormats);
                if (format instanceof Format) {
                    nestObject = await this.renderFormats(childObject, format);
                } else {
                    nestObject = {
                        tag: 'SPAN',
                        children: [childObject],
                    };
                    this.engine.renderAttributes(Attributes, charNodes[charIndex], nestObject);
                }
            } else {
                // Create textObject.
                const texts = [charNodes[charIndex].char];
                while (
                    nextCharIndex + 1 < charNodes.length &&
                    !charFormats[nextCharIndex + 1].length
                ) {
                    nextCharIndex++;
                    const charNode = charNodes[nextCharIndex];
                    // Same text node.
                    if (charNode.char === ' ' && texts[texts.length - 1] === ' ') {
                        // Browsers don't render consecutive space chars otherwise.
                        texts.push('\u00A0');
                    } else {
                        texts.push(charNode.char);
                    }
                }

                // Render block edge spaces as non-breakable space (otherwise browsers
                // won't render them).
                const previous = charNodes[charIndex].previousSibling();
                if (!previous || !previous.is(InlineNode)) {
                    texts[0] = texts[0].replace(/^ /g, '\u00A0');
                }
                const next = charNodes[nextCharIndex].nextSibling();
                if (!next || !next.is(InlineNode)) {
                    texts[texts.length - 1] = texts[texts.length - 1].replace(/^ /g, '\u00A0');
                }
                nestObject = {
                    text: texts.join(''),
                };
                this.engine.locate(charNodes.slice(charIndex, nextCharIndex + 1), nestObject);
            }

            // Add to the list of domObject.
            if (domObject) {
                if ('tag' in domObject || 'text' in domObject || 'dom' in domObject) {
                    domObject = { children: [domObject] };
                }
                domObject.children.push(nestObject);
            } else {
                domObject = nestObject;
            }

            charIndex = nextCharIndex;
        }
        return domObject;
    }
}
