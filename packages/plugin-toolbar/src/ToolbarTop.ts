import { Toolbar } from './Toolbar';
import { ToolbarUI } from './ToolbarUI';

export class ToolbarTop extends Toolbar {
    /**
     * Start the ui when the editor stops.
     */
    async start(): Promise<void> {
        this.ui.addPlugin(ToolbarUI);
        await this.ui.start({
            position: 'first-child',
        });
    }
}
