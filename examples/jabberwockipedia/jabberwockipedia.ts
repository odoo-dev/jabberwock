import { BasicEditor } from '../../packages/bundle-basic-editor/BasicEditor';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { DomLayout } from '../../packages/plugin-dom-layout/src/DomLayout';
import { DomEditable } from '../../packages/plugin-dom-editable/src/DomEditable';

const editor = new BasicEditor();
const target = document.getElementById('example');
editor.configure(DomLayout, { location: [target, 'replace'] });
editor.configure(DomEditable, { source: target });
editor.load(DevTools);
editor.start();
