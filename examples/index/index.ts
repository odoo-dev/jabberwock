import { BasicEditor } from '../../bundles/BasicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import './index.css';

const editor = new BasicEditor();

editor.loadConfig({
    debug: true,
});


document.body.appendChild(editor.el);
editor.start(jabberwocky.init());
