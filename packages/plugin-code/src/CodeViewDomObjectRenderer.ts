import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { CodeViewNode } from './CodeViewNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

export class CodeViewDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = CodeViewNode;

    async render(codeView: CodeViewNode): Promise<DomObject> {
        const domCodeView = document.createElement('TEXTAREA') as HTMLTextAreaElement;
        domCodeView.value = codeView.value;
        domCodeView.setAttribute(
            'style',
            [
                'width: 100%',
                'height: 100%',
                'background-color: black',
                'color: white',
                'padding: 5px',
                'font-family: "Courier New", Courier, "Lucida Sans Typewriter", "Lucida Typewriter", monospace;',
            ].join('; '),
        );
        return { dom: [domCodeView] };
    }
}
