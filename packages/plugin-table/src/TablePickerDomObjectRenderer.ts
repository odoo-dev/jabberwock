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

export class TablePickerDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = TablePickerNode;

    async render(tablePicker: TableNode): Promise<DomObjectElement> {
        const domObject = (await this.super.render(tablePicker)) as DomObjectElement;
        const tablePlugin = this.engine.editor.plugins.get(Table);
        const layout = this.engine.editor.plugins.get(Layout);

        const close = async (): Promise<void> => {
            await layout.remove('TablePicker');
        };

        domObject.attach = (): void => {
            tablePlugin.isTablePickerOpen = true;
            window.addEventListener('click', close, true);
        };
        domObject.detach = (): void => {
            tablePlugin.isTablePickerOpen = false;
            window.removeEventListener('click', close, true);
        };
        return domObject;
    }
}
