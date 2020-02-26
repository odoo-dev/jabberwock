import { BasicEditor } from '../../bundles/BasicEditor';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { Dom } from '../../packages/plugin-dom/Dom';
import template from './demo.xml';
import './demo.css';

const editor = new BasicEditor();

editor.editable.innerHTML = template;

editor.loadPlugin(DevTools);

editor.configure(Dom, {
    autoFocus: true,
});

editor.start();
