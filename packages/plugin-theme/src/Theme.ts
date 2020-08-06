import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { ThemeXmlDomParser } from './ThemeXmlDomParser';
import { ThemeDomObjectRenderer } from './ThemeDomObjectRenderer';
import { Layout } from '../../plugin-layout/src/Layout';
import { ComponentDefinition } from '../../plugin-layout/src/LayoutEngine';
import { CommandParams } from '../../core/src/Dispatcher';
import { ThemeNode } from './ThemeNode';
import { ZoneNode } from '../../plugin-layout/src/ZoneNode';
import { ActionableGroupNode } from '../../plugin-layout/src/ActionableGroupNode';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { VElement } from '../../core/src/VNodes/VElement';

interface ThemeComponent extends ComponentDefinition {
    label?: string;
}
interface ThemeConfig extends JWPluginConfig {
    components?: ThemeComponent[];
}
interface ChangeThemeParams extends CommandParams {
    theme: string;
}

export class Theme<T extends ThemeConfig = ThemeConfig> extends JWPlugin<T> {
    static dependencies = [];
    readonly loadables: Loadables<Parser & Renderer & Layout> = {
        parsers: [ThemeXmlDomParser],
        renderers: [ThemeDomObjectRenderer],
        components: [
            {
                id: 'ThemeButton',
                async render(): Promise<ActionableGroupNode[]> {
                    const group = new ActionableGroupNode({ name: 'themes' });
                    const zone = new ZoneNode({ managedZones: ['themeButtons'] });
                    group.append(zone);
                    return [group];
                },
            },
        ],
        componentZones: [['ThemeButton', ['actionables']]],
    };
    commands = {
        changeTheme: {
            handler: this.changeTheme,
        },
    };
    themes: Record<string, ThemeComponent> = {
        default: {
            id: 'default',
            async render(): Promise<VElement[]> {
                return [new VElement({ htmlTag: 'T-PLACEHOLDER' })];
            },
            label: 'Theme: Default',
        },
    };

    constructor(editor: JWEditor, configuration: Partial<T> = {}) {
        super(editor, configuration);
        for (const theme of this.configuration.components) {
            this.themes[theme.id] = theme;
        }
        for (const name in this.themes) {
            this.loadables.components.push(this._createThemeButton(name));
            this.loadables.componentZones.push(['Theme' + name + 'Button', ['themeButtons']]);
        }
    }
    /**
     * Create a theme button ComponentDefinition.
     *
     * @param name
     */
    private _createThemeButton(name: string): ComponentDefinition {
        const theme = this.themes[name];
        return {
            id: 'Theme' + name + 'Button',
            async render(): Promise<ActionableNode[]> {
                const button = new ActionableNode({
                    name: 'theme-' + name,
                    label: theme.label || 'Theme: ' + name,
                    commandId: 'changeTheme',
                    commandArgs: { theme: name } as ChangeThemeParams,
                    selected: (editor: JWEditor): boolean => {
                        const ancestor = editor.selection.anchor.ancestor(ThemeNode);
                        return ancestor?.themeName === name;
                    },
                    enabled: (editor: JWEditor): boolean => {
                        return !!editor.selection.anchor.ancestor(ThemeNode);
                    },
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
    async changeTheme(params: ChangeThemeParams): Promise<void> {
        const ancestor = this.editor.selection.anchor.ancestor(ThemeNode);
        if (ancestor) {
            ancestor.themeName = params.theme;
        }
    }
}
