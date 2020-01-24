/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import { reprForTests, parseTestingDOM } from '../../utils/src/testUtils';

describe('utils', () => {
    describe('Parser', () => {
        describe('parse()', () => {
            it('should parse a "p" tag with some content', () => {
                const vDocument = parseTestingDOM('<p>a</p>');
                expect(reprForTests(vDocument.root)).to.equal(
                    ['FragmentNode', '    VElement: P', '        CharNodeTest: a'].join('\n') +
                        '\n',
                );
            });
            it('should parse a "p" tag with no content', () => {
                const vDocument = parseTestingDOM('<p><br></p>');
                expect(reprForTests(vDocument.root)).to.equal(
                    ['FragmentNode', '    VElement: P', '        VElement: BR'].join('\n') + '\n',
                );
            });
            it('should parse two trailing consecutive <br> as one LINE_BREAK', () => {
                const vDocument = parseTestingDOM('<p>a<br><br>');
                expect(reprForTests(vDocument.root)).to.equal(
                    [
                        'FragmentNode',
                        '    VElement: P',
                        '        CharNodeTest: a',
                        '        VElement: BR',
                        '        VElement: BR',
                    ].join('\n') + '\n',
                );
            });
            it('handles nested formatted nodes', () => {
                const vDocument = parseTestingDOM('<p>a<i>b<b>c</b>d</i></p>');
                expect(reprForTests(vDocument.root)).to.equal(
                    [
                        'FragmentNode',
                        '    VElement: P',
                        '        CharNodeTest: a',
                        '        CharNodeTest: b {italic}',
                        '        CharNodeTest: c {bold,italic}',
                        '        CharNodeTest: d {italic}',
                    ].join('\n') + '\n',
                );
            });
        });
    });
});
