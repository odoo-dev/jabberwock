import JWEditor from '../../packages/core/src/JWEditor';
import { jabberwocky } from '../utils/jabberwocky';
import { Youtube } from '../../packages/plugin-youtube/src/Youtube';
import './index.css';

const editor = new JWEditor();
jabberwocky.init(editor.editable);

editor.loadConfig({
    debug: true,
});

editor.addPlugin(Youtube);

editor.start();
