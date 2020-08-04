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
        const range = this.engine.editor.selection.range;
        const fontNodes = range.selectedNodes(CharNode);

        const fontSize =
            fontNodes[0] && fontNodes[0].modifiers.find(Attributes)?.style?.get('font-size');

        input.style.display = 'block';
        if (fontSize) {
            input.value = parseInt(fontSize).toString();
        } else if (fontNodes[0]) {
            const layout = this.engine.editor.plugins.get(Layout);
            const domLayout = layout.engines.dom as DomLayoutEngine;
            const firstDomNode = domLayout.getDomNodes(fontNodes[0])[0];
            const firstDomElement =
                firstDomNode instanceof HTMLElement ? firstDomNode : firstDomNode.parentElement;
            const style = firstDomElement ? getComputedStyle(firstDomElement) : {'font-size': ''};
            input.value = parseInt(style['font-size']).toString();
        } else {
            input.value = '';
            input.style.display = 'none';
        }
    }
}
