import { Component } from 'owl-framework';
import { Env } from 'owl-framework/src/component/component';
import JWEditor from '../core/JWEditor';

interface OwlUIEnv extends Env {
    editor: JWEditor;
}

export class OwlUIComponent<Props> extends Component<OwlUIEnv, Props> {
    state: {};

    _storageKeyPrefix = 'OwlUI' + this.constructor.name + ':';
    // State items which names are listed in the localStorage property will be
    // read from the localStorage during the willStart of the component, and
    // wrote back to the localStorage whenever the state changes.
    localStorage: string[] = [];
    /**
     * Owl hook called exactly once before the initial rendering.
     */
    willStart(): Promise<void> {
        if (this.state) {
            this._importStateFromStorage(localStorage, this.localStorage);
        }
        return super.willStart();
    }

    /**
     * Called by the Owl state observer every time the state changes.
     *
     * @param force see Owl Component
     */
    render(force = false): Promise<void> {
        if (this.state) {
            this._exportStateToStorage(localStorage, this.localStorage);
        }
        return super.render(force);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Read the given storable state items from the given `storage` and write
     * the items as the key of the `state` property.
     *
     * @param storage from which to read the state items
     * @param storableItems names of the state items to read from storage
     */
    _importStateFromStorage(storage: Storage, storableItems: string[]): void {
        storableItems.forEach(itemName => {
            const storageKey = this._storageKeyPrefix + itemName;
            const value = storage.getItem(storageKey);

            // The value of items that were not yet set in storage is null.
            if (value !== null) {
                // Otherwise, the value was stored as a string in the storage.
                // Convert it to the type of the default value for the state.
                try {
                    this.state[itemName] = JSON.parse(value);
                } catch (e) {
                    // Stored item is not parseable. Keep the default value.
                    console.warn(
                        `Storage: Ignoring state.${itemName} stored value.\n` +
                            `${e.name}: ${e.message}\n` +
                            `Stored value: ${value}`,
                    );
                }
            }
        });
    }

    /**
     * For every keys in the property `state`, write it back to `storage`
     * Write the given storable state items to the given storage.
     *
     * @param storage to write the state items to
     * @param storableItems names of the state items to write to storage
     */
    _exportStateToStorage(storage: Storage, storableItems: string[]): void {
        storableItems.forEach(itemName => {
            const storageKey = this._storageKeyPrefix + itemName;
            // Storage require items to be stored as strings.
            try {
                const serializedValue = JSON.stringify(this.state[itemName]);
                storage.setItem(storageKey, serializedValue);
            } catch (e) {
                // State item is not serializable. Skip storing it.
                console.warn(
                    `Storage: Unserializable state.${itemName} value.\n` +
                        `${e.name}: ${e.message}`,
                );
            }
        });
    }
}
