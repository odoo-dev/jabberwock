import { BasicEditor } from '../../bundles/BasicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import './index.css';
import { CodeView } from '../../packages/plugin-codeView/CodeView';

const editor = new BasicEditor();

editor.loadConfig({
    debug: true,
});

editor.addPlugin(CodeView);

document.body.appendChild(editor.el);
editor.start(jabberwocky.init());
