import { Loadables } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Layout } from '../../plugin-layout/src/Layout';
import { FullsreenButtonDomObjectRenderer } from './FullsreenButtonDomObjectRenderer';
import { ComponentId } from '../../plugin-layout/src/LayoutEngine';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

interface FullscreenConfig extends JWPluginConfig {
    component?: ComponentId;
}

export class Fullscreen<T extends FullscreenConfig = FullscreenConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Renderer & Layout> = {
        renderers: [FullsreenButtonDomObjectRenderer],
        components: [
            {
                id: 'FullscreenButton',
                render: async (): Promise<ActionableNode[]> => {
                    const button = new ActionableNode({
                        name: 'fullscreen',
                        label: 'Toggle Fullsreen',
                        selected: (): boolean => this.isFullscreen,
                        modifiers: [new Attributes({ class: 'fas fa-expand fa-fw' })],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [['FullscreenButton', 'actionables']],
    };
    isFullscreen = false;
}
