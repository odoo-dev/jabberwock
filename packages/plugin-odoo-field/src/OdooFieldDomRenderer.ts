import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { OdooFieldNode } from './OdooFieldNode';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Predicate } from '../../core/src/VNodes/VNode';

export class OdooFieldDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate: Predicate = OdooFieldNode;

    async render(node: OdooFieldNode): Promise<Node[]> {
        const container = document.createElement(node.htmlTag);
        this.engine.renderAttributes(Attributes, node, container);
        await this._renderValue(node, container);
        return [container];
    }

    /**
     * Render the value of the given field node into the given container.
     *
     * @param node
     * @param container
     */
    async _renderValue(node: OdooFieldNode, container: HTMLElement): Promise<void> {
        const renderedChildren = await this.renderChildren(node);
        container.append(...renderedChildren.flat());

        // Instances of the field containing the range are artificially focused.
        const focusedField = this.engine.editor.selection.range.start.ancestor(
            ancestor =>
                ancestor.is(OdooFieldNode) && ancestor.fieldInfo.value === node.fieldInfo.value,
        );
        if (focusedField) {
            container.classList.add('jw-focus');
        }

        container.classList.add('jw-odoo-field');

        if (!node.fieldInfo.isValid.get()) {
            container.classList.add('jw-odoo-field-invalid');
        }

        if (!node.descendants(AtomicNode).length) {
            container.classList.add('jw-odoo-field-empty');
        }
    }
}
