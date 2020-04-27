import { expect } from 'chai';
import { describePlugin } from '../../utils/src/testUtils';
import { Youtube } from '../src/Youtube';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import JWEditor from '../../core/src/JWEditor';
import { YoutubeXmlDomParser } from '../src/YoutubeXmlDomParser';

describePlugin(Youtube, () => {
    describe('parser', () => {
        it('should parse a youtube video', async () => {
            const editor = new JWEditor();
            const engine = new XmlDomParsingEngine(editor);
            engine.register(YoutubeXmlDomParser);
            const element = document.createElement('div');
            element.innerHTML =
                '<iframe src="https://www.youtube-nocookie.com/embed/Ih8K2SKHJPI?start=15"></iframe>';
            const node = (await engine.parse(element))[0];
            expect(node.children().length).to.equal(1);
            expect(node.children()[0].toString()).to.equal('YoutubeNode');
            expect(node.children()[0].attributes).to.deep.equal({
                src: 'https://www.youtube-nocookie.com/embed/Ih8K2SKHJPI?start=15',
            });
        });
    });
});
