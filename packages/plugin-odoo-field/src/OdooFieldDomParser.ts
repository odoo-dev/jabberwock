import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { Dom } from '../../plugin-dom/src/Dom';
import { OdooFieldNode } from './OdooFieldNode';
import {
    OdooRecordDefinition,
    OdooReactiveRegistry,
} from '../../plugin-odoo-reactive-registry/src/OdooReactiveRegistry';
import { ReactiveValue } from '../../utils/src/ReactiveValue';
import { OdooFieldNodeCurrency, OdooFieldNodeCurrencyPosition } from './OdooFieldNodeCurrency';
import { Renderer } from '../../plugin-renderer/src/Renderer';

/**
 * Regex used to validate a field.
 */
export const fieldValidators = {
    integer: /^[0-9]+$/,
    float: /^[0-9.,]+$/,
    monetary: /^[0-9.,]+$/,
};

/**
 * Check wether a field with `type` and `value` is valid.
 *
 * @param {string} type The type of the field.
 * @param {string} value The value of the field.
 * @returns {boolean}
 */
export function isFieldValid(type: 'integer' | 'float' | 'monetary', value: string): boolean {
    if (fieldValidators[type] && !value.match(fieldValidators[type])) {
        return false;
    } else {
        return true;
    }
}

export class OdooFieldDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;
    predicate = (item: Node): boolean => {
        const isField = !!(
            (
                item instanceof Element &&
                item.attributes['data-oe-type'] &&
                item.attributes['data-oe-model'] &&
                (item.attributes['data-oe-type'].value === 'text' ||
                    item.attributes['data-oe-type'].value === 'html' ||
                    item.attributes['data-oe-type'].value === 'float' ||
                    item.attributes['data-oe-type'].value === 'integer' ||
                    item.attributes['data-oe-type'].value === 'monetary')
            )
            // todo: Handle thoses fields when their dependecies will be met.
            // item.attributes['data-oe-type'].value === 'many2one' ||
            // item.attributes['data-oe-type'].value === 'date' ||
            // item.attributes['data-oe-type'].value === 'datetime'
            // item.attributes['data-oe-type'].value === 'image' ||
            // item.attributes['data-oe-type'].value === 'contact'
        );
        return isField;
    };

    /**
     * A `ReactiveValue`represent the value of only one field with a specific
     * model and id. A field that has the same `model`, `field` and `id` will
     * retrieve the same `ReactiveValue`.
     *
     * This map store all nodes that are associated with the same
     * `ReactiveValue`.
     *
     */
    _reactiveToFields = new Map<ReactiveValue<any>, Set<OdooFieldNode>>();
    /**
     * When a field *node* change, we save the event in this map. This allows to
     * update all nodes associated to the `ReactiveValue` originating from that
     * particular *node*. See method _beforeRenderInEditable
     *
     */
    reactiveChanges = new Map<ReactiveValue<any>, OdooFieldNode>();

    constructor(engine) {
        super(engine);
        // ? dmo: We need to discuss about a way to send signals to the dom in a
        // better way because the following code create a dependecy to the dom.
        // I'm not sure we want to code this dependecy that way.
        const domPlugin = this.engine.editor.plugins.get(Dom);
        domPlugin.beforeRenderInEditable.push(this._beforeRenderInEditable.bind(this));
    }

    async parse(element: HTMLElement): Promise<OdooFieldNode[]> {
        const record: OdooRecordDefinition = {
            modelId: element.attributes['data-oe-model'].value,
            recordId: element.attributes['data-oe-id'].value,
            fieldName: element.attributes['data-oe-field'].value,
        };

        // ? dmo: Same here. What am I supposed to use to get the plugin from a
        // parser? Or should I have the logic located in the OdooField plugin
        // instead?
        const reactivePlugin = this.engine.editor.plugins.get(OdooReactiveRegistry);
        const reactiveValue = reactivePlugin.getReactiveField(record);
        const isValidReactive = new ReactiveValue(false);

        const fieldType = element.attributes['data-oe-type'].value;
        let value = element.innerHTML;
        let childNodeToParse = element.childNodes;
        let fieldNode: OdooFieldNode;

        // ? dmo: Special case 1/4 for monetary field. Should I place the logic
        // specific for monetary somewhere else?

        // The monetary field is rendered by the odoo server differently
        // deppending on the currenty for instance:
        // `<tag><span class=".oe_currency_value">100,000.00</span>&nbsp;€</tag>`
        // or
        // `<tag>$&nbsp;<span class=".oe_currency_value">1,540,080.00</span></tag>`
        //
        // The following if statement capture the value inside the span, the
        // currency and the currency position.
        if (element.attributes['data-oe-type'].value === 'monetary') {
            const currencyElement = element.querySelector('.oe_currency_value');
            value = currencyElement.textContent;
            childNodeToParse = currencyElement.childNodes;
            const currency = (currencyElement.previousSibling || currencyElement.nextSibling)
                .textContent;
            fieldNode = new OdooFieldNodeCurrency(
                element.tagName,
                reactiveValue,
                isValidReactive,
                currency,
                currencyElement.previousSibling
                    ? OdooFieldNodeCurrencyPosition.BEFORE
                    : OdooFieldNodeCurrencyPosition.AFTER,
            );
        } else {
            fieldNode = new OdooFieldNode(element.tagName, reactiveValue, isValidReactive);
        }

        fieldNode.attributes = this.engine.parseAttributes(element);

        // Update the ReactiveValue "valid" automatically when the ReactiveValue
        // reprensenting the field changes.
        const isValidCallback = (): void => {
            isValidReactive.set(isFieldValid(fieldType, reactiveValue.get()));
        };
        reactiveValue.on('set', isValidCallback);

        const fieldSet = this._reactiveToFields.get(reactiveValue);
        if (!fieldSet) {
            reactiveValue.set(value);
            this._reactiveToFields.set(reactiveValue, new Set([fieldNode]));
        } else {
            fieldSet.add(fieldNode);
        }

        const children = await this.engine.parse(...childNodeToParse);
        fieldNode.append(...children);

        // todo: When the memory will be merged, observe the change of the
        //       memory rather than the node.
        fieldNode.on('childList', async () => {
            this.reactiveChanges.set(reactiveValue, fieldNode);
        });

        return [fieldNode];
    }

    /**
     * Before the Dom plugin render, make a deep clone of the field nodes that
     * needs to be.
     *
     * @private
     * @returns {Promise<void>}
     * @memberof OdooFieldDomParser
     */
    private async _beforeRenderInEditable(): Promise<void> {
        const domPlugin = this.engine.editor.plugins.get(Dom);
        const reactiveChange = [...this.reactiveChanges];
        for (const [reactiveValue, fieldNodeToCopy] of reactiveChange) {
            const renderedContainer = domPlugin.domMap.toDom(fieldNodeToCopy) as HTMLElement;

            // Special case 2/4 for monetary field.
            const currencyElement = renderedContainer.querySelector('.oe_currency_value');
            const renderer = this.engine.editor.plugins.get(Renderer);

            const renderedNode = (await renderer.render('dom', fieldNodeToCopy))[0];

            let value = renderedNode.innerHTML;

            // Special case 3/4 for monetary field.
            if (currencyElement) {
                value = currencyElement.textContent;
            }
            await reactiveValue.set(value);

            for (const field of this._reactiveToFields.get(reactiveValue)) {
                if (fieldNodeToCopy === field) continue;
                const childs = fieldNodeToCopy.cloneChildrenDeep();

                field.empty();
                field.append(...childs);
            }
        }
        this.reactiveChanges.clear();
    }
}
