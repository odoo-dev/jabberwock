import { Action, ActionType } from '../../core/actions/Action';
import { Dispatcher } from '../../core/dispatcher/Dispatcher';
import { JWPlugin } from '../../core/JWPlugin';
import VDocument from '../../core/stores/VDocument';
import './DevTools.css';
import { VNode, VNodeType } from '../../core/stores/VNode';

                                // todo: use API //
interface DevToolsUI {
    el: Element;
    main: Element;
}

export class DevTools extends JWPlugin {
    ui: DevToolsUI;

    constructor (dispatcher: Dispatcher<Action>, vDocument: VDocument, options?: JWPluginConfiguration) {
        super(dispatcher, vDocument, options);
        let uiEl: Element = this._renderUI();
        this.ui = {
            el: uiEl,
            main: uiEl.querySelector('main'),
        };
        this._fillUI();
    }

    _addChildren (node: VNode): Element {
        let children: VNode [] = node.children.slice();
        let container: Element = document.createElement('ol');
        document.createElement('li').appendChild(container);
        while (children.length) {
            const child: VNode = children.shift();
            container.appendChild(this._addOne(child));
            if (child.children.length) {
                container.appendChild(this._addChildren(child));
            }
        }
        return container;
    }
    _addOne (node: VNode): Element {
        let li: Element = document.createElement('li');
        let contents: string = node.type;
        if (node.type === VNodeType.CHAR) {
            contents += ': "' + node.value + '"';
        }
        li.appendChild(document.createTextNode(contents));
        return li;
    }
    _fillUI (): void {
        const root: VNode = this.vDocument.contents;
        let ol: Element = document.createElement('ol');
        let li: Element = document.createElement('li');
        li.appendChild(document.createTextNode(root.type));
        ol.appendChild(li);

        if (root.children.length) {
            ol.appendChild(this._addChildren(root));
        }
        this.ui.main.appendChild(ol);
    }
    _renderUI (): Element {
        let devTools: Element = document.createElement('jw-devtools');
        devTools.innerHTML = this._template;
        document.body.appendChild(devTools);
        return devTools;
    }
    get _template (): string {
        return `<jw-tabs>
                    <jw-tab>Inspector</jw-tab>
                </jw-tabs>
                <main></main>`;
    }
};
