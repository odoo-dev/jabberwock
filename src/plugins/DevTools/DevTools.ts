import { Action, ActionType } from '../../core/actions/Action';
import { Dispatcher } from '../../core/dispatcher/Dispatcher';
import { JWPlugin } from '../../core/JWPlugin';
import VDocument from '../../core/stores/VDocument';
import './DevTools.css';
import { VNode, VNodeType } from '../../core/stores/VNode';
import utils from '../../core/utils/utils';

                                // todo: use API //
interface DevToolsUI {
    el: Element;
    main: Element;
    toolbar: Element;
}

export class DevTools extends JWPlugin {
    ui: DevToolsUI;

    constructor (dispatcher: Dispatcher<Action>, vDocument: VDocument, options?: JWPluginConfiguration) {
        super(dispatcher, vDocument, options);
        let uiEl: Element = this._renderUI();
        this.ui = {
            el: uiEl,
            main: uiEl.querySelector('main'),
            toolbar: uiEl.querySelector('jw-tabs'),
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
            openingTag.setAttribute('class', 'element-name ' +
                (hasChildren ? 'opening' : 'self-closing'));
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
            closingTag.setAttribute('class', 'element-name closing');
            element.appendChild(closingTag);
        }
        return element;
    }
    _fillUI (): void {
        const root: VNode = this.vDocument.contents;
        let div: Element = this._createElement(root);
        this.ui.main.appendChild(div);
        this._foldableElements();
    }
    _foldableElements (): void {
        const elements: Element [] = utils._collectionToArray(
            this.ui.main.querySelectorAll('.element-name');
        );
        elements.slice().forEach((element: Element) => {
            element.addEventListener('click', () => {
                this._toggleClass(element.parentElement, 'folded');
            });
            this._toggleClass(element.parentElement, 'folded');
        });
        this.ui.toolbar.addEventListener('click', () => {
            this._toggleClass(this.ui.el, 'closed');
        });
        this._toggleClass(this.ui.el, 'closed');
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
                </jw-tabs>
                <main></main>`;
    }
    _toggleClass (node: Element, className: string): void {
        const currentClass: string = node.getAttribute('class') || '';
        if (currentClass.indexOf(className) !== -1) {
            const regex: RegExp = new RegExp('\\s*' + className + '\\s*');
            node.setAttribute('class', currentClass.replace(regex, ''));
        } else {
            node.setAttribute('class', currentClass + ' ' + className);
        }
    }
};
