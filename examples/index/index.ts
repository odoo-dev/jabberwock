import JWEditor from '../../src/core/JWEditor';
import { Awesome } from '../../src/plugins/Awesome';
import { jabberwocky } from '../utils/jabberwocky';

const editor = new JWEditor();
jabberwocky.init(editor.editable);

editor.addPlugin(Awesome);
editor.loadConfig({
    theme: 'CoolTheme',
});

editor.start();
