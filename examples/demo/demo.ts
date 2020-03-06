import { BasicEditor } from '../../bundles/BasicEditor';
import { DevTools } from '../../packages/plugin-devtools/src/DevTools';
import { Dom } from '../../packages/plugin-dom/src/Dom';
import template from './demo.xml';
import './demo.css';

const target = document.createElement('div');
target.innerHTML = template;

const editor = new BasicEditor();
editor.loadPlugin(DevTools);
editor.configure(Dom, {
    autoFocus: true,
    target: target,
});

editor.start();
