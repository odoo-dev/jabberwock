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
import {
    ActionableGroupNode,
    ActionableGroupNodeParams,
} from '../../plugin-layout/src/ActionableGroupNode';
import { SeparatorNode } from '../../core/src/VNodes/SeparatorNode';
import { ZoneNode } from '../../plugin-layout/src/ZoneNode';
import { LabelNode } from '../../plugin-layout/src/LabelNode';

export type ToolbarItem = ActionableNode | string | string[];
export type ToolbarOptGroup = ToolbarItem[];
export type ToolbarGroup = Array<ToolbarItem | ToolbarOptGroup>;
export type ToolbarLayout = Array<ToolbarGroup | string> | Record<string, ToolbarGroup>;

type ToolbarElementNode = SeparatorNode | ZoneNode | LabelNode | ActionableGroupNode;

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
                    toolbar.append(...this.makeToolbarNodes(this.configuration?.layout || []));
                    return [toolbar];
                },
            },
        ],
        componentZones: [['toolbar', ['tools']]],
    };
    configuration = { layout: [], ...this.configuration };

    makeToolbarNodes(group: ToolbarLayout | ToolbarGroup | ToolbarOptGroup): ToolbarElementNode[] {
        if (Array.isArray(group)) {
            const returnItems: ToolbarElementNode[] = [];
            for (const item of group) {
                returnItems.push(this.makeToolbarNode(item));
            }
            return returnItems;
        } else {
            return Object.keys(group).map(name => this.makeToolbarNode(group[name], name));
        }
    }
    makeToolbarNode(item: ToolbarGroup | ToolbarItem): ToolbarElementNode;
    makeToolbarNode(item: ToolbarGroup, name: string): ActionableGroupNode;
    makeToolbarNode(item: ToolbarGroup | ToolbarItem, name?: string): ToolbarElementNode {
        const domEngine = this.editor.plugins.get(Layout).engines.dom;

        if (typeof item === 'string') {
            if (item === '|') {
                return new SeparatorNode();
            } else if (domEngine.hasConfiguredComponents(item)) {
                return new ZoneNode({ managedZones: [item] });
            } else {
                return new LabelNode({ label: item });
            }
        } else if (item instanceof ActionableNode) {
            return item;
        } else {
            const groupParams: ActionableGroupNodeParams = { name };
            const group = new ActionableGroupNode(groupParams);
            group.append(...this.makeToolbarNodes(item));
            return group;
        }
    }
}
