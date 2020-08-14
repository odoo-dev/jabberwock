import { InputDomObjectRenderer } from './../../plugin-input/src/InputDomObjectRenderer';
import { InputNode } from './../../plugin-input/src/InputNode';
import { CharNode } from '../../plugin-char/src/CharNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { DomObjectRenderingEngine } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';

export class FontSizeDomObjectRenderer extends InputDomObjectRenderer {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = (node: VNode): boolean =>
        node instanceof InputNode && node.inputName === 'font-size';

    /**
     * @override
     */
    _onCommit(node: InputNode, input: HTMLInputElement): void {
        super._onCommit(node, input);
        const editor = this.engine.editor;
        const range = editor.selection.range;

        let next = range.start.nextSibling(CharNode);
        if (next) {
            // If the end is before the charNode, the charNode is not selected.
            const childVNodes = next.parent.childVNodes;
            let index = childVNodes.indexOf(next);
            let sibling: VNode;
            while (index && (sibling = childVNodes[index - 1]) && sibling !== range.start) {
                if (sibling !== range.end) {
                    next = null;
                }
                index--;
            }
        }

        let fontSize = next?.modifiers.find(Attributes)?.style?.get('font-size');

        input.style.display = 'block';
        if (fontSize) {
            fontSize = parseInt(fontSize, 10).toString();
        } else if (next) {
            const layout = this.engine.editor.plugins.get(Layout);
            const domLayout = layout.engines.dom as DomLayoutEngine;
            const firstDomNode = domLayout.getDomNodes(next)[0];
            let firstDomElement: Element;
            if (firstDomNode) {
                firstDomElement =
                    firstDomNode instanceof HTMLElement ? firstDomNode : firstDomNode.parentElement;
                if (firstDomElement) {
                    fontSize = parseInt(
                        getComputedStyle(firstDomElement)['font-size'],
                        10,
                    ).toString();
                }
            }
        } else {
            input.style.display = 'none';
        }
        input.value = fontSize || '';
    }
}
