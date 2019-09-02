import { Action, ActionType } from '../../core/actions/Action.js';
import { Dispatcher } from '../../core/dispatcher/Dispatcher.js';
import { JWPlugin, JWPluginConfiguration } from '../../core/JWPlugin.js';
import VDocument from '../../core/stores/VDocument.js';
import { VNode, VNodeType } from '../../core/stores/VNode.js';
import utils from '../../core/utils/utils.js';

// todo: use API //
interface DevToolsUI {
    el: Element;
    main: Element;
    toolbar: Element;
    sidepane: Element;
    about: Element;
    properties: Element;
}

export class DevTools extends JWPlugin {
    ui: DevToolsUI;
    _inspectedNode: VNode;

    constructor(dispatcher: Dispatcher<Action>, vDocument: VDocument, options?: JWPluginConfiguration) {
        super(dispatcher, vDocument, options);
        const uiEl: Element = this._renderUI();
        this.ui = {
            el: uiEl,
            main: uiEl.querySelector('devtools-main'),
            toolbar: uiEl.querySelector('devtools-navbar'),
            sidepane: uiEl.querySelector('devtools-sidepane'),
            about: uiEl.querySelector('devtools-sidepane .about'),
            properties: uiEl.querySelector('devtools-sidepane .properties'),
        };
        this._fillMainTree();
        this._updateInspectedNode(vDocument.contents);
    }

    _addChildren(node: VNode): Element {
        const children: VNode[] = node.children.slice();
        const container: Element = document.createElement('ol');
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
    _addOne(node: VNode): Element {
        const li: Element = document.createElement('li');
        let contents: string = node.type;
        if (node.type === VNodeType.CHAR) {
            contents += ': "' + node.value + '"';
        }
        li.appendChild(document.createTextNode(contents));
        return li;
    }
    _bindEventToNode(node: VNode, element: Element): void {
        element.addEventListener('click', () => {
            this._updateInspectedNode(node);
        });
    }
    _createElement(node: VNode): Element {
        let element: Element;
        const hasChildren: boolean = node.children.length > 0;
        const type: string = (node.type && node.type.toLowerCase()) || '?';
        if (node.type === VNodeType.CHAR) {
            element = document.createElement('span');
            element.appendChild(document.createTextNode(node.value));
            this._bindEventToNode(node, element);
        } else {
            element = document.createElement('div');
            const openingTag: Element = document.createElement('span');
            const value: string = '<' + type + (hasChildren ? '>' : '/>');
            openingTag.appendChild(document.createTextNode(value));
            openingTag.setAttribute('class', 'element-name ' + (hasChildren ? 'opening' : 'self-closing'));
            element.appendChild(openingTag);
            this._bindEventToNode(node, openingTag);
        }
        if (hasChildren) {
            const childrenDiv: Element = document.createElement('div');
            childrenDiv.setAttribute('class', 'children');
            node.children.slice().forEach(child => {
                childrenDiv.appendChild(this._createElement(child));
            });
            element.appendChild(childrenDiv);
            const closingTag: Element = document.createElement('span');
            const value: string = '</' + type + '>';
            closingTag.appendChild(document.createTextNode(value));
            closingTag.setAttribute('class', 'element-name closing');
            element.appendChild(closingTag);
        }
        return element;
    }
    _fillMainTree(): void {
        const root: VNode = this.vDocument.contents;
        const div: Element = this._createElement(root);
        this.ui.main.appendChild(div);
        this._foldableElements();
    }
    _foldableElements(): void {
        const elements: Element[] = utils._collectionToArray(this.ui.main.querySelectorAll('.element-name'));
        elements.slice().forEach((element: HTMLElement) => {
            element.addEventListener('click', (event: MouseEvent) => {
                if (event.offsetX < 10) {
                    // only toggle on click caret
                    this._toggleClass(element.parentElement, 'folded');
                }
            });
            this._toggleClass(element.parentElement, 'folded');
        });
        this.ui.toolbar.addEventListener('click', () => {
            this._toggleClass(this.ui.el, 'closed');
        });
        this._toggleClass(this.ui.el, 'closed');
    }
    _getTypeInfo(node: VNode): string {
        if (!node.type) {
            return 'Unknown node type';
        }
        if (node.type === VNodeType.CHAR) {
            return node.type + ': "' + node.value + '"';
        }
        const typeInfo: string = node.type.toLowerCase().replace('_', ' ');
        return typeInfo.charAt(0).toUpperCase() + typeInfo.substring(1);
    }
    _renderUI(): Element {
        const devTools: Element = document.createElement('jw-devtools');
        devTools.innerHTML = this._template;
        document.body.appendChild(devTools);
        return devTools;
    }
    get _template(): string {
        return `<devtools-navbar>
                    <button>Inspector</button>
                </devtools-navbar>
                <devtools-contents>
                    <devtools-main></devtools-main>
                    <devtools-sidepane>
                        <div class="about">
                            <div class="type"></div>
                        </div>
                        <div class="properties"></div>
                    </devtools-sidepane>
                </devtools-contents>`;
    }
    _toggleClass(node: Element, className: string): void {
        const currentClass: string = node.getAttribute('class') || '';
        if (currentClass.indexOf(className) !== -1) {
            const regex = new RegExp('\\s*' + className + '\\s*');
            node.setAttribute('class', currentClass.replace(regex, ''));
        } else {
            node.setAttribute('class', currentClass + ' ' + className);
        }
    }
    _updateInspectedNode(node: VNode) {
        this._inspectedNode = node;
        const typeContainer: Element = this.ui.about.querySelector('.type');
        typeContainer.innerHTML = this._getTypeInfo(node);
        this.ui.properties.innerHTML = '<div>Length: ' + node.length + '</div>';
        if (node.parent) {
            this.ui.properties.innerHTML += '<div>Parent: ' + node.parent.type + '</div>';
        }
    }
}
