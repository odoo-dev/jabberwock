import { JWEditor, Loadables } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { TemplateThumbnailSelectorDomObjectRenderer } from './TemplateThumbnailSelectorDomObjectRenderer';
import { TemplateActionableDomObjectRenderer } from './TemplateActionableDomObjectRenderer';
import { Layout } from '../../plugin-layout/src/Layout';
import { ComponentDefinition, ComponentId } from '../../plugin-layout/src/LayoutEngine';
import { CommandParams } from '../../core/src/Dispatcher';
import { ZoneNode, ZoneIdentifier } from '../../plugin-layout/src/ZoneNode';
import { ActionableGroupNode } from '../../plugin-layout/src/ActionableGroupNode';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { TemplateThumbnailSelectorNode } from './TemplateThumbnailSelectorNode';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { withIntangibles } from '../../core/src/Walker';

export type TemplateName = string;

export interface TemplateConfiguration {
    componentId: ComponentId;
    zoneId: ZoneIdentifier; // Zone to insert the content
    label: string;
    thumbnail: string;
    thumbnailZoneId?: ZoneIdentifier; // Zone to add the thumbnail (by default = zoneId)
}
interface TemplateConfig extends JWPluginConfig {
    components?: ComponentDefinition[];
    templateConfigurations?: Record<TemplateName, TemplateConfiguration>;
}
interface ApplyTemplateParams extends CommandParams {
    template: TemplateName;
}

export class Template<T extends TemplateConfig = TemplateConfig> extends JWPlugin<T> {
    static dependencies = [Layout, DomLayout];
    readonly loadables: Loadables<Renderer & Layout> = {
        renderers: [
            TemplateThumbnailSelectorDomObjectRenderer,
            TemplateActionableDomObjectRenderer,
        ],
        components: [
            {
                id: 'TemplateSelector',
                async render(): Promise<ActionableGroupNode[]> {
                    const group = new ActionableGroupNode({ name: 'templates' });
                    const zone = new ZoneNode({ managedZones: ['templateButtons'] });
                    group.append(zone);
                    return [group];
                },
            },
        ],
        componentZones: [['TemplateSelector', ['actionables']]],
    };
    commands = {
        applyTemplate: {
            handler: this.applyTemplate,
        },
    };

    constructor(editor: JWEditor, configuration: Partial<T> = {}) {
        super(editor, configuration);
        this.loadables.components.push(...this.configuration.components);
        const templateConfigurations = this.configuration.templateConfigurations;
        const targetedZones = new Set<ZoneIdentifier>();
        const thumbnailZones = new Set<ZoneIdentifier>();
        for (const config of Object.values(templateConfigurations)) {
            targetedZones.add(config.zoneId);
            config.thumbnailZoneId = config.thumbnailZoneId || config.zoneId;
            thumbnailZones.add(config.thumbnailZoneId);
        }
        for (const zoneId of targetedZones) {
            this.loadables.components.push({
                id: 'TemplateSelector-' + zoneId,
                async render(): Promise<ActionableGroupNode[]> {
                    const group = new ActionableGroupNode({ name: 'templates' });
                    const zone = new ZoneNode({ managedZones: ['templateButtons-' + zoneId] });
                    group.append(zone);
                    return [group];
                },
            });
        }
        for (const thumbnailZoneId of thumbnailZones) {
            this.loadables.components.push({
                id: 'TemplateThumbnailSelector-' + thumbnailZoneId,
                async render(): Promise<TemplateThumbnailSelectorNode[]> {
                    return [
                        new TemplateThumbnailSelectorNode({
                            managedZones: ['templateThumbnails-' + thumbnailZoneId],
                        }),
                    ];
                },
            });
        }
        for (const templateName in templateConfigurations) {
            const config = templateConfigurations[templateName];
            const button = this._createTemplateButton(templateName);
            this.loadables.components.push(button);
            this.loadables.componentZones.push([
                button.id,
                [
                    'templateButtons',
                    'templateButtons-' + config.zoneId,
                    'templateThumbnails-' + config.thumbnailZoneId,
                ],
            ]);
        }
    }
    /**
     *
     * @@override
     */
    async start(): Promise<void> {
        await super.start();
        const templateToSelect = new Set<TemplateName>();
        const layout = this.dependencies.get(Layout);
        const templateConfigurations = this.configuration.templateConfigurations;
        for (const templateName in templateConfigurations) {
            const config = templateConfigurations[templateName];
            for (const engine of Object.values(layout.engines)) {
                const zones = withIntangibles
                    .descendants(engine.root, ZoneNode)
                    .filter(zone => zone.managedZones.includes(config.zoneId));
                if (zones.length && !zones.find(zone => zone.firstChild())) {
                    templateToSelect.add(templateName);
                    break;
                }
            }
        }
        const filledZone = new Set<ZoneIdentifier>();
        for (const templateName of templateToSelect) {
            const config = templateConfigurations[templateName];
            if (!filledZone.has(config.thumbnailZoneId)) {
                await layout.clear(config.zoneId);
                filledZone.add(config.thumbnailZoneId);
                await layout.prepend(
                    'TemplateThumbnailSelector-' + config.thumbnailZoneId,
                    config.thumbnailZoneId,
                );
            }
        }
    }
    /**
     * Create the theme button ComponentDefinition
     *
     * @param name
     */
    private _createTemplateButton(name: TemplateName): ComponentDefinition {
        const config = this.configuration.templateConfigurations[name];
        return {
            id: 'Template' + name + 'Button',
            async render(): Promise<ActionableNode[]> {
                const button = new ActionableNode({
                    name: 'template-' + name,
                    label: config.label || 'Theme: ' + name,
                    commandId: 'applyTemplate',
                    commandArgs: { template: name } as ApplyTemplateParams,
                });
                return [button];
            },
        };
    }
    /**
     * Change the current theme and template.
     *
     * @param params
     */
    async applyTemplate(params: ApplyTemplateParams): Promise<void> {
        const layout = this.dependencies.get(Layout);
        const config = this.configuration.templateConfigurations[params.template];
        await layout.remove(
            'TemplateThumbnailSelector-' + config.thumbnailZoneId,
            config.thumbnailZoneId,
        );
        await layout.clear(config.zoneId);
        await layout.append(config.componentId, config.zoneId);
    }
}
