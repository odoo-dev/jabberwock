import { DefaultDomObjectRenderer } from '../../plugin-renderer-dom-object/src/DefaultDomObjectRenderer';
import { MailObjectRenderingEngine } from './MailObjectRenderingEngine';

export class DefaultMailObjectRenderer extends DefaultDomObjectRenderer {
    static id = 'object/mail';
    engine: MailObjectRenderingEngine;
}
