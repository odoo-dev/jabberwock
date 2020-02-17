import { BasicEditor } from '../../bundles/BasicEditor';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import template from './demo.xml';
import './demo.css';

const editor = new BasicEditor();

editor.editable.innerHTML = template;

editor.addPlugin(DevTools);

editor.loadConfig({
    autoFocus: true,
});

editor.start();
