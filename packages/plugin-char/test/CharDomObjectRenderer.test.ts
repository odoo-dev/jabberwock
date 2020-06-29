import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { Char } from '../src/Char';
import { CharNode } from '../src/CharNode';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { VNode } from '../../core/src/VNodes/VNode';

describe('CharDomObjectRenderer', () => {
    describe('render', () => {
        let editor: JWEditor;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.load(DomLayout);
            editor.load(Char);
            await editor.start();
        });
        afterEach(async () => {
            await editor.stop();
        });
        describe('spaces', () => {
            it('should insert 1 space and 1 nbsp instead of 2 spaces', async () => {
                const root = new ContainerNode();
                const char = new CharNode({ char: 'a' });
                root.append(char);
                root.append(new CharNode({ char: ' ' }));
                root.append(new CharNode({ char: ' ' }));
                root.append(new CharNode({ char: 'b' }));

                const renderer = editor.plugins.get(Renderer);
                const engine = renderer.engines['object/html'] as DomObjectRenderingEngine;
                const cache = await engine.render(root.childVNodes);
                const rendered = cache.renderings.get(char);
                expect(rendered).to.deep.equal({ text: 'a \u00A0b' });

                const locations = cache.locations as Map<DomObject, VNode[]>;
                expect(rendered && locations.get(rendered)).to.deep.equal(root.childVNodes);
            });
            it('should insert 2 spaces and 2 nbsp instead of 4 spaces', async () => {
                const root = new ContainerNode();
                const char = new CharNode({ char: 'a' });
                root.append(char);
                root.append(new CharNode({ char: ' ' }));
                root.append(new CharNode({ char: ' ' }));
                root.append(new CharNode({ char: ' ' }));
                root.append(new CharNode({ char: ' ' }));
                root.append(new CharNode({ char: 'b' }));

                const renderer = editor.plugins.get(Renderer);
                const engine = renderer.engines['object/html'] as DomObjectRenderingEngine;
                const cache = await engine.render(root.childVNodes);
                const rendered = cache.renderings.get(char);
                expect(rendered).to.deep.equal({ text: 'a \u00A0 \u00A0b' });

                const locations = cache.locations as Map<DomObject, VNode[]>;
                expect(rendered && locations.get(rendered)).to.deep.equal(root.children());
            });
        });
    });
});
