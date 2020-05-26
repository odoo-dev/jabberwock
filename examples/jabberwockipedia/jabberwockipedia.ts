import { BasicEditor } from '../../bundles/BasicEditor';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';

const target = document.getElementById('example');
const editor = new BasicEditor({ editable: target });
editor.load(DevTools);
editor.start();
