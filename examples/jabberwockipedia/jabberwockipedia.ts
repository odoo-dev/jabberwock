import { BasicEditor } from '../../bundles/BasicEditor';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';

const editor = new BasicEditor(document.getElementById('example'));
editor.loadPlugin(DevTools);
editor.start();
