import { Loadables } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { ToolbarZoneXmlDomParser } from './ToolbarXmlDomParser';
import { ToolbarZoneDomObjectRenderer } from './ToolbarDomObjectRenderer';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { Layout } from '../../plugin-layout/src/Layout';

import { ToolbarNode } from './ToolbarNode';
import { ActionableGroupNode } from '../../plugin-layout/src/ActionableGroupNode';
import { SeparatorNode } from '../../core/src/VNodes/SeparatorNode';
import { ZoneNode } from '../../plugin-layout/src/ZoneNode';
import { LabelNode } from '../../plugin-layout/src/LabelNode';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';

export type ToolbarItem = ActionableNode | string | string[];
export type ToolbarOptGroup = ToolbarItem[];
export type ToolbarGroup = Array<ToolbarItem | ToolbarOptGroup>;
export type ToolbarLayout = Array<ToolbarGroup | string>;

export interface ToolbarConfig extends JWPluginConfig {
    layout?: ToolbarLayout;
}

export class Toolbar<T extends ToolbarConfig = {}> extends JWPlugin<T> {
    static dependencies = [DomLayout];
    readonly loadables: Loadables<Parser & Renderer & Layout> = {
        parsers: [ToolbarZoneXmlDomParser],
        renderers: [ToolbarZoneDomObjectRenderer],
        components: [
            {
                id: 'toolbar',
                render: async (): Promise<ToolbarNode[]> => {
                    const toolbar = new ToolbarNode();
                    this.addToolbarItems(toolbar, this.configuration?.layout || []);
                    return [toolbar];
                },
            },
        ],
        componentZones: [['toolbar', ['tools']]],
    };
    configuration = { layout: [], ...this.configuration };
    addToolbarItems(toolbar: ToolbarNode, layout: ToolbarLayout): void;
    addToolbarItems(group: ActionableGroupNode, layoutGroup: ToolbarGroup | string[]): void;
    addToolbarItems(
        node: ToolbarNode | ActionableGroupNode,
        items: ToolbarLayout | ToolbarGroup | ToolbarOptGroup | string[],
    ): void {
        const domEngine = this.editor.plugins.get(Layout).engines.dom;

        for (const item of items) {
            if (typeof item === 'string') {
                if (item === '|') {
                    node.append(new SeparatorNode());
                } else if (domEngine.hasConfiguredComponents(item)) {
                    node.append(new ZoneNode({ managedZones: [item] }));
                } else {
                    node.append(new LabelNode({ label: item }));
                }
            } else if (item instanceof AbstractNode) {
                node.append(node);
            } else {
                const group = new ActionableGroupNode();
                this.addToolbarItems(group, item);
                node.append(group);
            }
        }
    }
}
