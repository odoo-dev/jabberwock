import basicEditor from '../../packages/bundles/basicEditor';
import { jabberwocky } from '../utils/jabberwocky';
import './index.css';

jabberwocky.init(basicEditor.editable);

basicEditor.loadConfig({
    debug: true,
});

basicEditor.start();
