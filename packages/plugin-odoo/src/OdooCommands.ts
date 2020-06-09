import JWEditor from '../../core/src/JWEditor';
import { RelativePosition } from '../../core/src/VNodes/VNode';
import { Char, InsertHtmlParams } from '../../plugin-char/src/Char';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/ui/DomLayoutEngine';
import { Layout } from '../../plugin-layout/src/Layout';
import {
    MoveParams,
    DomHelpers,
    RemoveParams,
    SetAttributeParams,
    SetStyleParams,
    EmptyParams,
    WrapParams,
    ReplaceParams,
} from '../../plugin-dom-helpers/src/DomHelpers';

interface ExecCommandHelpers {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: (...args: any[]) => void;
}

export type HtmlPoint = [Node, RelativePosition];

export function getOdooCommands(editor: JWEditor): ExecCommandHelpers {
    const layout = editor.plugins.get(Layout);
    const domEngine = layout.engines.dom as DomLayoutEngine;

    const odooCommands = {
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
            await editor.execCommand<DomHelpers>('dom.setStyle', params);
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
            return await editor.execCommand<DomHelpers>('dom.move', params);
        },
        async moveAfter(fromDomNode: Node, toDomNode: Node): Promise<void> {
            const fromNode = domEngine.getNodes(fromDomNode)[0];
            const toNode = domEngine.getNodes(toDomNode)[0];
            const params: MoveParams = {
                from: fromNode,
                to: [toNode, RelativePosition.AFTER],
            };
            return await editor.execCommand<DomHelpers>('dom.move', params);
        },
        async remove(domNode: Node): Promise<void> {
            const params: RemoveParams = {
                nodes: domEngine.getNodes(domNode),
            };
            return await editor.execCommand<DomHelpers>('dom.remove', params);
        },
        exists(domNode: Node): boolean {
            return !!domEngine.getNodes(domNode);
        },
        async empty(domNode: Node): Promise<void> {
            const params: EmptyParams = {
                nodes: domEngine.getNodes(domNode),
            };
            return await editor.execCommand<DomHelpers>('dom.empty', params);
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
            return await editor.execCommand<DomHelpers>('dom.empty', params);
        },
        async replace(domNode: Node, html: string): Promise<void> {
            const params: ReplaceParams = {
                nodes: domEngine.getNodes(domNode),
                html,
            };
            return await editor.execCommand<DomHelpers>('dom.replace', params);
        },
    };
    return odooCommands;
}
