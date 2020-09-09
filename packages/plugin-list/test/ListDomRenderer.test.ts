import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { ListNode, ListType } from '../src/ListNode';
import { TagNode } from '../../core/src/VNodes/TagNode';
import { CharNode } from '../../plugin-char/src/CharNode';
import { BoldFormat } from '../../plugin-bold/src/BoldFormat';
import { Modifiers } from '../../core/src/Modifiers';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { List } from '../src/List';
import { Char } from '../../plugin-char/src/Char';
import { Html } from '../../plugin-html/src/Html';
import { Paragraph } from '../../plugin-paragraph/src/Paragraph';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';

describe('ListDomRenderer', () => {
    describe('render', () => {
        let editor: JWEditor;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.configure({
                plugins: [[Html], [Char], [List], [Paragraph]],
            });
            await editor.start();
        });
        afterEach(() => editor.stop());
        it('should render a complex list', async () => {
            /**
             * ListNode: UL                 motherList
             *      TagNode: P             p1
             *          a
             *      ListNode: UL            ul
             *          TagNode: P         p2
             *              a.a             ('.' is bold)
             *          TagNode: P         p3
             *              a.b
             *          TagNode: H1        h1
             *              a.c
             *          TagNode: P         p4
             *              a.d
             *          ListNode: UL        ul2
             *              TagNode: P     p5
             *                  a.d.a
             *      TagNode: P             p6
             *          b
             *      ListNode: OL            ol
             *          TagNode: P         p7
             *              b.1
             *          TagNode: P         p8
             *              b.2
             *          TagNode: H1        h12
             *              b.3
             *          TagNode: P         p9
             *              b.4
             */
            const root = new ContainerNode();
            const motherList = new ListNode({ listType: ListType.UNORDERED });
            root.append(motherList);

            const p1 = new TagNode({ htmlTag: 'P' });
            p1.append(new CharNode({ char: 'a' }));
            motherList.append(p1);

            const ul = new ListNode({ listType: ListType.UNORDERED });
            const p2 = new TagNode({ htmlTag: 'P' });
            p2.append(new CharNode({ char: 'a' }));
            p2.append(new CharNode({ char: '.', modifiers: new Modifiers(BoldFormat) }));
            p2.append(new CharNode({ char: 'a' }));
            ul.append(p2);

            const p3 = new TagNode({ htmlTag: 'P' });
            p3.append(new CharNode({ char: 'a' }));
            p3.append(new CharNode({ char: '.' }));
            p3.append(new CharNode({ char: 'b' }));
            ul.append(p3);

            const h1 = new TagNode({ htmlTag: 'H1' });
            h1.append(new CharNode({ char: 'a' }));
            h1.append(new CharNode({ char: '.' }));
            h1.append(new CharNode({ char: 'c' }));
            ul.append(h1);

            const p4 = new TagNode({ htmlTag: 'P' });
            p4.append(new CharNode({ char: 'a' }));
            p4.append(new CharNode({ char: '.' }));
            p4.append(new CharNode({ char: 'd' }));
            ul.append(p4);

            const ul2 = new ListNode({ listType: ListType.UNORDERED });
            const p5 = new TagNode({ htmlTag: 'P' });
            p5.append(new CharNode({ char: 'a' }));
            p5.append(new CharNode({ char: '.' }));
            p5.append(new CharNode({ char: 'd' }));
            p5.append(new CharNode({ char: '.' }));
            p5.append(new CharNode({ char: 'a' }));
            ul2.append(p5);
            ul.append(ul2);
            motherList.append(ul);

            const p6 = new TagNode({ htmlTag: 'P' });
            p6.append(new CharNode({ char: 'b' }));
            motherList.append(p6);

            const ol = new ListNode({ listType: ListType.ORDERED });
            const p7 = new TagNode({ htmlTag: 'P' });
            p7.append(new CharNode({ char: 'b' }));
            p7.append(new CharNode({ char: '.' }));
            p7.append(new CharNode({ char: '1' }));
            ol.append(p7);
            const p8 = new TagNode({ htmlTag: 'P' });
            p8.append(new CharNode({ char: 'b' }));
            p8.append(new CharNode({ char: '.' }));
            p8.append(new CharNode({ char: '2' }));
            ol.append(p8);
            const h12 = new TagNode({ htmlTag: 'H1' });
            h12.append(new CharNode({ char: 'b' }));
            h12.append(new CharNode({ char: '.' }));
            h12.append(new CharNode({ char: '3' }));
            ol.append(h12);
            const p9 = new TagNode({ htmlTag: 'P' });
            p9.append(new CharNode({ char: 'b' }));
            p9.append(new CharNode({ char: '.' }));
            p9.append(new CharNode({ char: '4' }));
            ol.append(p9);
            motherList.append(ol);

            const renderer = editor.plugins.get(Renderer);
            const rendered = await renderer.render<Node[]>('dom/html', root);
            if (expect(rendered).to.exist) {
                /* eslint-disable prettier/prettier */
                expect(rendered[0].outerHTML).to.equal([
                    '<ul>',
                        '<li>a</li>',
                        '<li style="list-style: none;">',
                            '<ul>',
                                '<li>a<b>.</b>a</li>',
                                '<li>a.b</li>',
                                '<li><h1>a.c</h1></li>',
                                '<li>a.d</li>',
                                '<li style="list-style: none;">',
                                    '<ul>',
                                        '<li>a.d.a</li>',
                                    '</ul>',
                                '</li>',
                            '</ul>',
                        '</li>',
                        '<li>b</li>',
                        '<li style="list-style: none;">',
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
