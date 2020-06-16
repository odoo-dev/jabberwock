import { BasicEditor } from '../../packages/bundle-basic-editor/BasicEditor';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';

import '../utils/fontawesomeAssets';

const target = document.getElementById('example');
const editor = new BasicEditor({ editable: target });
editor.load(DevTools);
editor.start();
