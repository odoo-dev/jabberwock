import JWEditor from '../../core/src/JWEditor';
import { OwlUI } from '../../owl-ui/src/OwlUI';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { ToolbarUI } from './ToolbarUI';
import { CommandIdentifier, CommandParams } from '../../core/src/Dispatcher';

export interface Button {
    title: string;
    class?: string;
    commandId: CommandIdentifier;
    commandArgs?: CommandParams;
    selected?: (editor: JWEditor) => boolean;
    enabled?: (editor: JWEditor) => boolean;
}
export type ToolbarItem = Button | string | Array<Button | string>;
export type ToolbarGroup = ToolbarItem[];
export type ToolbarLayout = Array<ToolbarGroup | string>;

export interface ToolbarConfig extends JWPluginConfig {
    layout?: ToolbarLayout;
}

export class Toolbar<T extends ToolbarConfig = {}> extends JWPlugin<T> {
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
