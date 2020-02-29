import { Keymap, ConfiguredCommand } from '../src/Keymap';
import { expect } from 'chai';
function keydownEvent(key, code, options = {}): KeyboardEvent {
    return new KeyboardEvent('keydown', { ...options, key, code });
}
describe('core', () => {
    describe('Keymap', () => {
        let keymap: Keymap;
        beforeEach(() => {
            keymap = new Keymap();
        });
        it('should bindShortcut', () => {
            keymap.bindShortcut('a', { commandId: 'command' });
            expect(keymap.shortcuts.length === 1);
        });
        describe('parsePatter ', () => {
            it('should transform everything to uppercase modifiers', () => {
                const pattern = keymap.parsePattern('CtRl+a');
                expect('key' in pattern).to.be.true;
                if ('key' in pattern) {
                    expect(pattern.key).to.deep.equal('A');
                }
                expect([...pattern.modifiers]).to.deep.equal(['CTRL']);
            });
            it('should transform CMD to META', () => {
                const pattern = keymap.parsePattern('cMd+A');
                expect([...pattern.modifiers]).to.deep.equal(['META']);
            });
            it('should get 0 modifiers and 1 key', () => {
                keymap.bindShortcut('a', { commandId: 'command' });
                const pattern = keymap.parsePattern('a');
                expect('key' in pattern).to.be.true;
                if ('key' in pattern) {
                    expect(pattern.key).to.deep.equal('A');
                }
                expect([...pattern.modifiers]).to.deep.equal([]);
            });
            it('should get 1 modifiers and 1 key', () => {
                const pattern = keymap.parsePattern('cTRl+a');
                expect('key' in pattern).to.be.true;
                if ('key' in pattern) {
                    expect(pattern.key).to.deep.equal('A');
                }
                expect([...pattern.modifiers]).to.deep.equal(['CTRL']);
            });
            it('should get 2 modifiers and 1 key', () => {
                const pattern = keymap.parsePattern('ctrl+sHift+a');
                expect('key' in pattern).to.be.true;
                if ('key' in pattern) {
                    expect(pattern.key).to.deep.equal('A');
                }
                expect([...pattern.modifiers]).to.deep.equal(['CTRL', 'SHIFT']);
            });
            it('should get 0 modifiers and 1 code', () => {
                keymap.bindShortcut('a', { commandId: 'command' });
                const pattern = keymap.parsePattern('<KeyA>');
                expect('code' in pattern).to.be.true;
                if ('code' in pattern) {
                    expect(pattern.code).to.deep.equal('KeyA');
                }
                expect([...pattern.modifiers]).to.deep.equal([]);
            });
            it('should get 1 modifiers and 1 code', () => {
                const pattern = keymap.parsePattern('cTRl+<KeyB>');
                expect('code' in pattern).to.be.true;
                if ('code' in pattern) {
                    expect(pattern.code).to.deep.equal('KeyB');
                }
                expect([...pattern.modifiers]).to.deep.equal(['CTRL']);
            });
            it('should get 2 modifiers and 1 code', () => {
                const pattern = keymap.parsePattern('ctrl+sHift+<KeyC>');
                expect('code' in pattern).to.be.true;
                if ('code' in pattern) {
                    expect(pattern.code).to.deep.equal('KeyC');
                }
                expect([...pattern.modifiers]).to.deep.equal(['CTRL', 'SHIFT']);
            });
            it('should normalize pattern and get 2 modifiers and 1 key', () => {
                const pattern = keymap.parsePattern('cTrl+shiFt+a');
                expect('key' in pattern).to.be.true;
                if ('key' in pattern) {
                    expect(pattern.key).to.deep.equal('A');
                }
                expect([...pattern.modifiers]).to.deep.equal(['CTRL', 'SHIFT']);
            });
            it('should throw an error because there is no key', () => {
                expect(() => {
                    keymap.parsePattern('');
                }).to.throw();
            });
        });
        describe('match', () => {
            it('should match shortcuts with key', () => {
                keymap.bindShortcut('a', { commandId: 'command-a' });
                keymap.bindShortcut('b', { commandId: 'command-b' });
                const call = keymap.match(keydownEvent('a', 'KeyA'));
                const expectedCommands: ConfiguredCommand[] = [
                    {
                        commandId: 'command-a',
                    },
                ];
                expect(call).to.deep.equal(expectedCommands);
            });
            it('should match shortcuts with code', () => {
                keymap.bindShortcut('<KeyA>', { commandId: 'command-a' });
                keymap.bindShortcut('b', { commandId: 'command-b' });
                const call = keymap.match(keydownEvent('a', 'KeyA'));
                const expectedCommands: ConfiguredCommand[] = [
                    {
                        commandId: 'command-a',
                    },
                ];
                expect(call).to.deep.equal(expectedCommands);
            });
            it('should match shortcuts with command args', () => {
                const args = { propA: 'valA' };
                keymap.bindShortcut('<KeyA>', { commandId: 'command-a', commandArgs: args });
                const call = keymap.match(keydownEvent('a', 'KeyA'));
                const expectedCommands: ConfiguredCommand[] = [
                    {
                        commandId: 'command-a',
                        commandArgs: args,
                    },
                ];
                expect(call).to.deep.equal(expectedCommands);
            });
            it('should not trigger the map with modifiers', () => {
                const args = { propA: 'valA' };
                keymap.bindShortcut('a', { commandId: 'command-a', commandArgs: args });
                keymap.bindShortcut('ctrl  +a', { commandId: 'command-b', commandArgs: args });
                const call = keymap.match(keydownEvent('a', 'KeyA'));
                const expectedCommands: ConfiguredCommand[] = [
                    {
                        commandId: 'command-a',
                        commandArgs: args,
                    },
                ];
                expect(call).to.deep.equal(expectedCommands);
            });
            it('should remove a shortuct if there is no commandIdentifier', () => {
                keymap.bindShortcut('a', { commandId: 'command-a' });
                keymap.bindShortcut('a', {
                    commandId: undefined,
                    commandArgs: ['first unbinding'],
                });
                keymap.bindShortcut('a', { commandId: 'command-a' });
                keymap.bindShortcut('a', {
                    commandId: undefined,
                    commandArgs: ['second unbinding'],
                });
                const call = keymap.match(keydownEvent('a', 'KeyA'));
                const expectedCommands: ConfiguredCommand[] = [
                    {
                        commandId: undefined,
                        commandArgs: ['second unbinding'],
                    },
                ];
                expect(call).to.deep.equal(expectedCommands);
            });
            describe('modifier', () => {
                it('should match shortcuts only when one modifier is active', () => {
                    keymap.bindShortcut('ctRl+<KeyA>', { commandId: 'command-a' });
                    const call = keymap.match(keydownEvent('a', 'KeyA', { ctrlKey: true }));
                    const expectedCommands: ConfiguredCommand[] = [
                        {
                            commandId: 'command-a',
                        },
                    ];
                    expect(call).to.deep.equal(expectedCommands);
                });
                it('should match shortcuts only when one modifier is active but not the others', () => {
                    keymap.bindShortcut('cTrl+<KeyA>', { commandId: 'command-a' });
                    const call = keymap.match(
                        keydownEvent('a', 'KeyA', { ctrlKey: true, altKey: true }),
                    );
                    expect(call).to.deep.equal([]);
                });
                it('should match shortcuts only when multiples modifier are active', () => {
                    keymap.bindShortcut('Ctrl+alt+<KeyA>', { commandId: 'command-a' });
                    const call = keymap.match(
                        keydownEvent('a', 'KeyA', { ctrlKey: true, altKey: true }),
                    );
                    const expectedCommands: ConfiguredCommand[] = [{ commandId: 'command-a' }];
                    expect(call).to.deep.equal(expectedCommands);
                });
            });
        });
    });
});
