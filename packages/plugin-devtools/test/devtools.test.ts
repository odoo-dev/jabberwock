/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { VNode, VNodeType } from '../../core/src/VNodes/VNode';
import { click, nextTickFrame, keydown } from '../../utils/src/testUtils';

async function openDevTools(devtools: HTMLElement): Promise<void> {
    await click(devtools.querySelector('devtools-navbar'));
}

describe('plugin-devtools', () => {
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

        editor = new BasicEditor(root);
        editor.loadConfig({
            debug: true,
        });

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
            const button = devtools.querySelector('devtools-navbar button');
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
            const button = devtools.querySelector('devtools-navbar button:nth-child(2)');
            await click(button);
            expect(devtools.classList.contains('closed')).to.equal(false);
        });
    });
    describe('InspectorComponent', () => {
        it('should change panel to "Inspector" with top button', async () => {
            await openDevTools(devtools);
            const buttonCommand = devtools.querySelector('devtools-navbar button:nth-child(2)');
            await click(buttonCommand);

            const button = devtools.querySelector('devtools-navbar button');
            expect(button.textContent).to.equal('Inspector');
            expect(button.classList.contains('selected')).to.equal(false, 'button is not selected');

            await click(button);

            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');
            expect(!!devtools.querySelector('devtools-panel.active devtools-tree')).to.equal(true);
        });
        it('should display the VNode tab by default in info', async () => {
            await openDevTools(devtools);
            const button = devtools.querySelector('devtools-info devtools-navbar button');
            expect(button.textContent).to.equal('VNode');
            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');
        });
        it('should display the root by default in info', async () => {
            await openDevTools(devtools);
            const about = devtools.querySelector('devtools-info .about');
            const aResult =
                '<div class="about">' +
                '<span class="type">' +
                editor.vDocument.root.constructor.name +
                '</span> ' +
                editor.vDocument.root.type +
                '<button class="logger">&gt;_</button>' +
                '<span class="id">' +
                editor.vDocument.root.id +
                '</span>' +
                '</div>';
            expect(about.outerHTML).to.equal(aResult);

            const properties = devtools.querySelector('devtools-info .properties');
            const pResult =
                '<div class="properties">' +
                '<div class="divider">👤 About me</div>' +
                '<table>' +
                '<tbody>' +
                '<tr><td>id</td><td>' +
                editor.vDocument.root.id +
                '</td></tr>' +
                '<tr><td>name</td><td>"' +
                editor.vDocument.root.name +
                '"</td></tr>' +
                '<tr><td>type</td><td>"' +
                editor.vDocument.root.type +
                '"</td></tr>' +
                '<tr><td>length</td><td>4</td></tr>' +
                '<tr><td>atomic</td><td>false</td></tr>' +
                '<tr><td>text</td><td>"Titleabcdefghiudiv"</td></tr>' +
                '<tr><td>total length</td><td>23</td></tr>' +
                '</tbody>' +
                '</table>' +
                '<div class="divider">📖 My Properties</div>' +
                '<table><tbody></tbody></table>' +
                '<div class="divider">👪 My Family</div>' +
                '<table>' +
                '<tbody>' +
                '<tr><td>index</td><td>0</td></tr>' +
                '<tr><td>parent</td><td>undefined</td></tr>' +
                '<tr><td>children</td><td><ol><li>' +
                editor.vDocument.root.children[0].type +
                '</li><li>' +
                editor.vDocument.root.children[1].type +
                '</li><li>' +
                editor.vDocument.root.children[2].type +
                '</li><li>' +
                editor.vDocument.root.children[3].type +
                '</li></ol></td></tr>' +
                '<tr>' +
                '<td>siblings</td>' +
                '<td>' +
                '<ol style="list-style-type: none"><li>previous: none</li><li>next: none</li></ol>' +
                '</td>' +
                '</tr>' +
                '</tbody>' +
                '</table>' +
                '</div>';
            expect(properties.outerHTML).to.equal(pResult);
        });
    });
    describe('TreeComponent', () => {
        it('should select the first paragraph', async () => {
            await openDevTools(devtools);
            const node = devtools.querySelector(
                'devtools-node .children devtools-node:nth-child(2)',
            );
            const name = node.querySelector('.element-name');
            const pos = name.getBoundingClientRect();
            await click(name, {
                clientX: pos.left + 30,
                clientY: pos.top,
            });
            expect(name.classList.contains('selected')).to.equal(true, 'node is selected');

            expect(node.classList.contains('folded')).to.equal(true, 'node is folded');
            expect(node.querySelector('.children').children.length).to.equal(
                0,
                'not displayed anymore',
            );

            const about = devtools.querySelector('devtools-info .about');
            const aResult =
                '<div class="about">' +
                '<span class="type">' +
                editor.vDocument.root.children[1].constructor.name +
                '</span> ' +
                editor.vDocument.root.children[1].type +
                '<button class="logger">&gt;_</button>' +
                '<span class="id">' +
                editor.vDocument.root.children[1].id +
                '</span>' +
                '</div>';
            expect(about.outerHTML).to.equal(aResult);

            const aboutMe = devtools.querySelector('devtools-info .properties table');
            const aboutMeResult =
                '<table>' +
                '<tbody>' +
                '<tr><td>id</td><td>' +
                editor.vDocument.root.children[1].id +
                '</td></tr>' +
                '<tr><td>name</td><td>"' +
                editor.vDocument.root.children[1].name +
                '"</td></tr>' +
                '<tr><td>type</td><td>"' +
                editor.vDocument.root.children[1].type +
                '"</td></tr>' +
                '<tr><td>length</td><td>3</td></tr>' +
                '<tr><td>atomic</td><td>false</td></tr>' +
                '<tr><td>text</td><td>"abc"</td></tr>' +
                '<tr><td>total length</td><td>3</td></tr>' +
                '</tbody>' +
                '</table>';
            expect(aboutMe.outerHTML).to.equal(aboutMeResult);

            const family = devtools.querySelector('devtools-info .properties table:last-child');
            const familyResult =
                '<table>' +
                '<tbody>' +
                '<tr><td>index</td><td>1</td></tr>' +
                '<tr><td>parent</td><td>' +
                editor.vDocument.root.name +
                '</td></tr>' +
                '<tr><td>children</td><td><ol><li>' +
                editor.vDocument.root.children[0].type +
                '</li><li>' +
                editor.vDocument.root.children[1].type +
                '</li><li>' +
                editor.vDocument.root.children[2].type +
                '</li></ol></td></tr>' +
                '<tr><td>siblings</td><td><ol style="list-style-type: none"><li> previous: ' +
                editor.vDocument.root.children[0].type +
                '</li><li> next: ' +
                editor.vDocument.root.children[2].type +
                '</li></ol></td></tr>' +
                '</tbody>' +
                '</table>';
            expect(family.outerHTML).to.equal(familyResult);
        });
        it('should select a sibling node with arrow (up, down)', async () => {
            await openDevTools(devtools);
            const node = devtools.querySelector(
                'devtools-node .children devtools-node.element:nth-child(2)',
            );

            const name = node.querySelector('.element-name');
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
                'devtools-node .children devtools-node.element:nth-child(2)',
            );

            const name = node.querySelector('.element-name');
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
                'devtools-node .children > devtools-node.element:last-child',
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
            expect(last.querySelector('.folded span').classList.contains('selected')).to.equal(
                true,
                'select the first char',
            );
        });
        it('should open the first paragraph', async () => {
            await openDevTools(devtools);
            const last = devtools.querySelector(
                'devtools-node .children > devtools-node.element:last-child',
            );
            const span = last.firstElementChild;
            const pos = span.getBoundingClientRect();
            await click(span, {
                clientX: pos.left + 30,
                clientY: pos.top,
            });

            const node = devtools.querySelector('devtools-node.element.folded');
            const name = node.querySelector('.element-name');
            const namePos = name.getBoundingClientRect();
            await click(name, {
                clientX: namePos.left,
                clientY: namePos.top,
            });
            expect(node.classList.contains('folded')).to.equal(false, 'node is unfolded');
            expect(node.querySelector('.children').children.length).to.equal(
                3,
                'children are loaded',
            );
        });
        it('should open/close the last paragraph with enter', async () => {
            await openDevTools(devtools);
            const node = devtools.querySelector(
                'devtools-node .children devtools-node.element:nth-child(3)',
            );
            await keydown(node, 'Enter');
            expect(node.classList.contains('folded')).to.equal(false, 'node is unfolded');
            expect(node.querySelector('.children').children.length).to.equal(
                8,
                'children are loaded',
            );

            await keydown(node, 'Enter');
            expect(node.classList.contains('folded')).to.equal(true, 'node is folded');
            expect(node.querySelector('.children').children.length).to.equal(
                0,
                'removed from devtools dom',
            );
        });
        it('should change the selection to select the paragraph', async () => {
            await openDevTools(devtools);
            const p = devtools.querySelector(
                'devtools-tree > devtools-node > .children > devtools-node:nth-child(2)',
            );
            const name = p.firstElementChild;
            const pChildren = p.lastElementChild;
            const pos = name.getBoundingClientRect();
            name.dispatchEvent(
                new MouseEvent('dblclick', { clientX: pos.left, clientY: pos.top, bubbles: true }),
            );
            await nextTickFrame();

            expect(pChildren.childNodes.length).to.equal(5);
            expect(pChildren.firstElementChild.classList.contains('self-closing')).to.equal(
                true,
                'previous is the selection anchor',
            );
            expect(pChildren.lastElementChild.classList.contains('self-closing')).to.equal(
                true,
                'next is the selection focus',
            );
        });
        it('should select the bold char', async () => {
            await openDevTools(devtools);
            const node = devtools.querySelector('devtools-node.element.folded:nth-child(2)');
            const name = node.querySelector('.element-name');
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
            expect(bold.querySelector('.children')).to.equal(null);

            const vNodeChar = editor.vDocument.root.children[1].children[1];

            const about = devtools.querySelector('devtools-info .about');
            const aResult =
                '<div class="about">' +
                '<span class="type">' +
                vNodeChar.constructor.name +
                '</span> ' +
                vNodeChar.type +
                ': "b" ' +
                '<button class="logger">&gt;_</button>' +
                '<span class="id">' +
                +vNodeChar.id +
                '</span>' +
                '</div>';
            expect(about.outerHTML).to.equal(aResult);

            const aboutMe = devtools.querySelector('devtools-info .properties table');
            const aboutMeResult =
                '<table>' +
                '<tbody>' +
                '<tr><td>id</td><td>' +
                vNodeChar.id +
                '</td></tr>' +
                '<tr><td>name</td><td>"' +
                vNodeChar.name +
                '"</td></tr>' +
                '<tr><td>type</td><td>"' +
                vNodeChar.type +
                '"</td></tr>' +
                '<tr><td>length</td><td>1</td></tr>' +
                '<tr><td>atomic</td><td>true</td></tr>' +
                '<tr><td>text</td><td>"b"</td></tr>' +
                '<tr><td>total length</td><td>1</td></tr>' +
                '</tbody>' +
                '</table>';
            expect(aboutMe.outerHTML).to.equal(aboutMeResult);

            const family = devtools.querySelector('devtools-info .properties table:last-child');
            const familyResult =
                '<table>' +
                '<tbody>' +
                '<tr><td>index</td><td>1</td></tr>' +
                '<tr><td>parent</td><td>' +
                vNodeChar.parent.name +
                '</td></tr>' +
                '<tr><td>children</td><td>none</td></tr>' +
                '<tr><td>siblings</td><td><ol style="list-style-type: none"><li> previous: ' +
                vNodeChar.previousSibling().type +
                '</li><li> next: ' +
                vNodeChar.previousSibling().type +
                '</li></ol></td></tr>' +
                '</tbody>' +
                '</table>';
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
            const node = devtools.querySelector('devtools-node.element.folded:nth-child(2)');
            const name = node.querySelector('.element-name');
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

            const node = devtools.querySelector('devtools-node.element.folded:nth-child(2)');
            const name = node.querySelector('.element-name');
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
            container.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
            container.querySelector('b').firstChild.textContent = 'z';
            container.dispatchEvent(new KeyboardEvent('input', { bubbles: true }));
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

            const node = devtools.querySelector('devtools-node.element.folded:nth-child(3)');
            const name = node.querySelector('.element-name');
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

            const node = devtools.querySelector('devtools-node.element.folded:nth-child(2)');
            const name = node.querySelector('.element-name');
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
                'devtools-node .children > devtools-node.element:nth-child(2)',
            );
            expect(p.firstElementChild.classList.contains('selected')).to.equal(true);
        });
    });
    describe('InfoComponent', () => {
        it('should select a child node with the info panel', async () => {
            await openDevTools(devtools);
            const node = devtools.querySelector(
                'devtools-node .children devtools-node:nth-child(2)',
            );
            const name = node.querySelector('.element-name');
            const pos = name.getBoundingClientRect();
            await click(name, {
                clientX: pos.left + 30,
                clientY: pos.top,
            });

            const vNode = editor.vDocument.root.children[1];

            let about = devtools.querySelector('devtools-info .about');
            let aResult =
                '<div class="about">' +
                '<span class="type">' +
                vNode.constructor.name +
                '</span> ' +
                vNode.type +
                '<button class="logger">&gt;_</button>' +
                '<span class="id">' +
                vNode.id +
                '</span>' +
                '</div>';
            expect(about.outerHTML).to.equal(aResult);

            const tr = Array.from(devtools.querySelectorAll('devtools-info .properties tr'))
                .filter(tr => tr.firstElementChild.textContent === 'children')
                .pop();
            const li = tr.querySelector('li:last-child');
            expect(li.textContent).to.equal(VNodeType.NODE);
            await click(li);

            about = devtools.querySelector('devtools-info .about');
            aResult =
                '<div class="about">' +
                '<span class="type">' +
                vNode.children[2].constructor.name +
                '</span> ' +
                vNode.children[2].type +
                ': "c" ' +
                '<button class="logger">&gt;_</button>' +
                '<span class="id">' +
                vNode.children[2].id +
                '</span>' +
                '</div>';
            expect(about.outerHTML).to.equal(aResult);
        });
        it('should change panel to "Selection"', async () => {
            await openDevTools(devtools);
            const button = devtools.querySelector('devtools-info button:nth-child(2)');
            expect(button.textContent).to.equal('Selection');
            await click(button);

            expect(button.classList.contains('selected')).to.equal(true);
            const about = devtools.querySelector('devtools-info .about');
            const aResult =
                '<div class="about"><span class="type">VSelection</span> Selection </div>';
            expect(about.outerHTML).to.equal(aResult);
        });
    });
    describe('CommandsComponent', () => {
        it('should change panel to "Commands" with top button', async () => {
            await openDevTools(devtools);
            const button = devtools.querySelector('devtools-navbar button:not(.selected)');
            expect(button.textContent).to.equal('Commands');
            expect(button.classList.contains('selected')).to.equal(false, 'button is not selected');

            await click(button);

            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');

            const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
            expect(subpanel.firstElementChild.nodeName).to.equal('TABLE');
        });
        it('should change sub panel to "Registry"', async () => {
            await openDevTools(devtools);
            await click(devtools.querySelector('devtools-navbar button:not(.selected)'));

            const panel = devtools.querySelector('devtools-panel.active');
            const button = panel.querySelector('devtools-navbar button:not(.selected)');
            expect(button.textContent).to.equal('Registry');
            await click(button);
            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');
            const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
            expect(subpanel.firstElementChild.nodeName).to.equal('DIV');
            expect(Array.from(subpanel.childNodes).map((n: Node) => n.textContent)).to.deep.equal([
                'insertText',
                'applyFormat',
                'insertLineBreak',
                'toggleList',
                'insert',
                'insertParagraphBreak',
                'setSelection',
                'deleteBackward',
                'deleteForward',
                'selectAll',
            ]);
        });
        it('should display the previous commands in "Queue" of "Commands" panel', async () => {
            await openDevTools(devtools);
            const node = devtools.querySelector('devtools-node.element.folded:nth-child(2)');
            const name = node.querySelector('.element-name');
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
            container.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
            container.querySelector('b').firstChild.textContent = 'z';
            container.dispatchEvent(new KeyboardEvent('input', { bubbles: true }));
            await nextTickFrame();
            await nextTickFrame();

            const button = devtools.querySelector('devtools-navbar button:not(.selected)');
            await click(button);

            const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
            expect(subpanel.textContent).to.equal('insertTextsetSelection');
        });
        it('should select "insertLineBreak"', async () => {
            await openDevTools(devtools);
            await click(devtools.querySelector('devtools-navbar button:not(.selected)'));

            const panel = devtools.querySelector('devtools-panel.active');
            const button = panel.querySelector('devtools-navbar button:not(.selected)');
            await click(button);

            const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
            const line = subpanel.querySelector('.selectable-line:nth-child(3)');
            await click(line);

            expect(line.classList.contains('selected')).to.equal(true);

            const about = devtools.querySelector('devtools-info .about');
            const aResult =
                '<div class="about"><span class="type">Command</span> insertLineBreak</div>';
            expect(about.outerHTML).to.equal(aResult);
        });
        it('should select "applyFormat" with arrow', async () => {
            await openDevTools(devtools);
            await click(devtools.querySelector('devtools-navbar button:not(.selected)'));

            const panel = devtools.querySelector('devtools-panel.active');
            const button = panel.querySelector('devtools-navbar button:not(.selected)');
            await click(button);

            const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
            const line = subpanel.querySelector('.selectable-line:nth-child(3)');
            await click(line);

            await keydown(line.nextElementSibling, 'ArrowUp');
            expect(line.classList.contains('selected')).to.equal(false);
            expect(line.previousElementSibling.classList.contains('selected')).to.equal(true);

            const about = devtools.querySelector('devtools-info .about');
            const aResult =
                '<div class="about"><span class="type">Command</span> applyFormat</div>';
            expect(about.outerHTML).to.equal(aResult);
        });
        it('should select "insertLineBreak" with arrow', async () => {
            await openDevTools(devtools);
            await click(devtools.querySelector('devtools-navbar button:not(.selected)'));

            const panel = devtools.querySelector('devtools-panel.active');
            const button = panel.querySelector('devtools-navbar button:not(.selected)');
            await click(button);

            const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
            const line = subpanel.querySelector('.selectable-line:nth-child(2)');
            await click(line);

            await keydown(line.nextElementSibling, 'ArrowDown');
            expect(line.classList.contains('selected')).to.equal(false);
            expect(line.nextElementSibling.classList.contains('selected')).to.equal(true);

            const about = devtools.querySelector('devtools-info .about');
            const aResult =
                '<div class="about"><span class="type">Command</span> insertLineBreak</div>';
            expect(about.outerHTML).to.equal(aResult);
        });
        it('should not change the selection with other key', async () => {
            await openDevTools(devtools);
            await click(devtools.querySelector('devtools-navbar button:not(.selected)'));

            const panel = devtools.querySelector('devtools-panel.active');
            const button = panel.querySelector('devtools-navbar button:not(.selected)');
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
            await click(devtools.querySelector('devtools-navbar button:not(.selected)'));
            await click(
                devtools.querySelector(
                    'devtools-panel.active devtools-navbar button:not(.selected)',
                ),
            );

            const panel = devtools.querySelector('devtools-panel.active');
            const button = panel.querySelector('devtools-navbar button:not(.selected)');
            expect(button.textContent).to.equal('Queue');
            await click(button);
            expect(button.classList.contains('selected')).to.equal(true, 'button is selected');
        });
        describe('"Queue"', () => {
            let charBeforeChange: VNode;

            beforeEach(async () => {
                await openDevTools(devtools);
                const node = devtools.querySelector('devtools-node.element.folded:nth-child(2)');
                const name = node.querySelector('.element-name');
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

                charBeforeChange = editor.vDocument.root.children[1].children[1];

                const container = editor.el.querySelector('test-container');
                container.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
                container.querySelector('b').firstChild.textContent = 'z';
                container.dispatchEvent(new KeyboardEvent('input', { bubbles: true }));
                await nextTickFrame();
                await nextTickFrame();

                const button = devtools.querySelector('devtools-navbar button:not(.selected)');
                await click(button);
            });
            it('should select "insertText"', async () => {
                const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
                const line = subpanel.querySelector('.selectable-line');
                await click(line);
                expect(line.classList.contains('selected')).to.equal(true);

                const about = devtools.querySelector('devtools-info .about');
                const aResult =
                    '<div class="about"><span class="type">Command</span> insertText</div>';
                expect(about.outerHTML).to.equal(aResult);
            });
            it('should select "setSelection"', async () => {
                const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
                const line = subpanel.querySelector('.selectable-line:nth-child(2)');
                await click(line);
                expect(line.classList.contains('selected')).to.equal(true);

                const about = devtools.querySelector('devtools-info .about');
                const aResult =
                    '<div class="about"><span class="type">Command</span> setSelection</div>';
                expect(about.outerHTML).to.equal(aResult);

                const properties = devtools.querySelector('devtools-info .properties table');
                const pResult =
                    '<table>' +
                    '<tbody>' +
                    '<tr><td>vSelection</td><td><table><tbody>' +
                    '<tr><td> direction </td><td>FORWARD</td></tr>' +
                    '<tr><td> anchor </td><td> ' +
                    charBeforeChange.id +
                    ' (b) </td></tr>' +
                    '<tr><td> focus </td><td> ' +
                    charBeforeChange.id +
                    ' (b) </td></tr>' +
                    '</tbody></table></td></tr>' +
                    '</tbody>' +
                    '</table>';
                expect(properties.outerHTML).to.equal(pResult);
            });
            it('should select "insertText" with arrow', async () => {
                const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
                const line = subpanel.querySelector('.selectable-line:nth-child(2)');
                await click(line);
                await keydown(line, 'ArrowUp');

                expect(line.classList.contains('selected')).to.equal(false);

                const about = devtools.querySelector('devtools-info .about');
                const aResult =
                    '<div class="about"><span class="type">Command</span> insertText</div>';
                expect(about.outerHTML).to.equal(aResult);

                const properties = devtools.querySelector('devtools-info .properties table');
                const pResult =
                    '<table>' +
                    '<tbody>' +
                    '<tr><td>text</td><td>z</td></tr>' +
                    '<tr><td>elements</td><td>[object Set]</td></tr>' +
                    '<tr><td>origin</td><td>EventNormalizer</td></tr>' +
                    '</tbody>' +
                    '</table>';
                expect(properties.outerHTML).to.equal(pResult);
            });
            it('should select "setSelection" with arrow', async () => {
                const subpanel = devtools.querySelector('devtools-panel.active mainpane-contents');
                const line = subpanel.querySelector('.selectable-line');
                await click(line);

                await keydown(line, 'ArrowDown');
                expect(line.classList.contains('selected')).to.equal(false);

                const about = devtools.querySelector('devtools-info .about');
                const aResult =
                    '<div class="about"><span class="type">Command</span> setSelection</div>';
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
