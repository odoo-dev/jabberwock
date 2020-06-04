import { Modifier } from '../src/Modifier';
import { expect } from 'chai';
import { AtomicNode } from '../src/VNodes/AtomicNode';
import { ContainerNode } from '../src/VNodes/ContainerNode';
import { FragmentNode } from '../src/VNodes/FragmentNode';
import { MarkerNode } from '../src/VNodes/MarkerNode';
import { SeparatorNode } from '../src/VNodes/SeparatorNode';

describe('core', () => {
    describe('Modifier', () => {
        describe('name', () => {
            it('should have a blank name', () => {
                expect(new Modifier().name).to.equal('');
            });
        });
        describe('toString()', () => {
            it('should have a blank toString', () => {
                expect(new Modifier().toString()).to.equal('');
            });
        });
        describe('applyTo', () => {
            it('should apply modifiers to an AtomicNode', () => {
                const m1 = new Modifier();
                const m2 = new Modifier();
                const node = new AtomicNode();
                expect(node.modifiers.length).to.equal(0);
                m1.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m1]);
                m2.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m2, m1]);
                m1.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m1, m2, m1]);
            });
            it('should apply modifiers to a ContainerNode', () => {
                const m1 = new Modifier();
                const m2 = new Modifier();
                const node = new ContainerNode();
                expect(node.modifiers.length).to.equal(0);
                m1.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m1]);
                m2.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m2, m1]);
                m1.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m1, m2, m1]);
            });
            it('should apply modifiers to a FragmentNode', () => {
                const m1 = new Modifier();
                const m2 = new Modifier();
                const node = new FragmentNode();
                expect(node.modifiers.length).to.equal(0);
                m1.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m1]);
                m2.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m2, m1]);
                m1.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m1, m2, m1]);
            });
            it('should apply modifiers to a MarkerNode', () => {
                const m1 = new Modifier();
                const m2 = new Modifier();
                const node = new MarkerNode();
                expect(node.modifiers.length).to.equal(0);
                m1.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m1]);
                m2.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m2, m1]);
                m1.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m1, m2, m1]);
            });
            it('should apply modifiers to a SeparatorNode', () => {
                const m1 = new Modifier();
                const m2 = new Modifier();
                const node = new SeparatorNode();
                expect(node.modifiers.length).to.equal(0);
                m1.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m1]);
                m2.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m2, m1]);
                m1.applyTo(node);
                expect(node.modifiers.filter(() => true)).to.deep.equal([m1, m2, m1]);
            });
        });
        describe('isSameAs', () => {
            it('should find that a modifier is the same as itself', () => {
                const modifier = new Modifier();
                expect(modifier.isSameAs(modifier)).to.be.true;
            });
            it('should find that a modifier is not the same as another', () => {
                const m1 = new Modifier();
                const m2 = new Modifier();
                expect(m1.isSameAs(m2)).to.be.false;
            });
        });
        describe('clone', () => {
            it('should clone a modifier', () => {
                const modifier = new Modifier();
                const clone = modifier.clone();
                expect(clone instanceof Modifier).to.be.true;
                expect(clone).to.eql(modifier);
                expect(clone).not.to.equal(modifier);
            });
        });
    });
});
