import { expect } from 'chai';
import { CharNode } from '../../plugin-char/src/CharNode';
import { LineBreakNode } from '../../plugin-linebreak/src/LineBreakNode';
import { HeadingNode } from '../../plugin-heading/src/HeadingNode';
import { MarkerNode } from '../src/VNodes/MarkerNode';
import { VElement } from '../src/VNodes/VElement';
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

describe('core', () => {
    describe('src', () => {
        describe('VNodes', () => {
            describe('VElement', () => {
                describe('constructor', () => {
                    it('should create an unknown element', async () => {
                        for (let i = 1; i <= 6; i++) {
                            const vNode = new VElement({ htmlTag: 'UNKNOWN-ELEMENT' });
                            expect(vNode instanceof AtomicNode).to.equal(false);
                            expect(vNode.htmlTag).to.equal('UNKNOWN-ELEMENT');
                        }
                    });
                });
                describe('clone', () => {
                    it('should duplicate a SimpleElementNode', async () => {
                        const vNode = new VElement({ htmlTag: 'P' });
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
                 * - H1
                 *   - Marker1
                 *   - b
                 * - c
                 * - P
                 *   - d
                 *   - P
                 *     - e
                 *     - Marker2
                 *     - f
                 */
                const root = new FragmentNode();
                const a = new CharNode({ char: 'a' });
                root.append(a);
                const h1 = new VElement({ htmlTag: 'H1' });
                root.append(h1);
                const b = new CharNode({ char: 'b' });
                h1.append(b);
                const marker1 = new MarkerNode();
                h1.prepend(marker1);
                const c = new CharNode({ char: 'c' });
                root.append(c);
                const p = new VElement({ htmlTag: 'P' });
                root.append(p);
                const d = new CharNode({ char: 'd' });
                p.append(d);
                const pp = new VElement({ htmlTag: 'P' });
                p.append(pp);
                const e = new CharNode({ char: 'e' });
                pp.append(e);
                const marker2 = new MarkerNode();
                pp.append(marker2);
                const f = new CharNode({ char: 'f' });
                pp.append(f);

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
                        const p = new VElement({ htmlTag: 'P' });
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
                describe('children', () => {
                    it('should return the children nodes (without markers)', async () => {
                        expect(root.children()).to.deep.equal([a, h1, c, p]);
                        expect(h1.children()).to.deep.equal([b]);
                    });
                    it('should return the children nodes with the markers', async () => {
                        expect(root.childVNodes.slice()).to.deep.equal([a, h1, c, p]);
                        expect(h1.childVNodes.slice()).to.deep.equal([marker1, b]);
                    });
                });
                describe('locate', () => {
                    it('should locate where to set the selection at end', async () => {
                        const p = new VElement({ htmlTag: 'P' });
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
                        const p = new VElement({ htmlTag: 'P' });
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
                        const h1 = new VElement({ htmlTag: 'H1' });
                        root.append(h1);
                        const b = new CharNode({ char: 'b' });
                        h1.append(b);
                        const cite = new VElement({ htmlTag: 'CITE' });
                        h1.append(cite);
                        const x = new CharNode({ char: 'x' });
                        cite.append(x);
                        const tail = new MarkerNode();
                        h1.prepend(tail);
                        const c = new CharNode({ char: 'c' });
                        root.append(c);
                        const p = new VElement({ htmlTag: 'P' });
                        root.append(p);
                        const d = new CharNode({ char: 'd' });
                        p.append(d);
                        const pp = new VElement({ htmlTag: 'P' });
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
                        const h1 = new VElement({ htmlTag: 'H1' });
                        root.append(h1);
                        const b = new CharNode({ char: 'b' });
                        h1.append(b);
                        const cite = new VElement({ htmlTag: 'CITE' });
                        h1.append(cite);
                        const x = new CharNode({ char: 'x' });
                        cite.append(x);
                        const tail = new MarkerNode();
                        h1.prepend(tail);
                        const c = new CharNode({ char: 'c' });
                        root.append(c);
                        const p = new VElement({ htmlTag: 'P' });
                        root.append(p);
                        const d = new CharNode({ char: 'd' });
                        p.append(d);
                        const pp = new VElement({ htmlTag: 'P' });
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
                        expect(h1.adjacents()).to.deep.equal([a, c, p]);
                        expect(h1.adjacents(CharNode)).to.deep.equal([a, c]);
                        expect(b.adjacents()).to.deep.equal([], 'siblings without the markers');
                        expect(root.adjacents()).to.deep.equal([]);
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
                        expect(c.adjacents()).to.deep.equal([a, h2, b, d, h3, e]);
                        expect(c.adjacents(CharNode)).to.deep.equal([b, d]);
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
                                return vNode instanceof VElement;
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
                                return vNode instanceof VElement;
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
                    it('should return the previous with predicate', async () => {
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
                    it('should return the next with predicate', async () => {
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
                            contentBefore: '<h1><p>a</p></h1><h2>b</h2>',
                            stepFunction: (editor: JWEditor) => {
                                const domEngine = editor.plugins.get(Layout).engines.dom;
                                const editable = domEngine.components.editable[0];
                                const a = editable.firstLeaf();
                                const ancestors = a.ancestors();
                                expect(ancestors.map(ancestor => ancestor.name)).to.deep.equal([
                                    'ParagraphNode',
                                    'HeadingNode: 1',
                                    'VElement',
                                    'ZoneNode: main',
                                    'VElement',
                                    'VElement',
                                    'LayoutContainer',
                                    'ZoneNode: root',
                                ]);
                            },
                        });
                    });
                    it('should get a list of all ancestors of the node satisfying the predicate', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<h1><p>a</p></h1><h2>b</h2>',
                            stepFunction: (editor: JWEditor) => {
                                const domEngine = editor.plugins.get(Layout).engines.dom;
                                const editable = domEngine.components.editable[0];
                                const a = editable.firstLeaf();
                                const ancestors = a.ancestors(ancestor => {
                                    return (
                                        !(ancestor instanceof HeadingNode) || ancestor.level !== 1
                                    );
                                });
                                expect(ancestors.map(ancestor => ancestor.name)).to.deep.equal([
                                    'ParagraphNode',
                                    'VElement',
                                    'ZoneNode: main',
                                    'VElement',
                                    'VElement',
                                    'LayoutContainer',
                                    'ZoneNode: root',
                                ]);
                            },
                        });
                    });
                });
                describe('descendants', () => {
                    it('should get a list of all descendants of the root node ', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<h1><p>a</p></h1><h2>b</h2>',
                            stepFunction: (editor: JWEditor) => {
                                const domEngine = editor.plugins.get(Layout).engines.dom;
                                const editable = domEngine.components.editable[0];
                                const descendants = editable.descendants();
                                expect(
                                    descendants.map(descendant => descendant.name),
                                ).to.deep.equal([
                                    'HeadingNode: 1',
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
                            contentBefore: '<h1><p>a</p></h1><h2>b</h2>',
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
                                ).to.deep.equal(['HeadingNode: 1', 'ParagraphNode', 'a', 'b']);
                            },
                        });
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
                    it('should throw if no parent', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        expect(() => {
                            root.before(a);
                        }).to.throw();
                    });
                });
                describe('after', () => {
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
                });
                describe('insertAfter', () => {
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
                        const child1 = new CharNode({ char: 'a' });
                        const child2 = new CharNode({ char: 'a' });
                        const child3 = new CharNode({ char: 'a' });
                        root.append(child1);
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
                    it('should throw when try to remove a unknown node', async () => {
                        expect(() => {
                            root.removeChild(new CharNode({ char: 'd' }));
                        }).to.throw(ChildError);
                    });
                });
                describe('splitAt', () => {
                    it('should split a paragraph', async () => {
                        const root = new FragmentNode();
                        const p = new VElement({ htmlTag: 'P' });
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
                    it('should split a paragraph with markers', async () => {
                        const root = new FragmentNode();
                        const p = new VElement({ htmlTag: 'P' });
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
