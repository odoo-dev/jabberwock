import { BasicEditor } from '../../bundles/BasicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { Dom } from '../../packages/plugin-dom/src/Dom';
import './jabberwocky.css';

const target = document.createElement('div');
target.style.textAlign = 'center';
jabberwocky.init(target);

const editor = new BasicEditor();
editor.load(DevTools);
editor.configure(Dom, {
    autoFocus: true,
    target: target,
});

editor.start();
