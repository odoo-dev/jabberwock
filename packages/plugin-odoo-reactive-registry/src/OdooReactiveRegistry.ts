import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import JWEditor from '../../core/src/JWEditor';
import { ReactiveValue } from '../../utils/src/ReactiveValue';

/**
 * The record definion is mainly used to get a reactive field using the method `getReactiveField`.
 *
 * @export
 * @interface OdooRecordDefinition
 */
export interface OdooRecordDefinition {
    modelId: string;
    recordId: string;
    fieldName: string;
}

export class OdooReactiveRegistry<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    registry: Record<string, ReactiveValue<any>> = {};
    constructor(public editor: JWEditor, public configuration: T) {
        super(editor, configuration);
    }

    /**
     * Get reactive field.
     *
     * @param {OdooRecordDefinition} recordDefinition The record definition
     * @returns {ReactiveValue<any>}
     * @memberof OdooReactiveRegistry
     */
    getReactiveField(recordDefinition: OdooRecordDefinition): ReactiveValue<any> {
        let value = this.registry[this._getHash(recordDefinition)];
        if (!value) {
            value = new ReactiveValue('');
            this._setRecord(recordDefinition, value);
        }
        return value;
    }

    /**
     * Set a reactive value to the registry using a record definition.
     *
     * @param {OdooRecordDefinition} recordDefinition The record definition
     * @param {ReactiveValue<any>} value The reactive value
     * @memberof OdooReactiveRegistry
     */
    _setRecord(recordDefinition: OdooRecordDefinition, value: ReactiveValue<any>): void {
        this.registry[this._getHash(recordDefinition)] = value;
    }

    /**
     * Get a hash to store in a dictionnary from a record definition.
     *
     * @param {OdooRecordDefinition} recordDefinition The record definition
     * @returns {string}
     * @memberof OdooReactiveRegistry
     */
    _getHash(recordDefinition: OdooRecordDefinition): string {
        return `${recordDefinition.modelId}-${recordDefinition.recordId}-${recordDefinition.fieldName}`;
    }
}
