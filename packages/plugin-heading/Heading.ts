import { JWPlugin } from '../core/src/JWPlugin';
import { HeadingDomParser } from './HeadingDomParser';

export class Heading extends JWPlugin {
    readonly parsers = [HeadingDomParser];
}
