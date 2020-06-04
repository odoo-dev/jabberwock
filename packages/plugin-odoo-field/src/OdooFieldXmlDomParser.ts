import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { OdooFieldNode } from './OdooFieldNode';
import { OdooFieldInfo, OdooFieldDefinition } from './OdooField';
import { OdooField } from './OdooField';
import { OdooFieldMap } from './OdooFieldMap';
import { CharNode } from '../../plugin-char/src/CharNode';

export class OdooFieldXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;
    predicate = (item: Node): boolean => {
        return (
            item instanceof Element &&
            item.attributes['data-oe-type'] &&
            item.attributes['data-oe-model'] &&
            (item.attributes['data-oe-type'].value === 'char' ||
                item.attributes['data-oe-type'].value === 'text' ||
                item.attributes['data-oe-type'].value === 'html' ||
                item.attributes['data-oe-type'].value === 'float' ||
                item.attributes['data-oe-type'].value === 'integer')
        );
        // TODO: Handle those fields when their dependecies are met.
        // item.attributes['data-oe-type'].value === 'many2one' ||
        // item.attributes['data-oe-type'].value === 'date' ||
        // item.attributes['data-oe-type'].value === 'datetime'
        // item.attributes['data-oe-type'].value === 'image' ||
        // item.attributes['data-oe-type'].value === 'contact'
    };

    _reactiveChanges = new OdooFieldMap<OdooFieldNode>();

    async parse(element: Element): Promise<OdooFieldNode[]> {
        const field: OdooFieldDefinition = {
            modelId: element.attributes['data-oe-model'].value,
            recordId: element.attributes['data-oe-id'].value,
            fieldName: element.attributes['data-oe-field'].value,
        };

        // data-oe-type is kind of a widget in Odoo.
        const fieldType = element.attributes['data-oe-type'].value;
        const fieldsRegistry = this.engine.editor.plugins.get(OdooField);
        const value = this._parseValue(element);
        const fieldInfo = fieldsRegistry.register(field, fieldType, value);

        const fieldNode = await this._parseField(element, fieldInfo);
        fieldNode.modifiers.append(this.engine.parseAttributes(element));

        // TODO: Remove the mute mechanism when changes come from memory.
        // This prevent cycling when regenerating children after a value change.
        let mute = false;
        fieldNode.on('childList', async () => {
            if (mute) return;
            this._reactiveChanges.set(fieldNode.fieldInfo, fieldNode);
            fieldNode.fieldInfo.value.set(this._parseValue(fieldNode));
        });

        // TODO: Replace this value listening mechanism by mirror nodes.
        fieldNode.fieldInfo.value.on('set', () => {
            // TODO: Retrieving the node that made the change is a slight hack
            // that will be removed when mirror nodes are available.
            const original = this._reactiveChanges.get(fieldNode.fieldInfo);
            if (fieldNode === original) return;
            mute = true;
            fieldNode.empty();
            fieldNode.append(...original.children().map(child => child.clone(true)));
            mute = false;
        });
        return [fieldNode];
    }

    /**
     * Get an `OdooFieldNode` from an element and a ReactiveValue.
     *
     * @param element
     * @param fieldInfo
     */
    async _parseField(element: Element, fieldInfo: OdooFieldInfo): Promise<OdooFieldNode> {
        const fieldNode = new OdooFieldNode({ htmlTag: element.tagName, fieldInfo });
        const children = await this.engine.parse(...element.childNodes);
        fieldNode.append(...children);
        return fieldNode;
    }

    /**
     * Parse the value of the field from the given source.
     *
     * @param source
     */
    _parseValue(source: Element): string;
    _parseValue(source: OdooFieldNode): string;
    _parseValue(source: Element | OdooFieldNode): string {
        if (source instanceof Element) {
            return source.innerHTML;
        } else {
            const chars = source.descendants(CharNode).map(child => child.char);
            return chars.join('');
        }
    }
}
