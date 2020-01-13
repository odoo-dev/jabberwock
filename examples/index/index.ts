import { createBasicEditor } from '../../packages/bundles/basic';
import { jabberwocky } from '../utils/jabberwocky';
import './index.css';

const editor = createBasicEditor();
jabberwocky.init(editor.editable);

editor.loadConfig({
    debug: true,
});

editor.start();
