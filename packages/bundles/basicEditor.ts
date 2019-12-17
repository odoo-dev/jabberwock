import JWEditor from '../core/src/JWEditor';
import { Char } from '../plugin-char/src/Char';
import { LineBreak } from '../plugin-linebreak/src/LineBreak';
import { Range } from '../plugin-range/src/Range';
import { Format } from '../plugin-format/src/Format';

const basicEditor = new JWEditor();
basicEditor.addPlugin(Char, Format, LineBreak, Range);
export default basicEditor;
