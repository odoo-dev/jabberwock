import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { OdooFieldNode } from './OdooFieldNode';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Predicate } from '../../core/src/VNodes/VNode';
import { DomObjectRenderingEngine } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { DomObject } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { DomObjectElement } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

export class OdooFieldDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate: Predicate = OdooFieldNode;

    async render(node: OdooFieldNode): Promise<DomObject> {
        const domObject: DomObjectElement = { tag: node.htmlTag };
        this.engine.renderAttributes(Attributes, node, domObject);
        await this._renderValue(node, domObject);
        return domObject;
    }

    /**
     * Render the value of the given field node into the given container.
     *
     * @param node
     * @param container
     */
    async _renderValue(node: OdooFieldNode, container: DomObjectElement): Promise<void> {
        // TODO CHM: not having default values is cumbersome
        const children = container.children || [];
        const renderedChildren = await this.engine.renderChildren(node);
        children.push(...renderedChildren);
        container.children = children;

        // TODO CHM: not having default values is cumbersome
        container.attributes = container.attributes || {};

        const classList = container.attributes.class?.split(' ') || [];

        // Instances of the field containing the range are artificially focused.
        const focusedField = this.engine.editor.selection.range.start.ancestor(
            ancestor =>
                ancestor.is(OdooFieldNode) && ancestor.fieldInfo.value === node.fieldInfo.value,
        );
        if (focusedField) {
            classList.push('jw-focus');
        }

        classList.push('jw-odoo-field');

        if (!node.fieldInfo.isValid.get()) {
            classList.push('jw-odoo-field-invalid');
        }

        if (!node.descendants(AtomicNode).length) {
            classList.push('jw-odoo-field-empty');
        }

        container.attributes.class = classList.join(' ');
    }
}
