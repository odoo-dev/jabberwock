import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { OdooFieldNode } from './OdooFieldNode';
import { OMonetaryFieldNode } from './OMonetaryFieldNode';
import { ReactiveValue } from '../../utils/src/ReactiveValue';

export class OdooFieldDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = OdooFieldNode;
    focusedNode: ReactiveValue<OdooFieldNode | undefined> = new ReactiveValue(undefined);

    async render(node: OdooFieldNode | OMonetaryFieldNode): Promise<Node[]> {
        const container = document.createElement(node.htmlTag);
        const textNode = document.createTextNode(node.fieldInfo.value.get());

        this.engine.renderAttributes(node.attributes, container);
        const input = this._createInput(node);
        container.classList.add('jw-odoo-field');
        input.classList.add('jw-odoo-field-textarea');

        if (node.fieldInfo.value === this.focusedNode) {
            input.classList.add('jw-focus');
        }
        const focusNodeHandler = () => {
            const focusedNode = this.focusedNode.get();
            if (focusedNode && focusedNode.fieldInfo.value === node.fieldInfo.value) {
                container.classList.add('jw-focus');
            } else {
                container.classList.remove('jw-focus');
            }
            if (document.activeElement !== input) {
                input.remove();
                container.appendChild(textNode);
            }
        };
        this.focusedNode.on('set', focusNodeHandler);
        focusNodeHandler();

        const textHandler = () => {
            node.fieldInfo.value.set(input.value);
        };
        const clickHandler = (event: MouseEvent) => {
            event.stopPropagation();
            event.preventDefault();
            event.stopImmediatePropagation();
            this.engine.editor.preventEvent.add(event);
        };
        const focusHandler = event => {
            this.focusedNode.set(node);
        };
        const blurHandler = event => {
            // this.focusedNode.set(undefined);
        };

        node.fieldInfo.value.on('set', () => {
            input.value = node.fieldInfo.value.get();
            textNode.textContent = node.fieldInfo.value.get();
            delayedResize();
        });

        function resize() {
            input.style.height = 'auto';
            input.style.height = input.scrollHeight + 'px';
        }
        /* 0-timeout to get the already changed text */
        function delayedResize() {
            window.setTimeout(resize, 0);
        }

        const containerClickHandler = (event: MouseEvent) => {
            console.log('containerClick!!');
            if (
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLInputElement
            ) {
                console.log('target is input');
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            console.log('prepend!!');
            container.prepend(input);
            textNode.remove();
            this.focusedNode.set(node);
            input.focus();
            resize();
        };

        input.addEventListener('change', resize);
        input.addEventListener('cut', delayedResize);
        input.addEventListener('paste', delayedResize);
        input.addEventListener('drop', delayedResize);
        input.addEventListener('keydown', delayedResize);

        // span.addEventListener('click', spanClickHandler);
        container.addEventListener('mousedown', containerClickHandler);
        input.addEventListener('click', clickHandler);
        input.addEventListener('input', textHandler);
        input.addEventListener('focus', focusHandler);
        input.addEventListener('blur', blurHandler);

        this._destroyCallbacks.push(() => {
            // todo: destroy all callback here
        });
        // container.style.position = 'relative';
        container.style.color = 'red';
        input.style['caret-color'] = getComputedStyle(container).color + ' !important';

        container.appendChild(textNode);

        return [container];
    }

    _createInput(node: OdooFieldNode): HTMLInputElement | HTMLTextAreaElement {
        return document.createElement('input');
    }
}
