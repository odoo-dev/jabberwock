import { expect } from 'chai';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { VNode } from '../../core/src/VNodes/VNode';
import { DevTools } from '../src/DevTools';
import { click, nextTickFrame, keydown } from '../../utils/src/testUtils';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import JWEditor from '../../core/src/JWEditor';
import { DomEditable } from '../../plugin-dom-editable/src/DomEditable';
import { Char } from '../../plugin-char/src/Char';
import { Paragraph } from '../../plugin-paragraph/src/Paragraph';
import { Bold } from '../../plugin-bold/src/Bold';
import { Italic } from '../../plugin-italic/src/Italic';
import { Underline } from '../../plugin-underline/src/Underline';
import { CharNode } from '../../plugin-char/src/CharNode';

import template from '../../bundle-basic-editor/basicLayout.xml';
import { Parser } from '../../plugin-parser/src/Parser';
import { nodeName } from '../../utils/src/utils';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { Layout } from '../../plugin-layout/src/Layout';
import { QWeb } from '@odoo/owl';
import { parseEditable } from '../../utils/src/configuration';
import { Html } from '../../plugin-html/src/Html';
import { LineBreak } from '../../plugin-linebreak/src/LineBreak';

let wrapper: HTMLElement;
async function openDevTools(): Promise<void> {
    await click(wrapper.querySelector('devtools-navbar'));
    await nextTickFrame(); // redraw
    document
        .evaluate('//jw-devtools//devtools-node//devtools-nodename[text()="Zone: main"]', wrapper)
        .iterateNext()
        .parentElement.classList.add('zone-main'); // add for test query selector
}

describe('Plugin: DevTools', () => {
    let editor: BasicEditor;
    let domEngine: DomLayoutEngine;

    beforeEach(async () => {
        wrapper = document.createElement('test-wrapper');
        wrapper.style.display = 'block';
        document.body.appendChild(wrapper);

        const root = document.createElement('test-container');
        root.style.display = 'block';
        root.innerHTML =
            '<h1>Title</h1><p>a<b>b</b>c</p><p>def<br>gh<i>i</i><u>u</u></p><div>div</div>';
        wrapper.appendChild(root);

        Object.keys(localStorage).forEach(key => {
            if (key.indexOf('OwlUI') !== -1) {
                localStorage.removeItem(key);
            }
        });

        editor = new JWEditor();
        editor.load(Html);
        editor.load(Char);
        editor.load(Bold);
        editor.load(Italic);
        editor.load(Underline);
        editor.load(Paragraph);
        editor.load(LineBreak);
        editor.load(DevTools);
        editor.load(DomEditable);
        editor.configure(DomLayout, {
            components: [
                {
                    id: 'basicLayout',
                    render(editor: JWEditor): Promise<VNode[]> {
                        return editor.plugins.get(Parser).parse('text/html', template);
                    },
                },
                {
                    id: 'editable',
                    render: async (editor: JWEditor): Promise<VNode[]> =>
                        parseEditable(editor, root),
                },
            ],
            locations: [['basicLayout', [root, 'replace']]],
            componentZones: [['editable', ['main']]],
        });

        await editor.start();
        domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
    });
    afterEach(async () => {
        await editor.stop();
        document.body.removeChild(wrapper);
        wrapper = null;
        // TODO: remove when OWL is fixed.
        QWeb.slots = {};
    });

    describe('DevToolsComponent', () => {
        it('should display the devtools', async () => {
            expect(!!wrapper.querySelector('jw-devtools')).to.equal(true);
        });
        it('should display the devtools closed as bottom bar', async () => {
            expect(wrapper.querySelector('jw-devtools').classList.contains('closed')).to.equal(
                true,
            );
        });
        it('should open the devTools', async () => {
            await openDevTools();
            expect(wrapper.querySelector('jw-devtools').classList.contains('closed')).to.equal(
                false,
            );
        });
        it('should display the devTools with "Inspector" by default when open', async () => {
            await openDevTools();
            const button = wrapper.querySelector('jw-devtools devtools-navbar devtools-button');
            expect(button.textContent).to.equal('Inspector');
            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');
            const panel = wrapper.querySelector('jw-devtools devtools-panel.inspector.active');
            expect(!!panel).to.equal(true, 'panel is active');
        });
        it('should resize the devTools', async () => {
            await openDevTools();
            const navbar = wrapper.querySelector('jw-devtools').querySelector('devtools-navbar');
            const pos = navbar.getBoundingClientRect();
            const begin = { clientX: pos.left + 5, clientY: pos.top + 5, bubbles: true };
            const step = { clientX: pos.left + 15, clientY: pos.top + 25, bubbles: true };
            const end = { clientX: pos.left + 30, clientY: pos.top - 50, bubbles: true };
            navbar.dispatchEvent(new MouseEvent('mousedown', begin));
            await nextTickFrame();
            window.dispatchEvent(new MouseEvent('mousemove', step));
            await nextTickFrame();
            window.dispatchEvent(new MouseEvent('mousemove', end));
            await nextTickFrame();
            navbar.dispatchEvent(new MouseEvent('mouseup', end));
            await nextTickFrame();
            navbar.dispatchEvent(new MouseEvent('click', end));
            await nextTickFrame();
            expect(wrapper.querySelector('jw-devtools').classList.contains('closed')).to.equal(
                false,
            );
        });
        it('should close the devTools', async () => {
            await openDevTools();
            const navbar = wrapper.querySelector('jw-devtools').querySelector('devtools-navbar');
            await click(navbar);
            expect(wrapper.querySelector('jw-devtools').classList.contains('closed')).to.equal(
                true,
            );
        });
        it('should open the devTools when click on button "Commands"', async () => {
            const button = wrapper.querySelector(
                'jw-devtools devtools-navbar devtools-button:nth-child(2)',
            );
            await click(button);
            expect(wrapper.querySelector('jw-devtools').classList.contains('closed')).to.equal(
                false,
            );
        });
    });
    describe('InspectorComponent', () => {
        it('should change panel to "Inspector" with top button', async () => {
            await openDevTools();
            const buttonCommand = wrapper.querySelector(
                'jw-devtools devtools-navbar devtools-button:nth-child(2)',
            );
            await click(buttonCommand);

            const button = wrapper.querySelector('jw-devtools devtools-navbar devtools-button');
            expect(button.textContent).to.equal('Inspector');
            expect(button.classList.contains('selected')).to.equal(false, 'button is not selected');

            await click(button);

            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');
            expect(
                !!wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-panel.active devtools-tree'),
            ).to.equal(true);
        });
        it('should display the VNode tab by default in info', async () => {
            await openDevTools();
            const button = wrapper.querySelector(
                'jw-devtools devtools-info devtools-navbar devtools-button',
            );
            expect(button.textContent).to.equal('VNode');
            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');
        });
        it('should display the root by default in info', async () => {
            await openDevTools();
            const about = wrapper.querySelector('jw-devtools devtools-info devtools-about');
            const root = domEngine.components.editable[0];
            const aResult =
                '<devtools-about>' +
                '<devtools-type>' +
                root.constructor.name +
                '</devtools-type> ' +
                root.name +
                '<devtools-button class="logger">&gt;_</devtools-button>' +
                '<devtools-id>' +
                root.id +
                '</devtools-id>' +
                '</devtools-about>';
            expect(about.outerHTML).to.equal(aResult);

            const properties = wrapper.querySelector(
                'jw-devtools devtools-info devtools-properties',
            );
            const pResult =
                '<devtools-properties>' +
                '<devtools-infotitle>👤 About me</devtools-infotitle>' +
                '<devtools-table>' +
                '<devtools-tbody>' +
                '<devtools-tr><devtools-td>id</devtools-td><devtools-td>' +
                root.id +
                '</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>name</devtools-td><devtools-td>"' +
                root.name +
                '"</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>length</devtools-td><devtools-td>4</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>atomic</devtools-td><devtools-td>false</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>modifiers</devtools-td><devtools-td>[ Attributes: { style: "display: block;", contenteditable: "true" } ]</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>total length</devtools-td><devtools-td>23</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>text content</devtools-td><devtools-td>' +
                root.textContent +
                '</devtools-td></devtools-tr>' +
                '</devtools-tbody>' +
                '</devtools-table>' +
                '<devtools-infotitle>📖 My Properties</devtools-infotitle>' +
                '<devtools-table>' +
                '<devtools-tbody>' +
                '<devtools-tr><devtools-td>breakable</devtools-td><devtools-td>false</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>htmlTag</devtools-td><devtools-td>"TEST-CONTAINER"</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>mayContainContainers</devtools-td><devtools-td>true</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>parentVNode</devtools-td><devtools-td>ZoneNode: main</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>tangible</devtools-td><devtools-td>true</devtools-td></devtools-tr>' +
                '</devtools-tbody>' +
                '</devtools-table>' +
                '<devtools-infotitle>👪 My Family</devtools-infotitle>' +
                '<devtools-table>' +
                '<devtools-tbody>' +
                '<devtools-tr><devtools-td>parent</devtools-td><devtools-td>ZoneNode: main</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>children</devtools-td><devtools-td><devtools-list><devtools-listitem>' +
                root.children()[0].name +
                '</devtools-listitem><devtools-listitem>' +
                root.children()[1].name +
                '</devtools-listitem><devtools-listitem>' +
                root.children()[2].name +
                '</devtools-listitem><devtools-listitem>' +
                root.children()[3].name +
                '</devtools-listitem></devtools-list></devtools-td></devtools-tr>' +
                '<devtools-tr>' +
                '<devtools-td>siblings</devtools-td>' +
                '<devtools-td>' +
                '<devtools-list><devtools-listitem>previous: none</devtools-listitem><devtools-listitem>next: none</devtools-listitem></devtools-list>' +
                '</devtools-td>' +
                '</devtools-tr>' +
                '</devtools-tbody>' +
                '</devtools-table>' +
                '</devtools-properties>';
            expect(properties.outerHTML).to.equal(pResult);
        });
    });
    describe('TreeComponent', () => {
        it('should select the first paragraph', async () => {
            await openDevTools();
            const node = wrapper.querySelector('.zone-main devtools-node:nth-child(2)');
            const name = node.querySelector('devtools-nodename');
            const pos = name.getBoundingClientRect();
            await click(name, {
                clientX: pos.left + 30,
                clientY: pos.top,
            });
            expect(name.classList.contains('selected')).to.equal(true, 'node is selected');

            expect(node.classList.contains('folded')).to.equal(true, 'node is folded');
            expect(node.querySelector('devtools-children').children.length).to.equal(
                0,
                'not displayed anymore',
            );

            const about = wrapper.querySelector('jw-devtools devtools-info devtools-about');
            const root = domEngine.components.editable[0];
            const aResult =
                '<devtools-about>' +
                '<devtools-type>' +
                root.children()[1].constructor.name +
                '</devtools-type> ' +
                root.children()[1].name +
                '<devtools-button class="logger">&gt;_</devtools-button>' +
                '<devtools-id>' +
                root.children()[1].id +
                '</devtools-id>' +
                '</devtools-about>';
            expect(about.outerHTML).to.equal(aResult);

            const aboutMe = wrapper.querySelector(
                'jw-devtools devtools-info devtools-properties devtools-table',
            );
            const aboutMeResult =
                '<devtools-table>' +
                '<devtools-tbody>' +
                '<devtools-tr><devtools-td>id</devtools-td><devtools-td>' +
                root.children()[1].id +
                '</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>name</devtools-td><devtools-td>"' +
                root.children()[1].name +
                '"</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>length</devtools-td><devtools-td>3</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>atomic</devtools-td><devtools-td>false</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>modifiers</devtools-td><devtools-td>[]</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>total length</devtools-td><devtools-td>3</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>text content</devtools-td><devtools-td>' +
                root.children()[1].textContent +
                '</devtools-td></devtools-tr>' +
                '</devtools-tbody>' +
                '</devtools-table>';
            expect(aboutMe.outerHTML).to.equal(aboutMeResult);

            const family = wrapper.querySelector(
                'jw-devtools devtools-info devtools-properties devtools-table:last-child',
            );
            const familyResult =
                '<devtools-table>' +
                '<devtools-tbody>' +
                '<devtools-tr><devtools-td>parent</devtools-td><devtools-td>' +
                root.name +
                '</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>children</devtools-td><devtools-td><devtools-list><devtools-listitem>' +
                root.children()[1].children()[0].name +
                '</devtools-listitem><devtools-listitem>' +
                root.children()[1].children()[1].name +
                '</devtools-listitem><devtools-listitem>' +
                root.children()[1].children()[2].name +
                '</devtools-listitem></devtools-list></devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>siblings</devtools-td><devtools-td><devtools-list><devtools-listitem> previous: ' +
                root.children()[0].name +
                '</devtools-listitem><devtools-listitem> next: ' +
                root.children()[2].name +
                '</devtools-listitem></devtools-list></devtools-td></devtools-tr>' +
                '</devtools-tbody>' +
                '</devtools-table>';
            expect(family.outerHTML).to.equal(familyResult);
        });
        it('should select a sibling node with arrow (up, down)', async () => {
            await openDevTools();
            const node = wrapper.querySelector(
                '.zone-main devtools-children devtools-node.block:nth-child(2)',
            );

            const name = node.querySelector('devtools-nodename');
            const pos = name.getBoundingClientRect();
            await click(name, {
                clientX: pos.left + 30,
                clientY: pos.top,
            });

            const span = node.firstElementChild;
            await keydown(node, 'ArrowDown');
            expect(span.classList.contains('selected')).to.equal(false, 'unselect');
            const next = node.nextElementSibling;
            expect(next.firstElementChild.classList.contains('selected')).to.equal(
                true,
                'select the next',
            );

            await keydown(node, 'ArrowUp');
            expect(span.classList.contains('selected')).to.equal(true, 'select');
            expect(next.firstElementChild.classList.contains('selected')).to.equal(
                false,
                'unselect the next',
            );
        });
        it('should select a sibling node with arrow (left, right)', async () => {
            await openDevTools();
            const node = wrapper.querySelector(
                '.zone-main devtools-children devtools-node.block:nth-child(2)',
            );

            const name = node.querySelector('devtools-nodename');
            const pos = name.getBoundingClientRect();
            await click(name, {
                clientX: pos.left + 30,
                clientY: pos.top,
            });

            const span = node.firstElementChild;

            await keydown(node, 'ArrowRight');
            expect(span.classList.contains('selected')).to.equal(false, 'unselect');
            const next = node.nextElementSibling;
            expect(next.firstElementChild.classList.contains('selected')).to.equal(
                true,
                'select the next',
            );

            await keydown(node, 'ArrowLeft');
            expect(span.classList.contains('selected')).to.equal(true, 'select');
            expect(next.firstElementChild.classList.contains('selected')).to.equal(
                false,
                'unselect the next',
            );
        });
        it('should select a child node with arrow (down on last)', async () => {
            await openDevTools();
            const elements = wrapper.querySelectorAll(
                '.zone-main devtools-children > devtools-node.block',
            );
            const last = elements[elements.length - 1];
            const span = last.firstElementChild;
            span.scrollIntoView();
            await nextTickFrame();
            const pos = span.getBoundingClientRect();
            await click(span, {
                clientX: pos.left + 30,
                clientY: pos.top,
            });

            expect(span.classList.contains('selected')).to.equal(true, 'is selected');

            await keydown(last, 'ArrowDown');
            expect(span.classList.contains('selected')).to.equal(false, 'unselect');
            const char = last.lastElementChild.querySelector('devtools-nodename');
            expect(char.textContent).to.equal('d');
            expect(char.classList.contains('selected')).to.equal(true, 'select the first char');
        });
        it('should open the first paragraph', async () => {
            await openDevTools();
            const elements = wrapper.querySelectorAll(
                '.zone-main devtools-children > devtools-node.block',
            );
            const last = elements[elements.length - 1];
            const span = last.firstElementChild;
            const pos = span.getBoundingClientRect();
            await click(span, {
                clientX: pos.left + 30,
                clientY: pos.top,
            });

            const node = wrapper.querySelectorAll('.zone-main devtools-node.block.folded')[1];
            const name = node.querySelector('devtools-nodename');
            const namePos = name.getBoundingClientRect();
            await click(name, {
                clientX: namePos.left,
                clientY: namePos.top,
            });
            expect(node.classList.contains('folded')).to.equal(false, 'node is unfolded');
            expect(node.querySelector('devtools-children').children.length).to.equal(
                3,
                'children() are loaded',
            );
        });
        it('should open/close the last paragraph with enter', async () => {
            await openDevTools();
            const node = wrapper.querySelector(
                '.zone-main devtools-children devtools-node.block:nth-child(3)',
            );
            await keydown(node, 'Enter');
            expect(node.classList.contains('folded')).to.equal(false, 'node is unfolded');
            expect(node.querySelector('devtools-children').children.length).to.equal(
                8,
                'children() are loaded',
            );

            await keydown(node, 'Enter');
            expect(node.classList.contains('folded')).to.equal(true, 'node is folded');
            expect(node.querySelector('devtools-children').children.length).to.equal(
                0,
                'removed from devtools dom',
            );
        });
        it('should change the selection to select the paragraph', async () => {
            await openDevTools();
            const p = wrapper.querySelector(
                '.zone-main devtools-children devtools-node:nth-child(2)',
            );
            const name = p.firstElementChild;
            const pchildren = p.lastElementChild;

            const pos = name.getBoundingClientRect();
            name.dispatchEvent(
                new MouseEvent('dblclick', { clientX: pos.left, clientY: pos.top, bubbles: true }),
            );
            await nextTickFrame();

            expect(pchildren.childNodes.length).to.equal(5);
            expect(pchildren.firstElementChild.classList.contains('self-closing')).to.equal(
                true,
                'previous is the selection anchor',
            );
            expect(pchildren.lastElementChild.classList.contains('self-closing')).to.equal(
                true,
                'next is the selection focus',
            );
        });
        it('should select the bold char', async () => {
            await openDevTools();
            const node = wrapper.querySelector(
                '.zone-main devtools-node.block.folded:nth-child(2)',
            );
            const name = node.querySelector('devtools-nodename');
            const namePos = name.getBoundingClientRect();
            await click(name, {
                clientX: namePos.left,
                clientY: namePos.top,
            });

            const nameBold = wrapper.querySelector('.zone-main .selectable-line.bold');
            const bold = nameBold.parentNode as HTMLElement;
            const pos = nameBold.getBoundingClientRect();
            await click(nameBold, {
                clientX: pos.left,
                clientY: pos.top,
            });
            expect(nameBold.classList.contains('selected')).to.equal(true, 'bold char is selected');
            expect(bold.classList.contains('folded')).to.equal(true, 'node is folded');
            expect(bold.querySelector('devtools-children')).to.equal(null);

            const vNodeChar = domEngine.components.editable[0].children()[1].children()[1];

            const about = wrapper.querySelector('jw-devtools devtools-info devtools-about');
            const aResult =
                '<devtools-about>' +
                '<devtools-type>' +
                vNodeChar.constructor.name +
                '</devtools-type> ' +
                vNodeChar.name +
                ': "b" ' +
                '<devtools-button class="logger">&gt;_</devtools-button>' +
                '<devtools-id>' +
                vNodeChar.id +
                '</devtools-id>' +
                '</devtools-about>';
            expect(about.outerHTML).to.equal(aResult);

            const aboutMe = wrapper.querySelector(
                'jw-devtools devtools-info devtools-properties devtools-table',
            );
            const aboutMeResult =
                '<devtools-table>' +
                '<devtools-tbody>' +
                '<devtools-tr><devtools-td>id</devtools-td><devtools-td>' +
                vNodeChar.id +
                '</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>name</devtools-td><devtools-td>"' +
                vNodeChar.name +
                '"</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>length</devtools-td><devtools-td>1</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>atomic</devtools-td><devtools-td>true</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>modifiers</devtools-td><devtools-td>[ b ]</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>total length</devtools-td><devtools-td>1</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>text content</devtools-td><devtools-td>' +
                vNodeChar.textContent +
                '</devtools-td></devtools-tr>' +
                '</devtools-tbody>' +
                '</devtools-table>';
            expect(aboutMe.outerHTML).to.equal(aboutMeResult);

            const family = wrapper.querySelector(
                'jw-devtools devtools-info devtools-properties devtools-table:last-child',
            );
            const familyResult =
                '<devtools-table>' +
                '<devtools-tbody>' +
                '<devtools-tr><devtools-td>parent</devtools-td><devtools-td>' +
                vNodeChar.parent.name +
                '</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>children</devtools-td><devtools-td>none</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>siblings</devtools-td><devtools-td><devtools-list><devtools-listitem> previous: ' +
                vNodeChar.previousSibling().name +
                '</devtools-listitem><devtools-listitem> next: ' +
                vNodeChar.nextSibling().name +
                '</devtools-listitem></devtools-list></devtools-td></devtools-tr>' +
                '</devtools-tbody>' +
                '</devtools-table>';
            expect(family.outerHTML).to.equal(familyResult);

            const path = wrapper.querySelector('jw-devtools').querySelector('devtools-path');
            expect([].map.call(path.childNodes, (n: Node) => n.textContent)).to.deep.equal(
                vNodeChar
                    .ancestors()
                    .map(n => n.name)
                    .reverse()
                    .concat([vNodeChar.name + '.' + vNodeChar.name]),
            );
        });
        it('should change the selection to select the char', async () => {
            await openDevTools();
            const node = wrapper.querySelector(
                '.zone-main devtools-node.block.folded:nth-child(2)',
            );
            const name = node.querySelector('devtools-nodename');
            const namePos = name.getBoundingClientRect();
            await click(name, {
                clientX: namePos.left,
                clientY: namePos.top,
            });

            const nameBold = wrapper.querySelector('.zone-main .selectable-line.bold');
            const bold = nameBold.parentNode as HTMLElement;

            const pos = nameBold.getBoundingClientRect();
            nameBold.dispatchEvent(
                new MouseEvent('dblclick', { clientX: pos.left, clientY: pos.top, bubbles: true }),
            );
            await nextTickFrame();

            expect(bold.parentNode.childNodes.length).to.equal(5);
            expect(bold.previousElementSibling.classList.contains('self-closing')).to.equal(
                true,
                'previous is the selection anchor',
            );
            expect(bold.nextElementSibling.classList.contains('self-closing')).to.equal(
                true,
                'next is the selection focus',
            );

            const selection = document.getSelection();
            expect(selection.rangeCount).to.equal(1, 'range exist');
            const range = selection.getRangeAt(0);

            const b = wrapper.querySelector('jw-editor test-container b');
            expect(range.startContainer).to.equal(b.previousSibling);
            expect(range.startOffset).to.equal(1);
            expect(range.endContainer).to.equal(b.firstChild);
            expect(range.endOffset).to.equal(1);
        });
        it('should insert a char in editable (to add commands)', async () => {
            await openDevTools();

            const node = wrapper.querySelector(
                '.zone-main devtools-node.block.folded:nth-child(2)',
            );
            const name = node.querySelector('devtools-nodename');
            const namePos = name.getBoundingClientRect();
            await click(name, {
                clientX: namePos.left,
                clientY: namePos.top,
            });

            let nameBold = wrapper.querySelector('.zone-main .selectable-line.bold');
            const pos = nameBold.getBoundingClientRect();
            nameBold.dispatchEvent(
                new MouseEvent('dblclick', { clientX: pos.left, clientY: pos.top, bubbles: true }),
            );
            await nextTickFrame();

            const container = wrapper.querySelector('jw-editor test-container');
            container.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', bubbles: true }),
            );
            container.querySelector('b').firstChild.textContent = 'z';
            container.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await nextTickFrame();
            await nextTickFrame();

            expect(container.querySelector('b').parentElement.innerHTML).to.equal('a<b>z</b>c');
            expect(
                !!domEngine.components.editable[0].descendants(CharNode).find(c => c.char === 'z'),
            ).to.equal(true, 'z should be in vDocument');

            await nextTickFrame();
            nameBold = wrapper.querySelector('.zone-main .selectable-line.bold');
            expect(nameBold.parentElement.parentElement.textContent).to.equal('az[]c');
        });
    });
    describe('PathComponent', () => {
        it('should display the path in bottom bar', async () => {
            await openDevTools();

            const node = wrapper.querySelector(
                'jw-devtools devtools-node.block.folded:nth-child(3)',
            );
            const name = node.querySelector('devtools-nodename');
            const namePos = name.getBoundingClientRect();
            await click(name, {
                clientX: namePos.left,
                clientY: namePos.top,
            });

            const path = wrapper.querySelector('jw-devtools').querySelector('devtools-path');

            const i = wrapper.querySelector('.zone-main .selectable-line.italic');
            const posI = i.getBoundingClientRect();
            await click(i, {
                clientX: posI.left,
                clientY: posI.top,
            });
            expect(
                [...path.querySelectorAll('devtools-pathnode')].map(n => n.textContent),
            ).to.deep.equal([
                'ZoneNode: root',
                'LayoutContainer',
                'TagNode',
                'TagNode',
                'ZoneNode: main',
                'TagNode',
                'ParagraphNode',
                'i.i',
            ]);

            const u = wrapper.querySelector('.zone-main .selectable-line.underline');
            const posU = u.getBoundingClientRect();
            await click(u, {
                clientX: posU.left,
                clientY: posU.top,
            });
            expect(
                [...path.querySelectorAll('devtools-pathnode')].map(n => n.textContent),
            ).to.deep.equal([
                'ZoneNode: root',
                'LayoutContainer',
                'TagNode',
                'TagNode',
                'ZoneNode: main',
                'TagNode',
                'ParagraphNode',
                'u.u',
            ]);
        });
        it('should select a parent node with the bottom path bar', async () => {
            await openDevTools();

            const node = wrapper.querySelector(
                '.zone-main devtools-node.block.folded:nth-child(2)',
            );
            const name = node.querySelector('devtools-nodename');
            const namePos = name.getBoundingClientRect();
            await click(name, {
                clientX: namePos.left,
                clientY: namePos.top,
            });

            const nameBold = wrapper.querySelector('.zone-main .selectable-line.bold');
            const pos = nameBold.getBoundingClientRect();
            await click(nameBold, {
                clientX: pos.left,
                clientY: pos.top,
            });

            const elements = wrapper.querySelectorAll(
                'jw-devtools devtools-path devtools-pathnode',
            );
            const path = Array.from(elements).find(el => el.textContent === 'ParagraphNode');
            await click(path);
            const p = wrapper.querySelector(
                '.zone-main devtools-children > devtools-node.block:nth-child(2)',
            );
            expect(p.firstElementChild.classList.contains('selected')).to.equal(true);
        });
    });
    describe('InfoComponent', () => {
        it('should select a child node with the info panel', async () => {
            await openDevTools();
            const node = wrapper.querySelector(
                '.zone-main devtools-children devtools-node:nth-child(2)',
            );
            const name = node.querySelector('devtools-nodename');
            const pos = name.getBoundingClientRect();
            await click(name, {
                clientX: pos.left + 30,
                clientY: pos.top,
            });

            const vNode = domEngine.components.editable[0].children()[1];

            let about = wrapper.querySelector('jw-devtools devtools-info devtools-about');
            let aResult =
                '<devtools-about>' +
                '<devtools-type>' +
                vNode.constructor.name +
                '</devtools-type> ' +
                vNode.name +
                '<devtools-button class="logger">&gt;_</devtools-button>' +
                '<devtools-id>' +
                vNode.id +
                '</devtools-id>' +
                '</devtools-about>';
            expect(about.outerHTML).to.equal(aResult);

            const elements = wrapper.querySelectorAll(
                'jw-devtools devtools-info devtools-properties devtools-tr',
            );
            const tr = Array.from(elements)
                .filter(tr => tr.firstElementChild.textContent === 'children')
                .pop();
            const li = tr.querySelector('devtools-listitem:last-child');
            await click(li);

            about = wrapper.querySelector('jw-devtools devtools-info devtools-about');
            aResult =
                '<devtools-about>' +
                '<devtools-type>' +
                vNode.children()[2].constructor.name +
                '</devtools-type> ' +
                vNode.children()[2].name +
                ': "c" ' +
                '<devtools-button class="logger">&gt;_</devtools-button>' +
                '<devtools-id>' +
                vNode.children()[2].id +
                '</devtools-id>' +
                '</devtools-about>';
            expect(about.outerHTML).to.equal(aResult);
        });
        it('should change panel to "Selection"', async () => {
            await openDevTools();
            const button = wrapper.querySelector(
                'jw-devtools devtools-info devtools-button:nth-child(2)',
            );
            expect(button.textContent).to.equal('Selection');
            await click(button);

            expect(button.classList.contains('selected')).to.equal(true);
            const about = wrapper.querySelector('jw-devtools devtools-info devtools-about');
            const aResult =
                '<devtools-about><devtools-type>VSelection</devtools-type> Selection </devtools-about>';
            expect(about.outerHTML).to.equal(aResult);
        });
    });
    describe('CommandsComponent', () => {
        it('should change panel to "Commands" with top button', async () => {
            await openDevTools();
            const button = wrapper.querySelector(
                'jw-devtools devtools-navbar devtools-button:not(.selected)',
            );
            expect(button.textContent).to.equal('Commands');
            expect(button.classList.contains('selected')).to.equal(false, 'button is not selected');

            await click(button);

            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');

            const subpanel = wrapper.querySelector(
                'jw-devtools devtools-panel.active mainpane-contents',
            );
            expect(nodeName(subpanel.firstElementChild)).to.equal('DEVTOOLS-TABLE');
        });
        it('should change sub panel to "Registry"', async () => {
            await openDevTools();
            await click(
                wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-navbar devtools-button:not(.selected)'),
            );

            const panel = wrapper.querySelector('jw-devtools devtools-panel.active');
            const button = panel.querySelector('devtools-navbar devtools-button:not(.selected)');
            expect(button.textContent).to.equal('Registry');
            await click(button);
            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');
            const subpanel = wrapper.querySelector(
                'jw-devtools devtools-panel.active mainpane-contents',
            );
            expect(nodeName(subpanel.firstElementChild)).to.equal('DEVTOOLS-COMMAND');
            expect(Array.from(subpanel.childNodes).map((n: Node) => n.textContent)).to.deep.equal([
                'deleteBackward',
                'deleteForward',
                'deleteWord',
                'hide',
                'insert',
                'insertLineBreak',
                'insertParagraphBreak',
                'insertText',
                'removeFormat',
                'selectAll',
                'setSelection',
                'show',
                'toggleFormat',
            ]);
        });
        it('should display the previous commands in "Queue" of "Commands" panel', async () => {
            await openDevTools();
            const node = wrapper.querySelector(
                '.zone-main devtools-node.block.folded:nth-child(2)',
            );
            const name = node.querySelector('devtools-nodename');
            const namePos = name.getBoundingClientRect();
            await click(name, {
                clientX: namePos.left,
                clientY: namePos.top,
            });

            const nameBold = wrapper.querySelector('.zone-main .selectable-line.bold');
            const pos = nameBold.getBoundingClientRect();
            nameBold.dispatchEvent(
                new MouseEvent('dblclick', { clientX: pos.left, clientY: pos.top, bubbles: true }),
            );
            await nextTickFrame();

            const container = wrapper.querySelector('jw-editor test-container');
            container.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', bubbles: true }),
            );
            container.querySelector('b').firstChild.textContent = 'z';
            container.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await nextTickFrame();
            await nextTickFrame();

            const button = wrapper.querySelector(
                'jw-devtools devtools-navbar devtools-button:not(.selected)',
            );
            await click(button);

            const subpanel = wrapper.querySelector(
                'jw-devtools devtools-panel.active mainpane-contents',
            );
            expect(
                [...subpanel.querySelectorAll('devtools-td:not(.numbering)')].map(
                    td => td.textContent,
                ),
            ).to.deep.equal(['@commit', 'insertText', '@commit', 'setSelection', '@focus']);
        });
        it('should select "deleteWord"', async () => {
            await openDevTools();
            await click(
                wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-navbar devtools-button:not(.selected)'),
            );

            const panel = wrapper.querySelector('jw-devtools devtools-panel.active');
            const button = panel.querySelector('devtools-navbar devtools-button:not(.selected)');
            await click(button);

            const subpanel = wrapper.querySelector(
                'jw-devtools devtools-panel.active mainpane-contents',
            );
            const line = subpanel.querySelector('.selectable-line:nth-child(3)');
            await click(line);

            expect(line.classList.contains('selected')).to.equal(true);

            const about = wrapper.querySelector('jw-devtools devtools-info devtools-about');
            const aResult =
                '<devtools-about><devtools-type>Command</devtools-type> deleteWord</devtools-about>';
            expect(about.outerHTML).to.equal(aResult);
        });
        it('should select "deleteForward" with arrow', async () => {
            await openDevTools();
            await click(
                wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-navbar devtools-button:not(.selected)'),
            );

            const panel = wrapper.querySelector('jw-devtools devtools-panel.active');
            const button = panel.querySelector('devtools-navbar devtools-button:not(.selected)');
            await click(button);

            const subpanel = wrapper.querySelector(
                'jw-devtools devtools-panel.active mainpane-contents',
            );
            const line = subpanel.querySelector('.selectable-line:nth-child(3)');
            await click(line);

            await keydown(line.nextElementSibling, 'ArrowUp');
            expect(line.classList.contains('selected')).to.equal(false);
            expect(line.previousElementSibling.classList.contains('selected')).to.equal(true);

            const about = wrapper.querySelector('jw-devtools devtools-info devtools-about');
            const aResult =
                '<devtools-about><devtools-type>Command</devtools-type> deleteForward</devtools-about>';
            expect(about.outerHTML).to.equal(aResult);
        });
        it('should select "deleteWord" with arrow', async () => {
            await openDevTools();
            await click(
                wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-navbar devtools-button:not(.selected)'),
            );

            const panel = wrapper.querySelector('jw-devtools devtools-panel.active');
            const button = panel.querySelector('devtools-navbar devtools-button:not(.selected)');
            await click(button);

            const subpanel = wrapper.querySelector(
                'jw-devtools devtools-panel.active mainpane-contents',
            );
            const line = subpanel.querySelector('.selectable-line:nth-child(2)');
            await click(line);

            await keydown(line.nextElementSibling, 'ArrowDown');
            expect(line.classList.contains('selected')).to.equal(false);
            expect(line.nextElementSibling.classList.contains('selected')).to.equal(true);

            const about = wrapper.querySelector('jw-devtools devtools-info devtools-about');
            const aResult =
                '<devtools-about><devtools-type>Command</devtools-type> deleteWord</devtools-about>';
            expect(about.outerHTML).to.equal(aResult);
        });
        it('should not change the selection with other key', async () => {
            await openDevTools();
            await click(
                wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-navbar devtools-button:not(.selected)'),
            );

            const panel = wrapper.querySelector('jw-devtools devtools-panel.active');
            const button = panel.querySelector('devtools-navbar devtools-button:not(.selected)');
            await click(button);

            const subpanel = wrapper.querySelector(
                'jw-devtools devtools-panel.active mainpane-contents',
            );
            const line = subpanel.querySelector('.selectable-line:nth-child(3)');
            await click(line);

            const selected = wrapper.querySelector(
                'jw-devtools devtools-panel.active mainpane-contents .selectable-line.selected',
            );
            selected.dispatchEvent(
                new KeyboardEvent('keydown', {
                    key: 'a',
                    code: 'KeyA',
                    bubbles: true,
                }),
            );
            await nextTickFrame();
            expect(selected.classList.contains('selected')).to.equal(true);
        });
        it('should change sub panel to "Queue"', async () => {
            await openDevTools();
            await click(
                wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-navbar devtools-button:not(.selected)'),
            );
            await click(
                wrapper
                    .querySelector('jw-devtools')
                    .querySelector(
                        'devtools-panel.active devtools-navbar devtools-button:not(.selected)',
                    ),
            );

            const panel = wrapper.querySelector('jw-devtools devtools-panel.active');
            const button = panel.querySelector('devtools-navbar devtools-button:not(.selected)');
            expect(button.textContent).to.equal('Queue');
            await click(button);
            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');
        });
        describe('"Queue"', () => {
            let charBeforeChange: VNode;

            beforeEach(async () => {
                await openDevTools();
                const node = wrapper.querySelector(
                    '.zone-main devtools-node.block.folded:nth-child(2)',
                );
                const name = node.querySelector('devtools-nodename');
                const namePos = name.getBoundingClientRect();
                await click(name, {
                    clientX: namePos.left,
                    clientY: namePos.top,
                });

                const nameBold = wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-node .selectable-line.bold');
                const pos = nameBold.getBoundingClientRect();
                nameBold.dispatchEvent(
                    new MouseEvent('dblclick', {
                        clientX: pos.left,
                        clientY: pos.top,
                        bubbles: true,
                    }),
                );
                await nextTickFrame();

                charBeforeChange = domEngine.components.editable[0].children()[1].children()[1];

                const container = wrapper
                    .querySelector('jw-editor')
                    .querySelector('test-container');
                container.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ', bubbles: true }),
                );
                container.querySelector('b').firstChild.textContent = 'z';
                container.dispatchEvent(new InputEvent('input', { bubbles: true }));
                await nextTickFrame();
                await nextTickFrame();

                const button = wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-navbar devtools-button:not(.selected)');
                await click(button);
            });
            it('should select "insertText"', async () => {
                const subpanel = wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-panel.active mainpane-contents');
                const line = subpanel.querySelector('.selectable-line:nth-child(2)');
                await click(line);
                expect(line.classList.contains('selected')).to.equal(true);

                const about = wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-info devtools-about');
                const aResult =
                    '<devtools-about><devtools-type>Command</devtools-type> insertText</devtools-about>';
                expect(about.outerHTML).to.equal(aResult);
            });
            it('should select "setSelection"', async () => {
                const subpanel = wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-panel.active mainpane-contents');
                const line = subpanel.querySelector('.selectable-line:nth-child(4)');
                await click(line);
                expect(line.classList.contains('selected')).to.equal(true);

                const about = wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-info devtools-about');
                const aResult =
                    '<devtools-about><devtools-type>Command</devtools-type> setSelection</devtools-about>';
                expect(about.outerHTML).to.equal(aResult);

                const properties = wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-info devtools-properties devtools-table');
                const pResult =
                    '<devtools-table>' +
                    '<devtools-tbody>' +
                    '<devtools-tr><devtools-td>vSelection</devtools-td><devtools-td><devtools-table><devtools-tbody>' +
                    '<devtools-tr><devtools-td> direction </devtools-td><devtools-td>FORWARD</devtools-td></devtools-tr>' +
                    '<devtools-tr><devtools-td> anchor </devtools-td><devtools-td> ' +
                    charBeforeChange.id +
                    ' (b) </devtools-td></devtools-tr>' +
                    '<devtools-tr><devtools-td> focus </devtools-td><devtools-td> ' +
                    charBeforeChange.id +
                    ' (b) </devtools-td></devtools-tr>' +
                    '</devtools-tbody></devtools-table></devtools-td></devtools-tr>' +
                    '</devtools-tbody>' +
                    '</devtools-table>';
                expect(properties.outerHTML).to.equal(pResult);
            });
            it('should select "insertText" with arrow', async () => {
                const subpanel = wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-panel.active mainpane-contents');
                const line = subpanel.querySelector('.selectable-line:nth-child(3)');
                await click(line);
                await keydown(line, 'ArrowUp');

                expect(line.classList.contains('selected')).to.equal(false);

                const about = wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-info devtools-about');
                const aResult =
                    '<devtools-about><devtools-type>Command</devtools-type> insertText</devtools-about>';
                expect(about.outerHTML).to.equal(aResult);

                const properties = wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-info devtools-properties devtools-table');
                const pResult =
                    '<devtools-table>' +
                    '<devtools-tbody>' +
                    '<devtools-tr><devtools-td>text</devtools-td><devtools-td>z</devtools-td></devtools-tr>' +
                    '</devtools-tbody>' +
                    '</devtools-table>';
                expect(properties.outerHTML).to.equal(pResult);
            });
            it('should select "setSelection" with arrow', async () => {
                const subpanel = wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-panel.active mainpane-contents');
                const line = subpanel.querySelector('.selectable-line:nth-child(3)');
                await click(line);

                await keydown(line, 'ArrowDown');
                expect(line.classList.contains('selected')).to.equal(false);

                const about = wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-info devtools-about');
                const aResult =
                    '<devtools-about><devtools-type>Command</devtools-type> setSelection</devtools-about>';
                expect(about.outerHTML).to.equal(aResult);
            });
            it('should not change the selection with other key', async () => {
                const subpanel = wrapper
                    .querySelector('jw-devtools')
                    .querySelector('devtools-panel.active mainpane-contents');
                const line = subpanel.querySelector('.selectable-line');
                await click(line);

                line.dispatchEvent(
                    new KeyboardEvent('keydown', {
                        key: 'a',
                        code: 'KeyA',
                        bubbles: true,
                    }),
                );
                await nextTickFrame();
                expect(line.classList.contains('selected')).to.equal(true);
            });
        });
    });
});
