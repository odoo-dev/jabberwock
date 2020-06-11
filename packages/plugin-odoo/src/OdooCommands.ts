import JWEditor from '../../core/src/JWEditor';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { Layout } from '../../plugin-layout/src/Layout';

interface ExecCommandHelpers {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: (...args: any[]) => void;
}

export function getOdooCommands(editor: JWEditor): ExecCommandHelpers {
    const layout = editor.plugins.get(Layout);
    const domEngine = layout.engines.dom as DomLayoutEngine;

    const odooCommands = {
        exists(domNode: Node): boolean {
            return !!domEngine.getNodes(domNode);
        },
    };
    return odooCommands;
}
