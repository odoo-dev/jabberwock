import { expect } from 'chai';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { VNode } from '../../core/src/VNodes/VNode';
import { DevTools } from '../src/DevTools';
import { click, nextTickFrame, keydown } from '../../utils/src/testUtils';
import { Dom } from '../../plugin-dom/src/Dom';

async function openDevTools(devtools: HTMLElement): Promise<void> {
    await click(devtools.querySelector('devtools-navbar'));
}

describe('Plugin: DevTools', () => {
    let wrapper: HTMLElement;
    let devtools: HTMLElement;
    let editor: BasicEditor;

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

        editor = new BasicEditor();
        editor.configure(Dom, { target: root });
        editor.load(DevTools);

        await editor.start();

        devtools = editor.el.querySelector('jw-devtools');
    });
    afterEach(async () => {
        editor.stop();
        document.body.removeChild(wrapper);
    });

    describe('DevToolsComponent', () => {
        it('should display the devtools', async () => {
            expect(!!devtools).to.equal(true);
        });
        it('should display the devtools closed as bottom bar', async () => {
            expect(devtools.classList.contains('closed')).to.equal(true);
        });
        it('should open the devTools', async () => {
            await openDevTools(devtools);
            expect(devtools.classList.contains('closed')).to.equal(false);
        });
        it('should display the devTools with "Inspector" by default when open', async () => {
            await openDevTools(devtools);
            const button = devtools.querySelector('devtools-navbar devtools-button');
            expect(button.textContent).to.equal('Inspector');
            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');
            const panel = devtools.querySelector('devtools-panel.inspector.active');
            expect(!!panel).to.equal(true, 'panel is active');
        });
        it('should resize the devTools', async () => {
            await openDevTools(devtools);
            const navbar = devtools.querySelector('devtools-navbar');
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
            expect(devtools.classList.contains('closed')).to.equal(false);
        });
        it('should close the devTools', async () => {
            await openDevTools(devtools);
            const navbar = devtools.querySelector('devtools-navbar');
            await click(navbar);
            expect(devtools.classList.contains('closed')).to.equal(true);
        });
        it('should open the devTools when click on button "Commands"', async () => {
            const button = devtools.querySelector('devtools-navbar devtools-button:nth-child(2)');
            await click(button);
            expect(devtools.classList.contains('closed')).to.equal(false);
        });
    });
    describe('InspectorComponent', () => {
        it('should change panel to "Inspector" with top button', async () => {
            await openDevTools(devtools);
            const buttonCommand = devtools.querySelector(
                'devtools-navbar devtools-button:nth-child(2)',
            );
            await click(buttonCommand);

            const button = devtools.querySelector('devtools-navbar devtools-button');
            expect(button.textContent).to.equal('Inspector');
            expect(button.classList.contains('selected')).to.equal(false, 'button is not selected');

            await click(button);

            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');
            expect(!!devtools.querySelector('devtools-panel.active devtools-tree')).to.equal(true);
        });
        it('should display the VNode tab by default in info', async () => {
            await openDevTools(devtools);
            const button = devtools.querySelector('devtools-info devtools-navbar devtools-button');
            expect(button.textContent).to.equal('VNode');
            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');
        });
        it('should display the root by default in info', async () => {
            await openDevTools(devtools);
            const about = devtools.querySelector('devtools-info devtools-about');
            const aResult =
                '<devtools-about>' +
                '<devtools-type>' +
                editor.vDocument.root.constructor.name +
                '</devtools-type> ' +
                editor.vDocument.root.name +
                '<devtools-button class="logger">&gt;_</devtools-button>' +
                '<devtools-id>' +
                editor.vDocument.root.id +
                '</devtools-id>' +
                '</devtools-about>';
            expect(about.outerHTML).to.equal(aResult);

            const properties = devtools.querySelector('devtools-info devtools-properties');
            const pResult =
                '<devtools-properties>' +
                '<devtools-infotitle>👤 About me</devtools-infotitle>' +
                '<devtools-table>' +
                '<devtools-tbody>' +
                '<devtools-tr><devtools-td>id</devtools-td><devtools-td>' +
                editor.vDocument.root.id +
                '</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>name</devtools-td><devtools-td>"' +
                editor.vDocument.root.name +
                '"</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>length</devtools-td><devtools-td>4</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>atomic</devtools-td><devtools-td>false</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>text</devtools-td><devtools-td>"Titleabcdefghiudiv"</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>total length</devtools-td><devtools-td>23</devtools-td></devtools-tr>' +
                '</devtools-tbody>' +
                '</devtools-table>' +
                '<devtools-infotitle>📖 My Properties</devtools-infotitle>' +
                '<devtools-table>' +
                '<devtools-tbody>' +
                '<devtools-tr><devtools-td>attributes</devtools-td><devtools-td>{}</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>tangible</devtools-td><devtools-td>true</devtools-td></devtools-tr>' +
                '</devtools-tbody>' +
                '</devtools-table>' +
                '<devtools-infotitle>👪 My Family</devtools-infotitle>' +
                '<devtools-table>' +
                '<devtools-tbody>' +
                '<devtools-tr><devtools-td>parent</devtools-td><devtools-td>undefined</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>children</devtools-td><devtools-td><devtools-list><devtools-listitem>' +
                editor.vDocument.root.children()[0].name +
                '</devtools-listitem><devtools-listitem>' +
                editor.vDocument.root.children()[1].name +
                '</devtools-listitem><devtools-listitem>' +
                editor.vDocument.root.children()[2].name +
                '</devtools-listitem><devtools-listitem>' +
                editor.vDocument.root.children()[3].name +
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
            await openDevTools(devtools);
            const node = devtools.querySelector(
                'devtools-node devtools-children devtools-node:nth-child(2)',
            );
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

            const about = devtools.querySelector('devtools-info devtools-about');
            const aResult =
                '<devtools-about>' +
                '<devtools-type>' +
                editor.vDocument.root.children()[1].constructor.name +
                '</devtools-type> ' +
                editor.vDocument.root.children()[1].name +
                '<devtools-button class="logger">&gt;_</devtools-button>' +
                '<devtools-id>' +
                editor.vDocument.root.children()[1].id +
                '</devtools-id>' +
                '</devtools-about>';
            expect(about.outerHTML).to.equal(aResult);

            const aboutMe = devtools.querySelector(
                'devtools-info devtools-properties devtools-table',
            );
            const aboutMeResult =
                '<devtools-table>' +
                '<devtools-tbody>' +
                '<devtools-tr><devtools-td>id</devtools-td><devtools-td>' +
                editor.vDocument.root.children()[1].id +
                '</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>name</devtools-td><devtools-td>"' +
                editor.vDocument.root.children()[1].name +
                '"</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>length</devtools-td><devtools-td>3</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>atomic</devtools-td><devtools-td>false</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>text</devtools-td><devtools-td>"abc"</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>total length</devtools-td><devtools-td>3</devtools-td></devtools-tr>' +
                '</devtools-tbody>' +
                '</devtools-table>';
            expect(aboutMe.outerHTML).to.equal(aboutMeResult);

            const family = devtools.querySelector(
                'devtools-info devtools-properties devtools-table:last-child',
            );
            const familyResult =
                '<devtools-table>' +
                '<devtools-tbody>' +
                '<devtools-tr><devtools-td>parent</devtools-td><devtools-td>' +
                editor.vDocument.root.name +
                '</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>children</devtools-td><devtools-td><devtools-list><devtools-listitem>' +
                editor.vDocument.root.children()[1].children()[0].name +
                '</devtools-listitem><devtools-listitem>' +
                editor.vDocument.root.children()[1].children()[1].name +
                '</devtools-listitem><devtools-listitem>' +
                editor.vDocument.root.children()[1].children()[2].name +
                '</devtools-listitem></devtools-list></devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>siblings</devtools-td><devtools-td><devtools-list><devtools-listitem> previous: ' +
                editor.vDocument.root.children()[0].name +
                '</devtools-listitem><devtools-listitem> next: ' +
                editor.vDocument.root.children()[2].name +
                '</devtools-listitem></devtools-list></devtools-td></devtools-tr>' +
                '</devtools-tbody>' +
                '</devtools-table>';
            expect(family.outerHTML).to.equal(familyResult);
        });
        it('should select a sibling node with arrow (up, down)', async () => {
            await openDevTools(devtools);
            const node = devtools.querySelector(
                'devtools-node devtools-children devtools-node.block:nth-child(2)',
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
            await openDevTools(devtools);
            const node = devtools.querySelector(
                'devtools-node devtools-children devtools-node.block:nth-child(2)',
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
            await openDevTools(devtools);
            const last = devtools.querySelector(
                'devtools-node devtools-children > devtools-node.block:last-child',
            );
            const span = last.firstElementChild;
            const pos = span.getBoundingClientRect();
            await click(span, {
                clientX: pos.left + 30,
                clientY: pos.top,
            });

            expect(span.classList.contains('selected')).to.equal(true, 'is selected');

            await keydown(last, 'ArrowDown');
            expect(span.classList.contains('selected')).to.equal(false, 'unselect');
            expect(last.querySelector('.folded .inline').classList.contains('selected')).to.equal(
                true,
                'select the first char',
            );
        });
        it('should open the first paragraph', async () => {
            await openDevTools(devtools);
            const last = devtools.querySelector(
                'devtools-node devtools-children > devtools-node.block:last-child',
            );
            const span = last.firstElementChild;
            const pos = span.getBoundingClientRect();
            await click(span, {
                clientX: pos.left + 30,
                clientY: pos.top,
            });

            const node = devtools.querySelectorAll('devtools-node.block.folded')[1];
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
            await openDevTools(devtools);
            const node = devtools.querySelector(
                'devtools-node devtools-children devtools-node.block:nth-child(3)',
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
            await openDevTools(devtools);
            const p = devtools.querySelector(
                'devtools-tree > devtools-node > devtools-children > devtools-node:nth-child(2)',
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
            await openDevTools(devtools);
            const node = devtools.querySelector('devtools-node.block.folded:nth-child(2)');
            const name = node.querySelector('devtools-nodename');
            const namePos = name.getBoundingClientRect();
            await click(name, {
                clientX: namePos.left,
                clientY: namePos.top,
            });

            const nameBold = devtools.querySelector('devtools-node .selectable-line.bold');
            const bold = nameBold.parentNode as HTMLElement;
            const pos = nameBold.getBoundingClientRect();
            await click(nameBold, {
                clientX: pos.left,
                clientY: pos.top,
            });
            expect(nameBold.classList.contains('selected')).to.equal(true, 'bold char is selected');
            expect(bold.classList.contains('folded')).to.equal(true, 'node is folded');
            expect(bold.querySelector('devtools-children')).to.equal(null);

            const vNodeChar = editor.vDocument.root.children()[1].children()[1];

            const about = devtools.querySelector('devtools-info devtools-about');
            const aResult =
                '<devtools-about>' +
                '<devtools-type>' +
                vNodeChar.constructor.name +
                '</devtools-type> ' +
                vNodeChar.name +
                ': "b" ' +
                '<devtools-button class="logger">&gt;_</devtools-button>' +
                '<devtools-id>' +
                +vNodeChar.id +
                '</devtools-id>' +
                '</devtools-about>';
            expect(about.outerHTML).to.equal(aResult);

            const aboutMe = devtools.querySelector(
                'devtools-info devtools-properties devtools-table',
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
                '<devtools-tr><devtools-td>text</devtools-td><devtools-td>"b"</devtools-td></devtools-tr>' +
                '<devtools-tr><devtools-td>total length</devtools-td><devtools-td>1</devtools-td></devtools-tr>' +
                '</devtools-tbody>' +
                '</devtools-table>';
            expect(aboutMe.outerHTML).to.equal(aboutMeResult);

            const family = devtools.querySelector(
                'devtools-info devtools-properties devtools-table:last-child',
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

            const path = devtools.querySelector('devtools-path');
            expect([].map.call(path.childNodes, (n: Node) => n.textContent)).to.deep.equal([
                editor.vDocument.root.name,
                vNodeChar.parent.name,
                vNodeChar.name + '.' + vNodeChar.name,
            ]);
        });
        it('should change the selection to select the char', async () => {
            await openDevTools(devtools);
            const node = devtools.querySelector('devtools-node.block.folded:nth-child(2)');
            const name = node.querySelector('devtools-nodename');
            const namePos = name.getBoundingClientRect();
            await click(name, {
                clientX: namePos.left,
                clientY: namePos.top,
            });

            const nameBold = devtools.querySelector('devtools-node .selectable-line.bold');
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

            const b = editor.el.querySelector('test-container b');
            expect(range.startContainer).to.equal(b.previousSibling);
            expect(range.startOffset).to.equal(1);
            expect(range.endContainer).to.equal(b.firstChild);
            expect(range.endOffset).to.equal(1);
        });
        it('should insert a char in editable (to add commands)', async () => {
            await openDevTools(devtools);

            const node = devtools.querySelector('devtools-node.block.folded:nth-child(2)');
            const name = node.querySelector('devtools-nodename');
            const namePos = name.getBoundingClientRect();
            await click(name, {
                clientX: namePos.left,
                clientY: namePos.top,
            });

            let nameBold = devtools.querySelector('devtools-node .selectable-line.bold');
            const pos = nameBold.getBoundingClientRect();
            nameBold.dispatchEvent(
                new MouseEvent('dblclick', { clientX: pos.left, clientY: pos.top, bubbles: true }),
            );
            await nextTickFrame();

            const container = editor.el.querySelector('test-container');
            container.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ' }));
            container.querySelector('b').firstChild.textContent = 'z';
            container.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await nextTickFrame();
            await nextTickFrame();
            expect(container.querySelector('b').parentElement.innerHTML).to.equal('a<b>z</b>c');

            await nextTickFrame();
            nameBold = devtools.querySelector('devtools-node .selectable-line.bold');
            expect(nameBold.parentElement.parentElement.textContent).to.equal('az[]c');
        });
    });
    describe('PathComponent', () => {
        it('should display the path in bottom bar', async () => {
            await openDevTools(devtools);

            const node = devtools.querySelector('devtools-node.block.folded:nth-child(3)');
            const name = node.querySelector('devtools-nodename');
            const namePos = name.getBoundingClientRect();
            await click(name, {
                clientX: namePos.left,
                clientY: namePos.top,
            });

            const path = devtools.querySelector('devtools-path');

            const i = devtools.querySelector('devtools-node .selectable-line.italic');
            const posI = i.getBoundingClientRect();
            await click(i, {
                clientX: posI.left,
                clientY: posI.top,
            });
            expect(path.textContent).to.equal('FragmentNodeParagraphNodei.i');

            const u = devtools.querySelector('devtools-node .selectable-line.underline');
            const posU = u.getBoundingClientRect();
            await click(u, {
                clientX: posU.left,
                clientY: posU.top,
            });
            expect(path.textContent).to.equal('FragmentNodeParagraphNodeu.u');
        });
        it('should select a parent node with the bottom path bar', async () => {
            await openDevTools(devtools);

            const node = devtools.querySelector('devtools-node.block.folded:nth-child(2)');
            const name = node.querySelector('devtools-nodename');
            const namePos = name.getBoundingClientRect();
            await click(name, {
                clientX: namePos.left,
                clientY: namePos.top,
            });

            const nameBold = devtools.querySelector('devtools-node .selectable-line.bold');
            const pos = nameBold.getBoundingClientRect();
            await click(nameBold, {
                clientX: pos.left,
                clientY: pos.top,
            });

            const path = devtools.querySelector('devtools-path devtools-pathnode:nth-child(2)');
            await click(path);
            const p = devtools.querySelector(
                'devtools-node devtools-children > devtools-node.block:nth-child(2)',
            );
            expect(p.firstElementChild.classList.contains('selected')).to.equal(true);
        });
    });
    describe('InfoComponent', () => {
        it('should select a child node with the info panel', async () => {
            await openDevTools(devtools);
            const node = devtools.querySelector(
                'devtools-node devtools-children devtools-node:nth-child(2)',
            );
            const name = node.querySelector('devtools-nodename');
            const pos = name.getBoundingClientRect();
            await click(name, {
                clientX: pos.left + 30,
                clientY: pos.top,
            });

            const vNode = editor.vDocument.root.children()[1];

            let about = devtools.querySelector('devtools-info devtools-about');
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

            const tr = Array.from(
                devtools.querySelectorAll('devtools-info devtools-properties devtools-tr'),
            )
                .filter(tr => tr.firstElementChild.textContent === 'children')
                .pop();
            const li = tr.querySelector('devtools-listitem:last-child');
            await click(li);

            about = devtools.querySelector('devtools-info devtools-about');
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
            await openDevTools(devtools);
            const button = devtools.querySelector('devtools-info devtools-button:nth-child(2)');
            expect(button.textContent).to.equal('Selection');
            await click(button);

            expect(button.classList.contains('selected')).to.equal(true);
            const about = devtools.querySelector('devtools-info devtools-about');
            const aResult =
                '<devtools-about><devtools-type>VSelection</devtools-type> Selection </devtools-about>';
            expect(about.outerHTML).to.equal(aResult);
        });
    });
    describe('CommandsComponent', () => {
        it('should change panel to "Commands" with top button', async () => {
            await openDevTools(devtools);
            const button = devtools.querySelector('devtools-navbar devtools-button:not(.selected)');
            expect(button.textContent).to.equal('Commands');
            expect(button.classList.contains('selected')).to.equal(false, 'button is not selected');

            await click(button);

            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');

            const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
            expect(subpanel.firstElementChild.tagName).to.equal('DEVTOOLS-TABLE');
        });
        it('should change sub panel to "Registry"', async () => {
            await openDevTools(devtools);
            await click(devtools.querySelector('devtools-navbar devtools-button:not(.selected)'));

            const panel = devtools.querySelector('devtools-panel.active');
            const button = panel.querySelector('devtools-navbar devtools-button:not(.selected)');
            expect(button.textContent).to.equal('Registry');
            await click(button);
            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');
            const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
            expect(subpanel.firstElementChild.tagName).to.equal('DEVTOOLS-COMMAND');
            expect(Array.from(subpanel.childNodes).map((n: Node) => n.textContent)).to.deep.equal([
                'insert',
                'insertParagraphBreak',
                'setSelection',
                'deleteBackward',
                'deleteForward',
                'selectAll',
                'toggleFormat',
                'insertText',
                'insertLineBreak',
                'applyHeadingStyle',
                'toggleList',
                'indent',
                'outdent',
                'link',
                'unlink',
                'addRowAbove',
                'addRowBelow',
                'addColumnBefore',
                'addColumnAfter',
                'deleteRow',
                'deleteColumn',
                'deleteTable',
                'mergeCells',
                'unmergeCells',
                'align',
            ]);
        });
        it('should display the previous commands in "Queue" of "Commands" panel', async () => {
            await openDevTools(devtools);
            const node = devtools.querySelector('devtools-node.block.folded:nth-child(2)');
            const name = node.querySelector('devtools-nodename');
            const namePos = name.getBoundingClientRect();
            await click(name, {
                clientX: namePos.left,
                clientY: namePos.top,
            });

            const nameBold = devtools.querySelector('devtools-node .selectable-line.bold');
            const pos = nameBold.getBoundingClientRect();
            nameBold.dispatchEvent(
                new MouseEvent('dblclick', { clientX: pos.left, clientY: pos.top, bubbles: true }),
            );
            await nextTickFrame();

            const container = editor.el.querySelector('test-container');
            container.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ' }));
            container.querySelector('b').firstChild.textContent = 'z';
            container.dispatchEvent(new InputEvent('input', { bubbles: true }));
            await nextTickFrame();
            await nextTickFrame();

            const button = devtools.querySelector('devtools-navbar devtools-button:not(.selected)');
            await click(button);

            const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
            expect(subpanel.textContent).to.equal('insertTextsetSelection');
        });
        it('should select "setSelection"', async () => {
            await openDevTools(devtools);
            await click(devtools.querySelector('devtools-navbar devtools-button:not(.selected)'));

            const panel = devtools.querySelector('devtools-panel.active');
            const button = panel.querySelector('devtools-navbar devtools-button:not(.selected)');
            await click(button);

            const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
            const line = subpanel.querySelector('.selectable-line:nth-child(3)');
            await click(line);

            expect(line.classList.contains('selected')).to.equal(true);

            const about = devtools.querySelector('devtools-info devtools-about');
            const aResult =
                '<devtools-about><devtools-type>Command</devtools-type> setSelection</devtools-about>';
            expect(about.outerHTML).to.equal(aResult);
        });
        it('should select "insertParagraphBreak" with arrow', async () => {
            await openDevTools(devtools);
            await click(devtools.querySelector('devtools-navbar devtools-button:not(.selected)'));

            const panel = devtools.querySelector('devtools-panel.active');
            const button = panel.querySelector('devtools-navbar devtools-button:not(.selected)');
            await click(button);

            const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
            const line = subpanel.querySelector('.selectable-line:nth-child(3)');
            await click(line);

            await keydown(line.nextElementSibling, 'ArrowUp');
            expect(line.classList.contains('selected')).to.equal(false);
            expect(line.previousElementSibling.classList.contains('selected')).to.equal(true);

            const about = devtools.querySelector('devtools-info devtools-about');
            const aResult =
                '<devtools-about><devtools-type>Command</devtools-type> insertParagraphBreak</devtools-about>';
            expect(about.outerHTML).to.equal(aResult);
        });
        it('should select "setSelection" with arrow', async () => {
            await openDevTools(devtools);
            await click(devtools.querySelector('devtools-navbar devtools-button:not(.selected)'));

            const panel = devtools.querySelector('devtools-panel.active');
            const button = panel.querySelector('devtools-navbar devtools-button:not(.selected)');
            await click(button);

            const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
            const line = subpanel.querySelector('.selectable-line:nth-child(2)');
            await click(line);

            await keydown(line.nextElementSibling, 'ArrowDown');
            expect(line.classList.contains('selected')).to.equal(false);
            expect(line.nextElementSibling.classList.contains('selected')).to.equal(true);

            const about = devtools.querySelector('devtools-info devtools-about');
            const aResult =
                '<devtools-about><devtools-type>Command</devtools-type> setSelection</devtools-about>';
            expect(about.outerHTML).to.equal(aResult);
        });
        it('should not change the selection with other key', async () => {
            await openDevTools(devtools);
            await click(devtools.querySelector('devtools-navbar devtools-button:not(.selected)'));

            const panel = devtools.querySelector('devtools-panel.active');
            const button = panel.querySelector('devtools-navbar devtools-button:not(.selected)');
            await click(button);

            const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
            const line = subpanel.querySelector('.selectable-line:nth-child(3)');
            await click(line);

            const selected = devtools.querySelector(
                'devtools-panel.active mainpane-contents .selectable-line.selected',
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
            await openDevTools(devtools);
            await click(devtools.querySelector('devtools-navbar devtools-button:not(.selected)'));
            await click(
                devtools.querySelector(
                    'devtools-panel.active devtools-navbar devtools-button:not(.selected)',
                ),
            );

            const panel = devtools.querySelector('devtools-panel.active');
            const button = panel.querySelector('devtools-navbar devtools-button:not(.selected)');
            expect(button.textContent).to.equal('Queue');
            await click(button);
            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');
        });
        describe('"Queue"', () => {
            let charBeforeChange: VNode;

            beforeEach(async () => {
                await openDevTools(devtools);
                const node = devtools.querySelector('devtools-node.block.folded:nth-child(2)');
                const name = node.querySelector('devtools-nodename');
                const namePos = name.getBoundingClientRect();
                await click(name, {
                    clientX: namePos.left,
                    clientY: namePos.top,
                });

                const nameBold = devtools.querySelector('devtools-node .selectable-line.bold');
                const pos = nameBold.getBoundingClientRect();
                nameBold.dispatchEvent(
                    new MouseEvent('dblclick', {
                        clientX: pos.left,
                        clientY: pos.top,
                        bubbles: true,
                    }),
                );
                await nextTickFrame();

                charBeforeChange = editor.vDocument.root.children()[1].children()[1];

                const container = editor.el.querySelector('test-container');
                container.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', code: 'KeyZ' }));
                container.querySelector('b').firstChild.textContent = 'z';
                container.dispatchEvent(new InputEvent('input', { bubbles: true }));
                await nextTickFrame();
                await nextTickFrame();

                const button = devtools.querySelector(
                    'devtools-navbar devtools-button:not(.selected)',
                );
                await click(button);
            });
            it('should select "insertText"', async () => {
                const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
                const line = subpanel.querySelector('.selectable-line');
                await click(line);
                expect(line.classList.contains('selected')).to.equal(true);

                const about = devtools.querySelector('devtools-info devtools-about');
                const aResult =
                    '<devtools-about><devtools-type>Command</devtools-type> insertText</devtools-about>';
                expect(about.outerHTML).to.equal(aResult);
            });
            it('should select "setSelection"', async () => {
                const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
                const line = subpanel.querySelector('.selectable-line:nth-child(2)');
                await click(line);
                expect(line.classList.contains('selected')).to.equal(true);

                const about = devtools.querySelector('devtools-info devtools-about');
                const aResult =
                    '<devtools-about><devtools-type>Command</devtools-type> setSelection</devtools-about>';
                expect(about.outerHTML).to.equal(aResult);

                const properties = devtools.querySelector(
                    'devtools-info devtools-properties devtools-table',
                );
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
                const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
                const line = subpanel.querySelector('.selectable-line:nth-child(2)');
                await click(line);
                await keydown(line, 'ArrowUp');

                expect(line.classList.contains('selected')).to.equal(false);

                const about = devtools.querySelector('devtools-info devtools-about');
                const aResult =
                    '<devtools-about><devtools-type>Command</devtools-type> insertText</devtools-about>';
                expect(about.outerHTML).to.equal(aResult);

                const properties = devtools.querySelector(
                    'devtools-info devtools-properties devtools-table',
                );
                const pResult =
                    '<devtools-table>' +
                    '<devtools-tbody>' +
                    '<devtools-tr><devtools-td>text</devtools-td><devtools-td>z</devtools-td></devtools-tr>' +
                    '</devtools-tbody>' +
                    '</devtools-table>';
                expect(properties.outerHTML).to.equal(pResult);
            });
            it('should select "setSelection" with arrow', async () => {
                const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
                const line = subpanel.querySelector('.selectable-line');
                await click(line);

                await keydown(line, 'ArrowDown');
                expect(line.classList.contains('selected')).to.equal(false);

                const about = devtools.querySelector('devtools-info devtools-about');
                const aResult =
                    '<devtools-about><devtools-type>Command</devtools-type> setSelection</devtools-about>';
                expect(about.outerHTML).to.equal(aResult);
            });
            it('should not change the selection with other key', async () => {
                const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
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
