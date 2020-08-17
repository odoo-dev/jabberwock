import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { VNode } from '../../core/src/VNodes/VNode';
import { parseEditable } from '../../utils/src/configuration';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { ThemeNode } from '../../plugin-theme/src/ThemeNode';
import { Toolbar } from '../../plugin-toolbar/src/Toolbar';
import { click } from '../../utils/src/testUtils';
import { DevicePreview } from '../src/DevicePreview';
import { Layout } from '../../plugin-layout/src/Layout';

const container = document.createElement('div');
container.classList.add('container');
const section = document.createElement('section');

describe('DevicePreview', async () => {
    beforeEach(() => {
        document.body.appendChild(container);
        container.appendChild(section);
        section.innerHTML = '<p>abc</p><p>def</p>';
    });
    afterEach(() => {
        document.body.removeChild(container);
        container.innerHTML = '';
        section.innerHTML = '';
    });

    describe('default', async () => {
        it('should toggle the default mobile device', async () => {
            const editor = new BasicEditor({ editable: section });
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> => {
                            const theme = new ThemeNode();
                            const contents = await parseEditable(editor, section, true);
                            theme.append(...contents);
                            return [theme];
                        },
                    },
                ],
            });
            editor.configure(DevicePreview, {
                getTheme(editor: JWEditor) {
                    const layout = editor.plugins.get(Layout);
                    const domLayout = layout.engines.dom;
                    return domLayout.components.editable[0] as ThemeNode;
                },
            });
            editor.configure(Toolbar, { layout: [['DevicePreviewButton']] });
            await editor.start();

            // open the mobile preview

            await click(container.querySelector('jw-button[name="devicePreview"]'));

            const iframe = container.querySelector('iframe') as HTMLIFrameElement;
            expect(iframe?.id).to.equal('jw-device-preview');
            expect(iframe?.className).to.equal('device-preview-mobile');

            // return to default preview

            await click(container.querySelector('jw-button[name="devicePreview"]'));

            expect(!!container.querySelector('iframe')).to.equal(false);

            await editor.stop();
        });
    });
});
