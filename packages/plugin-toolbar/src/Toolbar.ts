import { OwlUI } from '../../owl-ui/src/OwlUI';
import { JWPlugin } from '../../core/src/JWPlugin';
import { ToolbarUI } from './ToolbarUI';

export class Toolbar extends JWPlugin {
    ui = new OwlUI(this.editor);
    /**
     * Start the ui when the editor stops.
     */
    async start(): Promise<void> {
        this.ui.addPlugin(ToolbarUI);
        await this.ui.start();
    }
    /**
     * Stop the ui when the editor stops.
     */
    async stop(): Promise<void> {
        await this.ui.stop();
    }
}
