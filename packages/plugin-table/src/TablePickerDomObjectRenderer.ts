import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import {
    DomObject,
    DomObjectRenderingEngine,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Table } from './Table';
import { TableNode } from './TableNode';
import { Layout } from '../../plugin-layout/src/Layout';
import { TablePickerNode } from './TablePickerNode';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

export class TablePickerDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = TablePickerNode;

    async render(
        tablePicker: TableNode,
        worker: RenderingEngineWorker<DomObject>,
    ): Promise<DomObjectElement> {
        const domObject = (await this.super.render(tablePicker, worker)) as DomObjectElement;
        const tablePlugin = this.engine.editor.plugins.get(Table);
        const layout = this.engine.editor.plugins.get(Layout);
        let attach: boolean;

        const close = async (): Promise<void> => {
            // TODO: remove this setTimeout when we have external vs internal execCommand.
            setTimeout(() => {
                if (attach && tablePlugin.isTablePickerOpen) {
                    this.engine.editor.execCommand(() => {
                        return layout.remove('TablePicker');
                    });
                }
            }, 50);
        };

        domObject.attach = (): void => {
            attach = true;
            tablePlugin.isTablePickerOpen = true;
            window.addEventListener('click', close, true);
        };
        domObject.detach = (): void => {
            attach = false;
            tablePlugin.isTablePickerOpen = false;
            window.removeEventListener('click', close, true);
        };
        return domObject;
    }
}
