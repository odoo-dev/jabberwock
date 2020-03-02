import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { ParsingEngine, ParserConstructor, ParsingEngineConstructor } from './ParsingEngine';

export class Parser<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly engines: Record<string, ParsingEngine> = {};
    readonly loaders = {
        parsingEngines: this.loadParsingEngines,
        parsers: this.loadParsers,
    };

    loadParsingEngines(parsingEngines: ParsingEngineConstructor[]): void {
        for (const EngineClass of parsingEngines) {
            const id = EngineClass.id;
            if (this.engines[id]) {
                throw new Error(`Rendering engine ${id} already registered.`);
            }
            const engine = new EngineClass(this.editor);
            this.engines[id] = engine;
        }
    }

    loadParsers(parsers: ParserConstructor[]): void {
        parsers = [...parsers].reverse();
        for (const ParserClass of parsers) {
            const parsingEngine = this.engines[ParserClass.id];
            if (parsingEngine) {
                parsingEngine.register(ParserClass);
            }
        }
    }
}
