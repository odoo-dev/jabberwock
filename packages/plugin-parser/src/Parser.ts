import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { ParsingEngine, ParserConstructor, ParsingEngineConstructor } from './ParsingEngine';
import { Plugins } from '../../core/src/JWEditor';

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
            // Register parsers from previously loaded plugins as that
            // could not be done earlier without the parsing engine.
            const plugins: Plugins<Parser> = this.editor.plugins.values();
            for (const plugin of plugins) {
                if (plugin.loadables.parsers) {
                    const parsers = [...plugin.loadables.parsers].reverse();
                    for (const ParserClass of parsers) {
                        if (ParserClass.id === id) {
                            engine.register(ParserClass);
                        }
                    }
                }
            }
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
