import JWEditor from '../../src/core/JWEditor';
import { jabberwocky } from '../utils/jabberwocky';
import './index.css';

const editor = new JWEditor();
jabberwocky.init(editor.editable);

editor.loadConfig({
    debug: true,
});

editor.start();
