import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { ParsingEngine, ParserConstructor, ParsingEngineConstructor } from './ParsingEngine';
import { VNode } from '../../core/src/VNodes/VNode';

export class Parser<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly engines: Record<string, ParsingEngine> = {};
    readonly loaders = {
        parsingEngines: this.loadParsingEngines,
        parsers: this.loadParsers,
    };

    async parse(engineId: string, ...items): Promise<VNode[]> {
        return this.engines[engineId].parse(...items);
    }

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
            for (const id in this.engines) {
                const parsingEngine = this.engines[id];
                const supportedTypes = [id, ...parsingEngine.constructor.extends];
                if (supportedTypes.includes(ParserClass.id)) {
                    parsingEngine.register(ParserClass);
                }
            }
        }
    }
}
