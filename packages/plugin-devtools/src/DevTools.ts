import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Owl } from '../../plugin-owl/src/Owl';
import { OwlNode } from '../../plugin-owl/src/ui/OwlNode';
import { DevToolsComponent } from './components/DevToolsComponent';
import { Html } from '../../plugin-html/src/Html';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { Loadables } from '../../core/src/JWEditor';
import { Layout } from '../../plugin-layout/src/Layout';

import devtoolsTemplates from '../assets/DevTools.xml';
import '../assets/DevTools.css';

export class DevTools<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Owl, Html, DomLayout];
    readonly loadables: Loadables<Layout & Owl> = {
        components: [
            {
                id: 'devTools',
                async render(): Promise<OwlNode[]> {
                    return [new OwlNode({ Component: DevToolsComponent, props: {} })];
                },
            },
        ],
        componentZones: [['devTools', 'debug']],
        owlTemplates: [devtoolsTemplates],
    };
}
