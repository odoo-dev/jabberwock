import JWEditor from '../../src/core/JWEditor';
import { jabberwocky } from '../utils/jabberwocky';

const editor = new JWEditor();
jabberwocky.init(editor.editable);

editor.loadConfig({
    theme: 'CoolTheme',
});

editor.start();
