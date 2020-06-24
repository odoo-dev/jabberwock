import { expect } from 'chai';
import { JWEditor } from '../../core/src/JWEditor';
import { Char } from '../../plugin-char/src/Char';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { VNode } from '../../core/src/VNodes/VNode';
import { Parser } from '../../plugin-parser/src/Parser';
import { Toolbar } from '../src/Toolbar';
import { Bold } from '../../plugin-bold/src/Bold';
import { Italic } from '../../plugin-italic/src/Italic';
import { Underline } from '../../plugin-underline/src/Underline';
import { Heading } from '../../plugin-heading/src/Heading';
import { Paragraph } from '../../plugin-paragraph/src/Paragraph';
import { Indent } from '../../plugin-indent/src/Indent';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Pre } from '../../plugin-pre/src/Pre';
import { Html } from '../../plugin-html/src/Html';

const container = document.createElement('div');
container.classList.add('container');
const section = document.createElement('section');

describe('Toolbar', async () => {
    before(() => {
        document.body.appendChild(container);
        container.appendChild(section);
    });
    after(() => {
        document.body.removeChild(container);
        container.innerHTML = '';
        section.innerHTML = '';
    });

    describe('Display buttons in toolbar', async () => {
        let editor: JWEditor;
        beforeEach(() => {
            editor = new JWEditor();
            editor.load(Html);
            editor.load(Char);
            editor.load(Toolbar);
            editor.load(DomLayout, {
                components: [
                    {
                        id: 'template',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            const template = `<jw-editor>
                                    <t-toolbar/>
                                    <main><t t-zone="main"/></main>
                                    <t t-zone="default"/>
                                </jw-editor>`;
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                    {
                        id: 'TestButton',
                        async render(): Promise<VNode[]> {
                            return [new ActionableNode({ name: 'test', label: 'Test' })];
                        },
                    },
                    {
                        id: 'TestButtonFa',
                        async render(): Promise<VNode[]> {
                            return [
                                new ActionableNode({
                                    name: 'test',
                                    label: 'Test',
                                    modifiers: [
                                        new Attributes({ class: 'fa fa-align-test fa-fw' }),
                                    ],
                                }),
                            ];
                        },
                    },
                ],
                componentZones: [['template', ['root']]],
                location: [section, 'replace'],
            });
        });
        afterEach(async () => {
            await editor.stop();
        });

        it('should display the empty toolbar', async () => {
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                '<jw-toolbar></jw-toolbar>',
            );
        });
        it('should display label in toolbar from layout configuration', async () => {
            editor.configure(Toolbar, { layout: [['label']] });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                '<jw-toolbar><jw-group><span class="label">label</span></jw-group></jw-toolbar>',
            );
        });
        it('should display the bold button in the toolbar form "actionables" zone', async () => {
            editor.load(Bold);
            editor.load(DomLayout, {
                components: [
                    {
                        id: 'template',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            const template = `<jw-editor>
                                    <t-toolbar><t t-zone="actionables"/></t-toolbar>
                                    <main><t t-zone="main"/></main>
                                    <t t-zone="default"/>
                                </jw-editor>`;
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                componentZones: [['template', ['root']]],
                location: [section, 'replace'],
            });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<button name="removeFormat" class="fa fa-eraser fa-fw" title="Remove format" aria-pressed="false"></button>',
                    '<button name="bold" class="fa fa-bold fa-fw" title="Toggle bold" aria-pressed="false"></button>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display a test button in the toolbar', async () => {
            editor.configure(Toolbar, { layout: ['TestButton'] });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<button name="test" aria-pressed="false">Test</button>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display a test button with font-awsome in the toolbar', async () => {
            editor.configure(Toolbar, { layout: ['TestButtonFa'] });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<button name="test" class="fa fa-align-test fa-fw" title="Test" aria-pressed="false"></button>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display the bold button in the toolbar', async () => {
            editor.load(Bold);
            editor.configure(Toolbar, { layout: ['BoldButton'] });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<button name="bold" class="fa fa-bold fa-fw" title="Toggle bold" aria-pressed="false"></button>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display the bold button in the toolbar group', async () => {
            editor.load(Bold);
            editor.configure(Toolbar, { layout: [['BoldButton']] });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<jw-group>',
                    '<button name="bold" class="fa fa-bold fa-fw" title="Toggle bold" aria-pressed="false"></button>',
                    '</jw-group>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display a test button without font-awsome in the toolbar group select', async () => {
            editor.configure(Toolbar, { layout: [[['TestButton']]] });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<jw-group>',
                    '<select>',
                    '<option></option>',
                    '<option value="test">Test</option>',
                    '</select>',
                    '</jw-group>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display the bold button in the toolbar group select', async () => {
            editor.load(Bold);
            editor.configure(Toolbar, { layout: [[['BoldButton']]] });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<jw-group>',
                    '<select>',
                    '<option></option>',
                    '<option value="bold" class="fa fa-bold fa-fw">Toggle bold</option>',
                    '</select>',
                    '</jw-group>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display the bold button in the toolbar group select group option', async () => {
            editor.load(Bold);
            editor.configure(Toolbar, { layout: [[[['BoldButton']]]] });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<jw-group>',
                    '<select>',
                    '<option></option>',
                    '<optgroup>',
                    '<option value="bold" class="fa fa-bold fa-fw">Toggle bold</option>',
                    '</optgroup>',
                    '</select>',
                    '</jw-group>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display the 2 buttons in the toolbar group', async () => {
            editor.load(Bold);
            editor.load(Italic);
            editor.configure(Toolbar, { layout: [['BoldButton', 'ItalicButton']] });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<jw-group>',
                    '<button name="bold" class="fa fa-bold fa-fw" title="Toggle bold" aria-pressed="false"></button>',
                    '<button name="italic" class="fa fa-italic fa-fw" title="Toggle italic" aria-pressed="false"></button>',
                    '</jw-group>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display a label in the toolbar group', async () => {
            editor.load(Bold);
            editor.load(Italic);
            editor.configure(Toolbar, { layout: [['BoldButton', 'custom label', 'ItalicButton']] });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<jw-group>',
                    '<button name="bold" class="fa fa-bold fa-fw" title="Toggle bold" aria-pressed="false"></button>',
                    '<span class="label">custom label</span>',
                    '<button name="italic" class="fa fa-italic fa-fw" title="Toggle italic" aria-pressed="false"></button>',
                    '</jw-group>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display a label in the toolbar group select', async () => {
            editor.configure(Toolbar, { layout: [[['label']]] });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<jw-group>',
                    '<select>',
                    '<option></option>',
                    '<option class="label" disabled="true">label</option>',
                    '</select>',
                    '</jw-group>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display a seperator button in the toolbar', async () => {
            editor.load(Bold);
            editor.load(Italic);
            editor.configure(Toolbar, { layout: ['BoldButton', '|', 'ItalicButton'] });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<button name="bold" class="fa fa-bold fa-fw" title="Toggle bold" aria-pressed="false"></button>',
                    '<jw-separator role="separator"></jw-separator>',
                    '<button name="italic" class="fa fa-italic fa-fw" title="Toggle italic" aria-pressed="false"></button>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display a seperator button in the toolbar group', async () => {
            editor.load(Bold);
            editor.load(Italic);
            editor.configure(Toolbar, { layout: [['BoldButton', '|', 'ItalicButton']] });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<jw-group>',
                    '<button name="bold" class="fa fa-bold fa-fw" title="Toggle bold" aria-pressed="false"></button>',
                    '<jw-separator role="separator"></jw-separator>',
                    '<button name="italic" class="fa fa-italic fa-fw" title="Toggle italic" aria-pressed="false"></button>',
                    '</jw-group>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display a seperator button in the toolbar group select', async () => {
            editor.load(Bold);
            editor.load(Italic);
            editor.configure(Toolbar, { layout: [[['BoldButton', '|', 'ItalicButton']]] });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<jw-group>',
                    '<select>',
                    '<option></option>',
                    '<option value="bold" class="fa fa-bold fa-fw">Toggle bold</option>',
                    '<option role="separator" disabled="true"></option>',
                    '<option value="italic" class="fa fa-italic fa-fw">Toggle italic</option>',
                    '</select>',
                    '</jw-group>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display not display an empty group', async () => {
            editor.configure(Toolbar, {
                layout: [[[]], '|', []],
            });
            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                    '<jw-separator role="separator"></jw-separator>',
                    '</jw-toolbar>',
                ].join(''),
            );
        });
        it('should display all buttons in the toolbar', async () => {
            editor.load(Bold);
            editor.load(Italic);
            editor.load(Underline);
            editor.load(Heading);
            editor.load(Paragraph);
            editor.load(Indent);
            editor.load(Pre);
            editor.configure(Toolbar, {
                layout: [
                    [
                        [
                            'ParagraphButton',
                            'Heading1Button',
                            'Heading2Button',
                            'custom label in select',
                            'Heading6Button',
                            'PreButton',
                        ],
                    ],
                    '|',
                    'Heading1Button',
                    ['BoldButton', 'ItalicButton', 'UnderlineButton'],
                    'custom label',
                    ['IndentButton', '|', 'OutdentButton'],
                ],
            });

            await editor.start();
            const toolbar = container.querySelector('jw-toolbar');

            /* eslint-disable prettier/prettier */
            expect(toolbar?.outerHTML.replace(/[\s\n]+/g, ' ')).to.equal(
                [
                    '<jw-toolbar>',
                        '<jw-group>',
                            '<select>',
                                '<option></option>',
                                '<option value="paragraph" class="p" selected="true">Paragraph</option>',
                                '<option value="heading1" class="h1">Heading1</option>',
                                '<option value="heading2" class="h2">Heading2</option>',
                                '<option class="label" disabled="true">custom label in select</option>',
                                '<option value="heading6" class="h6">Heading6</option>',
                                '<option value="pre" class="pre">Pre</option>',
                            '</select>',
                        '</jw-group>',
                        '<jw-separator role="separator"></jw-separator>',
                        '<button name="heading1" class="h1" aria-pressed="false">Heading1</button>',
                        '<jw-group>',
                            '<button name="bold" class="fa fa-bold fa-fw" title="Toggle bold" aria-pressed="false"></button>',
                            '<button name="italic" class="fa fa-italic fa-fw" title="Toggle italic" aria-pressed="false"></button>',
                            '<button name="underline" class="fa fa-underline fa-fw" title="Toggle underline" aria-pressed="false"></button>',
                        '</jw-group>',
                        '<span class="label">custom label</span>',
                        '<jw-group>',
                            '<button name="indent" class="fa fa-indent fa-fw" title="Indent" aria-pressed="false"></button>',
                            '<jw-separator role="separator"></jw-separator>',
                            '<button name="outdent" class="fa fa-outdent fa-fw" title="Outdent" aria-pressed="false"></button>',
                        '</jw-group>',
                    '</jw-toolbar>',
                ].join(''),
            );
            /* eslint-enable prettier/prettier */
        });
    });
});
