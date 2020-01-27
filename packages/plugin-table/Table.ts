import { JWPlugin } from '../core/src/JWPlugin';
import { TableDomParser } from './TableDomParser';

export class Table extends JWPlugin {
    readonly parsers = [TableDomParser];
}
