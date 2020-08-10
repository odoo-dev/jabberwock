import { BasicEditor } from '../../packages/bundle-basic-editor/BasicEditor';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { Table } from '../../packages/plugin-table/src/Table';

import '../../packages/plugin-toolbar/assets/Toolbar.css';
import '../utils/fontawesomeAssets';

const target = document.getElementById('example');
const editor = new BasicEditor({ editable: target });
editor.load(DevTools);
editor.configure(Table, {
    inlineUI: true,
});
editor.start();
