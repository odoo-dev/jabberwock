import { BasicEditor } from '../../bundles/BasicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import './index.css';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { ToolbarTop } from '../../packages/plugin-toolbar/src/ToolbarTop';
import { Indent } from '../../packages/plugin-indent/src/Indent';

const editor = new BasicEditor();
jabberwocky.init(editor.editable);

editor.loadConfig({
    autoFocus: true,
    plugins: [DevTools, ToolbarTop, Indent],
});

editor.start();
