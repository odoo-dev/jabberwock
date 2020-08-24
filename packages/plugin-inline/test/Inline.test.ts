import { describePlugin } from '../../utils/src/testUtils';
import { Inline } from '../src/Inline';
import JWEditor from '../../core/src/JWEditor';
import { Constructor } from '../../utils/src/utils';
import { Format } from '../../core/src/Format';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { BoldFormat } from '../../plugin-bold/src/BoldFormat';
import { Char } from '../../plugin-char/src/Char';
import { RelativePosition, VNode } from '../../core/src/VNodes/VNode';
import { Direction } from '../../core/src/VSelection';
import { JWPluginConfig, JWPlugin } from '../../core/src/JWPlugin';
import { HtmlDomParsingEngine } from '../../plugin-html/src/HtmlDomParsingEngine';
import { ModifierLevel } from '../../core/src/Modifier';
import { SpanFormat } from '../../plugin-span/src/SpanFormat';
import { FormatXmlDomParser } from '../src/FormatXmlDomParser';

const toggleFormat = async (editor: JWEditor, FormatClass: Constructor<Format>): Promise<void> => {
    await editor.execCommand<Inline>('toggleFormat', {
        FormatClass: FormatClass,
    });
};
const removeFormat = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<Inline>('removeFormat', {});
};

describePlugin(Inline, testEditor => {
    describe('FormatDomParser', () => {
        it('should parse text with nested similar formats', async () => {
            await testEditor(BasicEditor, {
                contentBefore:
                    '<p>a<span class="outer">bc<span class="inner">de</span>fg</span>h</p>',
                contentAfter:
                    '<p>a<span class="outer">bc<span class="inner">de</span>fg</span>h</p>',
            });
        });
        it('should parse some nested formats in order', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>ab<b>cd<i>ef<u>gh</u>ij</i>kl</b>mn</p>',
                contentAfter: '<p>ab<b>cd<i>ef<u>gh</u>ij</i>kl</b>mn</p>',
            });
        });
        it('should parse empty spans', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><span class="outer"><span class="inner"></span></span></p>',
                contentAfter: '<p><span class="outer"><span class="inner"></span></span></p>',
            });
        });
    });
    describe('toggleFormat', () => {
        // TODO: test that selection collapsed toggle format without char-plugin
        // indeed does nothing.
        describe('Selection collapsed', () => {
            it('should do nothing', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[]</p>',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter: '<p>[]<br></p>',
                });
            });
            it('should add the next char in bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[]</p>',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                        await editor.execCommand<Char>('insertText', { text: 'a' });
                    },
                    contentAfter: '<p><b>a[]</b></p>',
                });
            });
        });
        describe('Selection not collapsed', () => {
            it('should be bold when selected is not bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a[b]c',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter: 'a[<b>b]</b>c',
                });
            });
            it('should not be bold when selected is bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a<b>[b]</b>c',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter: 'a[b]c',
                });
            });
            it('should be bold when one of the selected is bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a<b>[b</b>c]',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter: 'a[<b>bc]</b>',
                });
            });
            it('should not be bold but keep attributes when selected is bold with various attributes', async () => {
                await testEditor(BasicEditor, {
                    contentBefore:
                        'a<b style="color: red">b[cd</b><b style="color: green">ef]g</b>',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter:
                        'a<b style="color: red;">b[</b><span style="color: red;">cd</span><span style="color: green;">ef]</span><b style="color: green;">g</b>',
                });
            });
            it('should replace all text and add the next char in bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>[abc]</b></p>',
                    stepFunction: async (editor: JWEditor) => {
                        await editor.execCommand<Char>('insertText', { text: 'd' });
                    },
                    contentAfter: '<p><b>d[]</b></p>',
                });
            });
            it('should select and replace all text and add the next char in bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>[]abc</b></p>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.anchor.parent;
                        await editor.execCommand('setSelection', {
                            vSelection: {
                                anchorNode: p.firstLeaf(),
                                anchorPosition: RelativePosition.BEFORE,
                                focusNode: p.lastLeaf(),
                                focusPosition: RelativePosition.AFTER,
                                direction: Direction.FORWARD,
                            },
                        });
                        await editor.execCommand<Char>('insertText', { text: 'd' });
                    },
                    contentAfter: '<p><b>d[]</b></p>',
                });
            });
            describe('optimalize modifiers order', () => {
                // HIGH is for eg: link
                class HIGH extends SpanFormat {
                    level = ModifierLevel.HIGH;
                    htmlTag = 'HIGH';
                }
                // MEDIUM is for eg: bold, span
                class X extends SpanFormat {
                    level = ModifierLevel.MEDIUM;
                    htmlTag = 'X';
                }
                class W extends SpanFormat {
                    level = ModifierLevel.MEDIUM;
                    htmlTag = 'W';
                }
                // LOW is for eg: attributes

                class CustomEditor extends BasicEditor {
                    constructor(params?: { editable?: HTMLElement }) {
                        super(params);

                        class MyCustomParser extends FormatXmlDomParser {
                            static id = HtmlDomParsingEngine.id;
                            predicate = (node: Node): boolean =>
                                node.nodeName === 'W' ||
                                node.nodeName === 'X' ||
                                node.nodeName === 'HIGH';
                            async parse(item: Element): Promise<VNode[]> {
                                const span =
                                    // eslint-disable-next-line no-nested-ternary
                                    item.nodeName === 'X'
                                        ? new X()
                                        : item.nodeName === 'W'
                                        ? new W()
                                        : new HIGH();
                                const attributes = this.engine.parseAttributes(item);
                                if (attributes.length) {
                                    span.modifiers.append(attributes);
                                }
                                const children = await this.engine.parse(...item.childNodes);
                                this.applyFormat(span, children);
                                return children;
                            }
                        }
                        class MyCustomPlugin<T extends JWPluginConfig> extends JWPlugin<T> {
                            readonly loadables = {
                                parsers: [MyCustomParser],
                            };
                        }
                        this.load(MyCustomPlugin);
                    }
                }

                it('should be bold inside a HIGH', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: 'a<high>b[cd]e</high>f',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                        },
                        contentAfter: 'a<high>b[<b>cd]</b>e</high>f',
                    });
                });
                it('should be bold inside a HIGH (2)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: 'a[b<b>cd</b>e]f',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, HIGH);
                        },
                        contentAfter: 'a[<high>b<b>cd</b>e]</high>f',
                    });
                });
                it('should be bold outside a HIGH', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: '[a<high>bcde</high>f]',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                        },
                        contentAfter: '<b>[a<high>bcde</high>f]</b>',
                    });
                });
                it('should be bold outside a HIGH (2)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: '<b>a[bcde]f</b>',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, HIGH);
                        },
                        contentAfter: '<b>a[<high>bcde]</high>f</b>',
                    });
                });
                it('should be bold a part of a HIGH (begin HIGH)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: 'a<high>bc[de</high>f]',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                        },
                        contentAfter: 'a<high>bc[<b>de</b></high><b>f]</b>',
                    });
                });
                it('should be bold a part of a HIGH (begin HIGH) (2)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: 'a[bc<b>de]f</b>',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, HIGH);
                        },
                        contentAfter: 'a[<high>bc<b>de]</b></high><b>f</b>',
                    });
                });
                it('should be bold a part of a HIGH (end HIGH)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: '[a<high>bc]de</high>f',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                        },
                        contentAfter: '<b>[a</b><high><b>bc]</b>de</high>f',
                    });
                });
                it('should be bold a part of a HIGH (end HIGH) (2)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: '<b>a[bc</b>de]f',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, HIGH);
                        },
                        contentAfter: '<b>a[</b><high><b>bc</b>de]</high>f',
                    });
                });
                it('should be bold a part of a HIGH (begin HIGH smaller)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: 'a<high>bc[de</high>f 123456]',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                        },
                        contentAfter: 'a<high>bc[<b>de</b></high><b>f 123456]</b>',
                    });
                });
                it('should be bold a part of a HIGH (begin HIGH smaller) (2)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: 'a[bc<b>de]f 123456</b>',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, HIGH);
                        },
                        contentAfter: 'a[<high>bc<b>de]</b></high><b>f 123456</b>',
                    });
                });
                it('should be bold a part of a HIGH (end HIGH smaller)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: '[123456 a<high>bc]de</high>f',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                        },
                        contentAfter: '<b>[123456 a</b><high><b>bc]</b>de</high>f',
                    });
                });
                it('should be bold a part of a HIGH (end HIGH smaller) (2)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: '<b>123456 a[bc</b>de]f',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, HIGH);
                        },
                        contentAfter: '<b>123456 a[</b><high><b>bc</b>de]</high>f',
                    });
                });
                it('should remove bold inside a HIGH', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: '<b>a<high>b[cd]e</high>f</b>',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                        },
                        contentAfter: '<b>a</b><high><b>b[</b>cd]<b>e</b></high><b>f</b>',
                    });
                });
                it('should remove bold inside a HIGH with MEDIUM', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: '<b>a<high><x>b[cd]e</x></high>f</b>',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                        },
                        contentAfter: '<b>a</b><high><x><b>b[</b>cd]<b>e</b></x></high><b>f</b>',
                    });
                });
                it('should be bold inside a HIGH with MEDIUM (2)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: '<x>a<high>b[cd]e</high>f</x>',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                        },
                        contentAfter: '<x>a<high>b[<b>cd]</b>e</high>f</x>',
                    });
                });
                it('should be bold inside a HIGH with MEDIUM (3)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: 'a<high>[b<x>cd]e</x></high><x>f</x>',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                        },
                        contentAfter: 'a[<high><b>b</b><x><b>cd]</b>e</x></high><x>f</x>',
                    });
                });
                it('should be bold inside a HIGH with MEDIUM (4)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: 'a<high>b<x>[c</x><w>d]e</w></high>f',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                        },
                        contentAfter: 'a<high>b[<b><x>c</x></b><w><b>d]</b>e</w></high>f',
                    });
                });
                it('should keep parsing order of MEDIUM', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: 'a<x><w>b</w></x><w><x>cd</x></w>',
                        contentAfter: 'a<x><w>b</w></x><w><x>cd</x></w>',
                    });
                });
                it('should optimise the order after update', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: 'a<x><w>b[]</w></x><w><x>cd</x></w>',
                        stepFunction: async (editor: JWEditor) => {
                            return editor.execCommand<Char>('insertText', { text: '0' });
                        },
                        contentAfter: 'a<x><w>b0[]cd</w></x>',
                    });
                });
                it('should optimise the order after update (2)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore:
                            '<i>__</i><b><i>_<a href="#">__</a></i><a href="#">_[]</a><i><a href="#">__</a>_</i></b>',
                        stepFunction: async (editor: JWEditor) => {
                            return editor.execCommand<Char>('insertText', { text: '0' });
                        },
                        contentAfter:
                            '<i>__</i><b><i>_</i><a href="#"><i>__</i>_0[]<i>__</i></a><i>_</i></b>',
                    });
                });
                it('should use attributes on VNode', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: '<p>a[]<b><img class="toto"></b><img class="toto"></p>',
                        contentAfter: '<p>a[]<b><img class="toto"></b><img class="toto"></p>',
                    });
                });
                it('should use attributes on VNode (2)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: '<p>[]<img class="toto"><img class="toto"></p>',
                        stepFunction: async (editor: JWEditor) => {
                            await editor.execCommand(() => {
                                editor.selection.anchor.next().modifiers.append(BoldFormat);
                            });
                        },
                        contentAfter: '<p><b>[]<img class="toto"></b><img class="toto"></p>',
                    });
                });
                it('should use attributes on VNode (3)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore: '<p><img class="toto">[]<img class="toto"></p>',
                        stepFunction: async (editor: JWEditor) => {
                            await editor.execCommand(() => {
                                editor.selection.anchor.next().modifiers.append(BoldFormat);
                            });
                        },
                        contentAfter: '<p><img class="toto"><b>[]<img class="toto"></b></p>',
                    });
                });
                it('should use attributes on VNode (4)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore:
                            '<p>[]<img class="toto"><img class="toto"><img class="toto"></p>',
                        stepFunction: async (editor: JWEditor) => {
                            await editor.execCommand(() => {
                                const next = editor.selection.anchor.next();
                                next.modifiers.append(BoldFormat);
                                next.next().modifiers.append(BoldFormat);
                            });
                        },
                        contentAfter:
                            '<p><b>[]<img class="toto"><img class="toto"></b><img class="toto"></p>',
                    });
                });
                it('should use attributes on VNode (5)', async () => {
                    await testEditor(CustomEditor, {
                        contentBefore:
                            '<p><img class="toto">[]<img class="toto"><img class="toto"></p>',
                        stepFunction: async (editor: JWEditor) => {
                            await editor.execCommand(() => {
                                const next = editor.selection.anchor.next();
                                next.modifiers.append(BoldFormat);
                                next.next().modifiers.append(BoldFormat);
                            });
                        },
                        contentAfter:
                            '<p><img class="toto"><b>[]<img class="toto"><img class="toto"></b></p>',
                    });
                });
            });
        });
    });
    describe('format and attributes', () => {
        it('should keep formats in order', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><i>g[]ga</i></b>',
                contentAfter: '<b><i>g[]ga</i></b>',
            });
        });
        it('should keep formats in order with inline node which use the inline renderer like image', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><i>g[]g<img src="#"></i></b>',
                contentAfter: '<b><i>g[]g<img src="#"></i></b>',
            });
        });
        it('should keep formats in order with inlines nodes which use the inline renderer like image', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><i>g[]g<img src="#1"><img src="#2"></i></b>',
                contentAfter: '<b><i>g[]g<img src="#1"><img src="#2"></i></b>',
            });
        });
        it('should keep formats and attributes in order', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><span a="b">g[]g</span></b>',
                contentAfter: '<b><span a="b">g[]g</span></b>',
            });
        });
        it('should keep nested formats in order', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><i>g[g</i>o]o</b>',
                contentAfter: '<b><i>g[g</i>o]o</b>',
            });
        });
        it('should keep nested formats and attributes in order', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><span a="b">g[g</span>o]o</b>',
                contentAfter: '<b><span a="b">g[g</span>o]o</b>',
            });
        });
        it('should nest identical formats', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><i>g[g</i></b><b><i>o]o</i></b>',
                contentAfter: '<b><i>g[go]o</i></b>',
            });
        });
        it('should nest identical formats and attributes', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><span a="b">g[g</span></b><b><span a="b">o]o</span></b>',
                contentAfter: '<b><span a="b">g[go]o</span></b>',
            });
        });
        it('should nest ordered formats', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><i>g[g</i></b><b>o]o</b>',
                contentAfter: '<b><i>g[g</i>o]o</b>',
            });
        });
        it('should nest ordered formats and attributes', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><span a="b">g[g</span></b><b>o]o</b>',
                contentAfter: '<b><span a="b">g[g</span>o]o</b>',
            });
        });
        it('should not nest unordered formats', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><i>g[g</i></b><i><b>o]o</b></i>',
                contentAfter: '<b><i>g[g</i></b><i><b>o]o</b></i>',
            });
        });
        it('should not nest formats with different attributes', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b>g[g</b><b a="b">o]o</b>',
                contentAfter: '<b>g[g</b><b a="b">o]o</b>',
            });
        });
        it('should not nest unordered formats and attributes', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><span a="b">g[g</span></b><span a="b"><b>o]o</b></span>',
                contentAfter: '<b><span a="b">g[g</span></b><span a="b"><b>o]o</b></span>',
            });
        });
    });
    describe('removeFormat', () => {
        it('should remove a format', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1><font style="color: red;">ab[cd]ef</font></h1>',
                stepFunction: async (editor: JWEditor) => {
                    await removeFormat(editor);
                },
                // TODO: the range placement is weird
                contentAfter:
                    '<h1><font style="color: red;">ab[</font>cd]<font style="color: red;">ef</font></h1>',
            });
        });
        it('should remove multiple formats', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1><i><font style="color: red;">ab[cd]ef</font></i></h1>',
                stepFunction: async (editor: JWEditor) => {
                    await removeFormat(editor);
                },
                // TODO: the range placement is weird
                contentAfter:
                    '<h1><i><font style="color: red;">ab[</font></i>cd]<i><font style="color: red;">ef</font></i></h1>',
            });
        });
    });
});
