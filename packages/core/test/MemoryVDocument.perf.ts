/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { DomEditable } from '../../plugin-dom-editable/src/DomEditable';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';

describe('test performances', () => {
    describe('stores', () => {
        describe('Memory / VDocument', () => {
            let wrapper: HTMLElement;
            let editor: BasicEditor;

            beforeEach(async () => {
                wrapper = document.createElement('test-wrapper');
                wrapper.style.display = 'block';
                document.body.appendChild(wrapper);
                const root = document.createElement('div');
                root.innerHTML = `<h1>Jabberwocky</h1>
                    <h3>by Lewis Carroll</h3>
                    <p><i>’Twas brillig, and the slithy toves<br/>
                    Did gyre and gimble in the wabe:<br/>
                    All mimsy were the borogoves,<br/>
                    And the mome raths outgrabe.<br/>
                    <br/>
                    “Beware the Jabberwock, my son!<br/>
                    The jaws that bite, the claws that catch!<br/>
                    Beware the Jubjub bird, and shun<br/>
                    The frumious Bandersnatch!”<br/>
                    <br/>
                    He took his vorpal sword in hand;<br/>
                    Long time the manxome foe he sought—<br/>
                    So rested he by the Tumtum tree<br/>
                    And stood awhile in thought.<br/>
                    <br/>
                    And, as in uffish thought he stood,<br/>
                    The Jabberwock, with eyes of flame,<br/>
                    Came whiffling through the tulgey wood,<br/>
                    And burbled as it came!<br/>
                    <br/>
                    One, two! One, two! And through and through<br/>
                    The vorpal blade went snicker-snack!<br/>
                    He left it dead, and with its head<br/>
                    He went galumphing back.<br/>
                    <br/>
                    “And hast thou slain the Jabberwock?<br/>
                    Come to my arms, my beamish boy!<br/>
                    O frabjous day! Callooh! Callay!”<br/>
                    He chortled in his joy.<br/>
                    <br/>
                    ’Twas brillig, and the slithy toves<br/>
                    Did gyre and gimble in the wabe:<br/>
                    All mimsy were the borogoves,<br/>
                    And the mome raths outgrabe.<br/></i></p>`;
                wrapper.appendChild(root);

                editor = new BasicEditor();
                editor.configure(DomLayout, { location: [root, 'replace'] });
                editor.configure(DomEditable, { source: root });
                await editor.start();
            });
            afterEach(async () => {
                editor.stop();
                document.body.removeChild(wrapper);
            });

            it('should split a paragraph in two', async () => {
                // Parse the editable in the internal format of the editor.
                const memory = editor.memory;
                const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const editable = domEngine.components.get('editable')[0];
                editor.selection.setAt(editable.children()[2].children()[500]);

                memory.linkToMemory(editable);
                memory.create('root').switchTo('root');

                expect(editable.children().length).to.equal(3);
                memory.create('test').switchTo('test');
                await editor.execCommand('insertParagraphBreak');
                expect(editable.children().length).to.equal(4);

                const t1 = [];
                const t2 = [];
                for (let k = 2; k < 26; k++) {
                    let d = Date.now();
                    memory
                        .switchTo('root')
                        .create(k.toString())
                        .switchTo(k.toString());
                    t1.push(Date.now() - d);

                    d = Date.now();
                    await editor.execCommand('insertParagraphBreak');
                    t2.push(Date.now() - d);
                }

                // We remove the first load because it does not represent time in
                // use. In fact, time is much longer because the functions and
                // object are not yet loaded. The loading test is done separately.
                t1.shift();
                t2.shift();

                const averageInsert = Math.round(t2.reduce((a, b) => a + b) / t2.length);
                expect(averageInsert).to.lessThan(30, 'Time to compute the insert paragraph');

                const averageSwitch = Math.round(t1.reduce((a, b) => a + b) / t1.length);
                expect(averageSwitch).to.lessThan(1, 'Time to switch the memory');
            });
        });
    });
});
