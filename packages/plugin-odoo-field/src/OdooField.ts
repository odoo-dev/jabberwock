import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { OdooFieldDomRenderer } from './OdooFieldDomRenderer';
import { OdooFieldDomParser } from './OdooFieldDomParser';
import { ReactiveValue } from '../../utils/src/ReactiveValue';
import { OdooMonetaryFieldDomParser } from './OMonetaryFieldNodeParser';
import { OdooMonetaryFieldDomRenderer } from './OMonetaryFieldNodeRenderer';

/**
 * The record definion is mainly used to get a reactive field using the method `getReactiveField`.
 */
export interface OdooRecordDefinition {
    modelId: string;
    recordId: string;
    fieldName: string;
}
export interface OdooFieldInfo {
    modelId: string;
    recordId: string;
    fieldName: string;
    value: ReactiveValue<string>;
    isValid: ReactiveValue<boolean>;
}

type OdooFieldRegistryIdentifier = string;

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
    return !fieldValidators[type] || !!value.match(fieldValidators[type]);
}

// class DomRenderingEngineBis extends DomRenderingEngine {
//     static readonly id = 'domBis';
// }

export class OdooField<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    // static dependencies = [Dom];
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [OdooFieldDomParser, OdooMonetaryFieldDomParser],
        renderers: [OdooMonetaryFieldDomRenderer, OdooFieldDomRenderer],
        // renderingEngines: [DomRenderingEngineBis],
    };

    commands = {
        foo: {
            handler: () => {
                console.log('foo');
            },
        },
    };

    registry: Record<OdooFieldRegistryIdentifier, OdooFieldInfo> = {};

    /**
     * Set the record from parsing html.
     *
     * No need to get the inforation from the network if it is already present in the document
     * parsed by the editor.
     *
     * Create 2 `ReactiveValue`. One that represent the actual value of the `recordDefinition`
     * and the other represent the validity of the value.
     *
     * See `getReactiveFieldRecordInfo` to retrieve theses value through an `OdooFieldInfo`.
     */
    setRecordFromParsing(
        recordDefinition: OdooRecordDefinition,
        fieldType: string,
        value: string,
    ): void {
        if (!this.registry[this._getHash(recordDefinition)]) {
            // todo: Retrieve the field from Odoo through RPC.
            const isValid = new ReactiveValue(true);
            const reactiveValue = new ReactiveValue(value);
            if (fieldType === 'integer' || fieldType === 'float' || fieldType === 'monetary') {
                reactiveValue.on('set', (): void => {
                    isValid.set(isFieldValid(fieldType, reactiveValue.get()));
                });
                isValid.set(isFieldValid(fieldType, reactiveValue.get()));
            }

            const reactiveOdooField = {
                modelId: recordDefinition.modelId,
                recordId: recordDefinition.recordId,
                fieldName: recordDefinition.fieldName,
                value: reactiveValue,
                isValid,
            };
            this._setRecord(recordDefinition, reactiveOdooField);
        }
    }
    /**
     * Retrieve reactive values by providing an `OdooRecordDefinition`.
     *
     * @param definition
     */
    getField(definition: OdooRecordDefinition): OdooFieldInfo {
        const reactiveOdooField = this.registry[this._getHash(definition)];
        if (!reactiveOdooField) {
            // todo: Retrieve the field from Odoo through RPC.
            throw new Error(
                `Impossible to find the field ${definition.fieldName} for model ${definition.modelId} with id ${definition.modelId}.`,
            );
        }
        return reactiveOdooField;
    }

    /**
     * Set a reactive value to the registry using a record definition.
     *
     * @param recordDefinition The record definition
     * @param value The reactive value
     */
    _setRecord(recordDefinition: OdooRecordDefinition, value: OdooFieldInfo): void {
        this.registry[this._getHash(recordDefinition)] = value;
    }

    /**
     * Get a hash to store in a dictionnary from a record definition.
     *
     * @param recordDefinition The record definition
     */
    _getHash(recordDefinition: OdooRecordDefinition): string {
        return `${recordDefinition.modelId}-${recordDefinition.recordId}-${recordDefinition.fieldName}`;
    }
}
