import { BasicEditor } from '../../bundles/BasicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { Dom } from '../../packages/plugin-dom/src/Dom';
import './jabberwocky.css';

const editor = new BasicEditor();
jabberwocky.init(editor.editable);

editor.editable.style.textAlign = 'center';

editor.loadPlugin(DevTools);

editor.configure(Dom, {
    autoFocus: true,
});

editor.start();
