import JWEditor from './core/JWEditor';
import { Awesome } from './plugins/Awesome';

const editor = new JWEditor(document.querySelector('jw-editor'));
editor.addPlugin(Awesome);
editor.loadConfig({
    theme: 'CoolTheme',
});
editor.start();
