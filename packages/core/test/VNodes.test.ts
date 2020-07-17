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
import { beforeNodeTemp, afterNodeTemp, removeNodeTemp } from '../src/VNodes/AbstractNode';
import {
    nextLeafNodeTemp,
    previousSiblingsNodeTemp,
    nextSiblingsNodeTemp,
} from '../src/VNodes/AbstractNode';
import {
    nextSiblingNodeTemp,
    previousNodeTemp,
    nextNodeTemp,
    previousLeafNodeTemp,
} from '../src/VNodes/AbstractNode';
import {
    siblingsNodesTemp,
    adjacentsNodeTemp,
    previousSiblingNodeTemp,
} from '../src/VNodes/AbstractNode';
import {
    isNodePredicate,
    isBeforeNode,
    isAfterNode,
    ancestorsNodesTemp,
    commonAncestorNodesTemp,
} from '../src/VNodes/AbstractNode';

describe('core', () => {
    describe('src', () => {
        describe('VNodes', () => {
            describe('VElement', () => {
                describe('constructor', () => {
                    it('should create an unknown element', async () => {
                        for (let i = 1; i <= 6; i++) {
                            const vNode = new VElement({ htmlTag: 'UNKNOWN-ELEMENT' });
                            expect(isNodePredicate(vNode, AtomicNode)).to.equal(false);
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
                        expect(isNodePredicate(markerNode, AtomicNode)).to.equal(true);
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
                        expect(isNodePredicate(atomic, AtomicNode)).to.equal(true);
                    });
                    it('should create a ContainerNode', async () => {
                        const container = new ContainerNode();
                        expect(isNodePredicate(container, AtomicNode)).to.equal(false);
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
                        expect(isBeforeNode(a, b)).to.equal(true);
                        expect(isBeforeNode(a, c)).to.equal(true);
                        expect(isBeforeNode(b, a)).to.equal(false);
                        expect(isBeforeNode(b, c)).to.equal(true);
                        expect(isBeforeNode(c, a)).to.equal(false);
                    });
                    it('should return if the is before (after in an other parent)', async () => {
                        expect(isBeforeNode(a, a)).to.equal(false, 'a isBefore a');
                        expect(isBeforeNode(a, b)).to.equal(true, 'a isBefore b');
                        expect(isBeforeNode(a, c)).to.equal(true, 'a isBefore c');
                        expect(isBeforeNode(a, d)).to.equal(true, 'a isBefore d');
                        expect(isBeforeNode(a, e)).to.equal(true, 'a isBefore e');
                        expect(isBeforeNode(a, f)).to.equal(true, 'a isBefore f');

                        expect(isBeforeNode(b, a)).to.equal(false, 'b isBefore a');
                        expect(isBeforeNode(b, b)).to.equal(false, 'b isBefore b');
                        expect(isBeforeNode(b, c)).to.equal(true, 'b isBefore c');
                        expect(isBeforeNode(b, d)).to.equal(true, 'b isBefore d');
                        expect(isBeforeNode(b, e)).to.equal(true, 'b isBefore e');
                        expect(isBeforeNode(b, f)).to.equal(true, 'b isBefore f');

                        expect(isBeforeNode(c, a)).to.equal(false, 'c isBefore a');
                        expect(isBeforeNode(c, b)).to.equal(false, 'c isBefore b');
                        expect(isBeforeNode(c, c)).to.equal(false, 'c isBefore c');
                        expect(isBeforeNode(c, d)).to.equal(true, 'c isBefore d');
                        expect(isBeforeNode(c, e)).to.equal(true, 'c isBefore e');
                        expect(isBeforeNode(c, f)).to.equal(true, 'c isBefore f');

                        expect(isBeforeNode(d, a)).to.equal(false, 'd isBefore a');
                        expect(isBeforeNode(d, b)).to.equal(false, 'd isBefore b');
                        expect(isBeforeNode(d, c)).to.equal(false, 'd isBefore c');
                        expect(isBeforeNode(d, d)).to.equal(false, 'd isBefore d');
                        expect(isBeforeNode(d, e)).to.equal(true, 'd isBefore e');
                        expect(isBeforeNode(d, f)).to.equal(true, 'd isBefore f');

                        expect(isBeforeNode(e, a)).to.equal(false, 'e isBefore a');
                        expect(isBeforeNode(e, b)).to.equal(false, 'e isBefore b');
                        expect(isBeforeNode(e, c)).to.equal(false, 'e isBefore c');
                        expect(isBeforeNode(e, d)).to.equal(false, 'e isBefore d');
                        expect(isBeforeNode(e, e)).to.equal(false, 'e isBefore e');
                        expect(isBeforeNode(e, f)).to.equal(true, 'e isBefore f');

                        expect(isBeforeNode(f, a)).to.equal(false, 'f isBefore a');
                        expect(isBeforeNode(f, b)).to.equal(false, 'f isBefore b');
                        expect(isBeforeNode(f, c)).to.equal(false, 'f isBefore c');
                        expect(isBeforeNode(f, d)).to.equal(false, 'f isBefore d');
                        expect(isBeforeNode(f, e)).to.equal(false, 'f isBefore e');
                        expect(isBeforeNode(f, f)).to.equal(false, 'f isBefore f');
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
                        expect(isAfterNode(a, b)).to.equal(false);
                        expect(isAfterNode(a, c)).to.equal(false);
                        expect(isAfterNode(b, a)).to.equal(true);
                        expect(isAfterNode(b, c)).to.equal(false);
                        expect(isAfterNode(c, a)).to.equal(true);
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

                        expect(isAfterNode(a, a)).to.equal(false, 'a isAfter a');
                        expect(isAfterNode(a, b)).to.equal(false, 'a isAfter b');
                        expect(isAfterNode(a, c)).to.equal(false, 'a isAfter c');
                        expect(isAfterNode(a, d)).to.equal(false, 'a isAfter d');
                        expect(isAfterNode(a, e)).to.equal(false, 'a isAfter e');
                        expect(isAfterNode(a, f)).to.equal(false, 'a isAfter f');

                        expect(isAfterNode(b, a)).to.equal(true, 'b isAfter a');
                        expect(isAfterNode(b, b)).to.equal(false, 'b isAfter b');
                        expect(isAfterNode(b, c)).to.equal(false, 'b isAfter c');
                        expect(isAfterNode(b, d)).to.equal(false, 'b isAfter d');
                        expect(isAfterNode(b, e)).to.equal(false, 'b isAfter e');
                        expect(isAfterNode(b, f)).to.equal(false, 'b isAfter f');

                        expect(isAfterNode(c, a)).to.equal(true, 'c isAfter a');
                        expect(isAfterNode(c, b)).to.equal(true, 'c isAfter b');
                        expect(isAfterNode(c, c)).to.equal(false, 'c isAfter c');
                        expect(isAfterNode(c, d)).to.equal(false, 'c isAfter d');
                        expect(isAfterNode(c, e)).to.equal(false, 'c isAfter e');
                        expect(isAfterNode(c, f)).to.equal(false, 'c isAfter f');

                        expect(isAfterNode(d, a)).to.equal(true, 'd isAfter a');
                        expect(isAfterNode(d, b)).to.equal(true, 'd isAfter b');
                        expect(isAfterNode(d, c)).to.equal(true, 'd isAfter c');
                        expect(isAfterNode(d, d)).to.equal(false, 'd isAfter d');
                        expect(isAfterNode(d, e)).to.equal(false, 'd isAfter e');
                        expect(isAfterNode(d, f)).to.equal(false, 'd isAfter f');

                        expect(isAfterNode(e, a)).to.equal(true, 'e isAfter a');
                        expect(isAfterNode(e, b)).to.equal(true, 'e isAfter b');
                        expect(isAfterNode(e, c)).to.equal(true, 'e isAfter c');
                        expect(isAfterNode(e, d)).to.equal(true, 'e isAfter d');
                        expect(isAfterNode(e, e)).to.equal(false, 'e isAfter e');
                        expect(isAfterNode(e, f)).to.equal(false, 'e isAfter f');

                        expect(isAfterNode(f, a)).to.equal(true, 'f isAfter a');
                        expect(isAfterNode(f, b)).to.equal(true, 'f isAfter b');
                        expect(isAfterNode(f, c)).to.equal(true, 'f isAfter c');
                        expect(isAfterNode(f, d)).to.equal(true, 'f isAfter d');
                        expect(isAfterNode(f, e)).to.equal(true, 'f isAfter e');
                        expect(isAfterNode(f, f)).to.equal(false, 'f isAfter f');

                        expect(isAfterNode(b, h1)).to.equal(true, 'b isAfter h1');
                        expect(isAfterNode(h1, b)).to.equal(false, 'h1 isAfter b');
                        expect(isAfterNode(e, x)).to.equal(true, 'e is after x');
                        expect(isAfterNode(x, e)).to.equal(false, 'x is after e');

                        expect(isAfterNode(root2, a2)).to.equal(false, 'root2 isAfter a2');
                        expect(isAfterNode(a2, root2)).to.equal(true, 'a2 isAfter root2');
                        expect(isAfterNode(a, a2)).to.equal(false, 'a isAfter a2');
                        expect(isAfterNode(a2, a)).to.equal(false, 'a2 isAfter a');
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

                        expect(commonAncestorNodesTemp(a, a)).to.equal(root, 'a commonAncestor a');
                        expect(commonAncestorNodesTemp(a, b)).to.equal(root, 'a commonAncestor b');
                        expect(commonAncestorNodesTemp(b, a)).to.equal(root, 'b commonAncestor a');
                        expect(commonAncestorNodesTemp(b, b)).to.equal(h1, 'b commonAncestor b');
                        expect(commonAncestorNodesTemp(b, x)).to.equal(h1, 'b commonAncestor x');
                        expect(commonAncestorNodesTemp(x, b)).to.equal(h1, 'x commonAncestor b');
                        expect(commonAncestorNodesTemp(x, x)).to.equal(cite, 'x commonAncestor x');
                        expect(commonAncestorNodesTemp(e, b)).to.equal(root, 'e commonAncestor b');
                        expect(commonAncestorNodesTemp(b, e)).to.equal(root, 'b commonAncestor e');
                        expect(commonAncestorNodesTemp(e, c)).to.equal(root, 'e commonAncestor c');
                        expect(commonAncestorNodesTemp(c, e)).to.equal(root, 'c commonAncestor e');
                        expect(commonAncestorNodesTemp(e, d)).to.equal(p, 'e commonAncestor d');
                        expect(commonAncestorNodesTemp(e, p)).to.equal(p, 'e commonAncestor p');
                        expect(commonAncestorNodesTemp(p, e)).to.equal(p, 'p commonAncestor e');
                        expect(commonAncestorNodesTemp(d, e)).to.equal(p, 'd commonAncestor e');
                        expect(commonAncestorNodesTemp(e, f)).to.equal(pp, 'e commonAncestor f');
                        expect(commonAncestorNodesTemp(f, e)).to.equal(pp, 'f commonAncestor e');
                        expect(commonAncestorNodesTemp(a2, root2)).to.equal(
                            root2,
                            'a2 commonAncestor root2',
                        );
                        expect(commonAncestorNodesTemp(a, a2)).to.be.undefined;
                        expect(commonAncestorNodesTemp(f, e, FragmentNode)).to.equal(root);
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
                        expect(siblingsNodesTemp(h1)).to.deep.equal([a, c, p]);
                        expect(siblingsNodesTemp(h1, CharNode)).to.deep.equal([a, c]);
                        expect(siblingsNodesTemp(b)).to.deep.equal(
                            [],
                            'siblings without the markers',
                        );
                        expect(siblingsNodesTemp(root)).to.deep.equal([]);
                    });
                });
                describe('adjacents', () => {
                    it('should return the adjacent nodes', async () => {
                        expect(adjacentsNodeTemp(h1)).to.deep.equal([a, c, p]);
                        expect(adjacentsNodeTemp(h1, CharNode)).to.deep.equal([a, c]);
                        expect(adjacentsNodeTemp(b)).to.deep.equal(
                            [],
                            'siblings without the markers',
                        );
                        expect(adjacentsNodeTemp(root)).to.deep.equal([]);
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
                        expect(adjacentsNodeTemp(c)).to.deep.equal([a, h2, b, d, h3, e]);
                        expect(adjacentsNodeTemp(c, CharNode)).to.deep.equal([b, d]);
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
                        expect(previousSiblingNodeTemp(h1)).to.deep.equal(
                            a,
                            'h1.previousSibling = a',
                        );
                        expect(previousSiblingNodeTemp(p)).to.deep.equal(
                            c,
                            'p.previousSibling = c',
                        );
                        expect(previousSiblingNodeTemp(pp)).to.deep.equal(
                            d,
                            'pp.previousSibling = d',
                        );
                        expect(previousSiblingNodeTemp(f)).to.deep.equal(
                            e,
                            'f.previousSibling = e',
                        );
                    });
                    it('should return the previousSibling with predicate without result', async () => {
                        expect(previousSiblingNodeTemp(root)).to.deep.equal(undefined);
                        expect(previousSiblingNodeTemp(d)).to.deep.equal(undefined);
                        expect(
                            previousSiblingNodeTemp(root, () => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            previousSiblingNodeTemp(b, vNode => {
                                return vNode.id === marker1.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the previousSibling with predicate', async () => {
                        expect(
                            previousSiblingNodeTemp(p, vNode => {
                                return vNode.id === a.id;
                            }),
                        ).to.equal(a);
                    });
                });
                describe('nextSibling', () => {
                    it('should return the nextSibling', async () => {
                        expect(nextSiblingNodeTemp(h1)).to.deep.equal(c, 'h1.nextSibling = c');
                        expect(nextSiblingNodeTemp(d)).to.deep.equal(pp, 'd.nextSibling = pp');
                        expect(nextSiblingNodeTemp(e)).to.deep.equal(f, 'e.nextSibling = f');
                    });
                    it('should return the nextSibling with predicate without result', async () => {
                        expect(nextSiblingNodeTemp(root)).to.deep.equal(undefined);
                        expect(nextSiblingNodeTemp(pp)).to.deep.equal(undefined);
                        expect(
                            nextSiblingNodeTemp(root, () => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            nextSiblingNodeTemp(f, vNode => {
                                return vNode.id === marker2.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the nextSibling with predicate', async () => {
                        expect(
                            nextSiblingNodeTemp(h1, vNode => {
                                return vNode.id === p.id;
                            }),
                        ).to.equal(p);
                    });
                });
                describe('previous', () => {
                    it('should return the previous node', async () => {
                        expect(previousNodeTemp(h1)).to.deep.equal(a, 'h1.previous = a');
                        expect(previousNodeTemp(p)).to.deep.equal(c, 'p.previous = c');
                        expect(previousNodeTemp(pp)).to.deep.equal(d, 'pp.previous = d');
                        expect(previousNodeTemp(f)).to.deep.equal(e, 'f.previous = e');
                    });
                    it('should return the previous with predicate without result', async () => {
                        expect(previousNodeTemp(root)).to.deep.equal(undefined);
                        expect(
                            previousNodeTemp(root, () => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            previousNodeTemp(b, vNode => {
                                return vNode.id === marker1.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the previous with predicate', async () => {
                        expect(
                            previousNodeTemp(pp, vNode => {
                                return vNode.id === b.id;
                            }),
                        ).to.equal(b);
                    });
                });
                describe('next', () => {
                    it('should return the next', async () => {
                        expect(nextNodeTemp(root)).to.deep.equal(a, 'root.next = a');
                        expect(nextNodeTemp(h1)).to.deep.equal(b, 'h1.next = b');
                        expect(nextNodeTemp(d)).to.deep.equal(pp, 'd.next = pp');
                        expect(nextNodeTemp(e)).to.deep.equal(f, 'e.next = f');
                    });
                    it('should return the next with predicate without result', async () => {
                        expect(nextNodeTemp(f)).to.deep.equal(undefined);
                        expect(
                            nextNodeTemp(root, () => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            nextNodeTemp(a, vNode => {
                                return vNode.id === marker2.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the next with predicate', async () => {
                        expect(
                            nextNodeTemp(b, vNode => {
                                return vNode.id === e.id;
                            }),
                        ).to.equal(e);
                    });
                });
                describe('previousLeaf', () => {
                    it('should return the previousLeaf node', async () => {
                        expect(previousLeafNodeTemp(h1)).to.deep.equal(a, 'h1.previousLeaf = a');
                        expect(previousLeafNodeTemp(c)).to.deep.equal(b, 'c.previousLeaf = b');
                        expect(previousLeafNodeTemp(e)).to.deep.equal(d, 'e.previousLeaf = d');
                        expect(previousLeafNodeTemp(f)).to.deep.equal(e, 'f.previousLeaf = e');
                    });
                    it('should return the previousLeaf with predicate without result', async () => {
                        expect(previousLeafNodeTemp(root)).to.deep.equal(undefined);
                        expect(
                            previousLeafNodeTemp(root, () => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            previousLeafNodeTemp(b, vNode => {
                                return vNode.id === marker1.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the previousLeaf with predicate', async () => {
                        expect(
                            previousLeafNodeTemp(e, vNode => {
                                return vNode.id === b.id;
                            }),
                        ).to.equal(b);
                        expect(
                            previousLeafNodeTemp(e, vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.equal(d);
                    });
                });
                describe('nextLeaf', () => {
                    it('should return the nextLeaf node', async () => {
                        expect(nextLeafNodeTemp(root)).to.deep.equal(a, 'root.nextLeaf = a');
                        expect(nextLeafNodeTemp(h1)).to.deep.equal(b, 'h1.nextLeaf = b');
                        expect(nextLeafNodeTemp(c)).to.deep.equal(d, 'c.nextLeaf = d');
                        expect(nextLeafNodeTemp(b)).to.deep.equal(c, 'b.nextLeaf = c');
                    });
                    it('should return the nextLeaf with predicate without result', async () => {
                        expect(nextLeafNodeTemp(f)).to.deep.equal(undefined);
                        expect(
                            nextLeafNodeTemp(root, () => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            nextLeafNodeTemp(b, vNode => {
                                return vNode.id === marker1.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the nextLeaf with predicate', async () => {
                        expect(
                            nextLeafNodeTemp(b, vNode => {
                                return vNode.id === e.id;
                            }),
                        ).to.equal(e);
                        expect(
                            nextLeafNodeTemp(b, vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.equal(c);
                    });
                });
                describe('previousSiblings', () => {
                    it('should return the previousSiblings', async () => {
                        expect(previousSiblingsNodeTemp(h1)).to.deep.equal(
                            [a],
                            'h1.previousSiblings = [a]',
                        );
                        expect(previousSiblingsNodeTemp(p)).to.deep.equal(
                            [c, h1, a],
                            'p.previousSiblings = [c, h1, a]',
                        );
                        expect(previousSiblingsNodeTemp(pp)).to.deep.equal(
                            [d],
                            'pp.previousSiblings = [d]',
                        );
                        expect(previousSiblingsNodeTemp(f)).to.deep.equal(
                            [e],
                            'f.previousSiblings = [e]',
                        );
                    });
                    it('should return the previousSiblings with predicate without result', async () => {
                        expect(previousSiblingsNodeTemp(root)).to.deep.equal([]);
                        expect(previousSiblingsNodeTemp(d)).to.deep.equal([]);
                        expect(
                            previousSiblingsNodeTemp(root, () => {
                                return false;
                            }),
                        ).to.deep.equal([]);
                        expect(
                            previousSiblingsNodeTemp(b, vNode => {
                                return vNode.id === marker1.id;
                            }),
                        ).to.deep.equal([]);
                    });
                    it('should return the previousSiblings with predicate', async () => {
                        expect(
                            previousSiblingsNodeTemp(p, vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.deep.equal([c, a]);
                    });
                });
                describe('nextSiblings', () => {
                    it('should return the nextSiblings', async () => {
                        expect(nextSiblingsNodeTemp(h1)).to.deep.equal(
                            [c, p],
                            'h1.nextSiblings = [c, p]',
                        );
                        expect(nextSiblingsNodeTemp(d)).to.deep.equal(
                            [pp],
                            'd.nextSiblings = [pp]',
                        );
                        expect(nextSiblingsNodeTemp(e)).to.deep.equal([f], 'e.nextSiblings = [f]');
                    });
                    it('should return the nextSiblings with predicate without result', async () => {
                        expect(nextSiblingsNodeTemp(root)).to.deep.equal([]);
                        expect(nextSiblingsNodeTemp(pp)).to.deep.equal([]);
                        expect(
                            nextSiblingsNodeTemp(root, () => {
                                return false;
                            }),
                        ).to.deep.equal([]);
                        expect(
                            nextSiblingsNodeTemp(e, vNode => {
                                return vNode.id === marker2.id;
                            }),
                        ).to.deep.equal([]);
                    });
                    it('should return the nextSiblings with predicate', async () => {
                        expect(
                            previousSiblingsNodeTemp(p, vNode => {
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
                                const editable = domEngine.components.get('editable')[0];
                                const a = editable.firstLeaf();
                                const ancestors = ancestorsNodesTemp(a);
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
                                const editable = domEngine.components.get('editable')[0];
                                const a = editable.firstLeaf();
                                const ancestors = ancestorsNodesTemp(a, ancestor => {
                                    return (
                                        !isNodePredicate(ancestor, HeadingNode) ||
                                        ancestor.level !== 1
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
                                const editable = domEngine.components.get('editable')[0];
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
                                const editable = domEngine.components.get('editable')[0];
                                const descendants = editable.descendants(
                                    descendant =>
                                        !isNodePredicate(descendant, HeadingNode) ||
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
                        beforeNodeTemp(a, b);
                        const c = new CharNode({ char: 'c' });
                        beforeNodeTemp(a, c);
                        expect(siblingsNodesTemp(a)).to.deep.equal([b, c]);
                    });
                    it('should throw if no parent', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        expect(() => {
                            beforeNodeTemp(root, a);
                        }).to.throw();
                    });
                });
                describe('after', () => {
                    it('should insert after node', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const b = new CharNode({ char: 'b' });
                        afterNodeTemp(a, b);
                        const c = new CharNode({ char: 'c' });
                        afterNodeTemp(a, c);
                        expect(siblingsNodesTemp(a)).to.deep.equal([c, b]);
                    });
                    it('should move a node after another', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        root.append(a);
                        const b = new CharNode({ char: 'b' });
                        root.append(b);
                        const c = new CharNode({ char: 'c' });
                        root.append(c);
                        afterNodeTemp(b, a);
                        expect(siblingsNodesTemp(a)).to.deep.equal([b, c]);
                    });
                    it('should throw if no parent', async () => {
                        const root = new ContainerNode();
                        const a = new CharNode({ char: 'a' });
                        expect(() => {
                            afterNodeTemp(root, a);
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
                        expect(siblingsNodesTemp(a)).to.deep.equal([b, c]);
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
                        expect(siblingsNodesTemp(a)).to.deep.equal([c, b]);
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
                        expect(siblingsNodesTemp(a)).to.deep.equal([b, c]);
                        removeNodeTemp(b);
                        expect(siblingsNodesTemp(a)).to.deep.equal([c]);
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
                        expect(siblingsNodesTemp(a)).to.deep.equal([b, c]);
                        root.removeChild(b);
                        expect(siblingsNodesTemp(a)).to.deep.equal([c]);
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
                        expect(nextSiblingNodeTemp(p).children()).to.deep.equal([b, c]);
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
                        expect(nextSiblingNodeTemp(p).childVNodes.slice()).to.deep.equal([
                            b,
                            marker2,
                            c,
                        ]);
                    });
                    it('should not break fragment', async () => {
                        const root = new FragmentNode();
                        const p = new VElement({ htmlTag: 'P' });
                        root.append(p);
                        expect(root.childVNodes.slice()).to.deep.equal([p]);
                        expect(root.parent).to.be.undefined;
                        root.splitAt(p);
                        expect(root.childVNodes.slice()).to.deep.equal([p]);
                        expect(root.parent).to.be.undefined;
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
                    const editable = domEngine.components.get('editable')[0];
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
