import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Owl } from '../../plugin-owl/src/Owl';
import { OwlNode } from '../../plugin-owl/src/ui/OwlNode';
import { VorpalComponent } from './VorpalComponent';
import { Html } from '../../plugin-html/src/Html';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { Loadables } from '../../core/src/JWEditor';
import { Layout } from '../../plugin-layout/src/Layout';

import vorpalTemplates from '../assets/Vorpal.xml';
import '../assets/Vorpal.css';

export class Vorpal<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Owl, Html, DomLayout];
    readonly loadables: Loadables<Layout & Owl> = {
        components: [
            {
                id: 'Vorpal',
                async render(): Promise<OwlNode[]> {
                    return [new OwlNode(VorpalComponent, {})];
                },
            },
        ],
        componentZones: [['Vorpal', 'main']],
        owlTemplates: [vorpalTemplates],
    };
}
