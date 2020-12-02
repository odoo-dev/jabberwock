import { expect } from 'chai';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import JWEditor from '../../core/src/JWEditor';
import { VNode } from '../../core/src/VNodes/VNode';
import { DevTools } from '../../plugin-devtools/src/DevTools';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { Layout } from '../../plugin-layout/src/Layout';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { DomHelpers } from '../src/DomHelpers';
import { withDomMutations } from '../src/withDomMutations';

export async function renderEditable<T>(editor: JWEditor): Promise<string> {
    const renderer = editor.plugins.get(Renderer);
    const layout = editor.plugins.get(Layout);
    const domEngine = layout.engines.dom;
    const editable = domEngine.components.editable[0];

    const editableElement = (await renderer.render<HTMLElement[]>(
        HtmlDomRenderingEngine.id,
        editable,
    )) as HTMLElement[];
    return editableElement[0].innerHTML;
}

async function load(
    params: { content?: string | HTMLElement },
    callback: (ctx: {
        editor: BasicEditor;
        editableNode: HTMLElement;
        editableVNode: VNode;
    }) => void,
): Promise<void> {
    const editableNode = document.createElement('editable');
    document.body.appendChild(editableNode);
    if (params.content) {
        if (params.content instanceof HTMLElement) {
            editableNode.appendChild(params.content);
        } else {
            editableNode.innerHTML = params.content;
        }
    }

    const editor = new BasicEditor({ editable: editableNode });
    editor.load(DomHelpers);
    editor.load(DevTools);
    await editor.start();

    const layout = editor.plugins.get(Layout);
    const domLayout = layout.engines.dom;
    const editableVNode = domLayout.components.editable[0];

    try {
        await callback({
            editableNode: document.querySelector('editable'),
            editableVNode,
            editor,
        });
    } finally {
        await editor.stop();
        document.body.innerHTML = '';
    }
}

describe('withDomMutations', () => {
    describe('attributes', () => {
        it('should add attribute', async () => {
            await load({ content: '<div>xx</div>' }, async ctx => {
                const div = ctx.editableNode.querySelector('div');
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    div.setAttribute('att1', 'a');
                    div.setAttribute('att2', 'b');
                });

                const result = await renderEditable(ctx.editor);
                expect(result).to.equal('<div att1="a" att2="b">xx</div>');
            });
        });
        it('should remove attribute', async () => {
            await load({ content: '<div att1="a" att2="b">xx</div>' }, async ctx => {
                const div = ctx.editableNode.querySelector('div');
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    div.removeAttribute('att1');
                    div.removeAttribute('att2');
                });

                const result = await renderEditable(ctx.editor);
                expect(result).to.equal('<div>xx</div>');
            });
        });
        it('should add class', async () => {
            await load({ content: '<div>xx</div>' }, async ctx => {
                const div = ctx.editableNode.querySelector('div');
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    div.classList.add('a');
                    div.classList.add('b');
                });

                const result = await renderEditable(ctx.editor);
                expect(result).to.equal('<div class="a b">xx</div>');
            });
        });
        it('should remove class', async () => {
            await load({ content: '<div class="a b">xx</div>' }, async ctx => {
                const div = ctx.editableNode.querySelector('div');
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    div.classList.remove('a');
                    div.classList.remove('b');
                });

                const result = await renderEditable(ctx.editor);
                expect(result).to.equal('<div>xx</div>');
            });
        });
        it('should add data', async () => {
            await load({ content: '<div>xx</div>' }, async ctx => {
                const div = ctx.editableNode.querySelector('div');
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    div.dataset.d1 = 'a';
                    div.dataset.d2 = 'b';
                });

                const result = await renderEditable(ctx.editor);
                expect(result).to.equal('<div data-d1="a" data-d2="b">xx</div>');
            });
        });
        it('should remove data', async () => {
            await load({ content: '<div data-d1="a" data-d2="b">xx</div>' }, async ctx => {
                const div = ctx.editableNode.querySelector('div');
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    delete div.dataset.d1;
                    delete div.dataset.d2;
                });

                const result = await renderEditable(ctx.editor);
                expect(result).to.equal('<div>xx</div>');
            });
        });

        // todo: unskip when supporting diff classList
        it.skip('should not add or remove a previously added class on ContainerNode', async () => {
            await load({ content: '<div class="a b c">xx</div>' }, async ctx => {
                const div = ctx.editableNode.querySelector('div');
                div.classList.remove('a');
                div.classList.add('d');
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    div.classList.remove('b');
                    div.classList.add('e');
                });
                div.classList.remove('c');
                div.classList.add('f');

                const result = await renderEditable(ctx.editor);
                expect(result).to.equal('<div class="a c e">xx</div>');
            });
        });
        // todo: unskip when supporting diff classList
        it.skip('should not add or remove a previously added class on Format', async () => {
            await load({ content: '<span class="a b c">xx</span>' }, async ctx => {
                const span = ctx.editableNode.querySelector('span');
                span.classList.remove('a');
                span.classList.add('d');
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    span.classList.remove('b');
                    span.classList.add('e');
                });
                span.classList.remove('c');
                span.classList.add('f');

                const result = await renderEditable(ctx.editor);
                expect(result).to.equal('<span class="a c e">xx</span>');
                expect(ctx.editableNode.innerHTML).to.equal('<span class="d e f">xx</span>');
            });
        });
        // todo: unskip when supporting diff classList
        it.skip('should add id, data and classes on ContainerNode', async () => {
            await load({ content: '<div>xx</div>' }, async ctx => {
                const div = ctx.editableNode.querySelector('div');
                div.classList.add('superclass1');
                div.setAttribute('data-foo1', 'bar1');
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    div.setAttribute('id', 'id1');
                    div.setAttribute('data-foo2', 'bar2');
                    div.dataset.foo3 = 'bar3';
                    div.classList.add('superClass2');
                });
                div.setAttribute('id', 'id2');
                div.classList.add('superclass3');
                div.setAttribute('data-foo4', 'bar4');

                const result = await renderEditable(ctx.editor);
                expect(result).to.equal(
                    '<div id="id1" data-foo2="bar2" data-foo3="bar3" class="superClass2">xx</div>',
                );
            });
        });
        it.skip('should add id, data and classes on Format', async () => {
            await load({ content: '<span>xx</span>' }, async ctx => {
                const span = ctx.editableNode.querySelector('span');
                span.classList.add('superclass1');
                span.setAttribute('data-foo1', 'bar1');
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    span.setAttribute('id', 'id1');
                    span.setAttribute('data-foo2', 'bar2');
                    span.dataset.foo3 = 'bar3';
                    span.classList.add('superClass2');
                });
                span.setAttribute('id', 'id2');
                span.classList.add('superclass3');
                span.setAttribute('data-foo4', 'bar4');

                const result = await renderEditable(ctx.editor);
                expect(result).to.equal(
                    '<span id="id1" data-foo2="bar2" data-foo3="bar3" class="superClass2">xx</span>',
                );
            });
        });
    });
    describe('childList', () => {
        describe('add', () => {
            describe('inside ContainerNode', () => {
                it('should not add if no parent for ContainerNode', async () => {
                    await load({ content: '<div>x</div>' }, async ctx => {
                        const div = ctx.editableNode.querySelector('div');
                        const a1 = document.createElement('a');
                        a1.textContent = 'a1';
                        const divWithin = document.createElement('div');
                        const a2 = document.createElement('a');
                        a2.textContent = 'a2';
                        const a3 = document.createElement('a');
                        a3.textContent = 'a3';

                        div.appendChild(a1);
                        div.appendChild(divWithin);
                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            divWithin.appendChild(a2);
                        });
                        div.appendChild(a3);

                        const result = await renderEditable(ctx.editor);
                        expect(result).to.equal('<div>x</div>');
                        expect(ctx.editableNode.innerHTML).to.equal(
                            '<div>x<a>a1</a><div><a>a2</a></div><a>a3</a></div>',
                        );
                    });
                });
                describe('add text', () => {
                    it('should add "ab" in <div>|</div>', async () => {
                        await load({ content: '<div></div>' }, async ctx => {
                            const div = ctx.editableNode.querySelector('div');
                            const text1 = document.createTextNode('ab');

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                div.appendChild(text1);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<div>ab</div>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                    it('should add "cd" and "ef" in <div>ab|</div>', async () => {
                        await load({ content: '<div>ab</div>' }, async ctx => {
                            const div = ctx.editableNode.querySelector('div');
                            const text1 = document.createTextNode('cd');
                            const text2 = document.createTextNode('ef');

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                div.appendChild(text1);
                            });
                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                text1.after(text2);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<div>abcdef</div>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                    it('should add "cd" in <div>ab|</div> then prepend <div> with "ef"', async () => {
                        await load({ content: '<div>ab</div>' }, async ctx => {
                            const div = ctx.editableNode.querySelector('div');
                            const text1 = document.createTextNode('cd');
                            const text2 = document.createTextNode('ef');

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                div.append(text1);
                            });
                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                div.prepend(text2);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<div>efabcd</div>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                });

                describe('add link', () => {
                    it('should add <a>ab</a> in <div>|</div>', async () => {
                        await load({ content: '<div></div>' }, async ctx => {
                            const div = ctx.editableNode.querySelector('div');
                            const a1 = document.createElement('a');
                            a1.append(document.createTextNode('ab'));

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                div.appendChild(a1);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<div><a>ab</a></div>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                    it('should add <a1>cd</a1><a2>ef</a2> in <div>ab|</div>', async () => {
                        await load({ content: '<div>ab</div>' }, async ctx => {
                            const div = ctx.editableNode.querySelector('div');
                            const a1 = document.createElement('a');
                            a1.classList.add('a1');
                            a1.append(document.createTextNode('cd'));
                            const a2 = document.createElement('a');
                            a2.classList.add('a2');
                            a2.append(document.createTextNode('ef'));

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                div.appendChild(a1);
                            });
                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                a1.after(a2);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult =
                                '<div>ab<a class="a1">cd</a><a class="a2">ef</a></div>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });

                    it('should add <a>ab</a> then <b>cd</b> in <div></div>', async () => {
                        await load({ content: '<div></div>' }, async ctx => {
                            const div = document.querySelector('div');
                            const a = document.createElement('a');
                            a.textContent = 'ab';
                            const b = document.createElement('b');
                            b.textContent = 'cd';
                            await withDomMutations(ctx.editor, ctx.editableNode, async () => {
                                div.appendChild(a);
                                div.appendChild(b);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<div><a>ab</a><b>cd</b></div>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                    it.skip('should add <a>cd</a> then <b>ef</b> in <div>ab</div>', async () => {
                        await load({ content: '<div>ab</div>' }, async ctx => {
                            const div = document.querySelector('div');
                            const a = document.createElement('a');
                            a.textContent = 'cd';
                            const b = document.createElement('b');
                            b.textContent = 'ef';
                            await withDomMutations(ctx.editor, ctx.editableNode, async () => {
                                div.appendChild(a);
                                div.appendChild(b);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<div>ab<a>cd</a><b>ef</b></div>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                    describe('with element not in DOM', () => {
                        it('should add <a2>cd</a2> in <div>{<a class="a1">ab</a>}</div>', async () => {
                            await load({ content: '<div></div>' }, async ctx => {
                                const div = ctx.editableNode.querySelector('div');
                                const a1 = document.createElement('a');
                                a1.append(document.createTextNode('ab'));
                                a1.classList.add('a1');
                                const a2 = document.createElement('a');
                                a2.append(document.createTextNode('cd'));
                                a2.classList.add('a2');

                                div.appendChild(a1);
                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    div.appendChild(a2);
                                });

                                const result = await renderEditable(ctx.editor);
                                expect(result).to.equal('<div><a class="a2">cd</a></div>');
                                expect(ctx.editableNode.innerHTML).to.equal(
                                    '<div><a class="a1">ab</a><a class="a2">cd</a></div>',
                                );
                            });
                        });
                        it.skip('should add <a2>cd</a2> in <div>xx{<a1>ab</a1>}|</div>', async () => {
                            await load({ content: '<div>xx</div>' }, async ctx => {
                                const div = ctx.editableNode.querySelector('div');
                                const a1 = document.createElement('a');
                                a1.append(document.createTextNode('ab'));
                                a1.classList.add('a1');
                                const a2 = document.createElement('a');
                                a2.append(document.createTextNode('cd'));
                                a2.classList.add('a2');

                                div.appendChild(a1);
                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    div.appendChild(a2);
                                });

                                const result = await renderEditable(ctx.editor);
                                expect(result).to.equal('<div>xx<a class="a2">cd</a></div>');
                                expect(ctx.editableNode.innerHTML).to.equal(
                                    '<div>xx<a class="a1">ab</a><a class="a2">cd</a></div>',
                                );
                            });
                        });
                        it.skip('should add <a2>cd</a2>in <div>xx{<a1>ab</a1>}|</div> then add <a3>ef<a3/> before <a2>', async () => {
                            await load({ content: '<div>xx</div>' }, async ctx => {
                                const div = ctx.editableNode.querySelector('div');
                                const a1 = document.createElement('a');
                                a1.classList.add('a1');
                                a1.append(document.createTextNode('ab'));
                                const a2 = document.createElement('a');
                                a2.classList.add('a2');
                                a2.append(document.createTextNode('cd'));
                                const a3 = document.createElement('a');
                                a3.append(document.createTextNode('ef'));
                                a3.classList.add('a3');

                                // because the text is not in a transaction, it
                                // should not be in the VDOC
                                div.appendChild(a1);
                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    div.append(a2);
                                });
                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    a1.after(a3);
                                });

                                const result = await renderEditable(ctx.editor);
                                expect(result).to.equal(
                                    '<div>xx<a class="a3">ef</a><a class="a2">cd</a></div>',
                                );
                                expect(ctx.editableNode.innerHTML).to.equal(
                                    '<div>xx<a class="a1">ab</a><a class="a3">ef</a><a class="a2">cd</a></div>',
                                );
                            });
                        });
                    });
                });
            });
            describe('inside Format', () => {
                it('should not add if no parent for Format', async () => {
                    await load({ content: '<span></span>' }, async ctx => {
                        const span = ctx.editableNode.querySelector('span');
                        const a1 = document.createElement('a');
                        a1.textContent = 'a1';
                        const aWithin = document.createElement('a');
                        aWithin.textContent = 'awithin';
                        const a2 = document.createElement('a');
                        a2.textContent = 'a2';
                        const a3 = document.createElement('a');
                        a3.textContent = 'a3';

                        span.appendChild(a1);
                        span.appendChild(aWithin);
                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            aWithin.appendChild(a2);
                        });
                        span.appendChild(a3);

                        const result = await renderEditable(ctx.editor);
                        expect(result).to.equal('<span></span>');
                        expect(ctx.editableNode.innerHTML).to.equal(
                            '<span><a>a1</a><a>awithin<a>a2</a></a><a>a3</a></span>',
                        );
                    });
                });
                describe('add text', () => {
                    describe('nested Format', () => {
                        it('should add with "xx" <a>|ab<b>cd<i>ef</i>gh</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const a = document.querySelector('a');
                                    const xx = document.createTextNode('xx');
                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        a.prepend(xx);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult = '<a>xxab<b>cd<i>ef</i>gh</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "xx" <a>ab|<b>cd<i>ef</i>gh</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const a = document.querySelector('a');
                                    const xx = document.createTextNode('xx');
                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        a.firstChild.after(xx);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult = '<a>abxx<b>cd<i>ef</i>gh</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "xx" <a>ab<b>|cd<i>ef</i>gh</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const b = document.querySelector('b');
                                    const xx = document.createTextNode('xx');
                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        b.prepend(xx);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult = '<a>ab<b>xxcd<i>ef</i>gh</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "xx" <a>ab<b>cd|<i>ef</i>gh</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const b = document.querySelector('b');
                                    const xx = document.createTextNode('xx');
                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        b.firstChild.after(xx);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult = '<a>ab<b>cdxx<i>ef</i>gh</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "xx" <a>ab<b>cd<i>|ef</i>gh</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const i = document.querySelector('i');
                                    const xx = document.createTextNode('xx');
                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        i.firstChild.before(xx);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult = '<a>ab<b>cd<i>xxef</i>gh</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "xx" <a>ab<b>cd<i>ef|</i>gh</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const i = document.querySelector('i');
                                    const xx = document.createTextNode('xx');
                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        i.firstChild.after(xx);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult = '<a>ab<b>cd<i>efxx</i>gh</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "xx" <a>ab<b>cd<i>ef</i>|gh</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const b = document.querySelector('b');
                                    const xx = document.createTextNode('xx');
                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        b.lastChild.before(xx);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult = '<a>ab<b>cd<i>ef</i>xxgh</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "xx" <a>ab<b>cd<i>ef</i>gh|</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const b = document.querySelector('b');
                                    const xx = document.createTextNode('xx');
                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        b.lastChild.after(xx);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult = '<a>ab<b>cd<i>ef</i>ghxx</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "xx" <a>ab<b>cd<i>ef</i>gh</b>|ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const a = document.querySelector('a');
                                    const xx = document.createTextNode('xx');
                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        a.lastChild.before(xx);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult = '<a>ab<b>cd<i>ef</i>gh</b>xxij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "xx" <a>ab<b>cd<i>ef</i>gh</b>ij|</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const a = document.querySelector('a');
                                    const xx = document.createTextNode('xx');
                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        a.lastChild.after(xx);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult = '<a>ab<b>cd<i>ef</i>gh</b>ijxx</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });

                        it('should add with "xx" <a>|<b><i>ab</i></b></a>', async () => {
                            await load({ content: '<a><b><i>ab</i></b></a>' }, async ctx => {
                                const a = document.querySelector('a');
                                const xx = document.createTextNode('xx');
                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    a.prepend(xx);
                                });

                                const result = await renderEditable(ctx.editor);
                                const expectedResult = '<a>xx<b><i>ab</i></b></a>';
                                expect(result).to.equal(expectedResult);
                                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                            });
                        });
                        it.skip('should add with "xx" <a><b>|<i>ab</i></b></a>', async () => {
                            await load({ content: '<a><b><i>ab</i></b></a>' }, async ctx => {
                                const b = document.querySelector('b');
                                const xx = document.createTextNode('xx');
                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    b.prepend(xx);
                                });

                                const result = await renderEditable(ctx.editor);
                                const expectedResult = '<a><b>xx<i>ab</i></b></a>';
                                expect(result).to.equal(expectedResult);
                                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                            });
                        });
                        it('should add with "xx" <a><b><i>ab</i>|</b></a>', async () => {
                            await load({ content: '<a><b><i>ab</i></b></a>' }, async ctx => {
                                const b = document.querySelector('b');
                                const xx = document.createTextNode('xx');
                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    b.append(xx);
                                });

                                const result = await renderEditable(ctx.editor);
                                const expectedResult = '<a><b><i>ab</i>xx</b></a>';
                                expect(result).to.equal(expectedResult);
                                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                            });
                        });
                        it('should add with "xx" <a><b><i>ab</i></b>|</a>', async () => {
                            await load({ content: '<a><b><i>ab</i></b></a>' }, async ctx => {
                                const a = document.querySelector('a');
                                const xx = document.createTextNode('xx');
                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    a.append(xx);
                                });

                                const result = await renderEditable(ctx.editor);
                                const expectedResult = '<a><b><i>ab</i></b>xx</a>';
                                expect(result).to.equal(expectedResult);
                                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                            });
                        });
                    });
                    it('should add "ab" in <span>|</span>', async () => {
                        await load({ content: '<span></span>' }, async ctx => {
                            const span = ctx.editableNode.querySelector('span');
                            const text1 = document.createTextNode('ab');

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                span.appendChild(text1);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<span>ab</span>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                    it('should add "ab" in <span><span>|</span></span>', async () => {
                        await load({ content: '<span><span></span></span>' }, async ctx => {
                            const span = ctx.editableNode.querySelectorAll('span')[1];
                            const text1 = document.createTextNode('ab');

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                span.appendChild(text1);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<span><span>ab</span></span>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });

                    it('should add "cd" and "ef" in <span>ab|</span>', async () => {
                        await load({ content: '<span>ab</span>' }, async ctx => {
                            const span = ctx.editableNode.querySelector('span');
                            const text1 = document.createTextNode('cd');
                            const text2 = document.createTextNode('ef');

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                span.appendChild(text1);
                            });
                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                span.append(text2);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<span>abcdef</span>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                    it('should add "cd" then prepend "ef" in <span>|ab|</span>', async () => {
                        await load({ content: '<span>ab</span>' }, async ctx => {
                            const span = ctx.editableNode.querySelector('span');
                            const text1 = document.createTextNode('cd');
                            const text2 = document.createTextNode('ef');

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                span.append(text1);
                            });
                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                span.prepend(text2);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<span>efabcd</span>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                    it('should add "cd" in <span>|<b>ab</b></span>', async () => {
                        await load({ content: '<span><b>ab</b></span>' }, async ctx => {
                            const b = ctx.editableNode.querySelector('b');
                            const text1 = document.createTextNode('cd');

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                b.before(text1);
                            });

                            const result = await renderEditable(ctx.editor);
                            expect(result).to.equal('<span>cd<b>ab</b></span>');
                            expect(ctx.editableNode.innerHTML).to.equal('<span>cd<b>ab</b></span>');
                        });
                    });
                    it('should add "cd" in <span><b>ab</b>|</span>', async () => {
                        await load({ content: '<span><b>ab</b></span>' }, async ctx => {
                            const b = ctx.editableNode.querySelector('b');
                            const text1 = document.createTextNode('cd');

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                b.after(text1);
                            });

                            const result = await renderEditable(ctx.editor);

                            const expectedResult = '<span><b>ab</b>cd</span>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                });

                describe('add link', () => {
                    describe('nested Format', () => {
                        it('should add with "<s>xx</s>" <a>|ab<b>cd<i>ef</i>gh</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const a = document.querySelector('a');
                                    const s = document.createElement('s');
                                    s.innerHTML = 'xx';

                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        a.prepend(s);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult =
                                        '<a><s>xx</s>ab<b>cd<i>ef</i>gh</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "<s>xx</s>" <a>ab|<b>cd<i>ef</i>gh</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const a = document.querySelector('a');
                                    const s = document.createElement('s');
                                    s.innerHTML = 'xx';

                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        a.firstChild.after(s);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult =
                                        '<a>ab<s>xx</s><b>cd<i>ef</i>gh</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "<s>xx</s>" <a>ab<b>|cd<i>ef</i>gh</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const b = document.querySelector('b');
                                    const s = document.createElement('s');
                                    s.innerHTML = 'xx';

                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        b.firstChild.before(s);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult =
                                        '<a>ab<b><s>xx</s>cd<i>ef</i>gh</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "<s>xx</s>" <a>ab<b>cd|<i>ef</i>gh</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const b = document.querySelector('b');
                                    const s = document.createElement('s');
                                    s.innerHTML = 'xx';

                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        b.firstChild.after(s);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult =
                                        '<a>ab<b>cd<s>xx</s><i>ef</i>gh</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "<s>xx</s>" <a>ab<b>cd<i>|ef</i>gh</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const i = document.querySelector('i');
                                    const s = document.createElement('s');
                                    s.innerHTML = 'xx';

                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        i.firstChild.before(s);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult =
                                        '<a>ab<b>cd<i><s>xx</s>ef</i>gh</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "<s>xx</s>" <a>ab<b>cd<i>ef|</i>gh</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const i = document.querySelector('i');
                                    const s = document.createElement('s');
                                    s.innerHTML = 'xx';

                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        i.firstChild.after(s);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult =
                                        '<a>ab<b>cd<i>ef<s>xx</s></i>gh</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "<s>xx</s>" <a>ab<b>cd<i>ef</i>|gh</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const b = document.querySelector('b');
                                    const s = document.createElement('s');
                                    s.innerHTML = 'xx';

                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        b.lastChild.before(s);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult =
                                        '<a>ab<b>cd<i>ef</i><s>xx</s>gh</b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "<s>xx</s>" <a>ab<b>cd<i>ef</i>gh|</b>ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const b = document.querySelector('b');
                                    const s = document.createElement('s');
                                    s.innerHTML = 'xx';

                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        b.lastChild.after(s);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult =
                                        '<a>ab<b>cd<i>ef</i>gh<s>xx</s></b>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "<s>xx</s>" <a>ab<b>cd<i>ef</i>gh</b>|ij</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const a = document.querySelector('a');
                                    const s = document.createElement('s');
                                    s.innerHTML = 'xx';

                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        a.lastChild.before(s);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult =
                                        '<a>ab<b>cd<i>ef</i>gh</b><s>xx</s>ij</a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });
                        it('should add with "<s>xx</s>" <a>ab<b>cd<i>ef</i>gh</b>ij|</a>', async () => {
                            await load(
                                { content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' },
                                async ctx => {
                                    const a = document.querySelector('a');
                                    const s = document.createElement('s');
                                    s.innerHTML = 'xx';

                                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                        a.lastChild.after(s);
                                    });

                                    const result = await renderEditable(ctx.editor);
                                    const expectedResult =
                                        '<a>ab<b>cd<i>ef</i>gh</b>ij<s>xx</s></a>';
                                    expect(result).to.equal(expectedResult);
                                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                                },
                            );
                        });

                        it('should add with "<s>xx</s>" <a>|<b><i>ab</i></b></a>', async () => {
                            await load({ content: '<a><b><i>ab</i></b></a>' }, async ctx => {
                                const a = document.querySelector('a');
                                const s = document.createElement('s');
                                s.innerHTML = 'xx';

                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    a.prepend(s);
                                });

                                const result = await renderEditable(ctx.editor);
                                const expectedResult = '<a><s>xx</s><b><i>ab</i></b></a>';
                                expect(result).to.equal(expectedResult);
                                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                            });
                        });
                        it.skip('should add with "<s>xx</s>" <a><b>|<i>ab</i></b></a>', async () => {
                            await load({ content: '<a><b><i>ab</i></b></a>' }, async ctx => {
                                const b = document.querySelector('b');
                                const s = document.createElement('s');
                                s.innerHTML = 'xx';

                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    b.prepend(s);
                                });

                                const result = await renderEditable(ctx.editor);
                                const expectedResult = '<a><b><s>xx</s><i>ab</i></b></a>';
                                expect(result).to.equal(expectedResult);
                                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                            });
                        });
                        it('should add with "<s>xx</s>" <a><b><i>ab</i>|</b></a>', async () => {
                            await load({ content: '<a><b><i>ab</i></b></a>' }, async ctx => {
                                const b = document.querySelector('b');
                                const s = document.createElement('s');
                                s.innerHTML = 'xx';

                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    b.append(s);
                                });

                                const result = await renderEditable(ctx.editor);
                                const expectedResult = '<a><b><i>ab</i><s>xx</s></b></a>';
                                expect(result).to.equal(expectedResult);
                                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                            });
                        });
                        it.skip('should add with "<s>xx</s>" <a><b><i>ab</i></b>|</a>', async () => {
                            await load({ content: '<a><b><i>ab</i></b></a>' }, async ctx => {
                                const b = document.querySelector('b');
                                const s = document.createElement('s');
                                s.innerHTML = 'xx';

                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    b.append(s);
                                });

                                const result = await renderEditable(ctx.editor);
                                const expectedResult = '<a><b><i>ab</i></b><s>xx</s></a>';
                                expect(result).to.equal(expectedResult);
                                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                            });
                        });
                    });
                    it('should add <a>ab</a> in <span>|</span>', async () => {
                        await load({ content: '<span></span>' }, async ctx => {
                            const span = ctx.editableNode.querySelector('span');
                            const a1 = document.createElement('a');
                            a1.append(document.createTextNode('ab'));

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                span.appendChild(a1);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<span><a>ab</a></span>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                    it('should add <a1>cd</a1> in <span>ab|</span>', async () => {
                        await load({ content: '<span>ab</span>' }, async ctx => {
                            const span = ctx.editableNode.querySelector('span');
                            const a1 = document.createElement('a');
                            a1.classList.add('a1');
                            a1.append(document.createTextNode('cd'));

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                span.appendChild(a1);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<span>ab<a class="a1">cd</a></span>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                    it('should add <a1>cd</a1> in <span>|ab</span>', async () => {
                        await load({ content: '<span>ab</span>' }, async ctx => {
                            const span = ctx.editableNode.querySelector('span');
                            const a1 = document.createElement('a');
                            a1.classList.add('a1');
                            a1.append(document.createTextNode('cd'));

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                span.prepend(a1);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<span><a class="a1">cd</a>ab</span>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                    it('should add <a1>cd</a1><a2>ef</a2> in <span>ab|</span>', async () => {
                        await load({ content: '<span>ab</span>' }, async ctx => {
                            const span = ctx.editableNode.querySelector('span');
                            const a1 = document.createElement('a');
                            a1.classList.add('a1');
                            a1.append(document.createTextNode('cd'));
                            const a2 = document.createElement('a');
                            a2.classList.add('a2');
                            a2.append(document.createTextNode('ef'));

                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                span.appendChild(a1);
                            });
                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                a1.after(a2);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult =
                                '<span>ab<a class="a1">cd</a><a class="a2">ef</a></span>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });

                    it.skip('should add <a>ab</a> then <b>cd</b> in <span></span>', async () => {
                        await load({ content: '<span></span>' }, async ctx => {
                            const span = document.querySelector('span');
                            const a = document.createElement('a');
                            a.textContent = 'ab';
                            const b = document.createElement('b');
                            b.textContent = 'cd';
                            await withDomMutations(ctx.editor, ctx.editableNode, async () => {
                                span.appendChild(a);
                                span.appendChild(b);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<span><a>ab</a><b>cd</b></span>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                    it.skip('should add <a>cd</a> then <b>ef</b> in <span>ab</span>', async () => {
                        await load({ content: '<span>ab</span>' }, async ctx => {
                            const span = document.querySelector('span');
                            const a = document.createElement('a');
                            a.textContent = 'cd';
                            const b = document.createElement('b');
                            b.textContent = 'ef';
                            await withDomMutations(ctx.editor, ctx.editableNode, async () => {
                                span.appendChild(a);
                                span.appendChild(b);
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<span>ab<a>cd</a><b>ef</b></span>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        });
                    });
                    describe('with element not in DOM', () => {
                        it.skip('should add <a2>cd</a2> in <span>{<a1>ab</a1>}|</span>', async () => {
                            await load({ content: '<span></span>' }, async ctx => {
                                const span = ctx.editableNode.querySelector('span');
                                const a1 = document.createElement('a');
                                a1.append(document.createTextNode('ab'));
                                a1.classList.add('a1');
                                const a2 = document.createElement('a');
                                a2.append(document.createTextNode('cd'));
                                a2.classList.add('a2');

                                span.appendChild(a1);
                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    span.appendChild(a2);
                                });

                                const result = await renderEditable(ctx.editor);
                                expect(result).to.equal('<span><a class="a2">cd</a></span>');
                                expect(ctx.editableNode.innerHTML).to.equal(
                                    '<div><span><a class="a1">ab</a><a class="a2">cd</a></span></div>',
                                );
                            });
                        });
                        it.skip('should add <a2>cd</a2> in <span>{<a1>ab</a1>}xx</span>', async () => {
                            await load({ content: '<span>xx</span>' }, async ctx => {
                                const span = ctx.editableNode.querySelector('span');
                                const a1 = document.createElement('a');
                                a1.append(document.createTextNode('ab'));
                                a1.classList.add('a1');
                                const a2 = document.createElement('a');
                                a2.append(document.createTextNode('cd'));
                                a2.classList.add('a2');

                                span.appendChild(a1);
                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    span.appendChild(a2);
                                });

                                const result = await renderEditable(ctx.editor);
                                expect(result).to.equal('<span>xx<a class="a2">cd</a></span>');
                                expect(ctx.editableNode.innerHTML).to.equal(
                                    '<span>xx<a class="a1">ab</a><a class="a2">cd</a></span>',
                                );
                            });
                        });
                        it.skip('should add <a2>ef</a2><a3>gh</a3> in <span>ab{<a1>cd</a1>}|</span>', async () => {
                            await load({ content: '<span>ab</span>' }, async ctx => {
                                const span = ctx.editableNode.querySelector('span');
                                const a1 = document.createElement('a');
                                a1.classList.add('a1');
                                a1.append(document.createTextNode('cd'));
                                const a2 = document.createElement('a');
                                a2.classList.add('a2');
                                a2.append(document.createTextNode('ef'));
                                const a3 = document.createElement('a');
                                a3.append(document.createTextNode('gh'));
                                a3.classList.add('a3');

                                // because the text is not in a transaction, it
                                // should not be in the VDOC
                                span.appendChild(a1);
                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    span.append(a2);
                                });
                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    a1.after(a3);
                                });

                                const result = await renderEditable(ctx.editor);
                                expect(result).to.equal(
                                    'ab<span><a class="a3">gh</a><a class="a2">ef</a></span>',
                                );
                                expect(ctx.editableNode.innerHTML).to.equal(
                                    'ab<span><a class="a1">cd</a><a class="a3">gh</a><a class="a2">ef</a></span>',
                                );
                            });
                        });
                    });
                });
            });
        });
        describe('remove', () => {
            it('should remove <div>a[<div1>b</div1>]c</div>', async () => {
                await load({ content: '<div>a<div class="div1">b</div>c</div>' }, async ctx => {
                    const div1 = document.querySelector('.div1');
                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                        div1.remove();
                    });

                    const result = await renderEditable(ctx.editor);
                    const expectedResult = '<div>ac</div>';
                    expect(result).to.equal(expectedResult);
                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                });
            });
            it('should remove <div>a[<span>b</span>]c</div>', async () => {
                await load({ content: '<div>a<span>b</span>c</div>' }, async ctx => {
                    const span = document.querySelector('span');
                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                        span.remove();
                    });

                    const result = await renderEditable(ctx.editor);
                    const expectedResult = '<div>ac</div>';
                    expect(result).to.equal(expectedResult);
                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                });
            });
            it('should remove <div>[a]<span>b</span>c</div>', async () => {
                await load({ content: '<div>a<span>b</span>c</div>' }, async ctx => {
                    const div = document.querySelector('div');
                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                        div.firstChild.remove();
                    });

                    const result = await renderEditable(ctx.editor);
                    const expectedResult = '<div><span>b</span>c</div>';
                    expect(result).to.equal(expectedResult);
                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                });
            });
            it('should remove <span>a[<span1>b</span1>]c</span>', async () => {
                await load(
                    { content: '<span>a<span class="span1">b</span>c</span>' },
                    async ctx => {
                        const span1 = document.querySelector('.span1');
                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            span1.remove();
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<span>ac</span>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    },
                );
            });
            it.skip('should remove <span>a<span1>[b]<b>c</b></span1>d</span>', async () => {
                await load(
                    { content: '<span>a<span class="span1">b<b>c</b></span>d</span>' },
                    async ctx => {
                        const span1 = document.querySelector('.span1');
                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            span1.firstChild.remove();
                        });

                        const result = await renderEditable(ctx.editor);
                        expect(
                            ctx.editableVNode.descendants(
                                n => n instanceof InlineNode && n.length === 0,
                            ),
                        ).to.be.length(0);
                        const expectedResult = '<span>a<span class="span1"><b>c</b></span>d</span>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    },
                );
            });
            it('should remove <span>a<span1>[b]</span1>c</span> and keeping span1 empty', async () => {
                await load(
                    { content: '<span>a<span class="span1">b</span>c</span>' },
                    async ctx => {
                        const span1 = document.querySelector('.span1');
                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            span1.firstChild.remove();
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<span>a<span class="span1"></span>c</span>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    },
                );
            });
        });
        describe('infer add', () => {
            it('should move <a>ab</a> into new <b></b> into <div><a>ab</a>|</div>', async () => {
                await load(
                    {
                        content: '<div><a>ab</a></div>',
                    },
                    async ctx => {
                        const div = ctx.editableNode.querySelector('div');
                        const a = ctx.editableNode.querySelector('a');
                        const b = document.createElement('b');

                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            b.append(a);
                            div.append(b);
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<div><b><a>ab</a></b></div>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.querySelector('a')).to.equal(a);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    },
                );
            });
        });
        describe('replace', () => {
            describe('text with text', () => {
                it('should replace with "xx" <a>[ab]<b>cd<i>ef</i>gh</b>ij</a>', async () => {
                    await load({ content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' }, async ctx => {
                        const a = document.querySelector('a');
                        const xx = document.createTextNode('xx');
                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            a.firstChild.remove();
                            a.prepend(xx);
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<a>xx<b>cd<i>ef</i>gh</b>ij</a>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    });
                });
                it('should replace with "xx" <a>ab<b>[cd]<i>ef</i>gh</b>ij</a>', async () => {
                    await load({ content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' }, async ctx => {
                        const b = document.querySelector('b');
                        const xx = document.createTextNode('xx');
                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            b.firstChild.remove();
                            b.prepend(xx);
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<a>ab<b>xx<i>ef</i>gh</b>ij</a>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    });
                });
                it('should replace with "xx" <a>ab<b>cd<i>[ef]</i>gh</b>ij</a>', async () => {
                    await load({ content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' }, async ctx => {
                        const i = document.querySelector('i');
                        const xx = document.createTextNode('xx');
                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            i.firstChild.remove();
                            i.prepend(xx);
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<a>ab<b>cd<i>xx</i>gh</b>ij</a>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    });
                });
                it('should replace with "xx" <a>ab<b>cd<i>ef</i>[gh]</b>ij</a>', async () => {
                    await load({ content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' }, async ctx => {
                        const b = document.querySelector('b');
                        const xx = document.createTextNode('xx');
                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            b.lastChild.remove();
                            b.append(xx);
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<a>ab<b>cd<i>ef</i>xx</b>ij</a>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    });
                });
                it('should replace with "xx" <a>ab<b>cd<i>ef</i>gh</b>[ij]</a>', async () => {
                    await load({ content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' }, async ctx => {
                        const a = document.querySelector('a');
                        const xx = document.createTextNode('xx');
                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            a.lastChild.remove();
                            a.append(xx);
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<a>ab<b>cd<i>ef</i>gh</b>xx</a>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    });
                });
            });
            describe('text with inline', () => {
                it('should replace with "<q>xx</q>" <a>[ab]<b>cd<i>ef</i>gh</b>ij</a>', async () => {
                    await load({ content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' }, async ctx => {
                        const a = document.querySelector('a');
                        const q = document.createElement('q');
                        q.innerHTML = 'xx';

                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            a.firstChild.remove();
                            a.prepend(q);
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<a><q>xx</q><b>cd<i>ef</i>gh</b>ij</a>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    });
                });
                it('should replace with "<q>xx</q>" <a>ab<b>[cd]<i>ef</i>gh</b>ij</a>', async () => {
                    await load({ content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' }, async ctx => {
                        const b = document.querySelector('b');
                        const q = document.createElement('q');
                        q.innerHTML = 'xx';

                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            b.firstChild.remove();
                            b.prepend(q);
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<a>ab<b><q>xx</q><i>ef</i>gh</b>ij</a>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    });
                });
                it('should replace with "<q>xx</q>" <a>ab<b>cd<i>[ef]</i>gh</b>ij</a>', async () => {
                    await load({ content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' }, async ctx => {
                        const i = document.querySelector('i');
                        const q = document.createElement('q');
                        q.innerHTML = 'xx';

                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            i.firstChild.remove();
                            i.prepend(q);
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<a>ab<b>cd<i><q>xx</q></i>gh</b>ij</a>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    });
                });
                it('should replace with "<q>xx</q>" <a>ab<b>cd<i>ef</i>[gh]</b>ij</a>', async () => {
                    await load({ content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' }, async ctx => {
                        const b = document.querySelector('b');
                        const q = document.createElement('q');
                        q.innerHTML = 'xx';

                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            b.lastChild.remove();
                            b.append(q);
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<a>ab<b>cd<i>ef</i><q>xx</q></b>ij</a>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    });
                });
                it('should replace with "<q>xx</q>" <a>ab<b>cd<i>ef</i>gh</b>[ij]</a>', async () => {
                    await load({ content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' }, async ctx => {
                        const a = document.querySelector('a');
                        const q = document.createElement('q');
                        q.innerHTML = 'xx';

                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            a.lastChild.remove();
                            a.append(q);
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<a>ab<b>cd<i>ef</i>gh</b><q>xx</q></a>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    });
                });
            });
        });

        describe('inline with text', () => {
            it('should replace with "xx" <a>ab<b>cd[<i>ef</i>]gh</b>ij</a>', async () => {
                await load({ content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' }, async ctx => {
                    const i = document.querySelector('i');
                    const xx = document.createTextNode('xx');
                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                        i.replaceWith(xx);
                    });

                    const result = await renderEditable(ctx.editor);
                    const expectedResult = '<a>ab<b>cdxxgh</b>ij</a>';
                    expect(result).to.equal(expectedResult);
                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                });
            });
            it('should replace with "xx" <a>ab[<b>cd<i>ef</i>gh</b>]ij</a>', async () => {
                await load({ content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' }, async ctx => {
                    const b = document.querySelector('b');
                    const xx = document.createTextNode('xx');
                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                        b.replaceWith(xx);
                    });

                    const result = await renderEditable(ctx.editor);
                    const expectedResult = '<a>abxxij</a>';
                    expect(result).to.equal(expectedResult);
                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                });
            });
        });

        describe('inline with inline', () => {
            it('should replace with "<q>xx</q>" <a>ab<b>cd[<i>ef</i>]gh</b>ij</a>', async () => {
                await load({ content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' }, async ctx => {
                    const i = document.querySelector('i');
                    const q = document.createElement('q');
                    q.innerHTML = 'xx';

                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                        i.replaceWith(q);
                    });

                    const result = await renderEditable(ctx.editor);
                    const expectedResult = '<a>ab<b>cd<q>xx</q>gh</b>ij</a>';
                    expect(result).to.equal(expectedResult);
                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                });
            });
            it('should replace with "<q>xx</q>" <a>ab[<b>cd<i>ef</i>gh</b>]ij</a>', async () => {
                await load({ content: '<a>ab<b>cd<i>ef</i>gh</b>ij</a>' }, async ctx => {
                    const b = document.querySelector('b');
                    const q = document.createElement('q');
                    q.innerHTML = 'xx';

                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                        b.replaceWith(q);
                    });

                    const result = await renderEditable(ctx.editor);
                    const expectedResult = '<a>ab<q>xx</q>ij</a>';
                    expect(result).to.equal(expectedResult);
                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                });
            });
        });
        describe('move', () => {
            describe('with inline', () => {
                describe('flat inline', () => {
                    it.skip('should move <a>ab<b>cd[<i>ef</i>]gh</b>ij</a><q>k<s>l<u>m|</u>n</s>o</q>', async () => {
                        await load(
                            {
                                content:
                                    '<div><a>ab<b>cd<i>ef</i>gh</b>ij</a><q>k<s>l<u>m</u>n</s>o</q></div>',
                            },
                            async ctx => {
                                const i = document.querySelector('i');
                                const u = document.querySelector('u');

                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    u.appendChild(i);
                                });

                                const result = await renderEditable(ctx.editor);
                                const expectedResult =
                                    '<div><a>ab<b>cdgh</b>ij</a><q>k<s>l<u>m<i>ef</i></u>n</s>o</q></div>';
                                expect(result).to.equal(expectedResult);
                                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                            },
                        );
                    });
                    it('should move <a>ab<b>cd[<i>ef</i>]gh</b>ij</a><q>k<s>l<u>m</u>|n</s>o</q>', async () => {
                        await load(
                            {
                                content:
                                    '<div><a>ab<b>cd<i>ef</i>gh</b>ij</a><q>k<s>l<u>m</u>n</s>o</q></div>',
                            },
                            async ctx => {
                                const i = document.querySelector('i');
                                const s = document.querySelector('s');

                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    s.lastChild.before(i);
                                });

                                const result = await renderEditable(ctx.editor);
                                const expectedResult =
                                    '<div><a>ab<b>cdgh</b>ij</a><q>k<s>l<u>m</u><i>ef</i>n</s>o</q></div>';
                                expect(result).to.equal(expectedResult);
                                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                            },
                        );
                    });
                    it('should move <a>ab<b>cd[<i>ef</i>]gh</b>ij</a><q>k<s>l<u>m</u>n|</s>o</q>', async () => {
                        await load(
                            {
                                content:
                                    '<div><a>ab<b>cd<i>ef</i>gh</b>ij</a><q>k<s>l<u>m</u>n</s>o</q></div>',
                            },
                            async ctx => {
                                const i = document.querySelector('i');
                                const s = document.querySelector('s');

                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    s.append(i);
                                });

                                const result = await renderEditable(ctx.editor);
                                const expectedResult =
                                    '<div><a>ab<b>cdgh</b>ij</a><q>k<s>l<u>m</u>n<i>ef</i></s>o</q></div>';
                                expect(result).to.equal(expectedResult);
                                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                            },
                        );
                    });
                });
                describe('nested inline', () => {
                    it.skip('should move <a>ab[<b>cd<i>ef</i>gh</b>]ij</a><q>k<s>l<u>m|</u>n</s>o</q>', async () => {
                        await load(
                            {
                                content:
                                    '<div><a>ab<b>cd<i>ef</i>gh</b>ij</a><q>k<s>l<u>m</u>n</s>o</q></div>',
                            },
                            async ctx => {
                                const b = document.querySelector('b');
                                const u = document.querySelector('u');

                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    u.appendChild(b);
                                });

                                const result = await renderEditable(ctx.editor);
                                const expectedResult =
                                    '<div><a>abij</a><q>k<s>l<u>m<b>cd<i>ef</i>gh</b></u>n</s>o</q></div>';
                                expect(result).to.equal(expectedResult);
                                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                            },
                        );
                    });
                    it('should move <a>ab[<b>cd<i>ef</i>gh</b>]ij</a><q>k<s>l<u>m</u>|n</s>o</q>', async () => {
                        await load(
                            {
                                content:
                                    '<div><a>ab<b>cd<i>ef</i>gh</b>ij</a><q>k<s>l<u>m</u>n</s>o</q></div>',
                            },
                            async ctx => {
                                const b = document.querySelector('b');
                                const s = document.querySelector('s');

                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    s.lastChild.before(b);
                                });

                                const result = await renderEditable(ctx.editor);
                                const expectedResult =
                                    '<div><a>abij</a><q>k<s>l<u>m</u><b>cd<i>ef</i>gh</b>n</s>o</q></div>';
                                expect(result).to.equal(expectedResult);
                                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                            },
                        );
                    });
                    it('should move <a>ab[<b>cd<i>ef</i>gh</b>]ij</a><q>k<s>l<u>m</u>n|</s>o</q>', async () => {
                        await load(
                            {
                                content:
                                    '<div><a>ab<b>cd<i>ef</i>gh</b>ij</a><q>k<s>l<u>m</u>n</s>o</q></div>',
                            },
                            async ctx => {
                                const b = document.querySelector('b');
                                const s = document.querySelector('s');

                                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                    s.append(b);
                                });

                                const result = await renderEditable(ctx.editor);
                                const expectedResult =
                                    '<div><a>abij</a><q>k<s>l<u>m</u>n<b>cd<i>ef</i>gh</b></s>o</q></div>';
                                expect(result).to.equal(expectedResult);
                                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                            },
                        );
                    });
                });
            });
        });
        describe('mixed', () => {
            it.skip('should move and add <s>gh</s> in <div><a>[<b>ab<i>cd</i>|</b>]<q>ef</q>|</a></div>', async () => {
                await load(
                    {
                        content: '<div><a><b>ab<i>cd</i></b><q>ef</q></a></div>',
                    },
                    async ctx => {
                        const a = document.querySelector('a');
                        const b = document.querySelector('b');
                        const s = document.createElement('s');
                        s.innerText = 'gh';

                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            b.append(s);
                            a.append(b);
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult =
                            '<div><a>ab<b>cdgh</b>ij</a><q>k<s>l<u>m<i>ef</i></u>n</s>o</q></div>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    },
                );
            });
        });
        it('mouve move and change attribute', async () => {
            await load(
                {
                    content: '<div><a>ab<b>cd</b></a><i>ef</i></div>',
                },
                async ctx => {
                    const a = document.querySelector('a');
                    const b = document.querySelector('b');
                    const i = document.querySelector('i');

                    await withDomMutations(ctx.editor, ctx.editableNode, () => {
                        a.setAttribute('attr1', 'val1');
                        i.appendChild(b);
                    });

                    const result = await renderEditable(ctx.editor);
                    const expectedResult = '<div><a attr1="val1">ab</a><i>ef<b>cd</b></i></div>';
                    expect(result).to.equal(expectedResult);
                    expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                },
            );
        });
    });
    describe('characterData', () => {
        it('should change with "cd" in <div>[ab]</div>', async () => {
            await load({ content: '<div>ab</div>' }, async ctx => {
                const div = document.querySelector('div');
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    div.firstChild.textContent = 'cd';
                });

                const result = await renderEditable(ctx.editor);
                const expectedResult = '<div>cd</div>';
                expect(result).to.equal(expectedResult);
                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
            });
        });
        it('should change with "cd" in <span>[ab]</span>', async () => {
            await load({ content: '<span>ab</span>' }, async ctx => {
                const span = document.querySelector('span');
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    span.firstChild.textContent = 'cd';
                });

                const result = await renderEditable(ctx.editor);
                const expectedResult = '<span>cd</span>';
                expect(result).to.equal(expectedResult);
                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
            });
        });
        it('should add "gh" in <div><a>ab<b>cd|</b>ef</a></div>', async () => {
            await load({ content: '<div><a>ab<b>cd</b>ef</a></div>' }, async ctx => {
                const b = document.querySelector('b');
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    b.firstChild.textContent += 'gh';
                });

                const result = await renderEditable(ctx.editor);
                const expectedResult = '<div><a>ab<b>cdgh</b>ef</a></div>';
                expect(result).to.equal(expectedResult);
                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
            });
        });
        it('should change with "gh" in <div><a>ab<b>cd</b>[ef]</a></div>', async () => {
            await load({ content: '<div><a>ab<b>cd</b>ef</a></div>' }, async ctx => {
                const a = document.querySelector('a');
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    a.lastChild.textContent = 'gh';
                });

                const result = await renderEditable(ctx.editor);
                const expectedResult = '<div><a>ab<b>cd</b>gh</a></div>';
                expect(result).to.equal(expectedResult);
                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
            });
        });
        describe('with mixed operations', () => {
            it.skip('move "<i>ef</i>" then change "ef" to "pq" in <a>ab<b>cd<i>ef</i>gh|</b>ij</a>', () => {});
            it.skip('change "ef" to "kl" then move "<i>kl</i>"  in <a>ab<b>cd<i>ef</i>gh</b>|ij</a>', () => {});
            // TODO: make more tests with mixed operations
        });
        describe('space', () => {
            describe('without space around', () => {
                it('should change with " ef" in <div>ab <a>[cd]</a></div>', async () => {
                    await load({ content: '<div>ab <a>cd</a></div>' }, async ctx => {
                        const a = document.querySelector('a');
                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            a.firstChild.textContent = ' ef';
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<div>ab <a>ef</a></div>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    });
                });
                it('should change with "  ef  " in <div>ab <a>[cd]</a></div>', async () => {
                    await load({ content: '<div>ab <a>cd</a></div>' }, async ctx => {
                        const a = document.querySelector('a');
                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            a.firstChild.textContent = '  ef  ';
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<div>ab <a>ef</a></div>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    });
                });
                it('should change with "  gh  " in <div>ab <a>[cd]</a> ef</div>', async () => {
                    await load({ content: '<div>ab <a>cd</a> ef</div>' }, async ctx => {
                        const a = document.querySelector('a');
                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            a.firstChild.textContent = '  gh  ';
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<div>ab <a>gh</a> ef</div>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    });
                });
            });
            describe('with space around', () => {
                it.skip('should change with "  gh  " in <div>ab<a>[cd]</a>ef</div> with space around', async () => {
                    await load({ content: '<div>ab<a>cd</a>ef</div>' }, async ctx => {
                        const a = document.querySelector('a');
                        await withDomMutations(ctx.editor, ctx.editableNode, () => {
                            a.firstChild.textContent = '  gh  ';
                        });

                        const result = await renderEditable(ctx.editor);
                        const expectedResult = '<div>ab<a> gh </a>ef</div>';
                        expect(result).to.equal(expectedResult);
                        expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                    });
                });
                it.skip('should change with "  gh  " in <div>ab<a>  <i>  [cd]  </i>  </a>ef</div> with space around', async () => {
                    await load(
                        { content: '<div>ab<a>  <i>  [cd]  </i>  </a>ef</div>' },
                        async ctx => {
                            const a = document.querySelector('a');
                            await withDomMutations(ctx.editor, ctx.editableNode, () => {
                                a.firstChild.textContent = '  gh  ';
                            });

                            const result = await renderEditable(ctx.editor);
                            const expectedResult = '<div>ab<a> gh </a>ef</div>';
                            expect(result).to.equal(expectedResult);
                            expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                        },
                    );
                });
            });
        });
    });

    describe('move and change attributes', () => {
        it('should move in <div><a>ab<b>cd</b><a><i>ef</i></div>', async () => {
            await load({ content: '<div><a>ab<b>cd</b></a><i>ef</i></div>' }, async ctx => {
                const a = ctx.editableNode.querySelector('a');
                const b = ctx.editableNode.querySelector('b');
                const i = ctx.editableNode.querySelector('i');

                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    a.classList.add('a1');
                    b.classList.add('b1');
                    i.append(b);
                    a.classList.add('a2');
                    b.classList.add('b2');
                });

                const result = await renderEditable(ctx.editor);
                expect(result).to.equal(
                    '<div><a class="a1 a2">ab</a><i>ef<b class="b1 b2">cd</b></i></div>',
                );
            });
        });
    });

    describe('mixed add/remove/replace', () => {
        it('should wrap with <b><i></b></i> in <div><a>ab</a></div>', async () => {
            await load({ content: '<div><a>ab</a></div>' }, async ctx => {
                await withDomMutations(ctx.editor, ctx.editableNode, () => {
                    const div = ctx.editableNode.querySelector('div');
                    const a = ctx.editableNode.querySelector('a');
                    const b = document.createElement('b');
                    const i = document.createElement('i');
                    b.append(i);
                    i.append(a);
                    div.append(b);
                });

                const result = await renderEditable(ctx.editor);
                const expectedResult = '<div><b><i><a>ab</a></i></b></div>';
                expect(result).to.equal(expectedResult);
                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
            });
        });
    });
    describe('withDomMutation inside withDomMutation', () => {
        it('should only add once when a mutation is inside another mutation', async () => {
            await load({ content: '<div><span>ab</span></div>' }, async ctx => {
                const div = document.querySelector('div');
                const span = document.querySelector('span');
                const a = document.createElement('a');
                a.textContent = 'cd';
                await withDomMutations(ctx.editor, span, async context => {
                    await withDomMutations(
                        ctx.editor,
                        div,
                        () => {
                            span.appendChild(a);
                        },
                        context,
                    );
                });

                const result = await renderEditable(ctx.editor);
                const expectedResult = '<div><span>ab<a>cd</a></span></div>';
                expect(result).to.equal(expectedResult);
                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
                // throw new Error('find a way to assert');
            });
        });
        it('should discard the need to observe if a node is already included', async () => {
            await load({ content: '<div><span>ab</span></div>' }, async ctx => {
                const div = document.querySelector('div');
                const span = document.querySelector('span');
                const a = document.createElement('a');
                a.textContent = 'cd';
                await withDomMutations(ctx.editor, div, async context => {
                    await withDomMutations(
                        ctx.editor,
                        span,
                        () => {
                            span.appendChild(a);
                        },
                        context,
                    );
                });

                const result = await renderEditable(ctx.editor);
                const expectedResult = '<div><span>ab<a>cd</a></span></div>';
                expect(result).to.equal(expectedResult);
                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
            });
        });
        it('should discard the need to observe if a node is the same', async () => {
            await load({ content: '<div><span>ab</span></div>' }, async ctx => {
                const div = document.querySelector('div');
                const span = document.querySelector('span');
                const a = document.createElement('a');
                a.textContent = 'cd';
                await withDomMutations(ctx.editor, div, async context => {
                    await withDomMutations(
                        ctx.editor,
                        div,
                        () => {
                            span.appendChild(a);
                        },
                        context,
                    );
                });

                const result = await renderEditable(ctx.editor);
                const expectedResult = '<div><span>ab<a>cd</a></span></div>';
                expect(result).to.equal(expectedResult);
                expect(ctx.editableNode.innerHTML).to.equal(expectedResult);
            });
        });
        it.skip('should merge originalParents map when there is a nested mutation with a greater ancestor', async () => {
            throw new Error('implement me');
        });
    });
    it('should return what the callback return', async () => {
        await load({ content: '<div></div>' }, async ctx => {
            const result = await withDomMutations(ctx.editor, ctx.editableNode, () => {
                return 1;
            });

            expect(result).to.equal(1);
        });
    });
});
