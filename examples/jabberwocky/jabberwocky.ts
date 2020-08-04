import { BasicEditor } from '../../packages/bundle-basic-editor/BasicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import '../utils/jabberwocky.css';
import { DomLayout } from '../../packages/plugin-dom-layout/src/DomLayout';

import '../../packages/plugin-toolbar/assets/Toolbar.css';
import '../utils/fontawesomeAssets';

const target = document.getElementById('contentToEdit');
target.style.textAlign = 'center';
jabberwocky.init(target);

const editor = new BasicEditor({ editable: target });
editor.configure(DomLayout, {
    location: [target, 'replace'],
});
editor.load(DevTools);

editor.start();
