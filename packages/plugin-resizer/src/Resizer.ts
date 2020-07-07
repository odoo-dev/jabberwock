import { Loadables } from '../../core/src/JWEditor';
import { JWPlugin } from '../../core/src/JWPlugin';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { Layout } from '../../plugin-layout/src/Layout';

import '../assets/Resizer.css';
import { ResizerNode } from './ResizerNode';
import { ResizerDomObjectRenderer } from './ResizerDomObjectRenderer';
import { Renderer } from '../../plugin-renderer/src/Renderer';

export class Resizer<T = {}> extends JWPlugin<T> {
    static dependencies = [DomLayout];
    readonly loadables: Loadables<Layout & Renderer> = {
        renderers: [ResizerDomObjectRenderer],
        components: [
            {
                id: 'resizer',
                render: async (): Promise<ResizerNode[]> => {
                    return [new ResizerNode()];
                },
            },
        ],
        componentZones: [['resizer', ['resizer']]],
    };
}
