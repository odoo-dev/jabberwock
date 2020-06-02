import { Attributes } from './../../plugin-xml/src/Attributes';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { VElement } from '../../core/src/VNodes/VElement';
import { VNode, Point, RelativePosition } from '../../core/src/VNodes/VNode';
import JWEditor from '../../core/src/JWEditor';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/ui/DomLayoutEngine';
import { OdooStructureNode } from './OdooStructureNode';
import { OdooStructureXmlDomParser } from './OdooStructureXmlDomParser';
import { OdooImageHtmlDomRenderer } from './OdooImageHtmlDomRenderer';
import { CommandParams } from '../../core/src/Dispatcher';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { LinkFormat } from '../../plugin-link/src/LinkFormat';
import { Inline } from '../../plugin-inline/src/Inline';
import { CharNode } from '../../plugin-char/src/CharNode';

export interface RemoveClassParams extends CommandParams {
    elements: VElement[];
    classes: string[];
}
export interface AddClassParams extends CommandParams {
    elements?: VElement[];
    classes: string[];
}
export interface AddClassToLinkParams extends CommandParams {
    /**
     * The class attribute to attatch to the link.
     */
    classes: string;
}
export interface ToggleClassParams {
    nodes: VNode[];
    class: string;
    set?: boolean;
}
export interface SetAttributeParams {
    elements: VElement[];
    attributeName: string;
    attributeValue: string;
}
export interface SetStyleParams {
    /**
     * The `VElement`s whose style we want to change.
     */
    nodes: VNode[];
    /**
     * The css property.
     */
    property: string;
    /**
     * The css value.
     */
    value: string;
    important?: boolean;
}
export interface MoveParams {
    from: VNode;
    to: Point;
}

export interface RemoveParams {
    nodes: VNode[];
}
export interface EmptyParams {
    nodes: VNode[];
}
export interface WrapParams {
    container: ContainerNode;
    html: string;
}
export interface ReplaceParams {
    nodes: VNode[];
    html: string;
}
interface SelectedLinkInfo {
    /**
     * The selected text
     */
    text: string;
    /**
     * The url of the link
     */
    url: string;
    /**
     * The css class associated with the link
     */
    class: string;
    /**
     * The target of an html anchor.
     * Could be "_blank", "_self" ,"_parent", "_top" or the framename.
     */
    target: string;
}

export class OdooSnippet<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer & Keymap> = {
        parsers: [OdooStructureXmlDomParser],
        renderers: [OdooImageHtmlDomRenderer],
        shortcuts: [],
    };
    commands = {
        removeClasses: {
            handler: this.removeClasses.bind(this),
        },
        addClasses: {
            handler: this.addClasses.bind(this),
        },
        addClassToLink: {
            handler: this.addClassToLink.bind(this),
        },
        toggleClass: {
            handler: this.toggleClass.bind(this),
        },
        setAttribute: {
            handler: this.setAttribute.bind(this),
        },
        setStyle: {
            handler: this.setStyle.bind(this),
        },
        move: {
            handler: this.move.bind(this),
        },
        remove: {
            handler: this.remove.bind(this),
        },
        empty: {
            handler: this.empty.bind(this),
        },
        wrap: {
            handler: this.wrap.bind(this),
        },
        replace: {
            handler: this.replace.bind(this),
        },
        getStructures: {
            handler: this.getStructures.bind(this),
        },
        getRecordCover: {
            handler: this.getRecordCover.bind(this),
        },
        getLinkInfo: {
            handler: this.getLinkInfo.bind(this),
        },
    };

    constructor(public editor: JWEditor, public configuration: T) {
        super(editor, configuration);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    removeClasses(params: RemoveClassParams): void {
        // todo: use range rather than params.elements
        for (const element of params.elements) {
            for (const className of params.classes) {
                element.modifiers.get(Attributes).classList.remove(className);
            }
        }
    }
    addClasses(params: AddClassParams): void {
        // todo: remove elements and only use a range.
        let nodes: VNode[];
        if (params.elements) {
            nodes = params.elements;
        } else {
            nodes = params.context?.range.selectedNodes() || [];
        }

        for (const node of nodes) {
            for (const className of params.classes) {
                node.modifiers.get(Attributes).classList.add(className);
            }
        }
    }
    addClassToLink(params: AddClassToLinkParams): void {
        const nodes = params.context.range.targetedNodes(InlineNode);
        for (const node of nodes) {
            node.modifiers.get(Attributes).set('class', params.classes);
        }
    }
    toggleClass(params: ToggleClassParams): void {
        for (const node of params.nodes) {
            const classList = node.modifiers.get(Attributes).classList;
            const value =
                typeof params.set !== 'undefined' ? params.set : !classList.has(params.class);
            if (value) {
                classList.add(params.class);
            } else {
                classList.remove(params.class);
            }
        }
    }
    setAttribute(params: SetAttributeParams): void {
        for (const element of params.elements) {
            element.modifiers.get(Attributes).set(params.attributeName, params.attributeValue);
        }
    }
    setStyle(params: SetStyleParams): void {
        for (const node of params.nodes) {
            const value = params.important ? params.value + ' !important' : params.value;
            node.modifiers.get(Attributes).style.set(params.property, value);
        }
    }
    move(params: MoveParams): void {
        switch (params.to[1]) {
            case RelativePosition.AFTER:
                params.from.after(params.to[0]);
                break;
            case RelativePosition.BEFORE:
                params.from.before(params.to[0]);
                break;
            case RelativePosition.INSIDE:
                params.from.append(params.to[0]);
                break;
        }
    }
    remove(params: RemoveParams): void {
        for (const vnode of params.nodes) {
            vnode.remove();
        }
    }
    empty(params: EmptyParams): void {
        for (const vnode of params.nodes) {
            vnode.empty();
        }
    }
    getStructures(): OdooStructureNode[] {
        const layout = this.editor.plugins.get(Layout);
        const domLayout = layout.engines.dom;
        const editable = domLayout.components.get('editable')[0];
        return editable.descendants(OdooStructureNode);
    }
    async wrap(params: WrapParams): Promise<void> {
        const parsedNodes = await this._parseHTMLString(params.html);
        const wrapNode = parsedNodes[0];
        const containerVNodes = [...params.container.childVNodes];
        if (!(wrapNode instanceof ContainerNode)) {
            throw new Error('Impossible to wrap without a ContainerNode. Check "params.html".');
        }
        let vnode: VNode;
        while ((vnode = containerVNodes.shift())) {
            wrapNode.append(vnode);
        }
        params.container.append(wrapNode);
    }

    async replace(params: ReplaceParams): Promise<void> {
        const parsedNodes = await this._parseHTMLString(params.html);
        const firstNode = params.nodes[0];
        parsedNodes.forEach(firstNode.before.bind(firstNode));
        for (const node of params.nodes) {
            node.remove();
        }
    }
    async getRecordCover(): Promise<Node> {
        const layout = this.editor.plugins.get(Layout);
        const domLayout = layout.engines.dom as DomLayoutEngine;
        const editableNode = domLayout.components.get('editable')[0] as ContainerNode;
        const covers = editableNode.descendants(node => {
            const attributes = node.modifiers.find(Attributes);

            if (attributes.length && typeof attributes.get('class') === 'string') {
                return attributes.classList.has('o_record_cover_container');
            }
        });
        const cover = covers && covers[0];
        if (cover) return domLayout.getDomNodes(cover)[0];
    }
    async getSelectedText(params: CommandParams): Promise<string> {
        const selectedNode = params.context.range.selectedNodes().map(node => node.clone());
        const container = new ContainerNode();
        container.append(...selectedNode);
        const renderer = this.editor.plugins.get(Renderer);
        const renderedNode = await renderer.render<HTMLElement[]>(
            HtmlDomRenderingEngine.id,
            container,
        );
        // todo: what if there is more rendered nodes?
        return renderedNode ? renderedNode[0].innerText : '';
    }
    async getSelectedLink(params: CommandParams): Promise<string> {
        const selectedNode = params.context.range.selectedNodes().map(node => node.clone());
        const nodeWithFormat: InlineNode = selectedNode.find(
            node =>
                node.is(InlineNode) &&
                node.modifiers.find(modifier => modifier instanceof LinkFormat),
        ) as InlineNode;
        const linkFormat: LinkFormat =
            nodeWithFormat &&
            (nodeWithFormat.modifiers.find(
                modifier => modifier instanceof LinkFormat,
            ) as LinkFormat);
        return linkFormat ? linkFormat.url : '';
    }
    getLinkInfo(params: CommandParams): SelectedLinkInfo {
        const targettedNodes = params.context.range.targetedNodes(CharNode);
        const text = targettedNodes.map(x => x.char).join('');
        //
        const inline = this.editor.plugins.get(Inline);
        const modifiers = inline.getCurrentModifiers(params.context.range);
        return {
            text: text,
            url: modifiers.get(LinkFormat)?.url,
            class: modifiers.get(Attributes)?.get('class'),
            target: modifiers
                .get(LinkFormat)
                ?.modifiers?.get(Attributes)
                ?.get('target'),
        } as SelectedLinkInfo;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    async _parseHTMLString(content: string): Promise<VNode[]> {
        const parser = this.editor.plugins.get(Parser);
        const domParser = parser && parser.engines.dom;
        if (!domParser) {
            // TODO: remove this when the editor can be instantiated on
            // something else than DOM.
            throw new Error(`No DOM parser installed.`);
        }
        const div = document.createElement('div');
        div.innerHTML = content;
        return (await domParser.parse(div))[0].children();
    }
    _getVNode(domNode: Node): VNode {
        const layout = this.editor.plugins.get(Layout);
        const domEngine = layout.engines.dom as DomLayoutEngine;
        return domEngine.getNodes(domNode)[0];
    }
}
