import JWEditor from './src/core/JWEditor';
import Awesome from './src/plugins/Awesome';

const editor = JWEditor(document.querySelector('jw-editor'));
editor.addPlugin(Awesome);
editor.loadConfig({
    theme: 'CoolTheme',
});
editor.start();
