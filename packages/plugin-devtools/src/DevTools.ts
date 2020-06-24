import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Owl } from '../../plugin-owl/src/Owl';
import { OwlNode } from '../../plugin-owl/src/OwlNode';
import { DevToolsComponent } from './components/DevToolsComponent';
import { DomObjectRenderer } from '../../plugin-renderer-dom-object/src/DomObjectRenderer';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { Loadables } from '../../core/src/JWEditor';
import { Layout } from '../../plugin-layout/src/Layout';

import devtoolsTemplates from '../assets/DevTools.xml';
import '../assets/DevTools.css';

export class DevTools<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Owl, DomObjectRenderer, DomLayout];
    readonly loadables: Loadables<Layout & Owl> = {
        components: [
            {
                id: 'devTools',
                async render(): Promise<OwlNode[]> {
                    return [new OwlNode({ Component: DevToolsComponent, props: {} })];
                },
            },
        ],
        componentZones: [['devTools', ['debug']]],
        owlTemplates: [devtoolsTemplates],
    };
}
