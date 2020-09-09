import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { Predicate } from '../../core/src/VNodes/VNode';
import { ActionBarNode } from './ActionBarNode';
import { ActionBar, ActionItem } from './ActionBar';
import { Color } from '../../plugin-color/src/Color';
import { RenderingEngine } from '../../plugin-renderer/src/RenderingEngine';
import { ReactiveValue } from '../../utils/src/ReactiveValue';
import { Positionable, PositionableVerticalAlignment } from '../../utils/src/Positionable';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';

export class ActionBarDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate: Predicate = ActionBarNode;
    availableActions: ReactiveValue<ActionItem[]>;

    constructor(engine: RenderingEngine<DomObject>) {
        super(engine);
        this.engine.editor.plugins.get(Color);
        this.availableActions = this.engine.editor.plugins.get(ActionBar).availableActions;
    }

    async render(): Promise<DomObject> {
        const actionBar = document.createElement('jw-actionbar');
        let positionable: Positionable;

        const updateActions = (): void => {
            const container = this.engine.editor.selection.range.startContainer;
            const layout = this.engine.editor.plugins.get(Layout);
            const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
            const selectedDomNode = domLayoutEngine.getDomNodes(container)[0] as HTMLElement;

            console.log('selectedDomNode:', selectedDomNode);

            positionable.resetRelativeElement(selectedDomNode);
            positionable.resetPositionedElement();

            const actionItems = this.availableActions.get();
            if (actionItems.length) {
                actionBar.style.display = 'block';
                actionBar.innerHTML = '';
                for (const node of this._renderActionNode(actionItems)) {
                    actionBar.appendChild(node);
                }
            } else {
                actionBar.style.display = 'none';
            }
        };
        const attach = (): void => {
            console.log('attach');
            positionable = new Positionable({
                positionedElement: actionBar,
                verticalAlignment: PositionableVerticalAlignment.BOTTOM,
            });
            positionable.bind();
            this.availableActions.on('set', updateActions);
            setTimeout(() => updateActions(), 1000);
        };
        const detach = (): void => {
            console.log('detach');
            positionable.destroy();
            this.availableActions.off('set', updateActions);
        };
        return { dom: [actionBar], attach, detach };
    }

    _positionNode() {}

    _renderActionNode(actionItems: ActionItem[]): HTMLElement[] {
        return actionItems.map(item => {
            const element = document.createElement('jw-action-item');
            element.innerHTML = `
                <jw-action-name>${item.name}</jw-action-name>
            `;
            return element;
        });
    }
}
