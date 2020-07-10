import { Parser } from './../../plugin-parser/src/Parser';
import { Loadables } from '../../core/src/JWEditor';
import { JWPluginConfig, JWPlugin } from '../../core/src/JWPlugin';
import { TextareaXmlDomParser } from './TextareaXmlDomParser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { TextareaDomObjectRenderer } from './TextareaDomObjectRenderer';

export class Textarea<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [TextareaXmlDomParser],
        renderers: [TextareaDomObjectRenderer],
    };
}
