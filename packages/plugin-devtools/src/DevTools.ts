import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { OwlUI } from '../../owl-ui/src/OwlUI';
import { DevToolsUI } from './DevToolsUI';

export class DevTools<T extends JWPluginConfig> extends JWPlugin<T> {
    ui = new OwlUI(this.editor);
    /**
     * Start the ui when the editor stops.
     */
    async start(): Promise<void> {
        this.ui.addPlugin(DevToolsUI);
        await this.ui.start();
    }
    /**
     * Stop the ui when the editor stops.
     */
    async stop(): Promise<void> {
        await this.ui.stop();
    }
}
