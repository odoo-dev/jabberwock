import { BasicEditor } from './../../bundles/BasicEditor';
import './index.css';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { Indent } from '../../packages/plugin-indent/src/Indent';
import listTemplate from './list-example.xml';

const editor = new BasicEditor();

editor.editable.innerHTML = listTemplate;

editor.addPlugin(Indent);
editor.addPlugin(DevTools);

editor.loadConfig({
    autoFocus: true,
});

editor.start();
