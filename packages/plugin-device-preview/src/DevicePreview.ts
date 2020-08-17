import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { Layout } from '../../plugin-layout/src/Layout';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Theme } from '../../plugin-theme/src/Theme';
import { Iframe } from '../../plugin-iframe/src/Iframe';
import { VNode } from '../../core/src/VNodes/VNode';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { ThemeNode } from '../../plugin-theme/src/ThemeNode';
import { CommandParams } from '../../core/src/Dispatcher';

import '../assets/DevicePreview.css';

export interface DevicePreviewConfig extends JWPluginConfig {
    getTheme?: (editor: JWEditor) => ThemeNode;
    devices?: Record<
        string,
        {
            label: string;
            head: string;
        }
    >;
}
interface DevicePreviewParams extends CommandParams {
    device: string;
}

export class DevicePreview<T extends DevicePreviewConfig = DevicePreviewConfig> extends JWPlugin<
    T
> {
    static dependencies = [Theme, Iframe, DomLayout];
    readonly loadables: Loadables<Parser & Keymap & Layout> = {
        components: [
            {
                id: 'DevicePreviewButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'devicePreview',
                        label: 'Toggle device preview',
                        commandId: 'toggleDevicePreview',
                        selected: (editor: JWEditor): boolean =>
                            !!editor.selection.anchor.ancestor(
                                node =>
                                    node instanceof ThemeNode && node.themeName.endsWith('Preview'),
                            ),
                        modifiers: [new Attributes({ class: 'fa fa-mobile-alt fa-fw' })],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [['DevicePreviewButton', ['actionables']]],
    };
    commands = {
        toggleDevicePreview: {
            handler: this.toggleDevicePreview,
        },
    };

    constructor(editor: JWEditor, configuration: T) {
        super(editor, configuration);
        if (!this.configuration.getTheme) {
            throw new Error(
                'Please define the getTheme method to configure the DevicePreview plugin.',
            );
        }

        if (!this.configuration.devices) {
            const styleSheets: string[] = [];
            for (const style of document.querySelectorAll('style, link')) {
                styleSheets.push(
                    style.outerHTML.replace(
                        style.innerHTML,
                        style.innerHTML.replace(/</, '&lt;').replace(/>/, '&gt;'),
                    ),
                );
            }
            this.configuration.devices = {
                mobile: {
                    label: 'Mobile preview',
                    head: styleSheets.join(''),
                },
            };
        }
    }

    /**
     * @override
     */
    start(): Promise<void> {
        for (const deviceName in this.configuration.devices) {
            const device = this.configuration.devices[deviceName];
            this.dependencies.get(Theme).addTheme({
                id: deviceName + 'DevicePreview',
                label: device.label,
                render: async (editor: JWEditor): Promise<VNode[]> => {
                    return editor.plugins
                        .get(Parser)
                        .parse(
                            'text/html',
                            '<t-iframe id="jw-device-preview" class="device-preview-' +
                                deviceName +
                                '">' +
                                device.head +
                                '<t-placeholder/></t-iframe>',
                        );
                },
            });
        }
        return super.start();
    }
    /**
     * Toggle the device preview.
     *
     * @param params
     */
    async toggleDevicePreview(params: DevicePreviewParams): Promise<void> {
        const theme = this.configuration.getTheme(this.editor);
        if (theme) {
            if (params.device) {
                const device = params.device + 'DevicePreview';
                theme.themeName = theme.themeName === device ? 'default' : device;
            } else {
                const devices = ['default'].concat(
                    Object.keys(this.configuration.devices).map(device => device + 'DevicePreview'),
                );
                const index = devices.indexOf(theme.themeName) + 1;
                theme.themeName = devices[index] ? devices[index] : 'default';
            }
        }
    }
}
