import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { OdooFieldNode } from './OdooFieldNode';
import { OMonetaryFieldNode } from './OMonetaryFieldNode';
import { ReactiveValue } from '../../utils/src/ReactiveValue';

const props = getComputedStyle(document.body);

export class OdooFieldDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = OdooFieldNode;
    focusedNode: ReactiveValue<OdooFieldNode | undefined> = new ReactiveValue(undefined);

    async render(node: OdooFieldNode | OMonetaryFieldNode): Promise<Node[]> {
        const container = document.createElement(node.htmlTag);

        this.engine.renderAttributes(node.attributes, container);
        const span = document.createElement('span');
        const textNode = document.createTextNode(node.fieldInfo.value.get());
        span.appendChild(textNode);
        const input = this._createInput(node);
        input.classList.add('jw-odoo-field');

        if (node.fieldInfo.value === this.focusedNode) {
            input.classList.add('jw-focus');
        }
        const focusHander = () => {
            const focusedNode = this.focusedNode.get();
            if (focusedNode && focusedNode.fieldInfo.value === node.fieldInfo.value) {
                input.classList.add('jw-focus');
            } else {
                input.classList.remove('jw-focus');
            }
        };
        this.focusedNode.on('set', focusHander);
        focusHander();

        const textHandler = event => {
            node.fieldInfo.value.set(input.value);
            // const spanStyle = getComputedStyle(span);
        };
        const clickHandler = (event: MouseEvent) => {
            event.stopPropagation();
            event.preventDefault();
            event.stopImmediatePropagation();
            console.log('add preventEvent from odooField');
            this.engine.editor.preventEvent.add(event);
        };
        const focusHandler = event => {
            this.focusedNode.set(node);
        };
        const blurHandler = event => {
            this.focusedNode.set(undefined);
            // input.remove();
            // span.style['white-space'] = 'normal';
            // span.style.visibility = 'visible';
        };

        const setNodeValue = () => {
            span.innerText = node.fieldInfo.value.get();
            if (span.innerHTML.match(/<br>$/)) {
                span.innerHTML += '<br>';
            }
            if (span.innerHTML === '') {
                span.innerHTML = '<br>';
            }
            input.value = input.value.replace(/ {2}/g, ' \u00A0');
            const spaces = span.innerHTML.match(/(\s+)$/);
            // if (spaces) {
            // const spacesLength = spaces[1].length;
            // span.innerHTML = span.innerHTML.slice(0, span.innerHTML.length - spacesLength);
            // span.innerHTML += Array(spacesLength + 1).join('&nbsp;');
            // }
            span.innerHTML = span.innerHTML.replace(/\s\s/g, ' &nbsp;');
            // input.style.left = '300px';
            input.style.width = `${span.offsetWidth}px`;
            input.style.height = `${span.offsetHeight}px`;
            if (span.innerHTML === '<br>') {
                span.innerHTML = '<br>';
                input.style.width = `5px`;
                span.style['background-color'] = 'red';
                span.style.width = '10px';
                span.style.display = 'block';
            } else {
                span.style.width = 'auto';
                span.style.display = 'inline';
                span.style['background-color'] = 'inherit';
            }
        };
        node.fieldInfo.value.on('set', () => {
            input.value = node.fieldInfo.value.get();
            setNodeValue();
        });

        const spanClickHandler = (event: MouseEvent) => {
            console.log('spanclickhandler');
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            container.prepend(input);
            // span.style['white-space'] = 'pre';
            // span.style.visibility = 'hidden';
            input.focus();
        };
        // span.addEventListener('click', spanClickHandler);
        span.addEventListener('mousedown', spanClickHandler);
        input.addEventListener('click', clickHandler);
        input.addEventListener('input', textHandler);
        input.addEventListener('focus', focusHandler);
        input.addEventListener('blur', blurHandler);

        this._destroyCallbacks.push(() => {
            span.removeEventListener('click', spanClickHandler);
            input.removeEventListener('click', clickHandler);
            input.removeEventListener('input', textHandler);
            input.removeEventListener('focus', focusHandler);
            input.removeEventListener('blur', blurHandler);
        });
        // container.style.position = 'relative';
        // container.style.display = 'inline-block';
        container.style.color = 'red';
        for (const prop of props) {
            input.style[prop] = 'inherit';
        }

        input.style.position = 'absolute';
        input.style.color = 'rgba(0, 0, 150, 0.5)';
        input.style['caret-color'] = 'black';
        input.style.overflow = 'hidden';
        input.style['box-shadow'] = '0 0 0 1px  #875A7B';
        // input.style['box-sizing'] = 'border-box';
        input.style.display = 'block';

        setTimeout(() => {
            setNodeValue();
        }, 100);

        container.appendChild(span);

        return [container];
    }

    _createInput(node: OdooFieldNode): HTMLInputElement | HTMLTextAreaElement {
        return document.createElement('input');
    }
}
