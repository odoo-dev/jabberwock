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
    _createElement (node: VNode): Element {
        let element: Element;
        const hasChildren: boolean = node.children.length > 0;
        const type:string = node.type && node.type.toLowerCase() || '?';
        if (node.type === VNodeType.CHAR) {
            element = document.createElement('span');
            element.appendChild(document.createTextNode(node.value));
        } else {
            element = document.createElement('div');
            let openingTag: Element = document.createElement('span');
            const value: string = '<' + type + (hasChildren ? '>' : '/>');
            openingTag.appendChild(document.createTextNode(value));
            openingTag.setAttribute('class', 'element-name');
            element.appendChild(openingTag);
        }
        if (hasChildren) {
            let childrenDiv: Element = document.createElement('div');
            childrenDiv.setAttribute('class', 'children');
            node.children.slice().forEach(child => {
                childrenDiv.appendChild(this._createElement(child));
            });
            element.appendChild(childrenDiv);
            let closingTag: Element = document.createElement('span');
            let value: string = '</' + type + '>';
            closingTag.appendChild(document.createTextNode(value));
            closingTag.setAttribute('class', 'element-name');
            element.appendChild(closingTag);
        }
        return element;
    }
    _fillUI (): void {
        const root: VNode = this.vDocument.contents;
        let div: Element = this._createElement(root);
        this.ui.main.appendChild(div);
    }
    _renderUI (): Element {
        let devTools: Element = document.createElement('jw-devtools');
        devTools.innerHTML = this._template;
        document.body.appendChild(devTools);
        return devTools;
    }
    get _template (): string {
        return `<jw-tabs>
                    <button>Inspector</button>
                    <button
                        style="position: absolute; right: 10px;"
                        onclick="document.body.querySelector('jw-devtools').remove()">
                        X
                    </button>
                </jw-tabs>
                <main></main>`;
    }
};
