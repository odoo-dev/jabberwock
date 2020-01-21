import { BasicEditor } from '../../bundles/BasicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import './index.css';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';

const editor = new BasicEditor();
jabberwocky.init(editor.editable);

editor.addPlugin(DevTools);

editor.loadConfig({
    autoFocus: true,
});

editor.start();
