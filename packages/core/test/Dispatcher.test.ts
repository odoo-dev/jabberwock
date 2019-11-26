import { expect } from 'chai';
import JWEditor from '../src/JWEditor';
import * as sinon from 'sinon';
import { Dispatcher, CommandDefinition } from '../src/Dispatcher';

describe('utils', () => {
    describe('Dispatcher', () => {
        describe('dispatch()', () => {
            it('dispatch an event with argument', () => {
                const callback = sinon.fake();
                const editor = new JWEditor();
                const dispatcher = new Dispatcher(editor);
                const command: CommandDefinition = {
                    handler: callback,
                };
                dispatcher.registerCommand('myCommand', command);
                dispatcher.dispatch('myCommand', { arrayArg: ['argOne', 'argTwo'] });
                expect(callback.callCount).to.eql(1);
                expect(callback.args[0][0]).to.eql({ arrayArg: ['argOne', 'argTwo'] });
            });
            it('dispatch an event without argument', () => {
                const callback = sinon.fake();
                const editor = new JWEditor();
                const dispatcher = new Dispatcher(editor);
                const command: CommandDefinition = {
                    handler: callback,
                };
                dispatcher.registerCommand('myCommand', command);
                dispatcher.dispatch('myCommand');
                expect(callback.callCount).to.eql(1);
                expect(callback.args[0][0]).to.eql({});
            });
            it('dispatch an event that has one hook', () => {
                const callbackCommand = sinon.fake();
                const callbackHook = sinon.fake();
                const editor = new JWEditor();
                const dispatcher = new Dispatcher(editor);
                const command: CommandDefinition = {
                    handler: callbackCommand,
                };
                dispatcher.registerCommand('myCommand', command);
                dispatcher.registerHook('myCommand', callbackHook);
                dispatcher.dispatch('myCommand');
                expect(callbackCommand.callCount).to.eql(1);
                expect(callbackHook.callCount).to.eql(1);
            });
            it('dispatch an event that has multiples hook', () => {
                const callbackCommand = sinon.fake();
                const callbackHook1 = sinon.fake();
                const callbackHook2 = sinon.fake();
                const editor = new JWEditor();
                const dispatcher = new Dispatcher(editor);
                const command: CommandDefinition = {
                    handler: callbackCommand,
                };
                dispatcher.registerCommand('myCommand', command);
                dispatcher.registerHook('myCommand', callbackHook1);
                dispatcher.registerHook('myCommand', callbackHook2);
                dispatcher.dispatch('myCommand');
                expect(callbackCommand.callCount).to.eql(1);
                expect(callbackHook1.callCount).to.eql(1);
                expect(callbackHook2.callCount).to.eql(1);
            });
        });
    });
});
