import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { JWEditor, Loadables, CommitParams } from '../../core/src/JWEditor';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { Layout } from '../../plugin-layout/src/Layout';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class History<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Keymap & Layout> = {
        shortcuts: [
            {
                pattern: 'CTRL+Z',
                commandId: 'undo',
            },
            {
                pattern: 'CTRL+SHIFT+Z',
                commandId: 'redo',
            },
            {
                pattern: 'CTRL+Y',
                commandId: 'redo',
            },
        ],
        components: [
            {
                id: 'UndoButton',
                render: async (): Promise<ActionableNode[]> => {
                    const button = new ActionableNode({
                        name: 'undo',
                        label: 'History undo',
                        commandId: 'undo',
                        enabled: this.canUndo.bind(this),
                        modifiers: [new Attributes({ class: 'fa fa-undo fa-fw' })],
                    });
                    return [button];
                },
            },
            {
                id: 'RedoButton',
                render: async (): Promise<ActionableNode[]> => {
                    const button = new ActionableNode({
                        name: 'redo',
                        label: 'History redo',
                        commandId: 'redo',
                        enabled: this.canRedo.bind(this),
                        modifiers: [new Attributes({ class: 'fa fa-redo fa-fw' })],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [
            ['UndoButton', ['actionables']],
            ['RedoButton', ['actionables']],
        ],
    };
    commands = {
        undo: {
            handler: this.undo,
        },
        redo: {
            handler: this.redo,
        },
    };
    commandHooks = {
        '@commit': this._registerMemoryKey,
    };

    constructor(editor: JWEditor) {
        super(editor);
        this.loadables.components.push();
    }

    private _memoryKeys: string[] = [];
    private _memoryCommands: string[][] = [];
    private _memoryStep = -1;

    undo(): void {
        this._memoryStep--;
        if (this._memoryStep < 0) {
            this._memoryStep = 0;
        }
        this.editor.memory.switchTo(this._memoryKeys[this._memoryStep]);
    }
    redo(): void {
        this._memoryStep++;
        const max = this._memoryKeys.length - 1;
        if (this._memoryStep > max) {
            this._memoryStep = max;
        }
        this.editor.memory.switchTo(this._memoryKeys[this._memoryStep]);
    }
    canUndo(): boolean {
        return this._memoryStep > 0;
    }
    canRedo(): boolean {
        return this._memoryKeys.length - 1 > this._memoryStep;
    }
    private _registerMemoryKey(commitParams: CommitParams): void {
        const sliceKey = this.editor.memory.sliceKey;
        if (!this._memoryKeys.includes(sliceKey)) {
            const commands = commitParams.commandNames;
            if (commands.length === 1 && commands[0] === 'setSelection') {
                return;
            } else if (this.editor.memoryInfo.uiCommand) {
                return;
            }
            this._memoryStep++;
            this._memoryKeys.splice(this._memoryStep, Infinity, sliceKey);
            this._memoryCommands.splice(this._memoryStep, Infinity, [...commands]);
        }
    }
}
