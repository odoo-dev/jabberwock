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
        const domNode = document.createElement('jw-actionbar');
        const updateActions = (): void => {
            const actionItems = this.availableActions.get();
            if (actionItems.length) {
                domNode.innerHTML = '';
                for (const node of this._renderActionNode(actionItems)) {
                    domNode.appendChild(node);
                }
            } else {
                domNode.style.display = 'none';
            }
        };
        const attach = (): void => {
            this.availableActions.on('set', updateActions);
        };
        const detach = (): void => {
            this.availableActions.off('set', updateActions);
        };
        return { dom: [domNode], attach, detach };
    }

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
