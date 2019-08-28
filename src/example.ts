import JWEditor from './core/JWEditor';
import { Awesome } from './plugins/Awesome';
import { DevTools } from './plugins/DevTools/DevTools';

const editor = new JWEditor(document.querySelector('jw-editor'));
editor.addPlugin(Awesome);
editor.addPlugin(DevTools);
editor.loadConfig({
    theme: 'CoolTheme',
});
editor.start();
