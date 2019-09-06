import { EventNormalizer } from '../src/core/utils/EventNormalizer';
import * as sinon from 'sinon';
import { _triggerTextInput, nextTick, triggerEvents } from './utils/EventUtils';
import { expect } from 'chai';

describe('EventNormalizer', () => {
    // this.value = "<p>.◆.</p>";
    // this.updatedValue = "<p>.iô</p><p>◆.</p>";
    // this.updatedDom = "<p>.iô</p><p>.</p>";

    // this.completion = "<p>.chi◆.</p>";
    // this.completionValue = "<p>.Christophe ◆.</p>";
    // this.completionDom = "<p>.Christophe .</p>";

    // this.completionBold = "<p>.<b>chr</b>is◆ .</p>";
    // this.completionBoldValue = "<p>.<b>Christophe</b> ◆.</p>";
    // this.completionBoldDom = "<p>.<b>Christophe</b> .</p>";

    const editable = document.createElement('div');
    editable.innerHTML = 'hello';
    editable.setAttribute('contenteditable', 'true');

    document.body.appendChild(editable);

    (window as any)._triggerTextInput = _triggerTextInput;

    describe('later', () => {
        // describe('constructor()', () => {
        //     const triggerFunction = jest.fn();
        //     new EventNormalizer(editable, triggerFunction);
        //     //trigger native event (a)
        //     //trigger native event (a)
        // });
        // describe('destroy()', () => {
        //     it('should remove the event listener and stop triggering', () => {
        //         new EventNormalizer();
        //     });
        // });
    });

    describe('Events', () => {
        // beforeAll(() => {
        // });
        describe('insert', () => {
            it('insert "char"', () => {
                // const triggerFunction = sinon.fake();
                const triggerFunction = function(e, params): void {
                    console.log('event happen', e, params);
                };
                // console.log('foo');
                // console.log('foo');
                // const triggerFunction = jest.fn();
                const normalizer = new EventNormalizer(editable, triggerFunction);
                _triggerTextInput(editable, 'a', 'a');
                normalizer.destroy();

                //trigger native events keydown 'a', keyup 'a'
                // expect trigger to be called once
                // expect trigger to be called with 'insert a'

                // expect dom to be 'a'
                // ? expect arch to be 'a'?
            });
        });
    });

    describe('later', () => {
        it('Multikeypress', () => {
            // var ev;
            // var Test = this.dependencies.Test;
            // await Test.setValue("<p>aaa◆</p>");
            // await this.triggerEvent([
            //     // key down char without key up
            //     ['keydown', {
            //         key: 'i',
            //         charCode: 0,
            //         keyCode: 73,
            //     }],
            //     ['keypress', {
            //         key: 'i',
            //         charCode: 105,
            //         keyCode: 105,
            //     }],
            //     ['beforeInput', {
            //         data: 'i',
            //     }],
            //     ['input', {
            //         data: 'i',
            //         insert: 'i',
            //         inputType: 'textInput',
            //     }],
            // ]);
            // await nextTick();
            // await this.triggerEvent([
            //     // Backspace down char without key up
            //     ['keydown', {
            //         key: 'Backspace',
            //         charCode: 0,
            //         keyCode: 8,
            //     }],
            //     ['beforeInput', {
            //         inputType: 'deleteContentBackward',
            //     }],
            //     ['input', {
            //         inputType: 'deleteContentBackward',
            //     }],
            // ]);
            // await nextTick();
            // await this.triggerEvent([
            //     // Space down char without key up
            //     ['keydown', {
            //         key: ' ',
            //         charCode: 0,
            //         keyCode: 32,
            //     }],
            //     ['keypress', {
            //         key: ' ',
            //         charCode: 32,
            //         keyCode: 32,
            //     }],
            //     ['beforeInput', {
            //         data: ' ',
            //     }],
            //     ['input', {
            //         data: ' ',
            //         insert: ' ',
            //         inputType: 'textInput',
            //     }],
            // ]);
            // await nextTick();
            // await this.triggerEvent([
            //     // keyup
            //     ['keyup', {
            //         key: 'i',
            //         charCode: 0,
            //         keyCode: 73,
            //     }],
            // ]);
            // await nextTick();
            // await this.triggerEvent([
            //     ['keyup', {
            //         key: 'Backspace',
            //         charCode: 0,
            //         keyCode: 8,
            //     }],
            // ]);
            // await nextTick();
            // await this.triggerEvent([
            //     ['keyup', {
            //         key: ' ',
            //         charCode: 0,
            //         keyCode: 32,
            //     }],
            // ]);
            // await nextTick();
            // assert.strictEqual(this.dependencies.Test.getValue(), "<p>aaa&nbsp;◆</p>", "Should insert a space in the Arch");
            // assert.strictEqual(this.dependencies.Test.getDomValue(), "<p>aaa&nbsp;</p>", "Should insert a space in the DOM");
        });
        it('MultikeypressCTRLA', () => {
            // var ev;
            // var Test = this.dependencies.Test;
            // await Test.setValue("<p>aaa◆</p>");
            // await this.triggerEvent([
            //     ['keydown', {
            //         key: 'Control',
            //         charCode: 0,
            //         keyCode: 17,
            //         ctrlKey: true,
            //     }],
            // ]);
            // await new Promise(setTimeout);
            // await this.triggerEvent([
            //     ['keydown', {
            //         key: 'a',
            //         charCode: 0,
            //         keyCode: 65,
            //         ctrlKey: true,
            //     }],
            //     ['keypress', {
            //         key: 'a',
            //         charCode: 1,
            //         keyCode: 1,
            //         ctrlKey: true,
            //     }],
            // ]);
            // await new Promise(setTimeout);
            // await this.triggerEvent([
            //     ['keyup', {
            //         key: 'a',
            //         charCode: 0,
            //         keyCode: 73,
            //         ctrlKey: true,
            //     }],
            // ]);
            // await new Promise(setTimeout);
            // await this.triggerEvent([
            //     ['keyup', {
            //         key: 'Control',
            //         charCode: 0,
            //         keyCode: 17,
            //     }],
            // ]);
            // await new Promise(setTimeout);
            // assert.strictEqual(this.dependencies.Test.getValue(), "<p>▶aaa◀</p>", "Should select all in the Arch");
            // assert.strictEqual(this.dependencies.Test.getDomValue(), "<p>aaa</p>", "Should select all in the DOM without changes");
        });
        it('AccentUbuntuChrome', async function() {
            const triggerFunction = sinon.fake();
            const trigger1 = function(...args): void {
                console.log('event, params', args);
                triggerFunction.apply(triggerFunction, args);
            };
            const normalizer = new EventNormalizer(editable, trigger1);
            this.timeout(10000);

            // ?setvalue of something?
            // i
            await triggerEvents(editable, [
                {
                    nativeEventType: 'keydown',
                    key: 'i',
                    charCode: 0,
                    keyCode: 73,
                },
                {
                    nativeEventType: 'keypress',
                    key: 'i',
                    charCode: 105,
                    keyCode: 105,
                },
                {
                    nativeEventType: 'beforeInput',
                    data: 'i',
                },
                {
                    nativeEventType: 'input',
                    data: 'i',
                    insert: 'i',
                    inputType: 'textInput',
                },
            ]);

            await nextTick();
            expect(triggerFunction.callCount).to.equal(1);
            expect(triggerFunction.getCall(0).args[0]).to.equal('insert');
            expect(triggerFunction.getCall(0).args[1]).to.equal('i');

            await triggerEvents(editable, [
                {
                    nativeEventType: 'keyup',
                    key: 'i',
                    charCode: 0,
                    keyCode: 73,
                },
            ]);
            await nextTick();
            expect(triggerFunction.callCount).to.equal(1);
            // ^
            await triggerEvents(editable, [
                {
                    nativeEventType: 'keyup',
                    key: 'Dead',
                    charCode: 0,
                    keyCode: 219,
                },
            ]);
            await nextTick();
            expect(triggerFunction.callCount).to.equal(1);
            // o
            await triggerEvents(editable, [
                {
                    nativeEventType: 'keydown',
                    key: 'o',
                    charCode: 0,
                    keyCode: 79,
                },
                {
                    nativeEventType: 'keypress',
                    key: 'ô',
                    charCode: 244,
                    keyCode: 244,
                },
                {
                    nativeEventType: 'beforeInput',
                    data: 'ô',
                },
                {
                    nativeEventType: 'input',
                    data: 'ô',
                    insert: 'ô',
                    inputType: 'textInput',
                },
            ]);
            await nextTick();
            expect(triggerFunction.callCount).to.equal(2);
            expect(triggerFunction.getCall(1).args[0]).to.equal('insert');
            expect(triggerFunction.getCall(1).args[1]).to.equal('ô');

            await triggerEvents(editable, [
                {
                    nativeEventType: 'keyup',
                    key: 'o',
                    charCode: 0,
                    keyCode: 79,
                },
            ]);
            await nextTick();
            expect(triggerFunction.callCount).to.equal(2);
            // Enter
            await triggerEvents(editable, [
                {
                    nativeEventType: 'keydown',
                    key: 'Enter',
                    charCode: 0,
                    keyCode: 13,
                },
                {
                    nativeEventType: 'keypress',
                    key: 'Enter',
                    charCode: 13,
                    keyCode: 13,
                },
                {
                    nativeEventType: 'beforeInput',
                    data: 'null',
                },
            ]);
            await nextTick();
            expect(triggerFunction.callCount).to.equal(3);
            expect(triggerFunction.getCall(2).args[0]).to.equal('keydown');
            expect(triggerFunction.getCall(2).args[1].type).to.equal('keydown');

            await triggerEvents(editable, [
                {
                    nativeEventType: 'keyup',
                    key: 'Enter',
                    charCode: 0,
                    keyCode: 13,
                },
            ]);
            await nextTick();
            expect(triggerFunction.callCount).to.equal(3);

            normalizer.destroy();

            // assert.strictEqual(
            //     this.dependencies.Test.getValue(),
            //     this.updatedValue,
            //     'Should insert the char, accent and enter in the Arch',
            // );
            // assert.strictEqual(
            //     this.dependencies.Test.getDomValue(),
            //     this.updatedDom,
            //     'Should insert the char, accent and enter in the DOM',
            // );
        });
        // it('AccentUbuntuFireFox', () => {
        //     var ev;
        //     var Test = this.dependencies.Test;
        //     await Test.setValue(this.value);
        //     // i
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'i',
        //             charCode: 0,
        //             keyCode: 73,
        //         }],
        //         ['keypress', {
        //             key: 'i',
        //             charCode: 105,
        //             keyCode: 105,
        //         }],
        //         ['input', {
        //             insert: 'i',
        //             inputType: 'textInput',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'i',
        //             charCode: 0,
        //             keyCode: 73,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     // ^
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Dead',
        //             charCode: 0,
        //             keyCode: 0,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'Dead',
        //             charCode: 0,
        //             keyCode: 0,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     // o
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'ô',
        //             charCode: 0,
        //             keyCode: 79,
        //         }],
        //         ['keypress', {
        //             key: 'ô',
        //             charCode: 244,
        //             keyCode: 244,
        //         }],
        //         ['input', {
        //             insert: 'ô',
        //             inputType: 'textInput',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'o',
        //             charCode: 0,
        //             keyCode: 79,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     // Enter
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Enter',
        //             charCode: 0,
        //             keyCode: 13,
        //         }],
        //         ['keypress', {
        //             key: 'Enter',
        //             charCode: 13,
        //             keyCode: 13,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'Enter',
        //             charCode: 0,
        //             keyCode: 13,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     assert.strictEqual(this.dependencies.Test.getValue(), this.updatedValue, "Should insert the char, accent and enter in the Arch");
        //     assert.strictEqual(this.dependencies.Test.getDomValue(), this.updatedDom, "Should insert the char, accent and enter in the DOM");
        // });
        // it('AccentMacSafari', () => {
        //     var ev;
        //     var Test = this.dependencies.Test;
        //     await Test.setValue(this.value);
        //     // i
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'i',
        //             charCode: 0,
        //             keyCode: 73,
        //         }],
        //         ['keypress', {
        //             key: 'i',
        //             charCode: 105,
        //             keyCode: 105,
        //         }],
        //         ['beforeInput', {
        //             data: 'i',
        //         }],
        //         ['input', {
        //             data: 'i',
        //             insert: 'i',
        //             inputType: 'textInput',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'i',
        //             charCode: 0,
        //             keyCode: 73,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     // ^
        //     await this.triggerEvent([
        //         ['compositionstart', {
        //         }],
        //         ['compositionupdate', {
        //             data: '^',
        //         }],
        //         ['beforeInput', {
        //             data: '^',
        //         }],
        //         ['input', {
        //             data: '^',
        //             insert: '^',
        //             inputType: 'textInput',
        //         }],
        //         ['keydown', {
        //             key: 'Dead',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: '^',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     // o
        //     await this.triggerEvent([
        //         ['beforeInput', {
        //             data: 'null',
        //             inputType: 'deleteContentBackward',
        //         }],
        //         ['input', {
        //             data: 'null',
        //             inputType: 'deleteContentBackward',
        //         }],
        //         ['beforeInput', {
        //             data: 'ô',
        //         }],
        //         ['input', {
        //             data: 'ô',
        //             inputType: 'textInput',
        //         }],
        //         ['compositionend', {
        //             data: 'ô',
        //         }],
        //         ['keydown', {
        //             key: 'ô',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //     ]);
        //     var textNode = this.editable.querySelector('p').firstChild;
        //     textNode.textContent = '.iô.';
        //     this._selectDOMRange(textNode, 3);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'o',
        //             charCode: 0,
        //             keyCode: 79,
        //         }],
        //     ]);
        //     // Enter
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Enter',
        //             charCode: 0,
        //             keyCode: 13,
        //         }],
        //         ['keypress', {
        //             key: 'Enter',
        //             charCode: 13,
        //             keyCode: 13,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'Enter',
        //             charCode: 0,
        //             keyCode: 13,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     assert.strictEqual(this.dependencies.Test.getValue(), this.updatedValue, "Should insert the char, accent and enter in the Arch");
        //     assert.strictEqual(this.dependencies.Test.getDomValue(), this.updatedDom, "Should insert the char, accent and enter in the DOM");
        // });
        // it('AccentMacChrome', () => {
        //     var ev;
        //     var Test = this.dependencies.Test;
        //     await Test.setValue(this.value);
        //     // i
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'i',
        //             charCode: 0,
        //             keyCode: 73,
        //         }],
        //         ['keypress', {
        //             key: 'i',
        //             charCode: 105,
        //             keyCode: 105,
        //         }],
        //         ['beforeInput', {
        //             data: 'i',
        //         }],
        //         ['input', {
        //             data: 'i',
        //             insert: 'i',
        //             inputType: 'textInput',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'i',
        //             charCode: 0,
        //             keyCode: 73,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     // ^
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Dead',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['compositionstart', {
        //         }],
        //         ['beforeInput', {
        //             data: '^',
        //         }],
        //         ['compositionupdate', {
        //             data: '^',
        //         }],
        //         ['input', {
        //             data: '^',
        //             insert: '^',
        //             inputType: 'textInput',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'Dead',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     // o
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'ô',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['beforeInput', {
        //             data: 'ô',
        //         }],
        //         ['compositionupdate', {
        //             data: 'ô',
        //         }],
        //         ['input', {
        //             data: 'ô',
        //             insert: 'ô',
        //             inputType: 'textInput',
        //         }],
        //         ['compositionend', {
        //             data: 'ô',
        //         }],
        //     ]);
        //     var textNode = this.editable.querySelector('p').firstChild;
        //     textNode.textContent = '.iô.';
        //     this._selectDOMRange(textNode, 3);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'o',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     // Enter
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Enter',
        //             charCode: 0,
        //             keyCode: 13,
        //         }],
        //         ['keypress', {
        //             key: 'Enter',
        //             charCode: 13,
        //             keyCode: 13,
        //         }],
        //         ['beforeInput', {
        //             data: 'null',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'Enter',
        //             charCode: 0,
        //             keyCode: 13,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     assert.strictEqual(this.dependencies.Test.getValue(), this.updatedValue, "Should insert the char, accent and enter in the Arch");
        //     assert.strictEqual(this.dependencies.Test.getDomValue(), this.updatedDom, "Should insert the char, accent and enter in the DOM");
        // });
        // it('AccentMacFirefox', () => {
        //     var ev;
        //     var Test = this.dependencies.Test;
        //     await Test.setValue(this.value);
        //     // i
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'i',
        //             charCode: 0,
        //             keyCode: 73,
        //         }],
        //         ['keypress', {
        //             key: 'i',
        //             charCode: 105,
        //             keyCode: 105,
        //         }],
        //         ['input', {
        //             data: 'i',
        //             insert: 'i',
        //             inputType: 'textInput',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'i',
        //             charCode: 0,
        //             keyCode: 73,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     // ^
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Dead',
        //             charCode: 0,
        //             keyCode: 160,
        //         }],
        //         ['compositionstart', {
        //         }],
        //         ['compositionupdate', {
        //             data: '^',
        //         }],
        //         ['input', {
        //             data: '^',
        //             insert: '^',
        //             inputType: 'textInput',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: '^',
        //             charCode: 0,
        //             keyCode: 160,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     // o
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'ô',
        //             charCode: 0,
        //             keyCode: 79,
        //         }],
        //         ['compositionupdate', {
        //             data: 'ô',
        //         }],
        //         ['compositionend', {
        //             data: 'ô',
        //         }],
        //         ['input', {
        //             data: 'ô',
        //             insert: 'ô',
        //             inputType: 'textInput',
        //         }],
        //     ]);
        //     var textNode = this.editable.querySelector('p').firstChild;
        //     textNode.textContent = '.iô.';
        //     this._selectDOMRange(textNode, 3);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'o',
        //             charCode: 0,
        //             keyCode: 79,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     // Enter
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Enter',
        //             charCode: 0,
        //             keyCode: 13,
        //         }],
        //         ['keypress', {
        //             key: 'Enter',
        //             charCode: 13,
        //             keyCode: 13,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'Enter',
        //             charCode: 0,
        //             keyCode: 13,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     assert.strictEqual(this.dependencies.Test.getValue(), this.updatedValue, "Should insert the char, accent and enter in the Arch");
        //     assert.strictEqual(this.dependencies.Test.getDomValue(), this.updatedDom, "Should insert the char, accent and enter in the DOM");
        // });
        // it('AccentSwiftKey', () => {
        //     var ev;
        //     var Test = this.dependencies.Test;
        //     await Test.setValue(this.value);
        //     // i
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['beforeInput', {
        //             data: 'i',
        //         }],
        //         ['input', {
        //             data: 'i',
        //             insert: 'i',
        //             inputType: 'textInput',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     // ô
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['beforeInput', {
        //             data: 'ô',
        //         }],
        //         ['input', {
        //             data: 'ô',
        //             insert: 'ô',
        //             inputType: 'textInput',
        //         }],
        //     ]);
        //     var textNode = this.editable.querySelector('p').firstChild;
        //     textNode.textContent = '.iô.';
        //     this._selectDOMRange(textNode, 3);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     // Enter
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Enter',
        //             charCode: 0,
        //             keyCode: 13,
        //         }],
        //         ['beforeInput', {
        //             data: 'null',
        //             inputType: 'insertLineBreak',
        //         }],
        //         ['keypress', {
        //             key: 'Enter',
        //             charCode: 13,
        //             keyCode: 13,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'Enter',
        //             charCode: 0,
        //             keyCode: 13,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     assert.strictEqual(this.dependencies.Test.getValue(), this.updatedValue, "Should insert the char, accent and enter in the Arch");
        //     assert.strictEqual(this.dependencies.Test.getDomValue(), this.updatedDom, "Should insert the char, accent and enter in the DOM");
        // });
        // it('CharAndroidPad', () => {
        //     var ev;
        //     var Test = this.dependencies.Test;
        //     await Test.setValue('<p>p◆</p>');
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['compositionstart', {
        //             data: '',
        //         }],
        //         ['beforeInput', {
        //             data: 'a',
        //         }],
        //         ['compositionupdate', {
        //             data: 'a',
        //         }],
        //         ['input', {
        //             data: 'a',
        //             inputType: 'insertCompositionText',
        //         }],
        //     ]);
        //     var textNode = this.editable.querySelector('p').firstChild;
        //     textNode.textContent = textNode.textContent + 'a';
        //     this._selectDOMRange(textNode, textNode.textContent.length);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['compositionstart', {
        //             data: '',
        //         }],
        //         ['beforeInput', {
        //             data: 'aa',
        //         }],
        //         ['compositionupdate', {
        //             data: 'aa',
        //         }],
        //         ['input', {
        //             data: 'aa',
        //             inputType: 'insertCompositionText',
        //         }],
        //     ]);
        //     var textNode = this.editable.querySelector('p').firstChild;
        //     textNode.textContent = textNode.textContent + 'aa';
        //     this._selectDOMRange(textNode, textNode.textContent.length);
        //     await new Promise(setTimeout);
        //     assert.strictEqual(this.dependencies.Test.getValue(), '<p>paa◆</p>', "Should insert the char, accent and enter in the Arch");
        //     assert.strictEqual(this.dependencies.Test.getDomValue(), '<p>paa</p>', "Should insert the char, accent and enter in the DOM");
        // });
        // it('Char2AndroidPad', () => {
        //     var ev;
        //     var Test = this.dependencies.Test;
        //     await Test.setValue('<p>p\u00A0◆</p>');
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['compositionstart', {
        //             data: '',
        //         }],
        //         ['beforeInput', {
        //             data: 'a',
        //         }],
        //         ['compositionupdate', {
        //             data: 'a',
        //         }],
        //         ['input', {
        //             data: 'a',
        //             inputType: 'insertCompositionText',
        //         }],
        //     ]);
        //     var textNode = this.editable.querySelector('p').firstChild;
        //     textNode.textContent = textNode.textContent + 'a';
        //     this._selectDOMRange(textNode, textNode.textContent.length);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['compositionstart', {
        //             data: '',
        //         }],
        //         ['beforeInput', {
        //             data: 'aa',
        //         }],
        //         ['compositionupdate', {
        //             data: 'aa',
        //         }],
        //         ['input', {
        //             data: 'aa',
        //             inputType: 'insertCompositionText',
        //         }],
        //     ]);
        //     var textNode = this.editable.querySelector('p').firstChild;
        //     textNode.textContent = textNode.textContent + 'aa';
        //     this._selectDOMRange(textNode, textNode.textContent.length);
        //     await new Promise(setTimeout);
        //     assert.strictEqual(this.dependencies.Test.getValue(), '<p>p aa◆</p>', "Should insert the char, accent and enter in the Arch");
        //     assert.strictEqual(this.dependencies.Test.getDomValue(), '<p>p aa</p>', "Should insert the char, accent and enter in the DOM");
        // });
        // it('BackspaceAndroidPad', () => {
        //     var ev;
        //     var Test = this.dependencies.Test;
        //     await Test.setValue('<p>aaa ◆, bbb</p>');
        //     var list = ['b', 'bo', 'bom', 'bo', 'bon'];
        //     for (var k = 0; k < list.length; k++) {
        //         var str = list[k];
        //         await this.triggerEvent([
        //             ['keydown', {
        //                 key: 'Unidentified',
        //                 charCode: 0,
        //                 keyCode: 229,
        //             }],
        //             ['compositionstart', {
        //                 data: '',
        //             }],
        //             ['beforeInput', {
        //                 data: str,
        //             }],
        //             ['compositionupdate', {
        //                 data: str,
        //             }],
        //             ['input', {
        //                 data: str,
        //                 inputType: 'insertCompositionText',
        //             }],
        //         ]);
        //         this.document.execCommand("insertText", 0, str);
        //         await new Promise(setTimeout);
        //     }
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['compositionstart', {
        //             data: '',
        //         }],
        //         ['beforeInput', {
        //             data: 'Bonjour',
        //             inputType: 'insertCompositionText',
        //         }],
        //         ['compositionupdate', {
        //             data: 'Bonjour',
        //         }],
        //         ['input', {
        //             data: 'Bonjour',
        //             inputType: 'insertCompositionText',
        //         }],
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['beforeInput', {
        //             data: 'Bonjour',
        //             inputType: 'insertCompositionText',
        //         }],
        //         ['compositionupdate', {
        //             data: 'Bonjour',
        //         }],
        //         ['input', {
        //             data: 'Bonjour',
        //             inputType: 'textInput',
        //         }],
        //         ['input', {
        //             data: 'Bonjour',
        //             inputType: 'insertCompositionText',
        //         }],
        //         ['compositionend', {
        //             data: 'Bonjour',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     assert.strictEqual(this.dependencies.Test.getValue(), '<p>aaa Bonjour◆, bbb</p>', "Should insert the char, accent and enter in the Arch");
        //     assert.strictEqual(this.dependencies.Test.getDomValue(), '<p>aaa Bonjour, bbb</p>', "Should insert the char, accent and enter in the DOM");
        // });
        // it('CompletionSwiftKey', () => {
        //     var ev;
        //     var Test = this.dependencies.Test;
        //     await Test.setValue(this.completion);
        //     // s
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['beforeInput', {
        //             data: 's',
        //         }],
        //         ['input', {
        //             data: 's',
        //             insert: 's',
        //             inputType: 'textInput',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     // Christophe
        //     await this.triggerEvent([
        //         ['compositionstart', {
        //             data: '',
        //         }],
        //         ['compositionupdate', {
        //             data: 'chris',
        //         }],
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['beforeInput', {
        //             data: 'Christophe',
        //             inputType: 'insertCompositionText',
        //         }],
        //         ['compositionupdate', {
        //             data: 'Christophe',
        //         }],
        //     ]);
        //     var textNode = this.editable.querySelector('p').firstChild;
        //     textNode.textContent = '.Christophe.';
        //     this._selectDOMRange(textNode, 11);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['compositionend', {
        //             data: 'Christophe',
        //         }],
        //         // auto add space after autocompletion (if no space after)
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['beforeInput', {
        //             data: ' ',
        //         }],
        //         ['input', {
        //             data: ' ',
        //             insert: ' ',
        //             inputType: 'textInput',
        //         }],
        //         ['keyup', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     assert.strictEqual(this.dependencies.Test.getValue(), this.completionValue, "Should insert the word in the Arch");
        //     assert.strictEqual(this.dependencies.Test.getDomValue(), this.completionDom, "Should insert the word in the DOM");
        // });
        // it('DoubleCompletionSwiftKey', () => {
        //     var ev;
        //     var Test = this.dependencies.Test;
        //     await Test.setValue('<p>ab◆</p>');
        //     await this.triggerEvent([
        //         ['compositionstart', {
        //             data: '',
        //         }],
        //         ['compositionupdate', {
        //             data: 'ab',
        //         }],
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['beforeInput', {
        //             data: 'Abc',
        //             inputType: 'insertCompositionText',
        //         }],
        //         ['compositionupdate', {
        //             data: 'Abc',
        //         }],
        //         ['input', {
        //             data: 'Christophe',
        //             inputType: 'insertCompositionText',
        //         }],
        //     ]);
        //     var textNode = this.editable.querySelector('p').firstChild;
        //     textNode.textContent = 'Abc';
        //     this._selectDOMRange(textNode, 3);
        //     await this.triggerEvent([
        //         ['compositionend', {
        //             data: 'Abc',
        //         }],
        //         // auto add space after autocompletion (if no space after)
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['beforeInput', {
        //             data: ' ',
        //         }],
        //         ['input', {
        //             data: ' ',
        //             inputType: 'insertText',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['compositionstart', {
        //             data: '',
        //         }],
        //         ['compositionupdate', {
        //             data: '',
        //         }],
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['compositionstart', {
        //             data: '',
        //         }],
        //         ['beforeInput', {
        //             data: 'def',
        //             inputType: 'insertCompositionText',
        //         }],
        //         ['compositionupdate', {
        //             data: 'def',
        //         }],
        //         ['input', {
        //             data: 'def',
        //             inputType: 'insertCompositionText',
        //         }],
        //     ]);
        //     var textNode = this.editable.querySelector('p').firstChild;
        //     textNode.textContent = 'Abc def';
        //     this._selectDOMRange(textNode, 7);
        //     await this.triggerEvent([
        //         ['compositionend', {
        //             data: 'def',
        //         }],
        //         // auto add space after autocompletion (if no space after)
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['beforeInput', {
        //             data: ' ',
        //         }],
        //         ['input', {
        //             data: ' ',
        //             inputType: 'insertText',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     assert.strictEqual(this.dependencies.Test.getValue(), '<p>Abc def&nbsp;◆</p>', "Should insert 2 words in the Arch");
        //     assert.strictEqual(this.dependencies.Test.getDomValue(), '<p>Abc def&nbsp;</p>', "Should insert 2 words in the DOM");
        // });
        // it('SpaceAtEndSwiftKey', () => {
        //     var ev;
        //     var Test = this.dependencies.Test;
        //     await Test.setValue('<p>p◆</p>');
        //     await this.triggerEvent([
        //         ['compositionstart', {
        //             data: '',
        //         }],
        //         ['compositionupdate', {
        //             data: 'p',
        //         }],
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['beforeInput', {
        //             data: 'p',
        //             inputType: 'insertCompositionText',
        //         }],
        //         ['compositionupdate', {
        //             data: 'p',
        //         }],
        //         ['input', {
        //             data: 'p',
        //             inputType: 'insertCompositionText',
        //         }],
        //         ['compositionend', {
        //             data: 'p',
        //         }],
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['beforeInput', {
        //             data: ' ',
        //             inputType: 'insertCompositionText',
        //         }],
        //         ['input', {
        //             data: ' ',
        //             insert: ' ',
        //             inputType: 'textInput',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     assert.strictEqual(this.dependencies.Test.getValue(), '<p>p&nbsp;◆</p>', "Should insert the space in the Arch");
        //     assert.strictEqual(this.dependencies.Test.getDomValue(), '<p>p&nbsp;</p>', "Should insert the space in the DOM");
        // });
        // it('CompletionOnBRSwiftKey', () => {
        //     var ev;
        //     var Test = this.dependencies.Test;
        //     await Test.setValue('<p><br/>◆</p>');
        //     // Christophe
        //     await this.triggerEvent([
        //         ['compositionstart', {
        //             data: '',
        //         }],
        //         ['compositionupdate', {
        //             data: '',
        //         }],
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['beforeInput', {
        //             data: 'Christophe',
        //             inputType: 'insertCompositionText',
        //         }],
        //         ['compositionupdate', {
        //             data: 'Christophe',
        //         }],
        //     ]);
        //     var p = this.editable.querySelector('p');
        //     p.removeChild(p.firstChild);
        //     var textNode = document.createTextNode('Christophe');
        //     p.appendChild(textNode);
        //     this._selectDOMRange(textNode, 10);
        //     await this.triggerEvent([
        //         ['keyup', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['compositionend', {
        //             data: 'Christophe',
        //         }],
        //         // auto add space after autocompletion (if no space after)
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //             noTimeout: true,
        //         }],
        //         ['beforeInput', {
        //             data: ' ',
        //         }],
        //         ['input', {
        //             data: ' ',
        //             insert: ' ',
        //             inputType: 'textInput',
        //         }],
        //         ['keyup', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     assert.strictEqual(this.dependencies.Test.getValue(), '<p>Christophe&nbsp;◆</p>', "Should insert the word in the Arch");
        //     assert.strictEqual(this.dependencies.Test.getDomValue(), '<p>Christophe&nbsp;</p>', "Should insert the word in the DOM");
        // });
        // it('CompletionWithBoldSwiftKey', () => {
        //     var ev;
        //     var Test = this.dependencies.Test;
        //     await Test.setValue(this.completionBold);
        //     // Christophe
        //     await this.triggerEvent([
        //         ['compositionstart', {
        //         }],
        //         ['compositionupdate', {
        //             data: 'chris',
        //         }],
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['beforeInput', {
        //             data: 'Christophe',
        //             inputType: 'insertCompositionText',
        //         }],
        //         ['compositionupdate', {
        //             data: 'Christophe',
        //         }],
        //         ['input', {
        //             data: 'Christophe',
        //             inputType: 'insertCompositionText',
        //         }],
        //     ]);
        //     var p = this.editable.querySelector('p');
        //     p.removeChild(p.firstChild);
        //     p.firstChild.removeChild(p.firstChild.firstChild);
        //     p.removeChild(p.firstChild);
        //     var text = document.createTextNode('.');
        //     p.insertBefore(text, p.lastChild);
        //     var b = document.createElement('b');
        //     b.innerHTML = 'Christophe';
        //     p.insertBefore(b, p.lastChild);
        //     p.lastChild.nodeValue = '\u00A0.';
        //     this._selectDOMRange(b.firstChild, b.firstChild.textContent.length);
        //     await this.triggerEvent([
        //         ['compositionend', {
        //             data: 'Christophe',
        //         }],
        //     ]);
        //     await new Promise(setTimeout);
        //     assert.strictEqual(this.dependencies.Test.getValue(), this.completionBoldValue, "Should insert the word in the Arch");
        //     assert.strictEqual(this.dependencies.Test.getDomValue(), this.completionBoldDom, "Should insert the word in the DOM");
        // });
        // it('AudioSwiftKey', () => {
        //     var ev;
        //     var Test = this.dependencies.Test;
        //     await Test.setValue('<p>ab&nbsp;◆</p>');
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['compositionstart', {
        //             data: '',
        //         }],
        //         ['beforeInput', {
        //             data: 'test',
        //             inputType: 'insertCompositionText',
        //         }],
        //         ['compositionupdate', {
        //             data: 'test',
        //         }],
        //         ['input', {
        //             data: 'test',
        //             inputType: 'insertCompositionText',
        //         }],
        //     ]);
        //     var textNode = this.editable.querySelector('p').firstChild;
        //     textNode.textContent = 'ab test';
        //     this._selectDOMRange(textNode, textNode.textContent.length);
        //     await new Promise(setTimeout);
        //     await this.triggerEvent([
        //         ['keydown', {
        //             key: 'Unidentified',
        //             charCode: 0,
        //             keyCode: 229,
        //         }],
        //         ['compositionstart', {
        //             data: '',
        //         }],
        //         ['beforeInput', {
        //             data: ' test vocal',
        //             inputType: 'insertCompositionText',
        //         }],
        //         ['compositionupdate', {
        //             data: ' test vocal',
        //         }],
        //         ['input', {
        //             data: ' test vocal',
        //             inputType: 'insertCompositionText',
        //         }],
        //     ]);
        //     var textNode = this.editable.querySelector('p').firstChild;
        //     textNode.textContent += ' test vocal';
        //     this._selectDOMRange(textNode, textNode.textContent.length);
        //     await new Promise(setTimeout);
        //     assert.strictEqual(this.dependencies.Test.getValue(), '<p>ab test test vocal◆</p>', "Should insert 2 audio parts in the Arch");
        //     assert.strictEqual(this.dependencies.Test.getDomValue(), '<p>ab test test vocal</p>', "Should insert 2 audio parts in the DOM");
        // });
    });
});
