import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CommandIdentifier, CommandParams } from '../../core/src/Dispatcher';
import { Owl } from '../../plugin-owl/src/Owl';
import { ToolbarComponent } from './components/ToolbarComponent';
import { Layout } from '../../plugin-layout/src/Layout';
import { OwlNode } from '../../plugin-owl/src/ui/OwlNode';

import toolbarTemplates from '../assets/Toolbar.xml';
import '../assets/Toolbar.css';

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
    static dependencies = [Owl];
    readonly loadables: Loadables<Layout & Owl> = {
        components: [
            {
                id: 'toolbar',
                async render(): Promise<OwlNode[]> {
                    return [new OwlNode(ToolbarComponent, {})];
                },
            },
        ],
        componentZones: [['toolbar', 'tools']],
        owlTemplates: [toolbarTemplates],
    };
}
