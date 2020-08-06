import { JWPluginConfig, JWPlugin } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Layout } from '../../plugin-layout/src/Layout';
import { CodeViewNode } from './CodeViewNode';
import { CodeViewDomObjectRenderer } from './CodeViewDomObjectRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { parseEditable } from '../../utils/src/configuration';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { isBlock } from '../../utils/src/isBlock';
import { CommandParams } from '../../core/src/Dispatcher';

export class Code<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    codeView = new CodeViewNode();
    readonly loadables: Loadables<Renderer & Layout> = {
        renderers: [CodeViewDomObjectRenderer],
        components: [
            {
                id: 'CodeButton',
                render: async (): Promise<ActionableNode[]> => {
                    const button = new ActionableNode({
                        name: 'code',
                        label: 'Toggle Code view',
                        commandId: 'toggleCodeView',
                        selected: (): boolean => this.active,
                        modifiers: [new Attributes({ class: 'fas fa-code fa-fw' })],
                    });
                    return [button];
                },
            },
            {
                id: 'code',
                render: async (): Promise<VNode[]> => {
                    return [this.codeView];
                },
            },
        ],
        componentZones: [['CodeButton', ['actionables']]],
    };
    commands = {
        toggleCodeView: {
            handler: this.toggle.bind(this),
        },
    };
    active = false;
    async start(): Promise<void> {
        await super.start();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    async toggle(params: CommandParams): Promise<void> {
        if (this.active) {
            return this.deactivate(params);
        } else {
            return this.activate(params);
        }
    }
    async activate(params: CommandParams): Promise<void> {
        this.active = true;
        const domLayoutEngine = this.editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
        const editable = domLayoutEngine.components.get('editable')[0];

        // Update the view's contents.
        const domEditable = domLayoutEngine.getDomNodes(editable)[0] as Element;
        this.codeView.value = this._formatElementHtml(domEditable).innerHTML.trim() || '';

        // Show the code view and hide the editable.
        await this.editor.plugins.get(Layout).append('code', 'main');
        await params.context.execCommand('hide', { componentId: 'editable' });
    }
    async deactivate(params: CommandParams): Promise<void> {
        this.active = false;
        const domLayoutEngine = this.editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
        const editable = domLayoutEngine.components.get('editable')[0];

        // Parse the code view into the editable.
        const codeContainer = document.createElement('div');
        codeContainer.innerHTML = (domLayoutEngine.getDomNodes(
            this.codeView,
        )[0] as HTMLTextAreaElement).value;
        const newEditable = await parseEditable(this.editor, codeContainer);
        editable.empty();
        editable.append(...newEditable[0].children());

        // Show the editable and hide the code view.
        await params.context.execCommand('show', { componentId: 'editable' });
        await this.editor.plugins.get(Layout).remove('code', 'main');
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Format an element's inner HTML by recursively adding inner indentation
     * where it is relevant.
     *
     * @param element
     * @param [_level]
     */
    private _formatElementHtml(element: Element, _level = 0): Element {
        element = element.cloneNode(true) as Element;
        const indentBefore = new Array(_level + 1).join('    ');
        const indentAfter = new Array(_level).join('    ');
        for (const child of element.children) {
            const isChildBlock = isBlock(child);
            if (isChildBlock) {
                element.insertBefore(document.createTextNode('\n' + indentBefore), child);
            }
            this._formatElementHtml(child, _level + 1);
            if (isChildBlock && element.lastElementChild === child) {
                element.appendChild(document.createTextNode('\n' + indentAfter));
            }
        }
        return element;
    }
}
