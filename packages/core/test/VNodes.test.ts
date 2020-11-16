import { expect } from 'chai';
import { CharNode } from '../../plugin-char/src/CharNode';
import { LineBreakNode } from '../../plugin-linebreak/src/LineBreakNode';
import { HeadingNode } from '../../plugin-heading/src/HeadingNode';
import { MarkerNode } from '../src/VNodes/MarkerNode';
import { TagNode } from '../src/VNodes/TagNode';
import { FragmentNode } from '../src/VNodes/FragmentNode';
import { JWPlugin, JWPluginConfig } from '../src/JWPlugin';
import JWEditor from '../src/JWEditor';
import { testEditor } from '../../utils/src/testUtils';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { nodeName } from '../../utils/src/utils';
import { ContainerNode } from '../src/VNodes/ContainerNode';
import { AtomicNode } from '../src/VNodes/AtomicNode';
import { ChildError } from '../../utils/src/errors';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { DomEditable } from '../../plugin-dom-editable/src/DomEditable';
import { Layout } from '../../plugin-layout/src/Layout';
import { HtmlDomParsingEngine } from '../../plugin-html/src/HtmlDomParsingEngine';
import { VNode } from '../src/VNodes/VNode';
import { parseEditable } from '../../utils/src/configuration';
import { Html } from '../../plugin-html/src/Html';
import { DividerNode } from '../../plugin-divider/src/DividerNode';
import { ParagraphNode } from '../../plugin-paragraph/src/ParagraphNode';

describe('core', () => {
    describe('src', () => {
        describe('VNodes', () => {
            describe('TagNode', () => {
                describe('constructor', () => {
                    it('should create an unknown element', async () => {
                        for (let i = 1; i <= 6; i++) {
                            const vNode = new TagNode({ htmlTag: 'UNKNOWN-ELEMENT' });
                            expect(vNode instanceof AtomicNode).to.equal(false);
                            expect(vNode.htmlTag).to.equal('UNKNOWN-ELEMENT');
                        }
                    });
                });
                describe('clone', () => {
                    it('should duplicate a SimpleElementNode', async () => {
                        const vNode = new TagNode({ htmlTag: 'P' });
                        const copy = vNode.clone();
                        expect(copy).to.not.equal(vNode);
                        expect(copy.htmlTag).to.equal('P');
                    });
                });
            });
            describe('MarkerNode', () => {
                describe('constructor', () => {
                    it('should create a marker node', async () => {
                        const markerNode = new MarkerNode();
                        expect(markerNode.tangible).to.equal(false);
                        expect(markerNode instanceof AtomicNode).to.equal(true);
                    });
                });
            });
            describe('VNode', () => {
                /*
                 * ROOT
                 * - a
                 * - NotTangible 1
                 *   - H1
                 *     - Marker1
                 *     - NotTangible 2
                 *       - b
                 *   - NotTangible 3
                 *     - c
                 *   - P
                 *     - d
                 *     - P
                 *       - e
                 *       - NotTangible 4
                 *         - Marker2
                 *         - f
                 */
                class NotTangible extends ContainerNode {
                    tangible = false;
                }

                const root = new FragmentNode();
                const a = new CharNode({ char: 'a' });
                root.append(a);
                const not1 = new NotTangible();
                root.append(not1);
                const h1 = new TagNode({ htmlTag: 'H1' });
                not1.append(h1);
                const not2 = new NotTangible();
                h1.append(not2);
                const b = new CharNode({ char: 'b' });
                not2.append(b);
                const marker1 = new MarkerNode();
                h1.prepend(marker1);
                const not3 = new NotTangible();
                not1.append(not3);
                const c = new CharNode({ char: 'c' });
                not3.append(c);
                const p = new TagNode({ htmlTag: 'P' });
                not1.append(p);
                const d = new CharNode({ char: 'd' });
                p.append(d);
                const pp = new TagNode({ htmlTag: 'P' });
                p.append(pp);
                const e = new CharNode({ char: 'e' });
                pp.append(e);
                const not4 = new NotTangible();
                pp.append(not4);
                const marker2 = new MarkerNode();
                not4.append(marker2);
                const f = new CharNode({ char: 'f' });
                not4.append(f);

                describe('constructor', () => {
                    it('should create an AtomicNode', async () => {
                        const atomic = new AtomicNode();
                        expect(atomic instanceof AtomicNode).to.equal(true);
                    });
                    it('should create a ContainerNode', async () => {
                        const container = new ContainerNode();
                        expect(container instanceof AtomicNode).to.equal(false);
                    });
                });
                describe('toString', () => {
                    it('should display an understandable rendering', async () => {
                        const root = new FragmentNode();
                        const p = new TagNode({ htmlTag: 'P' });
                        root.append(p);
                        const a = new CharNode({ char: 'a' });
                        p.append(a);
                        const marker1 = new MarkerNode();
                        p.append(marker1);
                        const b = new CharNode({ char: 'b' });
                        p.append(b);
                        const marker2 = new MarkerNode();
                        p.append(marker2);
                        const c = new CharNode({ char: 'c' });
                        p.append(c);
                        expect(root + '').to.deep.equal('FragmentNode');
                    });
                });
                describe('parent', () => {
                    it('should return the parent (tangible)', async () => {
                        expect(d.parent).to.deep.equal(p);
                        expect(f.parent).to.deep.equal(pp);
                    });
                });
                describe('closest', () => {
                    it('should closest parent of the node', async () => {
                        expect(b.closest(TagNode)).to.deep.equal(h1);
                        expect(d.closest(TagNode)).to.deep.equal(p);
                        expect(f.closest(TagNode)).to.deep.equal(pp);
                        expect(f.closest(FragmentNode)).to.deep.equal(root);
                    });
                });
                describe('children', () => {
                    it('should return the children nodes (without markers)', async () => {
                        expect(root.children()).to.deep.equal([a, h1, c, p]);
                        expect(not1.children()).to.deep.equal([h1, c, p]);
                        expect(h1.children()).to.deep.equal([b]);
                    });
                    it('should return the children nodes with the markers', async () => {
                        expect(root.childVNodes.slice()).to.deep.equal([a, not1]);
                        expect(not1.childVNodes.slice()).to.deep.equal([h1, not3, p]);
                        expect(h1.childVNodes.slice()).to.deep.equal([marker1, not2]);
                    });
                });
                describe('locate', () => {
                    it('should locate where to set the selection at end', async () => {
                        const p = new TagNode({ htmlTag: 'P' });
                        p.append(new ContainerNode());
                        p.append(new LineBreakNode());
                        p.append(new ContainerNode());
                        const doc = document.createElement('p');
                        doc.innerHTML = '<span><span><br><span><span>';
                        expect(p.lastChild().locate(doc.lastChild, 0)).to.deep.equal([
                            p.lastChild(),
                            'BEFORE',
                        ]);
                        expect(p.lastChild().locate(doc.lastChild, 1)).to.deep.equal([
                            p.lastChild(),
                            'AFTER',
                        ]);
                    });
                    it('should locate where to set the selection inside string', async () => {
                        const p = new TagNode({ htmlTag: 'P' });
                        const a = new CharNode({ char: 'a' });
                        p.append(a);
                        const vNode = new ContainerNode();
                        p.append(vNode);
                        const b = new CharNode({ char: 'b' });
                        p.append(b);
                        const doc = document.createElement('p');
                        doc.innerHTML = 'a<span><span>b';
                        expect(vNode.locate(doc.childNodes[1], 0)).to.deep.equal([vNode, 'BEFORE']);
                        expect(vNode.locate(doc.childNodes[1], 1)).to.deep.equal([vNode, 'AFTER']);
                    });
                });
                describe('clone', () => {
                    it('should duplicate a VNode', async () => {
                        const vNode = new ContainerNode();
                        const copy = vNode.clone();
                        expect(copy).to.not.equal(vNode);
                        expect(vNode.tangible).to.equal(true);
                    });
                });
                describe('isBefore', () => {
                    it('should return if the is before (after in same parent)', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const b = new CharNode({ char: 'b' });
                        root.append(b);
                        const c = new CharNode({ char: 'c' });
                        root.append(c);
                        expect(a.isBefore(b)).to.equal(true);
                        expect(a.isBefore(c)).to.equal(true);
                        expect(b.isBefore(a)).to.equal(false);
                        expect(b.isBefore(c)).to.equal(true);
                        expect(c.isBefore(a)).to.equal(false);
                    });
                    it('should return if the is before (after in an other parent)', async () => {
                        expect(a.isBefore(a)).to.equal(false, 'a isBefore a');
                        expect(a.isBefore(b)).to.equal(true, 'a isBefore b');
                        expect(a.isBefore(c)).to.equal(true, 'a isBefore c');
                        expect(a.isBefore(d)).to.equal(true, 'a isBefore d');
                        expect(a.isBefore(e)).to.equal(true, 'a isBefore e');
                        expect(a.isBefore(f)).to.equal(true, 'a isBefore f');

                        expect(b.isBefore(a)).to.equal(false, 'b isBefore a');
                        expect(b.isBefore(b)).to.equal(false, 'b isBefore b');
                        expect(b.isBefore(c)).to.equal(true, 'b isBefore c');
                        expect(b.isBefore(d)).to.equal(true, 'b isBefore d');
                        expect(b.isBefore(e)).to.equal(true, 'b isBefore e');
                        expect(b.isBefore(f)).to.equal(true, 'b isBefore f');

                        expect(c.isBefore(a)).to.equal(false, 'c isBefore a');
                        expect(c.isBefore(b)).to.equal(false, 'c isBefore b');
                        expect(c.isBefore(c)).to.equal(false, 'c isBefore c');
                        expect(c.isBefore(d)).to.equal(true, 'c isBefore d');
                        expect(c.isBefore(e)).to.equal(true, 'c isBefore e');
                        expect(c.isBefore(f)).to.equal(true, 'c isBefore f');

                        expect(d.isBefore(a)).to.equal(false, 'd isBefore a');
                        expect(d.isBefore(b)).to.equal(false, 'd isBefore b');
                        expect(d.isBefore(c)).to.equal(false, 'd isBefore c');
                        expect(d.isBefore(d)).to.equal(false, 'd isBefore d');
                        expect(d.isBefore(e)).to.equal(true, 'd isBefore e');
                        expect(d.isBefore(f)).to.equal(true, 'd isBefore f');

                        expect(e.isBefore(a)).to.equal(false, 'e isBefore a');
                        expect(e.isBefore(b)).to.equal(false, 'e isBefore b');
                        expect(e.isBefore(c)).to.equal(false, 'e isBefore c');
                        expect(e.isBefore(d)).to.equal(false, 'e isBefore d');
                        expect(e.isBefore(e)).to.equal(false, 'e isBefore e');
                        expect(e.isBefore(f)).to.equal(true, 'e isBefore f');

                        expect(f.isBefore(a)).to.equal(false, 'f isBefore a');
                        expect(f.isBefore(b)).to.equal(false, 'f isBefore b');
                        expect(f.isBefore(c)).to.equal(false, 'f isBefore c');
                        expect(f.isBefore(d)).to.equal(false, 'f isBefore d');
                        expect(f.isBefore(e)).to.equal(false, 'f isBefore e');
                        expect(f.isBefore(f)).to.equal(false, 'f isBefore f');
                    });
                });
                describe('isAfter', () => {
                    it('should return if the is after (after in same parent)', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const b = new CharNode({ char: 'b' });
                        root.append(b);
                        const c = new CharNode({ char: 'c' });
                        root.append(c);
                        expect(a.isAfter(b)).to.equal(false);
                        expect(a.isAfter(c)).to.equal(false);
                        expect(b.isAfter(a)).to.equal(true);
                        expect(b.isAfter(c)).to.equal(false);
                        expect(c.isAfter(a)).to.equal(true);
                    });
                    it('should return if the is after (after in an other parent)', async () => {
                        /*
                         * <root>                     root
                         *     a                      a
                         *     <h1>                   h1
                         *         [                  tail
                         *         b                  b
                         *         <cite>             cite
                         *             x              x
                         *         </cite>
                         *     </h1>
                         *     c                      c
                         *     <p>                    p
                         *         d                  d
                         *         <p>                pp
                         *             e              e
                         *             ]              head
                         *             f              f
                         *         </p>
                         *     </p>
                         * </root>
                         * <root>                     root2
                         *     a                      a2
                         * </root>
                         */
                        const root = new FragmentNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const h1 = new TagNode({ htmlTag: 'H1' });
                        root.append(h1);
                        const b = new CharNode({ char: 'b' });
                        h1.append(b);
                        const cite = new TagNode({ htmlTag: 'CITE' });
                        h1.append(cite);
                        const x = new CharNode({ char: 'x' });
                        cite.append(x);
                        const tail = new MarkerNode();
                        h1.prepend(tail);
                        const c = new CharNode({ char: 'c' });
                        root.append(c);
                        const p = new TagNode({ htmlTag: 'P' });
                        root.append(p);
                        const d = new CharNode({ char: 'd' });
                        p.append(d);
                        const pp = new TagNode({ htmlTag: 'P' });
                        p.append(pp);
                        const e = new CharNode({ char: 'e' });
                        pp.append(e);
                        const head = new MarkerNode();
                        pp.append(head);
                        const f = new CharNode({ char: 'f' });
                        pp.append(f);

                        const root2 = new FragmentNode();
                        const a2 = new CharNode({ char: 'a' });
                        root2.append(a2);

                        expect(a.isAfter(a)).to.equal(false, 'a isAfter a');
                        expect(a.isAfter(b)).to.equal(false, 'a isAfter b');
                        expect(a.isAfter(c)).to.equal(false, 'a isAfter c');
                        expect(a.isAfter(d)).to.equal(false, 'a isAfter d');
                        expect(a.isAfter(e)).to.equal(false, 'a isAfter e');
                        expect(a.isAfter(f)).to.equal(false, 'a isAfter f');

                        expect(b.isAfter(a)).to.equal(true, 'b isAfter a');
                        expect(b.isAfter(b)).to.equal(false, 'b isAfter b');
                        expect(b.isAfter(c)).to.equal(false, 'b isAfter c');
                        expect(b.isAfter(d)).to.equal(false, 'b isAfter d');
                        expect(b.isAfter(e)).to.equal(false, 'b isAfter e');
                        expect(b.isAfter(f)).to.equal(false, 'b isAfter f');

                        expect(c.isAfter(a)).to.equal(true, 'c isAfter a');
                        expect(c.isAfter(b)).to.equal(true, 'c isAfter b');
                        expect(c.isAfter(c)).to.equal(false, 'c isAfter c');
                        expect(c.isAfter(d)).to.equal(false, 'c isAfter d');
                        expect(c.isAfter(e)).to.equal(false, 'c isAfter e');
                        expect(c.isAfter(f)).to.equal(false, 'c isAfter f');

                        expect(d.isAfter(a)).to.equal(true, 'd isAfter a');
                        expect(d.isAfter(b)).to.equal(true, 'd isAfter b');
                        expect(d.isAfter(c)).to.equal(true, 'd isAfter c');
                        expect(d.isAfter(d)).to.equal(false, 'd isAfter d');
                        expect(d.isAfter(e)).to.equal(false, 'd isAfter e');
                        expect(d.isAfter(f)).to.equal(false, 'd isAfter f');

                        expect(e.isAfter(a)).to.equal(true, 'e isAfter a');
                        expect(e.isAfter(b)).to.equal(true, 'e isAfter b');
                        expect(e.isAfter(c)).to.equal(true, 'e isAfter c');
                        expect(e.isAfter(d)).to.equal(true, 'e isAfter d');
                        expect(e.isAfter(e)).to.equal(false, 'e isAfter e');
                        expect(e.isAfter(f)).to.equal(false, 'e isAfter f');

                        expect(f.isAfter(a)).to.equal(true, 'f isAfter a');
                        expect(f.isAfter(b)).to.equal(true, 'f isAfter b');
                        expect(f.isAfter(c)).to.equal(true, 'f isAfter c');
                        expect(f.isAfter(d)).to.equal(true, 'f isAfter d');
                        expect(f.isAfter(e)).to.equal(true, 'f isAfter e');
                        expect(f.isAfter(f)).to.equal(false, 'f isAfter f');

                        expect(b.isAfter(h1)).to.equal(true, 'b isAfter h1');
                        expect(h1.isAfter(b)).to.equal(false, 'h1 isAfter b');
                        expect(e.isAfter(x)).to.equal(true, 'e is after x');
                        expect(x.isAfter(e)).to.equal(false, 'x is after e');

                        expect(root2.isAfter(a2)).to.equal(false, 'root2 isAfter a2');
                        expect(a2.isAfter(root2)).to.equal(true, 'a2 isAfter root2');
                        expect(a.isAfter(a2)).to.equal(false, 'a isAfter a2');
                        expect(a2.isAfter(a)).to.equal(false, 'a2 isAfter a');
                    });
                });
                describe('ancestor', () => {
                    it('should return the ancestor', async () => {
                        /*
                         * <root>                     root
                         *     a                      a
                         *     <h1>                   h1
                         *         b                  b
                         *         <cite>             cite
                         *             []             tail
                         *             x              x
                         *         </cite>
                         *     </h1>
                         * </root>
                         */
                        class H1 extends TagNode {}
                        class Cite extends TagNode {}
                        const root = new FragmentNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const h1 = new H1({ htmlTag: 'H1' });
                        root.append(h1);
                        const b = new CharNode({ char: 'b' });
                        h1.append(b);
                        const cite = new Cite({ htmlTag: 'CITE' });
                        h1.append(cite);
                        const x = new CharNode({ char: 'x' });
                        cite.append(x);
                        const tail = new MarkerNode();
                        cite.prepend(tail);

                        expect(h1.ancestor()).to.equal(root, 'h1 ancestor');
                        expect(h1.ancestor(FragmentNode)).to.equal(
                            root,
                            'h1 ancestor FragmentNode',
                        );
                        expect(a.ancestor()).to.equal(root, 'a ancestor');
                        expect(a.ancestor(FragmentNode)).to.equal(root, 'a ancestor FragmentNode');
                        expect(a.ancestor(H1)).to.equal(undefined, 'a ancestor H1');
                        expect(b.ancestor(H1)).to.equal(h1, 'b ancestor H1');
                        expect(x.ancestor(H1)).to.equal(h1, 'x ancestor H1');
                        expect(b.ancestor(Cite)).to.equal(undefined, 'b ancestor Cite');
                        expect(x.ancestor(Cite)).to.equal(cite, 'x ancestor Cite');
                        expect(tail.ancestor(FragmentNode)).to.equal(
                            root,
                            'tail ancestor FragmentNode',
                        );
                        expect(tail.ancestor(H1)).to.equal(h1, 'tail ancestor FragmentNode');
                        expect(tail.ancestor(Cite)).to.equal(cite, 'tail ancestor Cite');
                        expect(tail.ancestor(TagNode)).to.equal(cite, 'tail ancestor TagNode');
                        expect(
                            tail.ancestor(n => n instanceof TagNode && n.htmlTag === 'CITE'),
                        ).to.equal(cite, 'tail ancestor TagNode = CITE');
                        expect(
                            tail.ancestor(n => n instanceof TagNode && n.htmlTag === 'H1'),
                        ).to.equal(h1, 'tail ancestor TagNode = h1');
                    });
                    it('should return the ancestor when contains not tangible container', async () => {
                        /*
                         * <root>                     root
                         *   <NotTangible>            not1
                         *     a                      a
                         *     <h1>                   h1
                         *       <NotTangible>        not2
                         *         b                  b
                         *         <cite>             cite
                         *             []             tail
                         *           <NotTangible>    not3
                         *             x              x
                         *           </NotTangible>
                         *         </cite>
                         *       </NotTangible>
                         *     </h1>
                         *   </NotTangible>
                         * </root>
                         */
                        class H1 extends TagNode {}
                        class Cite extends TagNode {}
                        class NotTangible extends ContainerNode {
                            tangible = false;
                        }
                        const root = new FragmentNode();
                        const not1 = new NotTangible();
                        root.append(not1);
                        const a = new CharNode({ char: 'a' });
                        not1.append(a);
                        const h1 = new H1({ htmlTag: 'H1' });
                        not1.append(h1);
                        const not2 = new NotTangible();
                        h1.append(not2);
                        const b = new CharNode({ char: 'b' });
                        not2.append(b);
                        const cite = new Cite({ htmlTag: 'CITE' });
                        not2.append(cite);
                        const not3 = new NotTangible();
                        cite.append(not3);
                        const x = new CharNode({ char: 'x' });
                        not3.append(x);
                        const tail = new MarkerNode();
                        cite.prepend(tail);

                        expect(h1.ancestor()).to.equal(root, 'h1 ancestor');
                        expect(h1.ancestor(FragmentNode)).to.equal(
                            root,
                            'h1 ancestor FragmentNode',
                        );
                        expect(a.ancestor()).to.equal(root, 'a ancestor');
                        expect(a.ancestor(FragmentNode)).to.equal(root, 'a ancestor FragmentNode');
                        expect(a.ancestor(H1)).to.equal(undefined, 'a ancestor H1');
                        expect(b.ancestor(H1)).to.equal(h1, 'b ancestor H1');
                        expect(x.ancestor(H1)).to.equal(h1, 'x ancestor H1');
                        expect(b.ancestor(Cite)).to.equal(undefined, 'b ancestor Cite');
                        expect(x.ancestor(Cite)).to.equal(cite, 'x ancestor Cite');
                        expect(tail.ancestor(FragmentNode)).to.equal(
                            root,
                            'tail ancestor FragmentNode',
                        );
                        expect(tail.ancestor(H1)).to.equal(h1, 'tail ancestor FragmentNode');
                        expect(tail.ancestor(Cite)).to.equal(cite, 'tail ancestor Cite');
                        expect(tail.ancestor(TagNode)).to.equal(cite, 'tail ancestor TagNode');
                        expect(
                            tail.ancestor(n => n instanceof TagNode && n.htmlTag === 'CITE'),
                        ).to.equal(cite, 'tail ancestor TagNode = CITE');
                        expect(
                            tail.ancestor(n => n instanceof TagNode && n.htmlTag === 'H1'),
                        ).to.equal(h1, 'tail ancestor TagNode = h1');
                    });
                });
                describe('commonAncestor', () => {
                    it('should return the common ancestor', async () => {
                        /*
                         * <root>                     root
                         *     a                      a
                         *     <h1>                   h1
                         *         [                  tail
                         *         b                  b
                         *         <cite>             cite
                         *             x              x
                         *         </cite>
                         *     </h1>
                         *     c                      c
                         *     <p>                    p
                         *         d                  d
                         *         <p>                pp
                         *             e              e
                         *             ]              head
                         *             f              f
                         *         </p>
                         *     </p>
                         * </root>
                         * <root>                     root2
                         *     a                      a2
                         * </root>
                         */
                        const root = new FragmentNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const h1 = new TagNode({ htmlTag: 'H1' });
                        root.append(h1);
                        const b = new CharNode({ char: 'b' });
                        h1.append(b);
                        const cite = new TagNode({ htmlTag: 'CITE' });
                        h1.append(cite);
                        const x = new CharNode({ char: 'x' });
                        cite.append(x);
                        const tail = new MarkerNode();
                        h1.prepend(tail);
                        const c = new CharNode({ char: 'c' });
                        root.append(c);
                        const p = new TagNode({ htmlTag: 'P' });
                        root.append(p);
                        const d = new CharNode({ char: 'd' });
                        p.append(d);
                        const pp = new TagNode({ htmlTag: 'P' });
                        p.append(pp);
                        const e = new CharNode({ char: 'e' });
                        pp.append(e);
                        const head = new MarkerNode();
                        pp.append(head);
                        const f = new CharNode({ char: 'f' });
                        pp.append(f);

                        const root2 = new FragmentNode();
                        const a2 = new CharNode({ char: 'a' });
                        root2.append(a2);

                        expect(a.commonAncestor(a)).to.equal(root, 'a commonAncestor a');
                        expect(a.commonAncestor(b)).to.equal(root, 'a commonAncestor b');
                        expect(b.commonAncestor(a)).to.equal(root, 'b commonAncestor a');
                        expect(b.commonAncestor(b)).to.equal(h1, 'b commonAncestor b');
                        expect(b.commonAncestor(x)).to.equal(h1, 'b commonAncestor x');
                        expect(x.commonAncestor(b)).to.equal(h1, 'x commonAncestor b');
                        expect(x.commonAncestor(x)).to.equal(cite, 'x commonAncestor x');
                        expect(e.commonAncestor(b)).to.equal(root, 'e commonAncestor b');
                        expect(b.commonAncestor(e)).to.equal(root, 'b commonAncestor e');
                        expect(e.commonAncestor(c)).to.equal(root, 'e commonAncestor c');
                        expect(c.commonAncestor(e)).to.equal(root, 'c commonAncestor e');
                        expect(e.commonAncestor(d)).to.equal(p, 'e commonAncestor d');
                        expect(e.commonAncestor(p)).to.equal(p, 'e commonAncestor p');
                        expect(p.commonAncestor(e)).to.equal(p, 'p commonAncestor e');
                        expect(d.commonAncestor(e)).to.equal(p, 'd commonAncestor e');
                        expect(e.commonAncestor(f)).to.equal(pp, 'e commonAncestor f');
                        expect(f.commonAncestor(e)).to.equal(pp, 'f commonAncestor e');
                        expect(a2.commonAncestor(root2)).to.equal(root2, 'a2 commonAncestor root2');
                        expect(a.commonAncestor(a2)).to.be.undefined;
                        expect(f.commonAncestor(e, FragmentNode)).to.equal(root);
                    });
                    it('should return the common ancestor when contains not tangible container', async () => {
                        /*
                         * <root>                           root
                         *   <NotTangible>                  not1
                         *     a                            a
                         *     <NotTangible>                not2
                         *       <h1>                       h1
                         *         [                        tail
                         *         b                        b
                         *         <NotTangible>            not3
                         *           <cite>                 cite
                         *             <NotTangible>        not4
                         *               x                  x
                         *             </NotTangible>
                         *           </cite>
                         *         </NotTangible>
                         *       </h1>
                         *     </NotTangible>
                         *     c                            c
                         *     <NotTangible>                not5
                         *       <p>                        p
                         *         d                        d
                         *         <p>                      pp
                         *           <NotTangible>          not6
                         *             <NotTangible>        not7
                         *             e                    e
                         *             </NotTangible>
                         *             ]                    head
                         *           </NotTangible>
                         *           f                      f
                         *         </p>
                         *       </p>
                         *     </NotTangible>
                         *   </NotTangible>
                         * </root>
                         * <root>                           root2
                         *     a                            a2
                         * </root>
                         */
                        class NotTangible extends ContainerNode {
                            tangible = false;
                        }
                        const root = new FragmentNode();
                        const not1 = new NotTangible();
                        root.append(not1);
                        const a = new CharNode({ char: 'a' });
                        not1.append(a);
                        const not2 = new NotTangible();
                        not1.append(not2);
                        const h1 = new TagNode({ htmlTag: 'H1' });
                        not2.append(h1);
                        const b = new CharNode({ char: 'b' });
                        h1.append(b);
                        const not3 = new NotTangible();
                        h1.append(not3);
                        const cite = new TagNode({ htmlTag: 'CITE' });
                        h1.append(cite);
                        const not4 = new NotTangible();
                        cite.append(not4);
                        const x = new CharNode({ char: 'x' });
                        not4.append(x);
                        const tail = new MarkerNode();
                        h1.prepend(tail);
                        const c = new CharNode({ char: 'c' });
                        not1.append(c);
                        const not5 = new NotTangible();
                        not1.append(not5);
                        const p = new TagNode({ htmlTag: 'P' });
                        not5.append(p);
                        const d = new CharNode({ char: 'd' });
                        p.append(d);
                        const pp = new TagNode({ htmlTag: 'P' });
                        p.append(pp);
                        const not6 = new NotTangible();
                        pp.append(not6);
                        const not7 = new NotTangible();
                        not6.append(not7);
                        const e = new CharNode({ char: 'e' });
                        not7.append(e);
                        const head = new MarkerNode();
                        not6.append(head);
                        const f = new CharNode({ char: 'f' });
                        pp.append(f);

                        const root2 = new FragmentNode();
                        const a2 = new CharNode({ char: 'a' });
                        root2.append(a2);

                        expect(a.commonAncestor(a)).to.equal(root, 'a commonAncestor a');
                        expect(a.commonAncestor(b)).to.equal(root, 'a commonAncestor b');
                        expect(b.commonAncestor(a)).to.equal(root, 'b commonAncestor a');
                        expect(b.commonAncestor(b)).to.equal(h1, 'b commonAncestor b');
                        expect(b.commonAncestor(x)).to.equal(h1, 'b commonAncestor x');
                        expect(x.commonAncestor(b)).to.equal(h1, 'x commonAncestor b');
                        expect(x.commonAncestor(x)).to.equal(cite, 'x commonAncestor x');
                        expect(e.commonAncestor(b)).to.equal(root, 'e commonAncestor b');
                        expect(b.commonAncestor(e)).to.equal(root, 'b commonAncestor e');
                        expect(e.commonAncestor(c)).to.equal(root, 'e commonAncestor c');
                        expect(c.commonAncestor(e)).to.equal(root, 'c commonAncestor e');
                        expect(e.commonAncestor(d)).to.equal(p, 'e commonAncestor d');
                        expect(e.commonAncestor(p)).to.equal(p, 'e commonAncestor p');
                        expect(p.commonAncestor(e)).to.equal(p, 'p commonAncestor e');
                        expect(d.commonAncestor(e)).to.equal(p, 'd commonAncestor e');
                        expect(e.commonAncestor(f)).to.equal(pp, 'e commonAncestor f');
                        expect(f.commonAncestor(e)).to.equal(pp, 'f commonAncestor e');
                        expect(a2.commonAncestor(root2)).to.equal(root2, 'a2 commonAncestor root2');
                        expect(a.commonAncestor(a2)).to.be.undefined;
                        expect(f.commonAncestor(e, FragmentNode)).to.equal(root);
                    });
                });
                describe('nthChild', () => {
                    it('should return the child at given index', async () => {
                        expect(root.nthChild(1)).to.equal(a);
                        expect(root.nthChild(2)).to.equal(h1);
                        expect(root.nthChild(3)).to.equal(c);
                        expect(root.nthChild(4)).to.equal(p);
                    });
                });
                describe('siblings', () => {
                    it('should return the node siblings', async () => {
                        expect(h1.siblings()).to.deep.equal([a, c, p]);
                        expect(h1.siblings(CharNode)).to.deep.equal([a, c]);
                        expect(b.siblings()).to.deep.equal([], 'siblings without the markers');
                        expect(root.siblings()).to.deep.equal([]);
                    });
                });
                describe('adjacents', () => {
                    it('should return the adjacent nodes', async () => {
                        expect(h1.adjacents()).to.deep.equal([a, h1, c, p]);
                        expect(h1.adjacents(CharNode)).to.deep.equal([a, c]);
                        expect(b.adjacents()).to.deep.equal([b], 'siblings without the markers');
                        expect(root.adjacents()).to.deep.equal([root]);
                    });
                    it('should return the adjacent nodes', async () => {
                        const container = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        container.append(a);
                        const h2 = new HeadingNode({ level: 2 });
                        container.append(h2);
                        const b = new CharNode({ char: 'b' });
                        container.append(b);
                        const c = new CharNode({ char: 'c' });
                        container.append(c);
                        const d = new CharNode({ char: 'd' });
                        container.append(d);
                        const h3 = new HeadingNode({ level: 3 });
                        container.append(h3);
                        const e = new CharNode({ char: 'e' });
                        container.append(e);
                        expect(c.adjacents()).to.deep.equal([a, h2, b, c, d, h3, e]);
                        expect(c.adjacents(CharNode)).to.deep.equal([b, c, d]);
                    });
                });
                describe('firstChild', () => {
                    it('should return the firstChild node', async () => {
                        expect(root.firstChild()).to.deep.equal(a, 'root.firstChild = a');
                        expect(h1.firstChild()).to.deep.equal(
                            b,
                            'h1.firstChild = b (not the marker)',
                        );
                        expect(p.firstChild()).to.deep.equal(d, 'p.firstChild = d');
                        expect(pp.firstChild()).to.deep.equal(e, 'pp.firstChild = e');
                    });
                    it('should return the firstChild node with predicate without result', async () => {
                        expect(
                            root.firstChild(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the firstChild node with predicate', async () => {
                        expect(
                            root.firstChild(vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.equal(a);
                        expect(
                            root.firstChild(vNode => {
                                return vNode instanceof TagNode;
                            }),
                        ).to.equal(h1);
                    });
                });
                describe('lastChild', () => {
                    it('should return the lastChild node', async () => {
                        expect(root.lastChild()).to.deep.equal(p, 'root.lastChild = p');
                        expect(h1.lastChild()).to.deep.equal(b, 'h1.lastChild = b');
                        expect(p.lastChild()).to.deep.equal(pp, 'p.lastChild = pp');
                        expect(pp.lastChild()).to.deep.equal(f, 'pp.lastChild = f');
                    });
                    it('should return the lastChild node with predicate without result', async () => {
                        expect(
                            root.lastChild(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the lastChild node with predicate', async () => {
                        expect(
                            root.lastChild(vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.equal(c);
                        expect(
                            root.lastChild(vNode => {
                                return vNode instanceof TagNode;
                            }),
                        ).to.equal(p);
                    });
                });
                describe('firstLeaf', () => {
                    it('should return the firstLeaf', async () => {
                        expect(root.firstLeaf()).to.deep.equal(a, 'root.firstLeaf = a');
                        expect(h1.firstLeaf()).to.deep.equal(b, 'h1.firstLeaf = b');
                        expect(p.firstLeaf()).to.deep.equal(d, 'p.firstLeaf = d');
                        expect(pp.firstLeaf()).to.deep.equal(e, 'pp.firstLeaf = e');
                    });
                    it('should return the firstLeaf with predicate without result', async () => {
                        expect(
                            root.firstLeaf(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            root.firstLeaf(vNode => {
                                return vNode.id === marker1.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the firstLeaf with predicate', async () => {
                        expect(
                            root.firstLeaf(vNode => {
                                return vNode.id === e.id;
                            }),
                        ).to.equal(e);
                    });
                    it('should return itself if is firstLeaf', async () => {
                        expect(b.firstLeaf()).to.deep.equal(b);
                    });
                });
                describe('lastLeaf', () => {
                    it('should return the lastLeaf', async () => {
                        expect(root.lastLeaf()).to.deep.equal(f, 'root.lastLeaf = a');
                        expect(h1.lastLeaf()).to.deep.equal(b, 'h1.lastLeaf = b');
                        expect(p.lastLeaf()).to.deep.equal(f, 'p.lastLeaf = d');
                        expect(pp.lastLeaf()).to.deep.equal(f, 'pp.lastLeaf = e');
                    });
                    it('should return the lastLeaf with predicate without result', async () => {
                        expect(
                            root.lastLeaf(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            root.lastLeaf(vNode => {
                                return vNode.id === marker1.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the lastLeaf with predicate', async () => {
                        expect(
                            root.lastLeaf(vNode => {
                                return vNode.id === e.id;
                            }),
                        ).to.equal(e);
                    });
                    it('should return itself if is lastLeaf', async () => {
                        expect(b.lastLeaf()).to.deep.equal(b);
                    });
                });
                describe('firstDescendant', () => {
                    it('should return the firstDescendant', async () => {
                        expect(root.firstDescendant()).to.deep.equal(a, 'root.firstDescendant = a');
                        expect(h1.firstDescendant()).to.deep.equal(
                            b,
                            'h1.firstDescendant = b (not the marker)',
                        );
                        expect(p.firstDescendant()).to.deep.equal(d, 'p.firstDescendant = d');
                        expect(pp.firstDescendant()).to.deep.equal(e, 'pp.firstDescendant = e');
                    });
                    it('should return the firstDescendant with predicate without result', async () => {
                        expect(a.firstDescendant()).to.deep.equal(undefined);
                        expect(
                            root.firstDescendant(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            root.firstDescendant(vNode => {
                                return vNode.id === marker1.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the firstDescendant with predicate', async () => {
                        expect(
                            root.firstDescendant(vNode => {
                                return vNode.id === pp.id;
                            }),
                        ).to.equal(pp);
                    });
                });
                describe('lastDescendant', () => {
                    it('should return the lastDescendant', async () => {
                        expect(root.lastDescendant()).to.deep.equal(f, 'root.lastDescendant = p');
                        expect(h1.lastDescendant()).to.deep.equal(
                            b,
                            'h1.lastDescendant = b (not the marker)',
                        );
                        expect(p.lastDescendant()).to.deep.equal(f, 'p.lastDescendant = f');
                        expect(pp.lastDescendant()).to.deep.equal(f, 'pp.lastDescendant = f');
                    });
                    it('should return the lastDescendant with predicate without result', async () => {
                        expect(a.lastDescendant()).to.deep.equal(undefined);
                        expect(
                            root.lastDescendant(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            root.lastDescendant(vNode => {
                                return vNode.id === marker1.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the lastDescendant with predicate', async () => {
                        expect(
                            root.lastDescendant(vNode => {
                                return vNode.id === pp.id;
                            }),
                        ).to.equal(pp);
                    });
                });
                describe('previousSibling', () => {
                    it('should return the previousSibling', async () => {
                        expect(h1.previousSibling()).to.deep.equal(a, 'h1.previousSibling = a');
                        expect(p.previousSibling()).to.deep.equal(c, 'p.previousSibling = c');
                        expect(pp.previousSibling()).to.deep.equal(d, 'pp.previousSibling = d');
                        expect(f.previousSibling()).to.deep.equal(e, 'f.previousSibling = e');
                    });
                    it('should return the previousSibling with predicate without result', async () => {
                        expect(root.previousSibling()).to.deep.equal(undefined);
                        expect(d.previousSibling()).to.deep.equal(undefined);
                        expect(b.previousSibling()).to.deep.equal(undefined);
                        expect(
                            root.previousSibling(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            b.previousSibling(vNode => {
                                return vNode.id === marker1.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the previousSibling with predicate', async () => {
                        expect(
                            p.previousSibling(vNode => {
                                return vNode.id === a.id;
                            }),
                        ).to.equal(a);
                    });
                });
                describe('nextSibling', () => {
                    it('should return the nextSibling', async () => {
                        expect(h1.nextSibling()).to.deep.equal(c, 'h1.nextSibling = c');
                        expect(d.nextSibling()).to.deep.equal(pp, 'd.nextSibling = pp');
                        expect(e.nextSibling()).to.deep.equal(f, 'e.nextSibling = f');
                    });
                    it('should return the nextSibling with predicate without result', async () => {
                        expect(root.nextSibling()).to.deep.equal(undefined);
                        expect(pp.nextSibling()).to.deep.equal(undefined);
                        expect(
                            root.nextSibling(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            f.nextSibling(vNode => {
                                return vNode.id === marker2.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the nextSibling with predicate', async () => {
                        expect(
                            h1.nextSibling(vNode => {
                                return vNode.id === p.id;
                            }),
                        ).to.equal(p);
                    });
                });
                describe('previous', () => {
                    it('should return the previous node', async () => {
                        expect(h1.previous()).to.deep.equal(a, 'h1.previous = a');
                        expect(p.previous()).to.deep.equal(c, 'p.previous = c');
                        expect(pp.previous()).to.deep.equal(d, 'pp.previous = d');
                        expect(f.previous()).to.deep.equal(e, 'f.previous = e');
                    });
                    it('should return the previous with predicate without result', async () => {
                        expect(root.previous()).to.deep.equal(undefined);
                        expect(
                            root.previous(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            b.previous(vNode => {
                                return vNode.id === marker1.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the previous with constructor predicate', async () => {
                        expect(marker1.previous(TagNode)).to.equal(h1);
                        expect(pp.previous(TagNode)).to.equal(p);
                        expect(f.previous(TagNode)).to.equal(pp);
                    });
                    it('should return the previous with function predicate', async () => {
                        expect(
                            pp.previous(vNode => {
                                return vNode.id === b.id;
                            }),
                        ).to.equal(b);
                    });
                });
                describe('next', () => {
                    it('should return the next', async () => {
                        expect(root.next()).to.deep.equal(a, 'root.next = a');
                        expect(h1.next()).to.deep.equal(b, 'h1.next = b');
                        expect(d.next()).to.deep.equal(pp, 'd.next = pp');
                        expect(e.next()).to.deep.equal(f, 'e.next = f');
                    });
                    it('should return the next with predicate without result', async () => {
                        expect(f.next()).to.deep.equal(undefined);
                        expect(
                            root.next(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            a.next(vNode => {
                                return vNode.id === marker2.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the next with constructor predicate', async () => {
                        expect(a.next(TagNode)).to.equal(h1);
                        expect(c.next(TagNode)).to.equal(p);
                        expect(d.next(TagNode)).to.equal(pp);
                    });
                    it('should return the next with function predicate', async () => {
                        expect(
                            b.next(vNode => {
                                return vNode.id === e.id;
                            }),
                        ).to.equal(e);
                    });
                });
                describe('previousLeaf', () => {
                    it('should return the previousLeaf node', async () => {
                        expect(h1.previousLeaf()).to.deep.equal(a, 'h1.previousLeaf = a');
                        expect(c.previousLeaf()).to.deep.equal(b, 'c.previousLeaf = b');
                        expect(e.previousLeaf()).to.deep.equal(d, 'e.previousLeaf = d');
                        expect(f.previousLeaf()).to.deep.equal(e, 'f.previousLeaf = e');
                    });
                    it('should return the previousLeaf with predicate without result', async () => {
                        expect(root.previousLeaf()).to.deep.equal(undefined);
                        expect(
                            root.previousLeaf(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            b.previousLeaf(vNode => {
                                return vNode.id === marker1.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the previousLeaf with predicate', async () => {
                        expect(
                            e.previousLeaf(vNode => {
                                return vNode.id === b.id;
                            }),
                        ).to.equal(b);
                        expect(
                            e.previousLeaf(vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.equal(d);
                    });
                });
                describe('nextLeaf', () => {
                    it('should return the nextLeaf node', async () => {
                        expect(root.nextLeaf()).to.deep.equal(a, 'root.nextLeaf = a');
                        expect(h1.nextLeaf()).to.deep.equal(b, 'h1.nextLeaf = b');
                        expect(c.nextLeaf()).to.deep.equal(d, 'c.nextLeaf = d');
                        expect(b.nextLeaf()).to.deep.equal(c, 'b.nextLeaf = c');
                    });
                    it('should return the nextLeaf with predicate without result', async () => {
                        expect(f.nextLeaf()).to.deep.equal(undefined);
                        expect(
                            root.nextLeaf(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            b.nextLeaf(vNode => {
                                return vNode.id === marker1.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the nextLeaf with predicate', async () => {
                        expect(
                            b.nextLeaf(vNode => {
                                return vNode.id === e.id;
                            }),
                        ).to.equal(e);
                        expect(
                            b.nextLeaf(vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.equal(c);
                    });
                });
                describe('previousSiblings', () => {
                    it('should return the previousSiblings', async () => {
                        expect(h1.previousSiblings()).to.deep.equal(
                            [a],
                            'h1.previousSiblings = [a]',
                        );
                        expect(p.previousSiblings()).to.deep.equal(
                            [c, h1, a],
                            'p.previousSiblings = [c, h1, a]',
                        );
                        expect(pp.previousSiblings()).to.deep.equal(
                            [d],
                            'pp.previousSiblings = [d]',
                        );
                        expect(f.previousSiblings()).to.deep.equal([e], 'f.previousSiblings = [e]');
                    });
                    it('should return the previousSiblings with predicate without result', async () => {
                        expect(root.previousSiblings()).to.deep.equal([]);
                        expect(d.previousSiblings()).to.deep.equal([]);
                        expect(
                            root.previousSiblings(() => {
                                return false;
                            }),
                        ).to.deep.equal([]);
                        expect(
                            b.previousSiblings(vNode => {
                                return vNode.id === marker1.id;
                            }),
                        ).to.deep.equal([]);
                    });
                    it('should return the previousSiblings with predicate', async () => {
                        expect(
                            p.previousSiblings(vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.deep.equal([c, a]);
                    });
                });
                describe('nextSiblings', () => {
                    it('should return the nextSiblings', async () => {
                        expect(h1.nextSiblings()).to.deep.equal([c, p], 'h1.nextSiblings = [c, p]');
                        expect(d.nextSiblings()).to.deep.equal([pp], 'd.nextSiblings = [pp]');
                        expect(e.nextSiblings()).to.deep.equal([f], 'e.nextSiblings = [f]');
                    });
                    it('should return the nextSiblings with predicate without result', async () => {
                        expect(root.nextSiblings()).to.deep.equal([]);
                        expect(pp.nextSiblings()).to.deep.equal([]);
                        expect(
                            root.nextSiblings(() => {
                                return false;
                            }),
                        ).to.deep.equal([]);
                        expect(
                            e.nextSiblings(vNode => {
                                return vNode.id === marker2.id;
                            }),
                        ).to.deep.equal([]);
                    });
                    it('should return the nextSiblings with predicate', async () => {
                        expect(
                            p.previousSiblings(vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.deep.equal([c, a]);
                    });
                });
                describe('ancestors', () => {
                    it('should get a list of all ancestors of the node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<div><p>a</p></div><h2>b</h2>',
                            stepFunction: (editor: JWEditor) => {
                                const domEngine = editor.plugins.get(Layout).engines.dom;
                                const editable = domEngine.components.editable[0];
                                const a = editable.firstLeaf();
                                const ancestors = a.ancestors();
                                expect(ancestors.map(ancestor => ancestor.name)).to.deep.equal([
                                    'ParagraphNode',
                                    'DividerNode',
                                    'TagNode',
                                    'ZoneNode: main',
                                    'TagNode',
                                    'TagNode',
                                    'LayoutContainer',
                                    'ZoneNode: root',
                                ]);
                            },
                        });
                    });
                    it('should get a list of all ancestors of the node satisfying the predicate', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<div><p>a</p></div><h2>b</h2>',
                            stepFunction: (editor: JWEditor) => {
                                const domEngine = editor.plugins.get(Layout).engines.dom;
                                const editable = domEngine.components.editable[0];
                                const a = editable.firstLeaf();
                                const ancestors = a.ancestors(ancestor => {
                                    return !(ancestor instanceof DividerNode);
                                });
                                expect(ancestors.map(ancestor => ancestor.name)).to.deep.equal([
                                    'ParagraphNode',
                                    'TagNode',
                                    'ZoneNode: main',
                                    'TagNode',
                                    'TagNode',
                                    'LayoutContainer',
                                    'ZoneNode: root',
                                ]);
                            },
                        });
                    });
                    it('should get a list of all ancestors (without not tangible) of the node', async () => {
                        expect(h1.ancestors()).to.deep.equal([root], 'h1.ancestors = [root]');
                        expect(not1.ancestors()).to.deep.equal([root], 'not1.ancestors = [root]');
                        expect(d.ancestors()).to.deep.equal([p, root], 'd.ancestors = [p, root]');
                        expect(f.ancestors()).to.deep.equal(
                            [pp, p, root],
                            'f.ancestors = [p, pp, root]',
                        );
                    });
                });
                describe('descendants', () => {
                    it('should get a list of all descendants of the root node ', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<div><p>a</p></div><h2>b</h2>',
                            stepFunction: (editor: JWEditor) => {
                                const domEngine = editor.plugins.get(Layout).engines.dom;
                                const editable = domEngine.components.editable[0];
                                const descendants = editable.descendants();
                                expect(
                                    descendants.map(descendant => descendant.name),
                                ).to.deep.equal([
                                    'DividerNode',
                                    'ParagraphNode',
                                    'a',
                                    'HeadingNode: 2',
                                    'b',
                                ]);
                            },
                        });
                    });
                    it('should get a list of all non-HEADING2 descendants of the root node ', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<div><p>a</p></div><h2>b</h2>',
                            stepFunction: (editor: JWEditor) => {
                                const domEngine = editor.plugins.get(Layout).engines.dom;
                                const editable = domEngine.components.editable[0];
                                const descendants = editable.descendants(
                                    descendant =>
                                        !(descendant instanceof HeadingNode) ||
                                        descendant.level !== 2,
                                );
                                expect(
                                    descendants.map(descendant => descendant.name),
                                ).to.deep.equal(['DividerNode', 'ParagraphNode', 'a', 'b']);
                            },
                        });
                    });
                    it('should get a list of all descendants (without not tangible) of the node', async () => {
                        expect(pp.descendants()).to.deep.equal([e, f], 'pp.descendants = [e, f]');
                        expect(root.descendants()).to.deep.equal(
                            [a, h1, b, c, p, d, pp, e, f],
                            'root.descendants = [a, h1, b, c, p, d, pp, e, f]',
                        );
                    });
                });
                describe('append', () => {
                    it('should append a node', async () => {
                        const s = new TagNode({ htmlTag: 'SECTION' });
                        const a = new CharNode({ char: 'a' });
                        const d = new TagNode({ htmlTag: 'DIV' });
                        s.append(a, d);
                        expect(s.childVNodes).to.deep.equal([a, d]);
                    });
                    it.skip('should not append a container in when may not contain containers', async () => {
                        const p = new ParagraphNode();
                        const a = new CharNode({ char: 'a' });
                        const d = new TagNode({ htmlTag: 'DIV' });
                        p.append(a, d);
                        expect(p.childVNodes).to.deep.equal([a]);
                    });
                    it('should append a container in when may not contain containers with parent', async () => {
                        const s = new TagNode({ htmlTag: 'SECTION' });
                        const p = new ParagraphNode();
                        s.append(p);
                        const a = new CharNode({ char: 'a' });
                        const d = new TagNode({ htmlTag: 'DIV' });
                        p.append(a, d);
                        expect(s.childVNodes.map(n => n.name)).to.deep.equal([
                            'ParagraphNode',
                            'TagNode',
                        ]);
                    });
                    it('should append a node in not tangible container', async () => {
                        const s = new NotTangible();
                        const a = new CharNode({ char: 'a' });
                        const d = new TagNode({ htmlTag: 'DIV' });
                        s.append(a, d);
                        expect(s.childVNodes).to.deep.equal([a, d]);
                    });
                });
                describe('before', () => {
                    it('should insert before node', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const b = new CharNode({ char: 'b' });
                        a.before(b);
                        const c = new CharNode({ char: 'c' });
                        a.before(c);
                        expect(a.siblings()).to.deep.equal([b, c]);
                    });
                    it.skip('should not insert container before node in when may not contain containers', async () => {
                        const p = new ParagraphNode();
                        const a = new CharNode({ char: 'a' });
                        const b = new CharNode({ char: 'b' });
                        p.append(a, b);
                        const div = new TagNode({ htmlTag: 'DIV' });
                        b.before(div);
                        expect(p.childVNodes).to.deep.equal([a, b]);
                    });
                    it('should insert a not tangible container before node in when may not contain containers', async () => {
                        const p = new ParagraphNode();
                        const a = new CharNode({ char: 'a' });
                        const b = new CharNode({ char: 'b' });
                        p.append(a, b);
                        const not = new NotTangible();
                        b.before(not);
                        expect(p.childVNodes).to.deep.equal([a, not, b]);
                    });
                    it('should insert container before node in when may not contain containers with parent', async () => {
                        const s = new TagNode({ htmlTag: 'SECTION' });
                        const p = new ParagraphNode();
                        s.append(p);
                        const a = new CharNode({ char: 'a' });
                        const b = new CharNode({ char: 'b' });
                        p.append(a, b);
                        const div = new TagNode({ htmlTag: 'DIV' });
                        b.before(div);
                        expect(p.childVNodes).to.deep.equal([a]);
                        expect(s.childVNodes.map(n => n.name)).to.deep.equal([
                            'ParagraphNode',
                            'TagNode',
                            'ParagraphNode',
                        ]);
                    });
                    it('should insert a not tangible container before node in when may not contain containers with parent', async () => {
                        const s = new TagNode({ htmlTag: 'SECTION' });
                        const p = new ParagraphNode();
                        s.append(p);
                        const a = new CharNode({ char: 'a' });
                        const b = new CharNode({ char: 'b' });
                        p.append(a, b);
                        const not = new NotTangible();
                        b.before(not);
                        expect(p.childVNodes).to.deep.equal([a, not, b]);
                        expect(s.childVNodes).to.deep.equal([p]);
                    });
                    it('should throw if no parent', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        expect(() => {
                            root.before(a);
                        }).to.throw();
                    });
                    it('should insert before node in not tangible container', async () => {
                        const root = new ContainerNode();
                        const not = new NotTangible();
                        root.append(not);
                        const a = new CharNode({ char: 'a' });
                        not.append(a);
                        const not2 = new NotTangible();
                        const b = new CharNode({ char: 'b' });
                        not2.append(b);
                        a.before(not2);
                        const c = new CharNode({ char: 'c' });
                        a.before(c);
                        expect(root.children()).to.deep.equal([b, c, a]);
                        expect(root.childVNodes).to.deep.equal([not]);
                    });
                });
                describe('after', () => {
                    it('should insert after node in not tangible container', async () => {
                        const root = new ContainerNode();
                        const not = new NotTangible();
                        root.append(not);
                        const a = new CharNode({ char: 'a' });
                        not.append(a);
                        const not2 = new NotTangible();
                        const b = new CharNode({ char: 'b' });
                        not2.append(b);
                        a.after(not2);
                        const c = new CharNode({ char: 'c' });
                        a.after(c);
                        expect(root.children()).to.deep.equal([a, c, b]);
                        expect(root.childVNodes).to.deep.equal([not]);
                    });
                    it('should insert after node', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const b = new CharNode({ char: 'b' });
                        a.after(b);
                        const c = new CharNode({ char: 'c' });
                        a.after(c);
                        expect(a.siblings()).to.deep.equal([c, b]);
                    });
                    it('should move a node after another', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const b = new CharNode({ char: 'b' });
                        root.append(b);
                        const c = new CharNode({ char: 'c' });
                        root.append(c);
                        b.after(a);
                        expect(a.siblings()).to.deep.equal([b, c]);
                    });
                    it('should throw if no parent', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        expect(() => {
                            root.after(a);
                        }).to.throw();
                    });
                });
                describe('insertBefore', () => {
                    it('should insert insert before node', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const b = new CharNode({ char: 'b' });
                        root.insertBefore(b, a);
                        const c = new CharNode({ char: 'c' });
                        root.insertBefore(c, a);
                        expect(a.siblings()).to.deep.equal([b, c]);
                    });
                    it('should throw when try to insert before unknown node', async () => {
                        expect(() => {
                            root.insertBefore(c, new CharNode({ char: 'd' }));
                        }).to.throw(ChildError);
                    });
                    it('should insert before node in not tangible container', async () => {
                        const root = new ContainerNode();
                        const not = new NotTangible();
                        root.append(not);
                        const a = new CharNode({ char: 'a' });
                        not.append(a);
                        const not2 = new NotTangible();
                        const b = new CharNode({ char: 'b' });
                        not2.append(b);
                        root.insertBefore(not2, a);
                        const c = new CharNode({ char: 'c' });
                        root.insertBefore(c, a);
                        expect(root.children()).to.deep.equal([b, c, a]);
                        expect(root.childVNodes).to.deep.equal([not]);
                    });
                });
                describe('insertAfter', () => {
                    it('should insert before node in not tangible container', async () => {
                        const root = new ContainerNode();
                        const not = new NotTangible();
                        root.append(not);
                        const a = new CharNode({ char: 'a' });
                        not.append(a);
                        const not2 = new NotTangible();
                        const b = new CharNode({ char: 'b' });
                        not2.append(b);
                        root.insertAfter(not2, a);
                        const c = new CharNode({ char: 'c' });
                        root.insertAfter(c, a);
                        expect(root.children()).to.deep.equal([a, c, b]);
                        expect(root.childVNodes).to.deep.equal([not]);
                    });
                    it('should insert insert after node', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const b = new CharNode({ char: 'b' });
                        root.insertAfter(b, a);
                        const c = new CharNode({ char: 'c' });
                        root.insertAfter(c, a);
                        expect(a.siblings()).to.deep.equal([c, b]);
                    });
                    it('should throw when try to insert after unknown node', async () => {
                        expect(() => {
                            root.insertAfter(c, new CharNode({ char: 'd' }));
                        }).to.throw(ChildError);
                    });
                });
                describe('empty', () => {
                    it('should remove all the children nodes', () => {
                        const root = new ContainerNode();
                        const not = new NotTangible();
                        const child1 = new CharNode({ char: 'a' });
                        const child2 = new CharNode({ char: 'a' });
                        const child3 = new CharNode({ char: 'a' });
                        root.append(not);
                        not.append(child1);
                        root.append(child2);
                        root.append(child3);
                        root.empty();
                        expect(root.children().length).to.equal(0);
                    });
                });
                describe('remove', () => {
                    it('should remove node itself', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const b = new CharNode({ char: 'b' });
                        root.append(b);
                        const c = new CharNode({ char: 'c' });
                        root.append(c);
                        expect(a.siblings()).to.deep.equal([b, c]);
                        b.remove();
                        expect(a.siblings()).to.deep.equal([c]);
                    });
                    it('should remove node itself in not tangible container', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const not = new NotTangible();
                        root.append(not);
                        const b = new CharNode({ char: 'b' });
                        not.append(b);
                        const c = new CharNode({ char: 'c' });
                        not.append(c);
                        expect(root.children()).to.deep.equal([a, b, c]);

                        b.remove();
                        expect(root.children()).to.deep.equal([a, c]);
                        expect(root.childVNodes).to.deep.equal([a, not]);
                    });
                    it('should remove node itself in not tangible container (last one)', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const not = new NotTangible();
                        root.append(not);
                        const b = new CharNode({ char: 'b' });
                        not.append(b);

                        b.remove();
                        expect(root.children()).to.deep.equal([a]);
                        expect(root.childVNodes).to.deep.equal([a, not]);
                    });
                });
                describe('removeChild', () => {
                    it('should remove a child', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const b = new CharNode({ char: 'b' });
                        root.append(b);
                        const c = new CharNode({ char: 'c' });
                        root.append(c);
                        expect(a.siblings()).to.deep.equal([b, c]);
                        root.removeChild(b);
                        expect(a.siblings()).to.deep.equal([c]);
                    });
                    it('should remove a child in not tangible container', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const not = new NotTangible();
                        root.append(not);
                        const b = new CharNode({ char: 'b' });
                        not.append(b);
                        const c = new CharNode({ char: 'c' });
                        not.append(c);
                        expect(root.children()).to.deep.equal([a, b, c]);

                        root.removeChild(b);
                        expect(root.children()).to.deep.equal([a, c]);
                        expect(root.childVNodes).to.deep.equal([a, not]);
                    });
                    it('should remove a child in not tangible container (last one)', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const not = new NotTangible();
                        root.append(not);
                        const b = new CharNode({ char: 'b' });
                        not.append(b);

                        root.removeChild(b);
                        expect(root.children()).to.deep.equal([a]);
                        expect(root.childVNodes).to.deep.equal([a, not]);
                    });
                    it('should throw when try to remove a unknown node', async () => {
                        expect(() => {
                            root.removeChild(new CharNode({ char: 'd' }));
                        }).to.throw(ChildError);
                    });
                });
                describe('splitAt', () => {
                    it('should split a paragraph', async () => {
                        const root = new FragmentNode();
                        const p = new TagNode({ htmlTag: 'P' });
                        root.append(p);
                        const a = new CharNode({ char: 'a' });
                        p.append(a);
                        const b = new CharNode({ char: 'b' });
                        p.append(b);
                        const c = new CharNode({ char: 'c' });
                        p.append(c);
                        p.splitAt(b);
                        expect(p.children()).to.deep.equal([a]);
                        expect(p.nextSibling().children()).to.deep.equal([b, c]);
                    });
                    it('should split a paragraph with not tangible containers', async () => {
                        /**
                         * FragmentNode
                         * TagNode
                         *   a
                         *   NotTangible
                         *     b
                         *     NotTangible
                         *       c
                         *       NotTangible
                         *         d
                         *       e
                         *   f
                         */

                        const root = new FragmentNode();
                        const p = new TagNode({ htmlTag: 'P' });
                        root.append(p);
                        p.append(new CharNode({ char: 'a' }));
                        const not = new NotTangible();
                        p.append(not);
                        not.append(new CharNode({ char: 'b' }));
                        const not2 = new NotTangible();
                        not.append(not2);
                        not2.append(new CharNode({ char: 'c' }));
                        const not3 = new NotTangible();
                        not2.append(not3);
                        const d = new CharNode({ char: 'd' });
                        not3.append(d);
                        not2.append(new CharNode({ char: 'e' }));
                        p.append(new CharNode({ char: 'f' }));

                        const next = p.splitAt(d);
                        expect(next).to.equal(p.nextSibling());
                        expect(p.children().map(n => n.name)).to.deep.equal(['a', 'b', 'c']);
                        expect(p.childVNodes.map(n => n.name)).to.deep.equal(['a', 'NotTangible']);
                        expect(p.childVNodes[1].childVNodes.map(n => n.name)).to.deep.equal([
                            'b',
                            'NotTangible',
                        ]);
                        expect(
                            p.childVNodes[1].childVNodes[1].childVNodes.map(n => n.name),
                        ).to.deep.equal(['c', 'NotTangible']);
                        expect(next.children().map(n => n.name)).to.deep.equal(['d', 'e', 'f']);
                        expect(next.childVNodes.map(n => n.name)).to.deep.equal([
                            'NotTangible',
                            'f',
                        ]);
                    });
                    it('should split a paragraph with markers', async () => {
                        const root = new FragmentNode();
                        const p = new TagNode({ htmlTag: 'P' });
                        root.append(p);
                        const a = new CharNode({ char: 'a' });
                        p.append(a);
                        const marker1 = new MarkerNode();
                        p.append(marker1);
                        const b = new CharNode({ char: 'b' });
                        p.append(b);
                        const marker2 = new MarkerNode();
                        p.append(marker2);
                        const c = new CharNode({ char: 'c' });
                        p.append(c);
                        p.splitAt(b);
                        expect(p.childVNodes.slice()).to.deep.equal([a, marker1]);
                        expect(p.nextSibling().childVNodes.slice()).to.deep.equal([b, marker2, c]);
                    });
                });
            });
            describe('Custom VNode', () => {
                it('should create and parse a custom node', async () => {
                    const root = document.createElement('ROOT-NODE');
                    const element = document.createElement('CUSTOM-NODE');
                    root.appendChild(element);
                    document.body.appendChild(root);

                    const editor = new JWEditor();
                    class MyCustomNode extends ContainerNode {
                        customKey = 'yes';
                    }
                    class MyCustomParser extends AbstractParser<Node> {
                        static id = HtmlDomParsingEngine.id;
                        predicate = (node: Node): boolean => {
                            return nodeName(node) === 'CUSTOM-NODE';
                        };
                        async parse(): Promise<MyCustomNode[]> {
                            return [new MyCustomNode()];
                        }
                    }

                    class MyCustomPlugin<T extends JWPluginConfig> extends JWPlugin<T> {
                        readonly loadables = {
                            parsers: [MyCustomParser],
                        };
                    }
                    editor.load(Html);
                    editor.load(DomEditable);
                    editor.load(DomLayout, {
                        location: [root, 'replace'],
                        components: [
                            {
                                id: 'editable',
                                render: async (editor: JWEditor): Promise<VNode[]> =>
                                    parseEditable(editor, root),
                            },
                        ],
                        componentZones: [['editable', ['main']]],
                    });
                    editor.load(MyCustomPlugin);
                    await editor.start();
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.editable[0];
                    const customVNode = editable.firstChild();
                    expect(customVNode.constructor.name).to.equal('MyCustomNode');
                    expect(customVNode instanceof MyCustomNode).to.be.true;
                    expect((customVNode as MyCustomNode).customKey).to.equal('yes');
                    await editor.stop();
                    document.body.removeChild(root);
                });
            });
        });
    });
});
