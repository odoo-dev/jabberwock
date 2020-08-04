import { InputNode } from './../../plugin-input/src/InputNode';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Layout } from '../../plugin-layout/src/Layout';
import JWEditor from '../../core/src/JWEditor';
import { FontSizeDomObjectRenderer } from './FontSizeDomObjectRenderer';
import { Input } from '../../plugin-input/src/Input';
import { CommandParams } from '../../core/src/Dispatcher';
import { VNode } from '../../core/src/VNodes/VNode';
import { CharNode } from '../../plugin-char/src/CharNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export interface FontSizeCommandParams extends CommandParams {
    value: number;
}

export class FontSize<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Input];
    readonly loadables: Loadables<Parser & Renderer & Layout> = {
        renderers: [FontSizeDomObjectRenderer],
        components: [
            {
                id: 'FontSizeInput',
                async render(): Promise<InputNode[]> {
                    const input = new InputNode({
                        inputType: 'number',
                        inputName: 'font-size',
                        change: (editor: JWEditor): void => {
                            editor.execCommand('setFontSize', { value: parseInt(input.value) });
                        },
                    });
                    return [input];
                },
            },
        ],
    };
    commands = {
        setFontSize: {
            handler: this.setFontSize,
        },
    };
    /**
     * Set the font size of the context range
     */
    setFontSize(params: FontSizeCommandParams): void {
        let nodes: VNode[] = [];
        if (!params.context.range.isCollapsed()) {
            nodes = params.context.range.targetedNodes(CharNode);
        }
        for (const node of nodes) {
            node.modifiers.get(Attributes).style.set('font-size', `${params.value}px`);
        }
    }
}
