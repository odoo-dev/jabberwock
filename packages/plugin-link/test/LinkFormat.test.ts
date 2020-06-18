import { describePlugin, testEditor, unformat } from '../../utils/src/testUtils';
import { Link } from '../src/Link';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { LinkFormat } from '../src/LinkFormat';
import { expect } from 'chai';
describePlugin(Link, () => {
    describe('LinkFormat', () => {
        describe('parsing/rendering', () => {
            it('should preserve attributes order when parsing/rendering a link', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: unformat(`
                <a href="#myurl1" class="myClass1" target="myTarget1">text1</a>
                <a class="myClass2" href="#myurl2" target="myTarget2">text2</a>
                <a target="myTarget3" href="#myurl3" class="myClass3">text3</a>
                <a target="myTarget4" class="myClass4" href="#myurl4">text3</a>
                    `),
                    contentAfter: unformat(`
                <a href="#myurl1" class="myClass1" target="myTarget1">text1</a>
                <a class="myClass2" href="#myurl2" target="myTarget2">text2</a>
                <a target="myTarget3" href="#myurl3" class="myClass3">text3</a>
                <a target="myTarget4" class="myClass4" href="#myurl4">text3</a>
                    `),
                });
            });
        });
        describe('clone()', () => {
            it('should clone the link with proper url', () => {
                const format = new LinkFormat('/url');
                expect(format.clone().url).to.eql('/url');
            });
        });
    });
});
