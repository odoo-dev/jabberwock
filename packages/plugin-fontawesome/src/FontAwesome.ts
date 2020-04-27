import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { FontAwesomeXmlDomParser } from './FontAwesomeXmlDomParser';
import { FontAwesomeHtmlDomRenderer } from './FontAwesomeHtmlDomRenderer';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import '!style-loader!css-loader!@fortawesome/fontawesome-free/css/all.css';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-brands-400.woff';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-brands-400.woff2';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-brands-400.ttf';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-regular-400.woff2';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-regular-400.ttf';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2';
import '!file-loader?name=./fonts/[name].[ext]!@fortawesome/fontawesome-free/webfonts/fa-solid-900.ttf';

export class FontAwesome<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [FontAwesomeXmlDomParser],
        renderers: [FontAwesomeHtmlDomRenderer],
    };
}
