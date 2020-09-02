import { DomObject } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';
import { TableNode } from '../../plugin-table/src/TableNode';
import { Positionable } from '../../utils/src/Positionable';
import { Predicate } from '../../core/src/VNodes/VNode';
import { TableDomObjectRenderer } from '../../plugin-table/src/TableDomObjectRenderer';

export class OdooTableDomObjectRenderer extends TableDomObjectRenderer {
    predicate: Predicate = TableNode;

    async render(node: TableNode, worker: RenderingEngineWorker<DomObject>): Promise<DomObject> {
        const table = await this.super.render(node, worker);

        // TODO: add a condition to be in a rendering that does not show UI.
        if (table && 'tag' in table) {
            const savedAttach = table.attach;
            const savedDetach = table.detach;

            const dopdown = document.createElement('div');
            dopdown.classList.add('dropdown', 'oe_absolute_dropdown');
            dopdown.innerHTML = `
                <a href="#" role="button" data-toggle="dropdown" class="dropdown-toggle " aria-expanded="false">Table</a>
                <div role="menu" class="dropdown-menu dropdown-menu-right">
                    <a class="dropdown-item" data-command-id="deleteRow">Delete row</a>
                    <a class="dropdown-item" data-command-id="deleteColumn">Delete column</a>
                    <hr/>
                    <a class="dropdown-item" data-command-id="addRowAbove">Insert row above</a>
                    <a class="dropdown-item" data-command-id="addRowBelow">Insert row bellow</a>
                    <a class="dropdown-item" data-command-id="addColumnBefore">Insert column before</a>
                    <a class="dropdown-item" data-command-id="addColumnAfter">Insert column after</a>
                    <hr/>
                    <a class="dropdown-item" data-command-id="deleteTable">Delete Table</a>
                </div>
            `;
            const links = dopdown.querySelectorAll('.dropdown-menu a');
            for (const link of links) {
                link.addEventListener(
                    'click',
                    async (): Promise<void> =>
                        this.engine.editor.execCommand((link as HTMLElement).dataset.commandId),
                );
            }

            let positionable: Positionable;
            let commitHandler: () => void;

            table.attach = (el: HTMLElement): void => {
                if (savedAttach) {
                    savedAttach(el);
                }

                positionable = new Positionable({
                    relativeElement: el,
                    positionedElement: dopdown,
                });

                commitHandler = (): void => {
                    if (this.engine.editor.selection.range.start.ancestors().includes(node)) {
                        dopdown.style.display = 'block';
                        positionable.bind();
                        positionable.resetPositionedElement();
                    } else {
                        dopdown.style.display = 'none';
                        positionable.unbind();
                    }
                };

                commitHandler();
                this.engine.editor.dispatcher.registerCommandHook('@commit', commitHandler);
            };

            table.detach = (el: HTMLElement): void => {
                if (savedDetach) {
                    savedDetach(el);
                }
                positionable.destroy();
                this.engine.editor.dispatcher.removeCommandHook('@commit', commitHandler);
            };
        }
        return table;
    }
}
