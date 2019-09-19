import JWEditor from '../../src/core/JWEditor';
import { OwlUI } from '../../src/ui/OwlUI';
import { DevTools } from '../../src/plugins/DevTools/DevTools';
import { jabberwocky } from '../utils/jabberwocky';
import '../../src/plugins/DevTools/DevTools.css';

const editor = new JWEditor();
jabberwocky.init(editor.editable);
editor.loadConfig({
    theme: 'CoolTheme',
});
editor.start();

const ui = new OwlUI(editor);
ui.addPlugin(DevTools);
