import { InputDomObjectRenderer } from './../../plugin-input/src/InputDomObjectRenderer';
import { InputNode } from './../../plugin-input/src/InputNode';
import { CharNode } from '../../plugin-char/src/CharNode';
import { VNode } from '../../core/src/VNodes/VNode';
import {
    DomObject,
    DomObjectElement,
    DomObjectRenderingEngine,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { isInTextualContext } from '../../utils/src/utils';

export class FontSizeDomObjectRenderer extends InputDomObjectRenderer {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = (node: VNode): boolean =>
        node instanceof InputNode && node.inputName === 'font-size';
    /**
     * Render the VNode to the given format.
     */
    async render(node: InputNode): Promise<DomObject> {
        const input = (await super.render(node)) as DomObjectElement;
        const attach = input.attach;
        input.attach = (el: HTMLInputElement): void => {
            attach(el);
            const domVisible = el.style.display !== 'none';
            const visible = isInTextualContext(this.engine.editor);
            if (visible !== domVisible) {
                if (visible) {
                    el.style.display = 'inline-block';
                } else {
                    el.style.setProperty('display', 'none', 'important');
                }
            }
        };
        return input;
    }

    /**
     * @override
     */
    _onCommit(node: InputNode, input: HTMLInputElement): void {
        super._onCommit(node, input);
        const editor = this.engine.editor;
        const range = editor.selection.range;

        // Hide the input if the range is not in text.
        // TODO: create a ActionableInputNode for this, that way the button
        // group can be hidden as well.
        const domVisible = input.style.display !== 'none';
        const visible = isInTextualContext(editor);
        if (visible !== domVisible) {
            if (visible) {
                input.style.display = 'inline-block';
            } else {
                input.style.setProperty('display', 'none', 'important');
            }
        }

        const next = range.start.nextSibling(CharNode);
        const prev = range.end.previousSibling(CharNode);
        let fontSize = '';
        if (range.isCollapsed()) {
            fontSize = (next && this._getFontSize(next)) || (prev && this._getFontSize(prev)) || '';
        } else {
            const nextFontSize = next && this._getFontSize(next);
            const prevFontSize = prev && this._getFontSize(prev);
            if (nextFontSize && (nextFontSize === prevFontSize || !prevFontSize)) {
                fontSize = nextFontSize;
            }
        }
        input.value = fontSize;
    }
    private _getFontSize(charNode: CharNode): string {
        let fontSize = charNode.modifiers.find(Attributes)?.style?.get('font-size');
        if (fontSize) {
            fontSize = parseInt(fontSize, 10).toString();
        } else if (charNode) {
            const layout = this.engine.editor.plugins.get(Layout);
            const domLayout = layout.engines.dom as DomLayoutEngine;
            const firstDomNode = domLayout.getDomNodes(charNode)[0];
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
        }
        return fontSize;
    }
}
