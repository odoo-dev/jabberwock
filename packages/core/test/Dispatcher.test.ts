import { expect } from 'chai';
import JWEditor from '../src/JWEditor';
import * as sinon from 'sinon';
import { Dispatcher, CommandDefinition } from '../src/Dispatcher';

describe('utils', () => {
    describe('Dispatcher', () => {
        describe('dispatch()', () => {
            it('dispatch an event with argument', async () => {
                const callback = sinon.fake();
                const editor = new JWEditor();
                const dispatcher = new Dispatcher(editor);
                const command: CommandDefinition = {
                    handler: callback,
                };
                dispatcher.registerCommand('myCommand', command);
                await dispatcher.dispatch('myCommand', { arrayArg: ['argOne', 'argTwo'] });
                expect(callback.callCount).to.eql(1);
                expect(callback.args[0][0]).to.eql({ arrayArg: ['argOne', 'argTwo'] });
            });
            it('dispatch an event without argument', async () => {
                const callback = sinon.fake();
                const editor = new JWEditor();
                const dispatcher = new Dispatcher(editor);
                const command: CommandDefinition = {
                    handler: callback,
                };
                dispatcher.registerCommand('myCommand', command);
                await dispatcher.dispatch('myCommand');
                expect(callback.callCount).to.eql(1);
                expect(callback.args[0][0]).to.eql({});
            });
            it('dispatch an event that trigger last callbacks', async () => {
                const callbackCommand = sinon.fake();
                const callbackCommand2 = sinon.fake();
                const editor = new JWEditor();
                const dispatcher = new Dispatcher(editor);
                const command: CommandDefinition = {
                    title: 'command1',
                    handler: callbackCommand,
                };
                const command2: CommandDefinition = {
                    title: 'command2',
                    handler: callbackCommand2,
                };
                dispatcher.registerCommand('myCommand', command);
                dispatcher.registerCommand('myCommand', command2);
                await dispatcher.dispatch('myCommand');
                expect(callbackCommand.callCount).to.eql(0);
                expect(callbackCommand2.callCount).to.eql(1);
            });
        });
    });
});
