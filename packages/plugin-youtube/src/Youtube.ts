import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import JWEditor from '../../core/src/JWEditor';
import { YoutubeNode } from './VNodes/YoutubeNode';

export class Youtube extends JWPlugin {
    constructor(editor: JWEditor, options: JWPluginConfig = {}) {
        super(editor, options);
        this.editor.addCustomNode(YoutubeNode);
    }
}
