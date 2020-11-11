import { CommitParams } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { MemoryType } from '../../core/src/Memory/Memory';
import { ZoneIdentifier } from '../../plugin-layout/src/ZoneNode';

export interface CollaborativeConfig extends JWPluginConfig {
    fetch?: { url: string; data: Record<string, string> };
    send?: { url: string; data: Record<string, string> };
    zones?: ZoneIdentifier[];
}

type UpdateMemory = {
    needAll?: boolean; // ask all information.
    all?: boolean; // send all changes for a new client.
    from: number; // Current client.
    data: {
        fromSliceKey: string;
        toSliceKey: string;
        diff: Record<number, MemoryType>;
    }[];
};

export class Collaborative<T extends CollaborativeConfig = CollaborativeConfig> extends JWPlugin<
    T
> {
    private _running: boolean;
    private _needAll: boolean;
    private _memoryKeys: string;
    private _id: number;

    commandHooks = {
        '@commit': this._sendMemoryChanges,
    };

    /**
     * @override
     */
    async start(): Promise<void> {
        await super.start();
        this._id = Date.now(); // If disconnect must use a new id;
        this._running = true;
        this._needAll = true;
        this._fetch();
        this._sendNeedAll();
    }
    /**
     * @override
     */
    async stop(): Promise<void> {
        this._running = false;
        await super.stop();
    }

    /**
     *
     * @param needAll For the new connection, this editor need to receive every
     *      changes. The serveur must ask to the host every changes
     *      (compressed) except the initial slice.
     */
    async _fetch(): Promise<void> {
        const response = await fetch(this.configuration.fetch.url, {
            body: JSON.stringify({
                data: this.configuration.fetch.data,
                from: this._id,
            }),
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            method: 'GET',
        });
        const memoryUpdate: UpdateMemory = await response.json();
        if (!this._needAll || memoryUpdate.all) {
            this._needAll = false;
            // If need all information then wait it.
            this._applyMemoryChanges(memoryUpdate); // Don't wait to apply changes, to fetch the next messages.
        }
        if (this._running) {
            this._fetch();
        }
    }
    async _applyMemoryChanges(memoryUpdate: UpdateMemory): Promise<void> {
        if ((memoryUpdate.all && !this._needAll) || memoryUpdate.from !== this._id) {
            // This message is not for the current editor.
            return;
        }
        if (memoryUpdate.from > this._id) {
            // The current editor is the host.
        } else if (memoryUpdate.from > this._id) {
            // The send message come from the host.
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _sendMemoryChanges(params: CommitParams): void {
        const sliceKey = this.editor.memory.sliceKey;
        const previousKey = this._memoryKeys;
        this._memoryKeys = this.editor.memory.sliceKey;

        if (this.editor.memoryInfo.uiCommand) {
            // Don't send changes for ui changes.
            return;
        }
        if (this.configuration.zones) {
            // TODO: filter changes only inside the selected zones.
            return;
        }
        const memoryUpdate: UpdateMemory = {
            from: this._id,
            data: [
                {
                    fromSliceKey: previousKey,
                    toSliceKey: sliceKey,
                    diff: {},
                },
            ],
        };
        fetch(this.configuration.send.url, {
            body: JSON.stringify({
                update: memoryUpdate,
                data: this.configuration.send.data,
            }),
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            method: 'GET',
        })
            .then(response => response.json())
            .then(result => {
                if (!result) {
                    // Error can not apply this commit on the root editor, revert the changes.
                    const _sendMemoryChangesAbort = (): void => {
                        this.editor.memory.switchTo(previousKey);
                    };
                    this.editor.execCommand(_sendMemoryChangesAbort);
                }
            });
    }

    _sendNeedAll(): void {
        fetch(this.configuration.send.url, {
            body: JSON.stringify({
                memory: {
                    needAll: true,
                    from: this._id,
                    data: [],
                },
                data: this.configuration.send.data,
            }),
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            method: 'GET',
        });
    }
}
