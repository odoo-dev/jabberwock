import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { ParsingEngine } from '../../core/src/ParsingEngine';
import { ParserConstructor } from '../../core/src/ParsingEngine';
import { Plugins } from '../../core/src/JWEditor';

interface ParsingEngines {
    readonly parsingEngines?: Array<typeof ParsingEngine>;
}

interface Parsers {
    readonly parsers?: ParserConstructor[];
}

export class Parser<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly loaders = {
        parsingEngines: this.loadParsingEngines.bind(this),
        parsers: this.loadParsers.bind(this),
    };
    readonly engines: Record<string, ParsingEngine> = {};

    loadParsingEngines(parsingEngines: Array<typeof ParsingEngine>): void {
        for (const EngineClass of parsingEngines) {
            const id = EngineClass.id;
            if (this.engines[id]) {
                throw new Error(`Rendering engine ${id} already registered.`);
            }
            const engine = new EngineClass(this.editor);
            this.engines[id] = engine;
            // Register parsers from previously loaded plugins as that
            // could not be done earlier without the parsing engine.
            const plugins: Plugins<Parsers> = this.editor.plugins.values();
            for (const plugin of plugins) {
                if (plugin.parsers) {
                    for (const ParserClass of plugin.parsers) {
                        if (ParserClass.id === id) {
                            engine.register(ParserClass);
                        }
                    }
                }
            }
        }
    }

    loadParsers(parsers: ParserConstructor[]): void {
        for (const ParserClass of parsers) {
            const parsingEngine = this.engines[ParserClass.id];
            if (parsingEngine) {
                parsingEngine.register(ParserClass);
            }
        }
    }
}
