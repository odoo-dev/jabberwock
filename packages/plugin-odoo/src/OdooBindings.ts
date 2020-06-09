import JWEditor from '../../core/src/JWEditor';
import { VElement } from '../../core/src/VNodes/VElement';
import { RelativePosition } from '../../core/src/VNodes/VNode';
import { Char, InsertHtmlParams } from '../../plugin-char/src/Char';
import { EmptyParams, WrapParams, ReplaceParams } from './OdooSnippet';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/ui/DomLayoutEngine';
import { Layout } from '../../plugin-layout/src/Layout';
import {
    AddClassParams,
    MoveParams,
    OdooSnippet,
    RemoveClassParams,
    RemoveParams,
    SetAttributeParams,
    SetStyleParams,
    ToggleClassParams,
} from './OdooSnippet';

interface ExecCommandHelpers {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: (...args: any[]) => void;
}

export type HtmlPoint = [Node, RelativePosition];

export function createExecCommandHelpersForOdoo(editor: JWEditor): ExecCommandHelpers {
    const layout = editor.plugins.get(Layout);
    const domEngine = layout.engines.dom as DomLayoutEngine;

    function _getVElements(domNode: Node): VElement[] {
        const nodes = domEngine.getNodes(domNode);
        for (const node of nodes) {
            if (!(node instanceof VElement)) {
                throw new Error('VNode is not a VElement');
            }
        }
        return nodes as VElement[];
    }
    const odooCommands = {
        hasVNode(domNode: Node): boolean {
            const nodes = domEngine.getNodes(domNode);
            return !!(nodes && nodes.length);
        },
        async addClasses(domNode: Node, classes: string[]): Promise<void> {
            const params: AddClassParams = {
                elements: _getVElements(domNode),
                classes,
            };
            await editor.execCommand<OdooSnippet>('addClasses', params);
        },
        async removeClasses(domNode: Node, classes: string[]): Promise<void> {
            const params: RemoveClassParams = {
                elements: _getVElements(domNode),
                classes,
            };
            await editor.execCommand<OdooSnippet>('removeClasses', params);
        },
        async toggleClass(domNode: Node, klass: string, set?: boolean): Promise<void> {
            const nodes = domEngine.getNodes(domNode);
            if (!nodes) {
                throw new Error('nodes are empty');
            }
            const params: ToggleClassParams = {
                nodes: nodes,
                class: klass,
                set,
            };
            await editor.execCommand<OdooSnippet>('toggleClass', params);
        },
        async setAttribute(
            domNode: Node,
            attributeName: string,
            attributeValue: string,
        ): Promise<void> {
            const params: SetAttributeParams = {
                elements: _getVElements(domNode),
                attributeName,
                attributeValue,
            };
            await editor.execCommand<OdooSnippet>('setAttribute', params);
        },
        async setStyle(
            domNode: Node,
            property: string,
            value: string,
            important = false,
        ): Promise<void> {
            const params: SetStyleParams = {
                nodes: domEngine.getNodes(domNode),
                property,
                value,
                important,
            };
            await editor.execCommand<OdooSnippet>('setStyle', params);
        },
        // todo: sometimes i need to append. Because the implementation of the insertHTML append
        // it when the RelativePosition is 'inside', it work. But this is unclear that it will
        // append.
        // Change the API to have a clearer distinction and allowing to append/prepend;
        async insertHtml(rangePoint: HtmlPoint, html: string): Promise<void> {
            const node = domEngine.getNodes(rangePoint[0])[0];
            const params: InsertHtmlParams = {
                rangePoint: [node, rangePoint[1]],
                html,
            };
            return await editor.execCommand<Char>('insertHtml', params);
        },
        async moveBefore(fromDomNode: Node, toDomNode: Node): Promise<void> {
            const fromNode = domEngine.getNodes(fromDomNode)[0];
            const toNode = domEngine.getNodes(toDomNode)[0];
            const params: MoveParams = {
                from: fromNode,
                to: [toNode, RelativePosition.BEFORE],
            };
            return await editor.execCommand<OdooSnippet>('move', params);
        },
        async moveAfter(fromDomNode: Node, toDomNode: Node): Promise<void> {
            const fromNode = domEngine.getNodes(fromDomNode)[0];
            const toNode = domEngine.getNodes(toDomNode)[0];
            const params: MoveParams = {
                from: fromNode,
                to: [toNode, RelativePosition.AFTER],
            };
            return await editor.execCommand<OdooSnippet>('move', params);
        },
        async remove(domNode: Node): Promise<void> {
            const params: RemoveParams = {
                nodes: domEngine.getNodes(domNode),
            };
            return await editor.execCommand<OdooSnippet>('remove', params);
        },
        exists(domNode: Node): boolean {
            return !!domEngine.getNodes(domNode);
        },
        async empty(domNode: Node): Promise<void> {
            const params: EmptyParams = {
                nodes: domEngine.getNodes(domNode),
            };
            return await editor.execCommand<OdooSnippet>('empty', params);
        },
        async wrap(domNode: Node, html: string): Promise<void> {
            const container = domEngine.getNodes(domNode)[0];
            if (!(container instanceof ContainerNode)) {
                throw new Error(
                    'The provided node must be a ContainerNode in the jabberwock structure',
                );
            }
            const params: WrapParams = {
                container,
                html,
            };
            return await editor.execCommand<OdooSnippet>('empty', params);
        },
        async replace(domNode: Node, html: string): Promise<void> {
            const params: ReplaceParams = {
                nodes: domEngine.getNodes(domNode),
                html,
            };
            return await editor.execCommand<OdooSnippet>('replace', params);
        },
    };
    return odooCommands;
}
