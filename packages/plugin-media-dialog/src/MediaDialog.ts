import { JWPlugin } from '../../core/src/JWPlugin';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { Layout } from '../../plugin-layout/src/Layout';
export interface OpenMediaParams {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    foo?: any;
}
export interface MediaDialogConfig {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    foo?: any;
}
export class MediaDialog<T extends MediaDialogConfig = {}> extends JWPlugin<T> {
    commands = {
        'openMedia': {
            handler: this.openMedia.bind(this),
        },
    };
    async openMedia(params: OpenMediaParams): Promise<void> {
        params; // TODO
        const layout = this.editor.plugins.get(Layout);
        const domLayout = layout.engines.dom as DomLayoutEngine;
        await domLayout.show('media_dialog');
    }
}
