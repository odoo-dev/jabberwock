import JWEditor from '../../packages/core/src/JWEditor';
import { jabberwocky } from '../utils/jabberwocky';
import './index.css';

const editor = new JWEditor();
jabberwocky.init(editor.editable);

// Example custom keymap extending the default keymap:
editor.keyMap.set('Ctrl+Alt+k', {
    name: 'insertText',
    arguments: { value: 'Do cats eat bats? Do bats eat cats?' },
});

editor.loadConfig({
    debug: true,
    // To add a complete custom keymap, add it here: `keyMap: keyMap`.
});

editor.start();
