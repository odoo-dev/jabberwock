import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { FragmentNode } from '../../core/src/VNodes/FragmentNode';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { ListNode, ListType } from '../ListNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { CharNode } from '../../plugin-char/CharNode';

describe('ListDomRenderer', () => {
    describe('render', () => {
        let editor: JWEditor;
        let root: FragmentNode;
        beforeEach(async () => {
            editor = new BasicEditor(document.createElement('div'));
            await editor.start();
            root = editor.vDocument.root;
        });
        afterEach(() => editor.stop());
        it('should render a complex list', async () => {
            /**
             * ListNode: UL                 motherList
             *      VElement: P             p1
             *          a
             *      ListNode: UL            ul
             *          VElement: P         p2
             *              a.a             ('.' is bold)
             *          VElement: P         p3
             *              a.b
             *          VElement: H1        h1
             *              a.c
             *          VElement: P         p4
             *              a.d
             *          ListNode: UL        ul2
             *              VElement: P     p5
             *                  a.d.a
             *      VElement: P             p6
             *          b
             *      ListNode: OL            ol
             *          VElement: P         p7
             *              b.1
             *          VElement: P         p8
             *              b.2
             *          VElement: H1        h12
             *              b.3
             *          VElement: P         p9
             *              b.4
             */
            const motherList = new ListNode(ListType.UNORDERED);
            root.append(motherList);

            const p1 = new VElement('P');
            p1.append(new CharNode('a'));
            motherList.append(p1);

            const ul = new ListNode(ListType.UNORDERED);
            const p2 = new VElement('P');
            p2.append(new CharNode('a'));
            p2.append(new CharNode('.', { bold: true }));
            p2.append(new CharNode('a'));
            ul.append(p2);

            const p3 = new VElement('P');
            p3.append(new CharNode('a'));
            p3.append(new CharNode('.'));
            p3.append(new CharNode('b'));
            ul.append(p3);

            const h1 = new VElement('H1');
            h1.append(new CharNode('a'));
            h1.append(new CharNode('.'));
            h1.append(new CharNode('c'));
            ul.append(h1);

            const p4 = new VElement('P');
            p4.append(new CharNode('a'));
            p4.append(new CharNode('.'));
            p4.append(new CharNode('d'));
            ul.append(p4);

            const ul2 = new ListNode(ListType.UNORDERED);
            const p5 = new VElement('P');
            p5.append(new CharNode('a'));
            p5.append(new CharNode('.'));
            p5.append(new CharNode('d'));
            p5.append(new CharNode('.'));
            p5.append(new CharNode('a'));
            ul2.append(p5);
            ul.append(ul2);
            motherList.append(ul);

            const p6 = new VElement('P');
            p6.append(new CharNode('b'));
            motherList.append(p6);

            const ol = new ListNode(ListType.ORDERED);
            const p7 = new VElement('P');
            p7.append(new CharNode('b'));
            p7.append(new CharNode('.'));
            p7.append(new CharNode('1'));
            ol.append(p7);
            const p8 = new VElement('P');
            p8.append(new CharNode('b'));
            p8.append(new CharNode('.'));
            p8.append(new CharNode('2'));
            ol.append(p8);
            const h12 = new VElement('H1');
            h12.append(new CharNode('b'));
            h12.append(new CharNode('.'));
            h12.append(new CharNode('3'));
            ol.append(h12);
            const p9 = new VElement('P');
            p9.append(new CharNode('b'));
            p9.append(new CharNode('.'));
            p9.append(new CharNode('4'));
            ol.append(p9);
            motherList.append(ol);

            const rendered = await editor.render<Node[]>('dom', root);
            if (expect(rendered).to.exist) {
                const innerHTMLContainer = document.createElement('p');
                innerHTMLContainer.append(rendered[0]);
                /* eslint-disable prettier/prettier */
                expect(innerHTMLContainer.innerHTML).to.equal([
                    '<ul>',
                        '<li>a',
                            '<ul>',
                                '<li>a<b>.</b>a</li>',
                                '<li>a.b</li>',
                                '<li><h1>a.c</h1></li>',
                                '<li>a.d',
                                    '<ul>',
                                        '<li>a.d.a</li>',
                                    '</ul>',
                                '</li>',
                            '</ul>',
                        '</li>',
                        '<li>b',
                            '<ol>',
                                '<li>b.1</li>',
                                '<li>b.2</li>',
                                '<li><h1>b.3</h1></li>',
                                '<li>b.4</li>',
                            '</ol>',
                        '</li>',
                    '</ul>',
                ].join(''));
            }
            /* eslint-enable prettier/prettier */
        });
    });
});
