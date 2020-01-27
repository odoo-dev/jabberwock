import { JWPlugin } from '../core/src/JWPlugin';
import { MetadataDomParser } from './MetadataDomParser';

export class Metadata extends JWPlugin {
    readonly parsers = [MetadataDomParser];
    // TODO: render contents
}
