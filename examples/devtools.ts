import JWEditor from '../src/core/JWEditor';
import { OwlUI } from '../src/ui/OwlUI';
import { DevTools } from '../src/plugins/DevTools/DevTools';
import { Awesome } from '../src/plugins/Awesome';

const editor = new JWEditor(document.querySelector('jw-editor'));
const ui = new OwlUI(editor);
editor.addPlugin(Awesome);
ui.addPlugin(DevTools);
editor.loadConfig({
    theme: 'CoolTheme',
});
editor.start();
