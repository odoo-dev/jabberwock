import { BasicEditor } from '../../bundles/BasicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import './jabberwocky.css';

const editor = new BasicEditor();
jabberwocky.init(editor.editable);

editor.editable.style.textAlign = 'center';

editor.addPlugin(DevTools);

editor.loadConfig({
    autoFocus: true,
});

editor.start();
