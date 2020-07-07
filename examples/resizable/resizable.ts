import { BasicEditor } from '../../packages/bundle-basic-editor/BasicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import '../utils/jabberwocky.css';
import { DomLayout } from '../../packages/plugin-dom-layout/src/DomLayout';
import { Resizer } from '../../packages/plugin-resizer/src/Resizer';

import '../utils/fontawesomeAssets';

const target = document.getElementById('contentToEdit');
jabberwocky.init(target);

const editor = new BasicEditor({ editable: target });
editor.configure(DomLayout, {
    location: [target, 'replace'],
});

editor.load(Resizer);
editor.start();
