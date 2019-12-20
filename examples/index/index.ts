import basicEditor from '../../packages/bundles/basicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import { MarkdownRenderer } from '../../packages/plugin-markdownrenderer/src/MarkdownRenderer';
import './index.css';

jabberwocky.init(basicEditor.editable);

basicEditor.loadConfig({
    debug: true,
    renderTo: 'markdown',
});

basicEditor.addPlugin(MarkdownRenderer);

basicEditor.start();
