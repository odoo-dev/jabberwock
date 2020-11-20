import { expect } from 'chai';
import { JWEditor } from '../../core/src/JWEditor';
import { Char } from '../../plugin-char/src/Char';
import { TagNode } from '../../core/src/VNodes/TagNode';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { Dialog } from '../src/Dialog';
import { click } from '../../utils/src/testUtils';
import { Layout } from '../../plugin-layout/src/Layout';
import { DialogZoneNode } from '../src/DialogZoneNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { Parser } from '../../plugin-parser/src/Parser';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { Html } from '../../plugin-html/src/Html';

const container = document.createElement('div');
container.classList.add('container');
const section = document.createElement('section');

describe('Dialog', async () => {
    before(() => {
        document.body.appendChild(container);
        container.appendChild(section);
    });
    after(() => {
        document.body.removeChild(container);
        container.innerHTML = '';
        section.innerHTML = '';
    });

    describe('add a component in a dialog', async () => {
        let editor: JWEditor;
        before(() => {
            editor = new JWEditor();
            editor.load(Html);
            editor.load(Char);
            editor.load(Dialog);
            editor.load(DomLayout, {
                components: [
                    {
                        id: 'template',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            const template = `<jw-editor>
                                    <main>
                                        <t t-zone="main"/>
                                    </main>
                                    <t-dialog>
                                        <t t-zone="float"/>
                                        <t t-zone="default"/>
                                    </t-dialog>
                                </jw-editor>`;
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                    {
                        id: 'aaa',
                        async render(): Promise<VNode[]> {
                            const div = new TagNode({ htmlTag: 'div' });
                            const area = new TagNode({ htmlTag: 'area' });
                            div.append(area);
                            return [div];
                        },
                    },
                    {
                        id: 'bbb',
                        async render(): Promise<VNode[]> {
                            return [new TagNode({ htmlTag: 'section' })];
                        },
                    },
                ],
                componentZones: [['template', ['root']]],
                location: [section, 'replace'],
            });
        });
        beforeEach(async () => {
            await editor.start();
        });
        afterEach(async () => {
            await editor.stop();
        });

        it('should add a vNode in the dialog', async () => {
            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('aaa', 'float');
            });
            expect(container.innerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-editor>',
                    '<main></main>',
                    '<jw-dialog-container><jw-dialog> ',
                    '<jw-backdrop class="jw-close"></jw-backdrop> ',
                    '<jw-content> ',
                    '<jw-button class="jw-close">❌</jw-button> ',
                    '<div><area></div>',
                    '</jw-content> ',
                    '</jw-dialog>',
                    '</jw-dialog-container>',
                    '</jw-editor>',
                ].join(''),
            );
        });
        it('should add a vNode in the dialog and hide it', async () => {
            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('aaa', 'float');
            });
            await editor.execCommand('hide', { componentId: 'aaa' });
            expect(container.innerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                ['<jw-editor>', '<main></main>', '</jw-editor>'].join(''),
            );
        });
        it('should add a vNode in the dialog and show it', async () => {
            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('aaa', 'float');
            });
            await editor.execCommand('hide', { componentId: 'aaa' });
            await editor.execCommand('show', { componentId: 'aaa' });
            expect(container.innerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-editor>',
                    '<main></main>',
                    '<jw-dialog-container><jw-dialog> ',
                    '<jw-backdrop class="jw-close"></jw-backdrop> ',
                    '<jw-content> ',
                    '<jw-button class="jw-close">❌</jw-button> ',
                    '<div><area></div>',
                    '</jw-content> ',
                    '</jw-dialog>',
                    '</jw-dialog-container>',
                    '</jw-editor>',
                ].join(''),
            );
        });
        it('should add a vNode in dialog because dialog is the default zone', async () => {
            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('aaa', 'not available zone');
            });
            await editor.execCommand('show', { componentId: 'aaa' });
            expect(container.innerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-editor>',
                    '<main></main>',
                    '<jw-dialog-container><jw-dialog> ',
                    '<jw-backdrop class="jw-close"></jw-backdrop> ',
                    '<jw-content> ',
                    '<jw-button class="jw-close">❌</jw-button> ',
                    '<div><area></div>',
                    '</jw-content> ',
                    '</jw-dialog>',
                    '</jw-dialog-container>',
                    '</jw-editor>',
                ].join(''),
            );
        });
        it('should add 2 vNodes in the dialog and show it', async () => {
            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('aaa', 'float');
            });
            await editor.execCommand('show', { componentId: 'aaa' });

            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('bbb', 'not available zone');
            });
            await editor.execCommand('show', { componentId: 'bbb' });

            expect(container.innerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-editor>',
                    '<main></main>',
                    '<jw-dialog-container>',
                    '<jw-dialog> ',
                    '<jw-backdrop class="jw-close"></jw-backdrop> ',
                    '<jw-content> ',
                    '<jw-button class="jw-close">❌</jw-button> ',
                    '<div><area></div>',
                    '</jw-content> ',
                    '</jw-dialog>',
                    '<jw-dialog> ',
                    '<jw-backdrop class="jw-close"></jw-backdrop> ',
                    '<jw-content> ',
                    '<jw-button class="jw-close">❌</jw-button> ',
                    '<section></section>',
                    '</jw-content> ',
                    '</jw-dialog>',
                    '</jw-dialog-container>',
                    '</jw-editor>',
                ].join(''),
            );
        });
        it('should close 2 dialogs with the X button', async () => {
            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('aaa', 'float');
            });
            await editor.execCommand('show', { componentId: 'aaa' });

            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('bbb', 'not available zone');
            });
            await editor.execCommand('show', { componentId: 'bbb' });

            await click(
                Array.from(container.querySelectorAll('jw-dialog jw-button.jw-close')).pop(),
            );

            expect(container.innerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-editor>',
                    '<main></main>',
                    '<jw-dialog-container>',
                    '<jw-dialog> ',
                    '<jw-backdrop class="jw-close"></jw-backdrop> ',
                    '<jw-content> ',
                    '<jw-button class="jw-close">❌</jw-button> ',
                    '<div><area></div>',
                    '</jw-content> ',
                    '</jw-dialog>',
                    '</jw-dialog-container>',
                    '</jw-editor>',
                ].join(''),
            );

            await click(
                Array.from(container.querySelectorAll('jw-dialog jw-button.jw-close')).pop(),
            );

            expect(container.innerHTML).to.equal(
                ['<jw-editor>', '<main></main>', '</jw-editor>'].join(''),
            );

            // the node are not removed, only hide
            // TO CHECK DMO: params for 'add' method: callback for onShow and onHide ?
            const div = editor.plugins.get(Layout).engines.dom.components.aaa[0];
            expect(div.parent).to.instanceOf(DialogZoneNode);
            const section = editor.plugins.get(Layout).engines.dom.components.bbb[0];
            expect(section.parent).to.instanceOf(DialogZoneNode);
        });
        it('should close 2 dialogs it with the backdrop', async () => {
            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('aaa', 'float');
            });
            await editor.execCommand('show', { componentId: 'aaa' });

            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('bbb', 'not available zone');
            });
            await editor.execCommand('show', { componentId: 'bbb' });

            await click(
                Array.from(container.querySelectorAll('jw-dialog jw-backdrop.jw-close')).pop(),
            );

            expect(container.innerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-editor>',
                    '<main></main>',
                    '<jw-dialog-container>',
                    '<jw-dialog> ',
                    '<jw-backdrop class="jw-close"></jw-backdrop> ',
                    '<jw-content> ',
                    '<jw-button class="jw-close">❌</jw-button> ',
                    '<div><area></div>',
                    '</jw-content> ',
                    '</jw-dialog>',
                    '</jw-dialog-container>',
                    '</jw-editor>',
                ].join(''),
            );

            await click(
                Array.from(container.querySelectorAll('jw-dialog jw-backdrop.jw-close')).pop(),
            );

            expect(container.innerHTML).to.equal(
                ['<jw-editor>', '<main></main>', '</jw-editor>'].join(''),
            );

            // the node are not removed, only hide
            const div = editor.plugins.get(Layout).engines.dom.components.aaa[0];
            expect(div.parent).to.instanceOf(DialogZoneNode);
            const section = editor.plugins.get(Layout).engines.dom.components.bbb[0];
            expect(section.parent).to.instanceOf(DialogZoneNode);
        });
        it('should close a dialog and re-open a dialog', async () => {
            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('aaa', 'float');
            });
            await editor.execCommand('show', { componentId: 'aaa' });

            await click(
                Array.from(container.querySelectorAll('jw-dialog jw-button.jw-close')).pop(),
            );

            expect(container.innerHTML).to.equal(
                ['<jw-editor>', '<main></main>', '</jw-editor>'].join(''),
            );

            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('bbb', 'not available zone');
            });
            await editor.execCommand('show', { componentId: 'bbb' });

            expect(container.innerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-editor>',
                    '<main></main>',
                    '<jw-dialog-container>',
                    '<jw-dialog> ',
                    '<jw-backdrop class="jw-close"></jw-backdrop> ',
                    '<jw-content> ',
                    '<jw-button class="jw-close">❌</jw-button> ',
                    '<section></section>',
                    '</jw-content> ',
                    '</jw-dialog>',
                    '</jw-dialog-container>',
                    '</jw-editor>',
                ].join(''),
            );
        });
        it('should not close the dialog if click in content', async () => {
            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('bbb', 'not available zone');
            });
            await editor.execCommand('show', { componentId: 'bbb' });

            await click(Array.from(container.querySelectorAll('jw-dialog jw-content')).pop());

            expect(container.innerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-editor>',
                    '<main></main>',
                    '<jw-dialog-container>',
                    '<jw-dialog> ',
                    '<jw-backdrop class="jw-close"></jw-backdrop> ',
                    '<jw-content> ',
                    '<jw-button class="jw-close">❌</jw-button> ',
                    '<section></section>',
                    '</jw-content> ',
                    '</jw-dialog>',
                    '</jw-dialog-container>',
                    '</jw-editor>',
                ].join(''),
            );
        });
        it('should hide a vNode in dialog (without remove the vNode)', async () => {
            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('bbb', 'not available zone');
            });

            await editor.execCommand('hide', { componentId: 'bbb' });

            expect(container.innerHTML).to.equal(
                ['<jw-editor>', '<main></main>', '</jw-editor>'].join(''),
            );

            await editor.execCommand('show', { componentId: 'bbb' });

            expect(container.innerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-editor>',
                    '<main></main>',
                    '<jw-dialog-container>',
                    '<jw-dialog> ',
                    '<jw-backdrop class="jw-close"></jw-backdrop> ',
                    '<jw-content> ',
                    '<jw-button class="jw-close">❌</jw-button> ',
                    '<section></section>',
                    '</jw-content> ',
                    '</jw-dialog>',
                    '</jw-dialog-container>',
                    '</jw-editor>',
                ].join(''),
            );

            const section = editor.plugins.get(Layout).engines.dom.components.bbb[0];
            expect(section.parent).to.instanceOf(DialogZoneNode);
        });
    });
    describe('add automatically component in a dialog', async () => {
        let editor: JWEditor;
        before(() => {
            editor = new JWEditor();
            editor.load(Html);
            editor.load(Char);
            editor.load(Dialog);
            editor.load(DomLayout, {
                components: [
                    {
                        id: 'template',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            const template = `<jw-editor>
                                    <main>
                                        <t t-zone="main"/>
                                    </main>
                                    <t-dialog>
                                        <t t-zone="float"/>
                                        <t t-zone="default"/>
                                    </t-dialog>
                                </jw-editor>`;
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                    {
                        id: 'custom',
                        async render(): Promise<VNode[]> {
                            return [new TagNode({ htmlTag: 'section' })];
                        },
                    },
                ],
                componentZones: [
                    ['template', ['root']],
                    ['custom', ['float']],
                ],
                location: [section, 'replace'],
            });
        });
        beforeEach(async () => {
            await editor.start();
        });
        afterEach(async () => {
            await editor.stop();
        });

        it('should show the dialog', async () => {
            expect(container.innerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-editor>',
                    '<main></main>',
                    '<jw-dialog-container>',
                    '<jw-dialog> ',
                    '<jw-backdrop class="jw-close"></jw-backdrop> ',
                    '<jw-content> ',
                    '<jw-button class="jw-close">❌</jw-button> ',
                    '<section></section>',
                    '</jw-content> ',
                    '</jw-dialog>',
                    '</jw-dialog-container>',
                    '</jw-editor>',
                ].join(''),
            );
        });
        it('should hide the dialog', async () => {
            const domLayoutEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const vNode = domLayoutEngine.getNodes(container.querySelector('section')).pop();

            await editor.execCommand('hide', { componentId: 'custom' });
            expect(container.innerHTML).to.equal(
                ['<jw-editor>', '<main></main>', '</jw-editor>'].join(''),
            );

            expect(vNode.parent).to.instanceOf(DialogZoneNode);
        });
        it('should hide the dialog when click on the backdrop (without remove the vNode)', async () => {
            const domLayoutEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const vNode = domLayoutEngine.getNodes(container.querySelector('section')).pop();
            await click(
                Array.from(container.querySelectorAll('jw-dialog jw-backdrop.jw-close')).pop(),
            );
            expect(container.innerHTML).to.equal(
                ['<jw-editor>', '<main></main>', '</jw-editor>'].join(''),
            );

            // the node are not removed, only hide
            expect(vNode.parent).to.instanceOf(DialogZoneNode);
        });
    });
});
