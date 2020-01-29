import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import JWEditor from '../core/src/JWEditor';
import { DomRenderer } from '../plugin-dom/DomRenderer';
import { VDocumentMap } from '../core/src/VDocumentMap';

export class CodeView extends JWPlugin {
    textarea: HTMLTextAreaElement;
    renderer: DomRenderer;

    commandHooks = {
        commit: this.render.bind(this),
    };

    constructor(editor: JWEditor, options: JWPluginConfig = {}) {
        super(editor, options);
        this.textarea = document.createElement('textarea') as HTMLTextAreaElement;
        this.textarea.className = 'jw-codeview';
        this.textarea.style.minHeight = '50px';
        this.textarea.style.width = '100%';
        this.textarea.style.resize = 'none';

        // TODO: create structure to allow the plugin to add DOM into the editor (left, right, top, bottom, center)
        this.editor.el.appendChild(this.textarea);

        // Init the rendering in HTML element
        this.renderer = new DomRenderer(editor);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Render the vDocument
     *
     */
    render(): void {
        const vDocumentMap = new VDocumentMap();
        const container = document.createElement('container');
        this.renderer.render(vDocumentMap, this.editor.vDocument, container);
        this.textarea.value = container.innerHTML;
    }
}
