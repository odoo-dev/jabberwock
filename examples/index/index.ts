import { BasicEditor } from '../../bundles/BasicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import './index.css';

const editor = new BasicEditor();
jabberwocky.init(editor.editable);

editor.loadConfig({
    autoFocus: true,
    debug: true,
});

editor.start();
