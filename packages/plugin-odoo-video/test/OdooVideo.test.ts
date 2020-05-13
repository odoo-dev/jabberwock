import { OdooVideo } from '../src/OdooVideo';
import { describePlugin } from '../../utils/src/testUtils';

describePlugin(OdooVideo, testEditor => {
    describe('parser/parser', () => {
        it('should parse and render an Odoo video', async () => {
            await testEditor({
                contentBefore:
                    '<div class="media_iframe_video" data-oe-expression="//www.youtube.com/embed/-V1cAiPDShc?autoplay=0&rel=0"></div>',
                contentAfter: [
                    '<div class="media_iframe_video" data-oe-expression="//www.youtube.com/embed/-V1cAiPDShc?autoplay=0&amp;rel=0">',
                    '<div class="css_editable_mode_display">&nbsp;</div>',
                    '<div class="media_iframe_video_size">&nbsp;</div>',
                    '<iframe src="//www.youtube.com/embed/-V1cAiPDShc?autoplay=0&amp;rel=0" frameborder="0" allowfullscreen="allowfullscreen"></iframe></div>',
                ].join(''),
            });
        });
    });
});
