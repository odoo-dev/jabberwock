import { expect } from 'chai';
import { TestEnvironment } from '../../../src/core/utils/TestUtils';
import template from './renderer.test.template.xml';

let env: TestEnvironment;

describe('Renderer', () => {
    before(() => {
        env = new TestEnvironment(template);
    });
    after(() => {
        env.destroy();
    });
    describe('VNode -> HTML', () => {
        // todo: unskip
        it.skip('should render the template exactly with no format space', () => {
            const templateNoSpace: string = template
                .split('\n')
                .map(item => {
                    return item.replace(/\s*/, '').replace(/<br\/>/g, '<br>');
                })
                .join('');
            expect(env.editable.innerHTML).to.equal(templateNoSpace);
        });
        // todo: remove (we don't merge formats yet but we should eventually)
        it('should render the template with no format space (and unmerged formats)', () => {
            const templateNoSpaceButFormats = [
                '<h1>Title</h1>',
                '<h2>Subtitle</h2>',
                '<p>Paragraph</p>',
                '<p>',
                '<i>Some italic text<br></i>',
                '<i>New line<br></i><i><br></i>',
                '<i>New fake paragraph</i>',
                '</p>',
            ].join('');
            expect(env.editable.innerHTML).to.equal(templateNoSpaceButFormats);
        });
    });
    describe('Range', () => {
        it('should initialize on top of the editor', () => {
            expect(env.root).to.have.length.be.at.least(2);
            const testRange = env.createTestRange({
                startPath: [],
                startOffset: 0,
                onLeaf: true,
            });
            env.testRange(testRange);
        });
        describe('Rerange on click (collapsed range)', () => {
            it('should rerange to start of node', async () => {
                const testRange = env.createTestRange({
                    startPath: [1], // H2
                    startOffset: 0,
                });
                await env.setRange(testRange.range);
                env.testRange(testRange);
            });
            it('should rerange within of node', async () => {
                const testRange = env.createTestRange({
                    startPath: [1, 0], // 'Subtitle'
                    startOffset: 3, // after 'Sub'
                });
                await env.setRange(testRange.range);
                env.testRange(testRange);
            });
            it('should rerange to end of node', async () => {
                const testRange = env.createTestRange({
                    startPath: [1, 0], // 'Subtitle'
                    startOffset: 8, // after 'Subtitle'
                });
                await env.setRange(testRange.range);
                env.testRange(testRange);
            });
        });
        describe('Rerange on forward selection', () => {
            it('should rerange cross elements', async () => {
                const testRange = env.createTestRange({
                    startPath: [1, 0], // 'Subtitle'
                    startOffset: 3, // after 'Sub'
                    endPath: [2, 0], // 'Paragraph'
                    endOffset: 4, // after 'Para'
                });
                await env.setRange(testRange.range);
                env.testRange(testRange);
            });
            it('should rerange cross line break', async () => {
                // TODO: adapt endPath once format nodes are merged
                const testRange = env.createTestRange({
                    startPath: [3, 0, 0], // 'Some italic text'
                    startOffset: 12, // before 'text'
                    endPath: [3, 1, 0], // 'New line'
                    endOffset: 3, // after 'New'
                });
                await env.setRange(testRange.range);
                env.testRange(testRange);
            });
        });
        describe('Rerange on backward selection', () => {
            it('should rerange cross elements', async () => {
                const testRange = env.createTestRange(
                    {
                        startPath: [1, 0], // 'Subtitle'
                        startOffset: 3, // after 'Sub'
                        endPath: [2, 0], // 'Paragraph'
                        endOffset: 4, // after 'Para'
                    },
                    true,
                );
                await env.setRange(testRange.range, true);
                env.testRange(testRange);
            });
            it('should rerange cross line break', async () => {
                // TODO: adapt endPath once format nodes are merged
                const testRange = env.createTestRange(
                    {
                        startPath: [3, 0, 0], // 'Some italic text'
                        startOffset: 12, // before 'text'
                        endPath: [3, 1, 0], // 'New line'
                        endOffset: 3, // after 'New'
                    },
                    true,
                );
                await env.setRange(testRange.range, true);
                env.testRange(testRange);
            });
        });
    });
});
