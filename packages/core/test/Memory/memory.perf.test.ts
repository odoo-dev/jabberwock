/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';

import { Memory } from '../../src/Memory/Memory';
import { makeVersionable } from '../../src/Memory/Versionable';
import { VersionableArray } from '../../src/Memory/VersionableArray';
import { VersionableObject } from '../../src/Memory/VersionableObject';

let ID = 0;
let Text = 0;

class Node extends VersionableObject {
    ID: number;
    parent: Node;
}

class TestCharNode extends Node {
    bold: boolean;
    char: string;
    constructor(char: string) {
        super();
        Text++;
        this.ID = Text;
        this.bold = true;
        this.char = char;
    }
    display(): string {
        return this.char;
    }
}
class TestNode extends Node {
    name: string;
    attr: Record<string, object>;
    children: Node[];
    tagName: string;
    constructor() {
        super();
        ID++;
        this.ID = ID;
        this.name = '' + ID;
        this.children = new VersionableArray() as Node[];
        this.attr = makeVersionable({
            b: new Set(['p', 'o' + ID]),
            c: {
                'x': ID % 2 ? 'y' : 'z',
                'A': 'AAA',
            },
        }) as Record<string, object>;
    }

    display(withSpace = false, level = 0): string {
        const space = Array(2 * level).join(' ');
        let str = (withSpace ? space : '') + this.name;
        const add = (value: string, key: string): string => (str += key + ':' + value + ';');
        for (const key in this.attr) {
            if (key === 'b') {
                const m = [];
                (this.attr[key] as Set<number | string>).forEach(value => m.push(value));
                m.join(';');
                str += ' b<' + m.join(';') + '>';
            } else {
                str += ' c[';
                const style = this.attr[key];
                Object.keys(style).forEach(key => add(style[key], key));
                str += ']';
            }
        }
        level++;
        if (this.children.length) {
            str += '{';
            if (withSpace) {
                str += '\n';
            }
            const a = [];
            this.children.forEach(child => a.push((child as TestNode).display(withSpace, level)));
            str += a.join('|');
            if (withSpace) {
                str += '\n' + space;
            }
            str += '}';
        }
        return str;
    }
}

function addChildren(
    memory: Memory,
    root: TestNode,
    deep: number,
    num: number,
    textLength?: number,
): void {
    const children = [];
    for (let k = 0; k < num; k++) {
        const child = new TestNode();
        if (deep > 0) {
            addChildren(memory, child, deep - 1, num, textLength);
        } else if (textLength) {
            const texts = [];
            for (let i = 0; i < textLength; i++) {
                const child = new TestCharNode('a');
                texts.push(child);
            }
            child.children.push(...texts);
        }
        memory.linkToMemory(child);
        children.push(child);
    }
    root.children.push(...children);
}
function simulateAddSection(memory: Memory, root: TestNode): TestNode {
    const section = new TestNode();
    root.children.push(section);
    addChildren(memory, section, 2, 3, 30);
    return section;
}
function read(node: Node): void {
    if (node instanceof TestNode) {
        // eslint-disable-next-line no-unused-expressions
        node.name;
        (node.attr.b as Set<string>).has('p');
        // eslint-disable-next-line no-unused-expressions
        node.attr.c;
        // eslint-disable-next-line no-unused-expressions
        (node.attr.c as Record<string, string>).x;
        // eslint-disable-next-line no-unused-expressions
        node.children[0];
    } else if (node instanceof TestCharNode) {
        // eslint-disable-next-line no-unused-expressions
        node.char;
    }
}
function readAll(node: Node, nodes?: Node[]): Node[] {
    nodes = nodes || [];
    nodes.push(node);
    read(node);
    const children = (node as TestNode).children;
    if (children) {
        for (let k = 0, len = children.length; k < len; k++) {
            const node = children[k];
            readAll(node as Node, nodes);
        }
    }
    return nodes;
}

describe('core', () => {
    describe('state', () => {
        describe('Memory', () => {
            let memory: Memory;
            let array: VersionableArray;
            before(() => {
                memory = new Memory();
                memory.create('1');
                memory.switchTo('1');
                array = new VersionableArray();
            });
            it('Create and Link 100 arrays and add inside 1000 items', () => {
                const d = Date.now();
                for (let k = 0; k < 10; k++) {
                    array = new VersionableArray();
                    memory.linkToMemory(array);
                    for (let k = 0; k < 1000; k++) {
                        array.push(k);
                    }
                }
                const dt = Date.now() - d;
                expect(dt).to.lessThan(100);
            });
            it('array forEach (with length 1000)', () => {
                const d = Date.now();
                const fn = function emptyCallbackForTest(): void {
                    return;
                };
                for (let k = 0; k < 1000; k++) {
                    array.forEach(fn);
                }
                const dt = Date.now() - d;
                expect(dt).to.lessThan(10, 'Time to use 1000 * forEach');
            });
            it('array indexOf (with length 1000)', () => {
                const d = Date.now();
                for (let k = 0; k < 1000; k++) {
                    array.indexOf(k);
                }
                const dt = Date.now() - d;
                expect(dt).to.lessThan(10, 'Time to use 1000 * indexOf');
            });
        });
        describe('versionableNode', () => {
            describe('children, parent, attributes', () => {
                ID = 0;
                const memory = new Memory();

                memory.create('1');
                memory.switchTo('1');
                const root = new TestNode();
                memory.linkToMemory(root);

                it('create and read nodes', () => {
                    addChildren(memory, root, 0, 1);

                    expect(root.display()).to.equal(
                        '1 b<p;o1> c[x:y;A:AAA;]{2 b<p;o2> c[x:z;A:AAA;]}',
                    );

                    memory.create('1-1');
                    memory.create('1-2');

                    memory.switchTo('1-1');
                    addChildren(memory, root, 1, 2);
                    expect(root.display()).to.equal(
                        '1 b<p;o1> c[x:y;A:AAA;]{2 b<p;o2> c[x:z;A:AAA;]|3 b<p;o3> c[x:y;A:AAA;]{4 b<p;o4> c[x:z;A:AAA;]|5 b<p;o5> c[x:y;A:AAA;]}|6 b<p;o6> c[x:z;A:AAA;]{7 b<p;o7> c[x:y;A:AAA;]|8 b<p;o8> c[x:z;A:AAA;]}}',
                    );

                    memory.switchTo('1-2');
                    addChildren(memory, root, 0, 2);
                    expect(root.display()).to.equal(
                        '1 b<p;o1> c[x:y;A:AAA;]{2 b<p;o2> c[x:z;A:AAA;]|9 b<p;o9> c[x:y;A:AAA;]|10 b<p;o10> c[x:z;A:AAA;]}',
                    );

                    memory.switchTo('1-1');
                    memory.create('1-1-55');
                    memory.switchTo('1-1-55');

                    const child = root.children[1] as TestNode;
                    addChildren(memory, child, 0, 5);
                    let nb = 0;
                    Object.keys(memory._slices['1-1-55']).forEach((key: string) => {
                        if (!isNaN(+key)) {
                            nb++;
                        }
                    });
                    expect(nb).to.equal(21); // should create 5 nodes (5 nodes * 4 (node + attr + b + c) (not the empty children) + 1 children list)
                    memory.create('1-1-55-1');
                    memory.switchTo('1-1-55-1');
                    child.children.splice(1, 3);
                    const slice = memory._slices['1-1-55-1'];
                    expect(Object.keys(slice).length).to.equal(1); // one patch
                });
            });
            describe('Performance (double time to have an error)', () => {
                ID = 0;
                const memory = new Memory();
                memory.create('1');
                memory.switchTo('1');
                const root = new TestNode();
                memory.linkToMemory(root);

                it('Should write 100 chars in maximum 100ms', () => {
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    const root = new TestNode();
                    memory.linkToMemory(root);

                    const section = simulateAddSection(memory, root);
                    const child = (section.children[0] as TestNode).children[1] as TestNode;

                    const d = Date.now();
                    for (let k = 0; k < 100; k++) {
                        memory.create('test-' + k);
                        memory.autoSnapshot();
                        memory.switchTo('test-' + k);
                        const children = child.children;
                        // add char
                        children.push(new TestCharNode(k.toString()));
                        // simulate read new text for redraw
                        for (let k = 0, len = children.length; k < len; k++) {
                            const node = children[k];
                            if (node instanceof TestCharNode) {
                                // eslint-disable-next-line no-unused-expressions
                                node.char;
                            }
                        }
                    }
                    const dt = Date.now() - d;

                    expect(dt).to.lessThan(100);
                });
                function testAddAndRead(memory: Memory, root: TestNode, nb: number): number {
                    for (let k = 0; k < nb; k++) {
                        memory.create('1-t-' + k);
                        memory.autoSnapshot();
                        memory.switchTo('1-t-' + k);
                    }

                    memory.create('1-t');
                    memory.switchTo('1-t');

                    const section = simulateAddSection(memory, root);

                    memory.switchTo('test');
                    memory.switchTo('1-t');

                    const d = Date.now();
                    const nodes = readAll(section);
                    const dt = Date.now() - d;

                    let nodesNb = 0;
                    let chars = 0;
                    for (let k = 0, len = nodes.length; k < len; k++) {
                        const node = nodes[k];
                        if (node instanceof TestNode) {
                            nodesNb++;
                        } else {
                            chars++;
                        }
                    }

                    console.log(
                        'Time to load ' +
                            nodesNb +
                            ' nodes and ' +
                            chars +
                            ' chars on ' +
                            nb +
                            ' slices',
                        dt,
                    );

                    const d2 = Date.now();
                    readAll(section);
                    const dt2 = Date.now() - d2;
                    console.log(
                        'Time to re-load ' +
                            nodesNb +
                            ' nodes and ' +
                            chars +
                            ' chars on ' +
                            nb +
                            ' slices',
                        dt2,
                    );

                    return dt;
                }
                it('Should create and nodes with 10 slices in minimum time', () => {
                    memory.switchTo('1');
                    memory.create('test');
                    memory.switchTo('test');
                    const dt = testAddAndRead(memory, root, 10);
                    expect(dt).to.lessThan(50);
                });
                it('Should remove 10 slices in minimum time', () => {
                    const d = Date.now();
                    memory.switchTo('1');
                    memory.remove('test');
                    const dt = Date.now() - d;
                    expect(dt).to.lessThan(6);
                });
                it('Should create and nodes with 100 slices in maximum 30ms', () => {
                    memory.switchTo('1');
                    memory.create('test');
                    memory.switchTo('test');
                    const dt = testAddAndRead(memory, root, 100);
                    expect(dt).to.lessThan(50);
                });
                it('Should remove 100 slices in minimum time', () => {
                    const d = Date.now();
                    memory.switchTo('1');
                    memory.remove('test');
                    const dt = Date.now() - d;
                    expect(dt).to.lessThan(6);
                });
                it('Should read nodes with 1.000 slices in maximum 30ms', () => {
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    const root = new TestNode();
                    memory.linkToMemory(root);
                    const dt = testAddAndRead(memory, root, 1000);
                    expect(dt).to.lessThan(50);
                });
                it('Should create a lot of nodes in minimum time', () => {
                    memory.switchTo('1');
                    memory.create('test');
                    memory.switchTo('test');

                    memory.create('1-3');
                    memory.switchTo('1-3');

                    const d = Date.now();
                    const nodeInti = ID;
                    const textInti = Text;
                    for (let k = 0; k < 30; k++) {
                        simulateAddSection(memory, root);
                    }
                    const dt = Date.now() - d;

                    console.log(
                        'Time to create ' +
                            (ID - nodeInti) +
                            ' nodes and ' +
                            (Text - textInti) +
                            ' chars',
                        dt,
                    );
                    expect(dt).to.lessThan(1000); // perf to create node
                });
                it('Should switch slice in minimum time', () => {
                    const d = Date.now();
                    memory.switchTo('test');
                    memory.create('1-2');
                    memory.switchTo('1-3');
                    memory.create('1-3-1');
                    memory.switchTo('1-2');
                    memory.switchTo('1-3-1');
                    const dt = Date.now() - d;
                    console.log('Time to switch memory', dt);
                    expect(dt).to.lessThan(50);
                });
                it('Should read the nodes the first time in minimum time', () => {
                    memory.switchTo('1-3-1');
                    const d = Date.now();
                    readAll(root);
                    const dt = Date.now() - d;
                    console.log('Time to load nodes', dt);
                    expect(dt).to.lessThan(250);
                });
                it('Should read the nodes in minimum time', () => {
                    const times = [];

                    const d = Date.now();
                    const nodes = readAll(root);
                    const dt = Date.now() - d;
                    times.push(dt);
                    console.log('Time to re-load nodes', dt);

                    for (let k = 0; k < 5; k++) {
                        const d = Date.now();
                        // nodes.forEach(read);
                        readAll(root);
                        const dt = Date.now() - d;
                        times.push(dt);
                        console.log('Time to re-load nodes', dt);
                    }

                    let nodesNb = 0;
                    let chars = 0;
                    nodes.forEach(node => {
                        if (node instanceof TestNode) {
                            nodesNb++;
                        } else {
                            chars++;
                        }
                    });
                    const average = Math.round(times.reduce((a, b) => a + b) / times.length);
                    console.log(
                        're-load ' + nodesNb + ' nodes and ' + chars + ' chars time average',
                        average,
                    );
                    expect(average).to.lessThan(60);
                });
            });
        });
    });
});
