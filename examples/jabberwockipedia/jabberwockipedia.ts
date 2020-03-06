import { BasicEditor } from '../../bundles/BasicEditor';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { Dom } from '../../packages/plugin-dom/src/Dom';

const editor = new BasicEditor();
editor.configure(Dom, { target: document.getElementById('example') });
editor.loadPlugin(DevTools);
editor.start();
