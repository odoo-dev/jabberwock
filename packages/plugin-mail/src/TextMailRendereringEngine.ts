import { HtmlTextRendereringEngine } from '../../plugin-html/src/HtmlTextRendereringEngine';
import { MailObjectRenderingEngine } from './MailObjectRenderingEngine';

export class TextMailRendereringEngine extends HtmlTextRendereringEngine {
    static id = 'text/mail';
    protected correspondingObjectRenderingId = MailObjectRenderingEngine.id;
}
