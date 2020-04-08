import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { OdooFieldDomRenderer } from './OdooFieldDomRenderer';
import { OdooFieldDomParser } from './OdooFieldDomParser';
import { Dom } from '../../plugin-dom/src/Dom';
import { ReactiveValue } from '../../utils/src/ReactiveValue';
// import { OdooMonetaryFieldDomParser } from './fields/monetary/OMonetaryFieldNodeParser';
import { OCharFieldDomRenderer } from './fields/OCharFieldDomRenderer';
import { OTextFieldDomRenderer } from './fields/OTextFieldDomRenderer';
import { ONumberFieldDomRenderer } from './fields/ONumberFieldDomRenderer';
import { OFloatFieldDomRenderer } from './fields/OFloatFieldDomRenderer';

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
    value: ReactiveValue<any>;
    isValid: ReactiveValue<boolean>;
}

type OdooFieldRegistryIdentifier = string;

class ChangeAndCastManager {}

export class OdooField<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Dom];
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [OdooFieldDomParser],
        renderers: [
            OTextFieldDomRenderer,
            OCharFieldDomRenderer,
            ONumberFieldDomRenderer,
            OFloatFieldDomRenderer,
        ],
    };

    registry: Record<OdooFieldRegistryIdentifier, OdooFieldInfo> = {};
    changeAndCastManager = new ChangeAndCastManager();

    /**
     * Get reactive field.
     *
     * @param {OdooRecordDefinition} recordDefinition The record definition
     * @returns {ReactiveValue<any>}
     */
    getReactiveFieldRecordInfo(recordDefinition: OdooRecordDefinition): OdooFieldInfo {
        let reactiveOdooField = this.registry[this._getHash(recordDefinition)];
        if (!reactiveOdooField) {
            const isValid = new ReactiveValue(false);
            const value = new ReactiveValue('');

            reactiveOdooField = {
                modelId: recordDefinition.modelId,
                recordId: recordDefinition.recordId,
                fieldName: recordDefinition.fieldName,
                value,
                isValid,
            };
            this._setRecord(recordDefinition, reactiveOdooField);
        }
        return reactiveOdooField;
    }

    /**
     * Set a reactive value to the registry using a record definition.
     *
     * @param {OdooRecordDefinition} recordDefinition The record definition
     * @param {ReactiveValue<any>} value The reactive value
     */
    _setRecord(recordDefinition: OdooRecordDefinition, value: OdooFieldInfo): void {
        this.registry[this._getHash(recordDefinition)] = value;
    }

    /**
     * Get a hash to store in a dictionnary from a record definition.
     *
     * @param {OdooRecordDefinition} recordDefinition The record definition
     * @returns {string}
     */
    _getHash(recordDefinition: OdooRecordDefinition): string {
        return `${recordDefinition.modelId}-${recordDefinition.recordId}-${recordDefinition.fieldName}`;
    }
}
