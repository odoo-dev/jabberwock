import { History } from '../../plugin-history/src/History';
import { JWPluginConfig, JWPlugin } from '../../core/src/JWPlugin';
import { ReactiveValue } from '../../utils/src/ReactiveValue';

interface EditorCurrentState {
    canUndo: boolean;
    canRedo: boolean;
}

export class ReactiveEditorInfo<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [History];

    editorInfo: ReactiveValue<EditorCurrentState> = new ReactiveValue({
        canUndo: false,
        canRedo: false,
    });

    commandHooks = {
        '@commit': this._updateInfo,
    };

    /**
     * Update the information of the `editorInfo`.
     */
    private _updateInfo(): void {
        const history = this.editor.plugins.get(History);
        this.editorInfo.set({
            canUndo: history.canUndo(),
            canRedo: history.canRedo(),
        });
    }
}
