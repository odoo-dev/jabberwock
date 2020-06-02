import { OdooFieldDefinition } from './OdooField';

export class OdooFieldMap<T> extends Map<string, T> {
    static hash(field: OdooFieldDefinition): string {
        return `${field.modelId}-${field.recordId}-${field.fieldName}`;
    }

    get(field: OdooFieldDefinition): T;
    get(key: string): T;
    get(key: string | OdooFieldDefinition): T {
        let hashedKey: string;
        if (typeof key === 'string') {
            hashedKey = key;
        } else {
            hashedKey = OdooFieldMap.hash(key);
        }
        return super.get(hashedKey);
    }

    set(field: OdooFieldDefinition, value: T): this;
    set(key: string, value: T): this;
    set(key: string | OdooFieldDefinition, value: T): this {
        let hashedKey: string;
        if (typeof key === 'string') {
            hashedKey = key;
        } else {
            hashedKey = OdooFieldMap.hash(key);
        }
        super.set(hashedKey, value);
        return this;
    }
}
