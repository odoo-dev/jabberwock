import JWEditor from '../../src/core/JWEditor';
import { Awesome } from '../../src/plugins/Awesome';
import { DevTools } from '../../src/plugins/DevTools/DevTools';
const editor = new JWEditor(document.querySelector('jw-editor'));
// editor.addPlugin(Awesome);
// editor.addPlugin(DevTools);
// editor.loadConfig({
//     theme: 'CoolTheme',
// });
editor.start();
