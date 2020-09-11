/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import { MutationNormalizer } from '../src/MutationNormalizer';

async function nextTick(): Promise<void> {
    return new Promise((resolve): number => setTimeout(resolve));
}

describe('utils', () => {
    describe('MutationNormalizer', () => {
        let root: HTMLElement;
        let normalizer: MutationNormalizer;

        before(() => {
            root = document.createElement('root');
            document.body.appendChild(root);
            normalizer = new MutationNormalizer();
            normalizer.attach(root);
        });
        after(() => {
            document.body.removeChild(root);
            normalizer.destroy();
        });

        it('should auto-complete a word (mobile, chrome)', async () => {
            const p = document.createElement('p');
            const text = document.createTextNode('hell');
            root.innerHTML = '';
            root.appendChild(p);
            p.appendChild(text);

            await nextTick();

            normalizer.start();
            text.textContent = 'hello';

            await nextTick();

            expect(normalizer.getCharactersMapping(normalizer._mutations)).to.deep.equal({
                index: 4,
                insert: 'o',
                remove: '',
                current: {
                    chars: 'hello',
                    nodes: new Array(5).fill(text),
                    offsets: [...Array(5).keys()],
                },
                previous: {
                    chars: 'hell',
                    nodes: new Array(4).fill(text),
                    offsets: [...Array(4).keys()],
                },
            });
        });
        it('should auto-complete a word in string (mobile, chrome)', async () => {
            const p = document.createElement('p');
            const text = document.createTextNode('word hell other');
            root.innerHTML = '';
            root.appendChild(p);
            p.appendChild(text);

            await nextTick();

            normalizer.start();
            text.textContent = 'word hello other';

            await nextTick();

            expect(normalizer.getMutatedElements(normalizer._mutations)).to.deep.equal(
                new Set([text]),
            );
            expect(normalizer.getCharactersMapping(normalizer._mutations)).to.deep.equal({
                index: 9,
                insert: 'o',
                remove: '',
                current: {
                    chars: 'word hello other',
                    nodes: new Array(16).fill(text),
                    offsets: [...Array(16).keys()],
                },
                previous: {
                    chars: 'word hell other',
                    nodes: new Array(15).fill(text),
                    offsets: [...Array(15).keys()],
                },
            });
        });
        it('should auto-complete a word in string (firefox)', async () => {
            const p = document.createElement('p');
            const text = document.createTextNode('word hell other');
            root.innerHTML = '';
            root.appendChild(p);
            p.appendChild(text);

            await nextTick();

            normalizer.start();
            text.textContent = 'word  other';
            text.textContent = 'word   other';
            text.textContent = 'word  other';
            text.textContent = 'word   other';
            text.textContent = 'word  other';
            text.textContent = 'word hello other';

            await nextTick();

            expect(normalizer.getMutatedElements(normalizer._mutations)).to.deep.equal(
                new Set([text]),
            );
            expect(normalizer.getCharactersMapping(normalizer._mutations)).to.deep.equal({
                index: 5,
                insert: 'hello',
                remove: 'hell',
                current: {
                    chars: 'word hello other',
                    nodes: new Array(16).fill(text),
                    offsets: [...Array(16).keys()],
                },
                previous: {
                    chars: 'word hell other',
                    nodes: new Array(15).fill(text),
                    offsets: [...Array(15).keys()],
                },
            });
        });
        it('should auto-correct a word (mobile)', async () => {
            const p = document.createElement('p');
            const text = document.createTextNode('hillo');
            root.innerHTML = '';
            root.appendChild(p);
            p.appendChild(text);

            await nextTick();

            normalizer.start();
            text.textContent = 'hello';

            await nextTick();

            expect(normalizer.getCharactersMapping(normalizer._mutations)).to.deep.equal({
                index: 1,
                insert: 'e',
                remove: 'i',
                current: {
                    chars: 'hello',
                    nodes: new Array(5).fill(text),
                    offsets: [...Array(5).keys()],
                },
                previous: {
                    chars: 'hillo',
                    nodes: new Array(5).fill(text),
                    offsets: [...Array(5).keys()],
                },
            });
        });
        it('should auto-correct a word (chrome)', async () => {
            const init = 'And the mome rates outgrabe.';
            const result = 'And the mome raths\u00A0outgrabe.';
            const p = document.createElement('p');
            const text = document.createTextNode(init);
            root.innerHTML = '';
            root.appendChild(p);
            p.appendChild(text);

            await nextTick();

            normalizer.start();
            text.textContent = 'And the mome  outgrabe.';
            text.textContent = 'And the mome  outgrabe.';
            text.textContent = 'And the mome  outgrabe.';
            text.textContent = 'And the mome  outgrabe.';
            const text2 = document.createTextNode('And the mome ');
            p.insertBefore(text2, text);
            text.textContent = '\u00A0outgrabe.';
            const text3 = document.createTextNode('raths');
            p.insertBefore(text3, text);
            text2.textContent = 'And the mome';
            text2.textContent = 'And the mome raths';
            p.removeChild(text3);

            expect(p.textContent).to.deep.equal(result);

            await nextTick();

            expect(normalizer.getCharactersMapping(normalizer._mutations)).to.deep.equal({
                index: 13,
                insert: 'raths',
                remove: 'rates',
                current: {
                    chars: 'And the mome raths outgrabe.',
                    nodes: new Array(28).fill(text2, 0, 18).fill(text, 18),
                    offsets: [...Array(18).keys(), ...Array(10).keys()],
                },
                previous: {
                    chars: init,
                    nodes: new Array(28).fill(text),
                    offsets: [...Array(28).keys()],
                },
            });
        });
        it('should auto-correct a word at end (chrome)', async () => {
            root.innerHTML = '<p>slithy toves</p>';
            const p = root.firstChild;
            const text = p.firstChild;

            await nextTick();
            normalizer.start();
            text.textContent = 'slithy toes';
            await nextTick();

            expect(normalizer.getCharactersMapping(normalizer._mutations)).to.deep.equal({
                index: 9,
                insert: '',
                remove: 'v',
                current: {
                    chars: 'slithy toes',
                    nodes: new Array(11).fill(text),
                    offsets: [...Array(11).keys()],
                },
                previous: {
                    chars: 'slithy toves',
                    nodes: new Array(12).fill(text),
                    offsets: [...Array(12).keys()],
                },
            });
        });
        it('should auto-correct a word and remove chars (ubuntu chrome)', async () => {
            const p = document.createElement('p');
            const i = document.createElement('i');
            const text = document.createTextNode('a brillig b');
            root.innerHTML = '';
            root.appendChild(p);
            p.appendChild(i);
            i.appendChild(text);

            await nextTick();

            normalizer.start();
            text.textContent = 'a  b';
            text.textContent = 'a  b';
            text.textContent = 'a  b';
            text.textContent = 'a  b';
            const newText = document.createTextNode('a ');
            i.insertBefore(newText, text);
            text.textContent = ' b';
            const newText2 = document.createTextNode('brill');
            i.insertBefore(newText2, text);
            newText.textContent = 'a ';
            newText.textContent = 'a brill';
            i.removeChild(newText2);

            expect(p.textContent).to.deep.equal('a brill b');

            await nextTick();

            expect(normalizer.getCharactersMapping(normalizer._mutations)).to.deep.equal({
                index: 2,
                insert: 'brill',
                remove: 'brillig',
                current: {
                    chars: 'a brill b',
                    nodes: new Array(9).fill(newText, 0, 7).fill(text, 7),
                    offsets: [...Array(7).keys(), ...Array(2).keys()],
                },
                previous: {
                    chars: 'a brillig b',
                    nodes: new Array(11).fill(text),
                    offsets: [...Array(11).keys()],
                },
            });
        });
        it('should auto-correct a word at end of i tag (ubuntu chrome)', async () => {
            root.innerHTML = '<p><i>slithy toves</i></p>';
            const p = root.firstChild;
            const i = p.firstChild;
            const text = i.firstChild;

            await nextTick();

            normalizer.start();
            text.textContent = 'slithy ';
            text.textContent = 'slithy\u00A0';
            const text2 = document.createTextNode('toes');
            root.appendChild(text2);
            const br = document.createElement('br');
            root.insertBefore(br, text2);
            text2.textContent = '';
            root.removeChild(text2);
            root.removeChild(br);
            const span = document.createElement('span');
            const text3 = document.createTextNode('toes');
            span.appendChild(text3);
            p.appendChild(span);
            p.insertBefore(text3, span);
            p.insertBefore(span, text3);
            p.removeChild(span);
            const i2 = document.createElement('i');
            p.insertBefore(i2, text3);
            i2.appendChild(text3);
            i2.insertBefore(text, text3);
            p.removeChild(i);

            await nextTick();

            expect(normalizer.getCharactersMapping(normalizer._mutations)).to.deep.equal({
                index: 7,
                insert: 'toes',
                remove: 'toves',
                current: {
                    chars: 'slithy toes',
                    nodes: [...Array(7).fill(text), ...Array(4).fill(text3)],
                    offsets: [...Array(7).keys(), ...Array(4).keys()],
                },
                previous: {
                    chars: 'slithy toves',
                    nodes: new Array(12).fill(text),
                    offsets: [...Array(12).keys()],
                },
            });
        });
        it('should auto-correct a word (safari)', async () => {
            const init = 'And the mome rates outgrabe.';
            const result = 'And the mome raths outgrabe.';
            const p = document.createElement('p');
            const text = document.createTextNode(init);
            root.innerHTML = '';
            root.appendChild(p);
            p.appendChild(text);

            await nextTick();

            normalizer.start();
            text.textContent = 'And the mome outgrabe.';
            text.textContent = 'And the mome raths outgrabe.';

            await nextTick();

            expect(normalizer.getCharactersMapping(normalizer._mutations)).to.deep.equal({
                index: 13,
                insert: 'raths',
                remove: 'rates',
                current: {
                    chars: result,
                    nodes: new Array(28).fill(text),
                    offsets: [...Array(28).keys()],
                },
                previous: {
                    chars: init,
                    nodes: new Array(28).fill(text),
                    offsets: [...Array(28).keys()],
                },
            });
        });
        it('should auto-correct a word in tag <i> (safari)', async () => {
            const init = 'And the mome rates outgrabe.';
            const result = 'And the mome raths outgrabe.';
            const p = document.createElement('p');
            const i = document.createElement('i');
            const text = document.createTextNode(init);
            root.innerHTML = '';

            i.appendChild(text);
            p.appendChild(i);
            root.appendChild(p);

            await nextTick();

            normalizer.start();
            text.textContent = 'And the mome outgrabe.';
            text.textContent = 'And the mome outgrabe.';
            text.textContent = 'And the mome  outgrabe.';
            text.textContent = 'And the mome outgrabe.';
            text.textContent = 'And the mome  outgrabe.';
            const text2 = document.createTextNode('And the mome ');
            i.append(text2);
            text.textContent = ' outgrabe.';
            const raths = document.createTextNode('raths');
            i.insertBefore(raths, text);
            p.insertBefore(text2, i);
            p.insertBefore(raths, i);
            p.insertBefore(text, i);
            p.removeChild(i);
            const span = document.createElement('span');
            p.appendChild(span);
            p.removeChild(span);
            const newI = document.createElement('i');
            p.appendChild(newI);
            newI.appendChild(text2);
            p.appendChild(span);
            p.removeChild(span);
            const newI2 = document.createElement('i');
            newI2.appendChild(text2);
            p.appendChild(newI2);
            newI2.appendChild(text);
            p.appendChild(span);
            p.removeChild(span);
            const newI3 = document.createElement('i');
            p.appendChild(newI3);
            newI3.appendChild(raths);
            newI2.appendChild(raths);
            p.removeChild(newI3);
            newI2.appendChild(text2);
            p.removeChild(newI);
            text2.textContent = 'And the mome raths';
            newI2.removeChild(raths);
            text2.textContent = result;
            newI2.removeChild(text);

            expect(p.textContent).to.deep.equal(result);

            await nextTick();

            expect(normalizer.getCharactersMapping(normalizer._mutations)).to.deep.equal({
                index: 13,
                insert: 'raths',
                remove: 'rates',
                current: {
                    chars: result,
                    nodes: new Array(28).fill(text2),
                    offsets: [...Array(28).keys()],
                },
                previous: {
                    chars: init,
                    nodes: new Array(28).fill(text),
                    offsets: [...Array(28).keys()],
                },
            });
        });
        it('should define the change in repeat completion (SwiftKey)', async () => {
            const p = document.createElement('p');
            const text = document.createTextNode('Ha ha ha ha ha');
            root.innerHTML = '';
            root.appendChild(p);
            p.appendChild(text);

            await nextTick();

            normalizer.start();
            text.textContent = 'Ha ha ha haha ha';
            text.textContent = 'Ha ha ha ha ha ha';

            await nextTick();

            expect(normalizer.getCharactersMapping(normalizer._mutations)).to.deep.equal({
                index: -1,
                insert: 'ha ',
                remove: '',
                current: {
                    chars: 'Ha ha ha ha ha ha',
                    nodes: new Array(17).fill(text),
                    offsets: [...Array(17).keys()],
                },
                previous: {
                    chars: 'Ha ha ha ha ha',
                    nodes: new Array(14).fill(text),
                    offsets: [...Array(14).keys()],
                },
            });
        });
        it('add space (SwiftKey)', async () => {
            const p = document.createElement('p');
            const text = document.createTextNode('a hello');
            root.innerHTML = '';
            root.appendChild(p);
            p.appendChild(text);

            await nextTick();

            normalizer.start();
            text.textContent = 'a hello';
            text.textContent = 'a hello ';

            await nextTick();

            expect(normalizer.getCharactersMapping(normalizer._mutations)).to.deep.equal({
                index: 7,
                insert: ' ',
                remove: '',
                current: {
                    chars: 'a hello ',
                    nodes: new Array(8).fill(text),
                    offsets: [...Array(8).keys()],
                },
                previous: {
                    chars: 'a hello',
                    nodes: new Array(7).fill(text),
                    offsets: [...Array(7).keys()],
                },
            });
        });
    });
});
