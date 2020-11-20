import { expect } from 'chai';
import { Template } from '../src/Template';
import JWEditor, { JWEditorConfig, Loadables } from '../../core/src/JWEditor';
import { Char } from '../../plugin-char/src/Char';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { VNode, RelativePosition } from '../../core/src/VNodes/VNode';
import { Parser } from '../../plugin-parser/src/Parser';
import { Layout } from '../../plugin-layout/src/Layout';
import { TagNode } from '../../core/src/VNodes/TagNode';
import { Toolbar } from '../../plugin-toolbar/src/Toolbar';
import { click } from '../../utils/src/testUtils';
import { ZoneNode } from '../../plugin-layout/src/ZoneNode';
import { Html } from '../../plugin-html/src/Html';

const container = document.createElement('div');
const target = document.createElement('div');
container.classList.add('container');

describe('Template', () => {
    let editor: JWEditor;
    beforeEach(async () => {
        document.body.appendChild(container);
        target.classList.add('editable');
        container.appendChild(target);
        editor = new JWEditor();
        editor.load(Char);
        editor.load(Html);
        editor.configure(Template, {
            components: [
                {
                    id: 'template-first',
                    async render(editor: JWEditor): Promise<VNode[]> {
                        return editor.plugins
                            .get(Parser)
                            .parse(
                                'text/html',
                                `<div class="row"><div class="col">text default</div></div>`,
                            );
                    },
                },
                {
                    id: 'template-second',
                    async render(editor: JWEditor): Promise<VNode[]> {
                        return editor.plugins
                            .get(Parser)
                            .parse('text/html', `<section id="second">text default</section>`);
                    },
                },
            ],
            templateConfigurations: {
                template1: {
                    componentId: 'template-first',
                    zoneId: 'content',
                    label: 'Good 1',
                    thumbnail: '#thumbnail1.png',
                },
                template2: {
                    componentId: 'template-second',
                    zoneId: 'content',
                    label: 'Good 2',
                    thumbnail: '#thumbnail2.png',
                },
            },
        });
        editor.configure(DomLayout, {
            components: [
                {
                    id: 'editable',
                    async render(editor: JWEditor): Promise<VNode[]> {
                        const zone = new ZoneNode({ managedZones: ['content'] });
                        editor.selection.setAt(zone, RelativePosition.INSIDE);
                        return [zone];
                    },
                },
            ],
            componentZones: [['editable', ['main']]],
            location: [target, 'replace'],
        });
        const config: JWEditorConfig & { loadables: Loadables<Layout> } = {
            loadables: {
                components: [
                    {
                        id: 'editor',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<jw-editor><t t-zone="tools"/><t t-zone="default"/><t t-zone="main"/></jw-editor>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                componentZones: [['editor', ['root']]],
            },
        };
        editor.configure(config);
    });
    afterEach(async () => {
        await editor.stop();
        document.body.removeChild(container);
        container.innerHTML = '';
        target.innerHTML = '';
    });
    it('should display the template selector when the content is empty', async () => {
        await editor.start();
        expect(container.innerHTML).to.equal(
            [
                '<jw-editor>',
                '<jw-templates>',
                '<jw-label>Please choose a template</jw-label>',
                '<jw-template name="template-template1" aria-pressed="false"><jw-label class="label">Good 1</jw-label><jw-thumb style="background-image: url(&quot;#thumbnail1.png&quot;);"></jw-thumb></jw-template>',
                '<jw-template name="template-template2" aria-pressed="false"><jw-label class="label">Good 2</jw-label><jw-thumb style="background-image: url(&quot;#thumbnail2.png&quot;);"></jw-thumb></jw-template>',
                '</jw-templates>',
                '</jw-editor>',
            ].join(''),
        );
    });
    it('should use an other zone to display the thumbnail selector', async () => {
        editor.configure(DomLayout, {
            components: [
                {
                    id: 'editable',
                    async render(): Promise<VNode[]> {
                        const section = new TagNode({ htmlTag: 'SECTION' });
                        const sectionZone = new ZoneNode({ managedZones: ['section'] });
                        section.append(sectionZone);
                        const div = new TagNode({ htmlTag: 'DIV' });
                        const divZone = new ZoneNode({ managedZones: ['content'] });
                        div.append(divZone);
                        return [section, div];
                    },
                },
            ],
        });
        editor.configure(Template, {
            templateConfigurations: {
                template1: {
                    componentId: 'template-first',
                    zoneId: 'content',
                    label: 'Good 1',
                    thumbnail: '#thumbnail1.png',
                    thumbnailZoneId: 'section',
                },
                template2: {
                    componentId: 'template-second',
                    zoneId: 'content',
                    label: 'Good 2',
                    thumbnail: '#thumbnail2.png',
                    thumbnailZoneId: 'section',
                },
            },
        });
        await editor.start();
        /* eslint-disable prettier/prettier */
        expect(container.innerHTML).to.equal(
            [
                '<jw-editor>',
                    '<section>',
                        '<jw-templates>',
                            '<jw-label>Please choose a template</jw-label>',
                            '<jw-template name="template-template1" aria-pressed="false"><jw-label class="label">Good 1</jw-label><jw-thumb style="background-image: url(&quot;#thumbnail1.png&quot;);"></jw-thumb></jw-template>',
                            '<jw-template name="template-template2" aria-pressed="false"><jw-label class="label">Good 2</jw-label><jw-thumb style="background-image: url(&quot;#thumbnail2.png&quot;);"></jw-thumb></jw-template>',
                        '</jw-templates>',
                    '</section>',
                    '<div></div>',
                '</jw-editor>',
            ].join(''),
        );
        /* eslint-enable prettier/prettier */
    });
    it('should use an other zone to display the thumbnail selector and select template', async () => {
        editor.configure(DomLayout, {
            components: [
                {
                    id: 'editable',
                    async render(): Promise<VNode[]> {
                        const section = new TagNode({ htmlTag: 'SECTION' });
                        const sectionZone = new ZoneNode({ managedZones: ['section'] });
                        section.append(sectionZone);
                        const div = new TagNode({ htmlTag: 'DIV' });
                        const divZone = new ZoneNode({ managedZones: ['content'] });
                        div.append(divZone);
                        return [section, div];
                    },
                },
            ],
        });
        editor.configure(Template, {
            templateConfigurations: {
                template1: {
                    componentId: 'template-first',
                    zoneId: 'content',
                    label: 'Good 1',
                    thumbnail: '#thumbnail1.png',
                    thumbnailZoneId: 'section',
                },
                template2: {
                    componentId: 'template-second',
                    zoneId: 'content',
                    label: 'Good 2',
                    thumbnail: '#thumbnail2.png',
                    thumbnailZoneId: 'section',
                },
            },
        });
        await editor.start();
        await click(container.querySelector('jw-template[name="template-template2"] jw-thumb'));
        expect(container.innerHTML).to.equal(
            [
                '<jw-editor>',
                '<section></section>',
                '<div><section id="second">text default</section></div>',
                '</jw-editor>',
            ].join(''),
        );
    });
    it('should use different zones and display the thumbnail selectors', async () => {
        editor.configure(DomLayout, {
            components: [
                {
                    id: 'editable',
                    async render(): Promise<VNode[]> {
                        const section = new TagNode({ htmlTag: 'SECTION' });
                        const sectionZone = new ZoneNode({ managedZones: ['section'] });
                        section.append(sectionZone);
                        const div = new TagNode({ htmlTag: 'DIV' });
                        const divZone = new ZoneNode({ managedZones: ['content'] });
                        div.append(divZone);
                        return [section, div];
                    },
                },
            ],
        });
        editor.configure(Template, {
            templateConfigurations: {
                template1: {
                    componentId: 'template-first',
                    zoneId: 'section',
                    label: 'Good 1',
                    thumbnail: '#thumbnail1.png',
                },
                template2: {
                    componentId: 'template-second',
                    zoneId: 'content',
                    label: 'Good 2',
                    thumbnail: '#thumbnail2.png',
                },
            },
        });
        await editor.start();
        /* eslint-disable prettier/prettier */
        expect(container.innerHTML).to.equal(
            [
                '<jw-editor>',
                    '<section>',
                        '<jw-templates>',
                            '<jw-label>Please choose a template</jw-label>',
                            '<jw-template name="template-template1" aria-pressed="false"><jw-label class="label">Good 1</jw-label><jw-thumb style="background-image: url(&quot;#thumbnail1.png&quot;);"></jw-thumb></jw-template>',
                        '</jw-templates>',
                    '</section>',
                    '<div>',
                        '<jw-templates>',
                            '<jw-label>Please choose a template</jw-label>',
                            '<jw-template name="template-template2" aria-pressed="false"><jw-label class="label">Good 2</jw-label><jw-thumb style="background-image: url(&quot;#thumbnail2.png&quot;);"></jw-thumb></jw-template>',
                        '</jw-templates>',
                    '</div>',
                '</jw-editor>',
            ].join(''),
        );
        /* eslint-enable prettier/prettier */
    });
    it('should use different selectors in toolbar', async () => {
        editor.configure(DomLayout, {
            components: [
                {
                    id: 'editable',
                    async render(editor: JWEditor): Promise<VNode[]> {
                        const zone = new ZoneNode({ managedZones: ['content'] });
                        const article = new TagNode({ htmlTag: 'ARTICLE' });
                        zone.append(article);
                        editor.selection.setAt(article, RelativePosition.INSIDE);
                        return [zone];
                    },
                },
            ],
        });
        editor.configure(Template, {
            templateConfigurations: {
                template1: {
                    componentId: 'template-first',
                    zoneId: 'section',
                    label: 'Good 1',
                    thumbnail: '#thumbnail1.png',
                },
                template2: {
                    componentId: 'template-second',
                    zoneId: 'content',
                    label: 'Good 2',
                    thumbnail: '#thumbnail2.png',
                },
            },
        });
        editor.configure(Toolbar, {
            layout: [['TemplateSelector-section', 'TemplateSelector-content']],
        });
        await editor.start();
        /* eslint-disable prettier/prettier */
        expect(container.innerHTML).to.equal(
            [
                '<jw-editor>',
                    '<jw-toolbar>',
                        '<jw-group>',
                            '<jw-select>',
                                '<jw-button>&nbsp;</jw-button>',
                                '<jw-group>',
                                    '<jw-button name="template-template1" aria-pressed="false">Good 1</jw-button>',
                                '</jw-group>',
                            '</jw-select>',
                            '<jw-select>',
                                '<jw-button>&nbsp;</jw-button>',
                                '<jw-group>',
                                    '<jw-button name="template-template2" aria-pressed="false">Good 2</jw-button>',
                                '</jw-group>',
                                '</jw-select>',
                        '</jw-group>',
                    '</jw-toolbar>',
                    '<article></article>',
                '</jw-editor>',
            ].join(''),
        );
        /* eslint-enable prettier/prettier */
    });
    it('should select a template when the content is empty', async () => {
        await editor.start();
        await click(container.querySelector('jw-thumb'));
        expect(container.innerHTML).to.equal(
            [
                '<jw-editor>',
                '<div class="row"><div class="col">text default</div></div>',
                '</jw-editor>',
            ].join(''),
        );
    });
    it('should select the second template when the content is empty', async () => {
        await editor.start();
        await click(container.querySelector('jw-template:last-child jw-thumb'));
        expect(container.innerHTML).to.equal(
            ['<jw-editor>', '<section id="second">text default</section>', '</jw-editor>'].join(''),
        );
    });
    it('should change the template', async () => {
        editor.configure(DomLayout, {
            components: [
                {
                    id: 'editable',
                    async render(editor: JWEditor): Promise<VNode[]> {
                        const zone = new ZoneNode({ managedZones: ['content'] });
                        const article = new TagNode({ htmlTag: 'ARTICLE' });
                        zone.append(article);
                        editor.selection.setAt(article, RelativePosition.INSIDE);
                        return [zone];
                    },
                },
            ],
            componentZones: [['editable', ['main']]],
            location: [target, 'replace'],
        });
        await editor.start();
        await editor.execCommand('applyTemplate', { template: 'template1' });
        expect(container.innerHTML).to.equal(
            '<jw-editor><div class="row"><div class="col">text default</div></div></jw-editor>',
        );
    });
    it('should change the template with the toolbar', async () => {
        editor.configure(DomLayout, {
            components: [
                {
                    id: 'editable',
                    async render(editor: JWEditor): Promise<VNode[]> {
                        const zone = new ZoneNode({ managedZones: ['content'] });
                        const article = new TagNode({ htmlTag: 'ARTICLE' });
                        zone.append(article);
                        editor.selection.setAt(article, RelativePosition.INSIDE);
                        return [zone];
                    },
                },
            ],
        });
        editor.configure(Toolbar, { layout: [['TemplateSelector']] });
        await editor.start();

        /* eslint-disable prettier/prettier */
        expect(container.innerHTML).to.equal(
            [
                '<jw-editor>',
                    '<jw-toolbar>'+
                        '<jw-group>'+
                            '<jw-select>'+
                                '<jw-button>&nbsp;</jw-button>'+
                                    '<jw-group>',
                                        '<jw-button name="template-template1" aria-pressed="false">Good 1</jw-button>'+
                                        '<jw-button name="template-template2" aria-pressed="false">Good 2</jw-button>'+
                                    '</jw-group>'+
                            '</jw-select>'+
                        '</jw-group>'+
                    '</jw-toolbar>',
                    '<article></article>',
                '</jw-editor>',
            ].join(''),
        );
        /* eslint-enable prettier/prettier */

        await click(container.querySelector('jw-button[name="template-template1"]'));

        /* eslint-disable prettier/prettier */
        expect(container.innerHTML).to.equal(
            [
                '<jw-editor>',
                    '<jw-toolbar>'+
                        '<jw-group>'+
                            '<jw-select>'+
                                '<jw-button>&nbsp;</jw-button>'+
                                    '<jw-group>',
                                        '<jw-button name="template-template1" aria-pressed="false">Good 1</jw-button>'+
                                        '<jw-button name="template-template2" aria-pressed="false">Good 2</jw-button>'+
                                    '</jw-group>'+
                            '</jw-select>'+
                        '</jw-group>'+
                    '</jw-toolbar>',
                    '<div class="row"><div class="col">text default</div></div>',
                '</jw-editor>',
            ].join(''),
        );
        /* eslint-enable prettier/prettier */
    });
});
