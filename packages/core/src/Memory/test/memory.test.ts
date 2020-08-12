/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import { Memory, markAsDiffRoot } from '../Memory';
import { VersionableObject } from '../VersionableObject';
import { VersionableArray } from '../VersionableArray';
import { VersionableSet } from '../VersionableSet';
import { makeVersionable, markNotVersionable, proxifyVersionable } from '../Versionable';
import { memoryProxyPramsKey } from '../const';

describe('core', () => {
    describe('state', () => {
        describe('memory', () => {
            describe('throw', () => {
                const memory = new Memory();
                memory.create('1');
                memory.switchTo('1');

                it('if try create a slice twice', () => {
                    expect((): Memory => memory.create('1')).to.throw('already exists');
                });
                it('if try remove a slice before switch on an other', () => {
                    memory.create('rem-2');
                    memory.switchTo('rem-2');
                    memory.create('rem-3');
                    memory.switchTo('rem-3');
                    expect((): Memory => memory.remove('rem-2')).to.throw('switch');
                });
                it('if try remove the original slice', () => {
                    expect((): Memory => memory.remove('')).to.throw('original');
                });
                it('if try switch on a undefined slice', () => {
                    expect((): Memory => memory.switchTo('2')).to.throw('must create');
                });
                it('if try to link a non versionable object', () => {
                    expect((): void => {
                        memory.attach({
                            test: 1,
                        });
                    }).to.throw('VersionableObject', 'object');
                    expect((): void => {
                        memory.attach([1]);
                    }).to.throw('VersionableObject', 'array');
                    expect((): void => {
                        memory.attach(new Set([1]));
                    }).to.throw('VersionableObject', 'set');
                });
                it('if try to link a non versionable object from proxy Object.assing', () => {
                    const versionable = makeVersionable({ test: 1 });
                    const obj = Object.assign({}, versionable);
                    expect((): void => {
                        memory.attach(obj);
                    }).to.throw('VersionableObject');
                });
                it('if try to add as attribute a non versionable object from proxy Object.assing', () => {
                    const versionable = makeVersionable({ test: 1 });
                    const obj = Object.assign({}, versionable);
                    const ref = makeVersionable({ toto: undefined });
                    expect((): void => {
                        ref.toto = obj;
                    }).to.throw('VersionableObject');
                });
                it('if try to link an object and not the proxy of versionable', () => {
                    const obj = { test: 1 };
                    makeVersionable(obj);
                    expect((): void => {
                        memory.attach(obj);
                    }).to.throw('already');
                });
                it('if try to add as attribute an object and not the proxy of versionable', () => {
                    const obj = { test: 1 };
                    const ref = makeVersionable({ toto: undefined });
                    makeVersionable(obj);
                    expect((): void => {
                        ref.toto = obj;
                    }).to.throw('already');
                });
                it('if try to link a versionable object to 2 memories', () => {
                    const memoryTest = new Memory();
                    memoryTest.create('1');
                    memoryTest.switchTo('1');
                    const obj = new VersionableObject();
                    memoryTest.attach(obj);
                    const array = new VersionableArray();
                    memoryTest.attach(array);
                    const set = new VersionableSet();
                    memoryTest.attach(set);

                    expect((): void => {
                        memory.attach(obj);
                    }).to.throw('other memory', 'object');
                    expect((): void => {
                        memory.attach(array);
                    }).to.throw('other memory', 'array');
                    expect((): void => {
                        memory.attach(set);
                    }).to.throw('other memory', 'set');
                });
                it('if try to link a versionable from an other memory in versionable', () => {
                    const memoryTest = new Memory();
                    memoryTest.create('1');
                    memoryTest.switchTo('1');
                    const root = new VersionableObject();
                    memory.attach(root);
                    const obj = new VersionableObject();
                    memoryTest.attach(obj);
                    const array = new VersionableArray();
                    memoryTest.attach(array);
                    const set = new VersionableSet();
                    memoryTest.attach(set);

                    expect((): void => {
                        root['x+y'] = obj;
                    }).to.throw('other memory', 'object');
                    expect((): void => {
                        root['x+y'] = array;
                    }).to.throw('other memory', 'array');
                    expect((): void => {
                        root['x+y'] = set;
                    }).to.throw('other memory', 'set');
                });
                it('if try to makeVersionable on a object already versionable with the old ref', () => {
                    const obj = {};
                    makeVersionable(obj);
                    expect((): void => {
                        makeVersionable(obj);
                    }).to.throw('proxy', 'object');
                    const array = [];
                    makeVersionable(array);
                    expect((): void => {
                        makeVersionable(array);
                    }).to.throw('proxy', 'array');
                    const set = new Set();
                    makeVersionable(set);
                    expect((): void => {
                        makeVersionable(set);
                    }).to.throw('proxy', 'set');
                });
                it('if try to link an object in versionable', () => {
                    const obj = new VersionableArray();
                    expect((): void => {
                        obj['t+h'] = {};
                    }).to.throw('VersionableObject', 'object');

                    const array = new VersionableArray();
                    expect((): void => {
                        array.push({});
                    }).to.throw('VersionableObject', 'array');

                    const set = new VersionableSet();
                    expect((): void => {
                        set.add({});
                    }).to.throw('VersionableObject', 'set');
                });
                it('if try to link an object in custom class constructor', () => {
                    class SuperObject extends VersionableObject {
                        obj: object;
                        constructor() {
                            super();
                            this.obj = {};
                        }
                    }
                    expect((): SuperObject => new SuperObject()).to.throw('VersionableObject');
                });
                it('if try to link an object in custom class', () => {
                    class SuperObject extends VersionableObject {
                        obj: object;
                        myMethod(): void {
                            this.obj = {};
                        }
                    }
                    const instance = new SuperObject();
                    expect((): void => {
                        instance.myMethod();
                    }).to.throw('VersionableObject');
                });
                it('if try to edit attribute in a frozen slice', () => {
                    const obj = new VersionableObject();
                    memory.attach(obj);
                    memory.switchTo('1');
                    memory.create('1-1');
                    memory.switchTo('1');
                    expect((): number => (obj['H' + 1] = 4)).to.throw('can not update', 'object');
                    memory.remove('1-1');
                });
                it('if try to edit array in a frozen slice', () => {
                    const memory = new Memory();
                    const array = new VersionableArray();
                    memory.attach(array);
                    memory.create('1');
                    memory.switchTo('1');
                    memory.create('2');
                    expect((): number => array.push(4)).to.throw('can not update', 'array');
                    expect((): number => (array[1] = 3)).to.throw('can not update', 'array');
                    memory.switchTo('1');
                    memory.remove('2');
                });
                it('if try to edit set in a frozen slice', () => {
                    const memory = new Memory();
                    const set = new VersionableSet();
                    memory.attach(set);
                    memory.create('1');
                    memory.switchTo('1');
                    memory.create('1-1');
                    memory.switchTo('1');
                    expect((): VersionableSet => set.add(4)).to.throw('can not update', 'add');
                    expect((): boolean => set.delete(4)).to.throw('can not update', 'delete');
                    expect((): VersionableSet => set.clear()).to.throw('can not update', 'clear');
                    memory.remove('1-1');
                });
                it('if try to compress/snapshot with wrong slice', () => {
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    memory.create('test-0');
                    memory.switchTo('test-0');
                    memory.create('test-1');
                    memory.switchTo('test-1');
                    memory.create('test-2');
                    memory.switchTo('test-2');
                    expect((): void => memory.snapshot('test-2', 'test', 'snap')).to.throw('merge');
                });
            });

            describe('create versionable', () => {
                const memory = new Memory();
                memory.create('1');
                memory.switchTo('1');

                it('link a object marked as not versionable', () => {
                    const obj = new VersionableObject();
                    const context = {};
                    markNotVersionable(context);
                    memory.attach(obj);
                    // do not throw
                    obj['g+k'] = context;
                });
                it('makeVersionable an object after Object.assing by a versionable', () => {
                    const versionable = makeVersionable({ test: 1 });
                    // do not throw
                    const obj = makeVersionable(Object.assign({}, versionable));
                    expect(obj.test).to.equal(1);
                    obj.test = 3;
                    expect(obj.test).to.equal(3);
                    expect(versionable.test).to.equal(1, 'Original object value');
                });
                it('custom class/object', () => {
                    class SuperObject extends VersionableObject {
                        my: number;
                        toto: number;
                        myMethod(num: number): void {
                            this.my = num;
                        }
                    }
                    const obj = new SuperObject();
                    obj.toto = 99;
                    expect(obj.my).to.equal(
                        undefined,
                        'Should keep undefined value on versionable',
                    );
                    expect(obj.toto).to.equal(99, 'Should set a value on unlinked versionable');
                    memory.attach(obj);
                    expect(obj.my).to.equal(
                        undefined,
                        'Should keep undefined value when link to memory',
                    );
                    expect(obj.toto).to.equal(99, 'Should keep value when link to memory');
                    obj.myMethod(42);
                    expect(obj.my).to.equal(42, 'Should use custom method on versionable');
                    expect(obj.toto).to.equal(99, 'Should keep same value');
                });
                it('custom Array', () => {
                    class SuperArray extends VersionableArray {
                        myMethod(num: number): void {
                            this.push(num);
                        }
                    }
                    const obj = new SuperArray();
                    obj.push(1);
                    obj.myMethod(99);
                    expect(obj.join(',')).to.equal('1,99');
                    expect(obj.length).to.equal(2);
                    memory.attach(obj);
                    expect(obj.join(',')).to.equal('1,99');
                    expect(obj.length).to.equal(2);
                    obj.myMethod(42);
                    expect(obj.join(',')).to.equal('1,99,42');
                    expect(obj.length).to.equal(3);
                });
                it('use proxy of versionable array', () => {
                    const obj = makeVersionable({ test: [] });
                    const array = new VersionableArray();
                    const proxy = new Proxy(array, {});
                    memory.attach(obj);
                    obj.test = proxy;
                    expect(obj.test).to.equal(proxy);
                    obj.test.push(9);
                    expect(array).to.deep.equal([9]);
                });
                it('custom Set who extend versionableSet', () => {
                    class SuperSet extends VersionableSet {
                        myMethod(num: number): void {
                            this.add(num);
                        }
                    }
                    const obj = new SuperSet();
                    obj.add(1);
                    obj.myMethod(99);
                    function join(obj: SuperSet): string {
                        const array = [];
                        obj.forEach((value: number): number => array.push(value));
                        return array.join(',');
                    }
                    expect(join(obj)).to.equal('1,99');
                    expect(obj.size).to.equal(2);
                    memory.attach(obj);
                    expect(join(obj)).to.equal('1,99');
                    expect(obj.size).to.equal(2);
                    obj.myMethod(42);
                    expect(join(obj)).to.equal('1,99,42');
                    expect(obj.size).to.equal(3);
                });
                it('Set with default value', () => {
                    const obj = makeVersionable({
                        a: 1,
                        b: new Set([{}]),
                        c: 3,
                    });
                    const b = obj.b;
                    const memory = new Memory();
                    memory.create('1');
                    memory.switchTo('1');
                    memory.attach(obj);
                    memory.create('test');
                    memory.switchTo('test');
                    obj.b = new VersionableSet([1]);
                    expect([...obj.b]).to.deep.equal([1]);
                    memory.switchTo('1');
                    expect(obj.b).to.equal(b, 'switch object');
                    expect(obj.b.size).to.equal(1, 'one object');
                    expect([...obj.b]).to.deep.equal(
                        [{}],
                        'should have the set who contains an object',
                    );
                    memory.switchTo('test');
                    expect(obj.b.size).to.equal(1, 'one number');
                    expect([...obj.b]).to.deep.equal(
                        [1],
                        'should have the set who contains a number',
                    );
                });
                it('create versionableSet with array value to construct it', () => {
                    const set = new VersionableSet([1, 2, 3]);
                    const memory = new Memory();
                    memory.create('1');
                    memory.switchTo('1');
                    memory.attach(set);
                    expect(set.size).to.equal(3);
                });
                it('create versionableSet with customSet value to construct it', () => {
                    class TestSet extends Set {
                        method(): number {
                            this.add(5);
                            return 3;
                        }
                    }
                    const set = new TestSet();
                    set.add(3);
                    const proxy = (new VersionableSet(set) as unknown) as TestSet;
                    const memory = new Memory();
                    memory.create('1');
                    memory.switchTo('1');
                    memory.attach(proxy);
                    expect(proxy.size).to.equal(1);
                    expect(proxy.method()).to.equal(3);
                });
                it('create versionableSet with versionableSet', () => {
                    const set = new VersionableSet();
                    set.add(3);
                    expect(set.size).to.equal(1);
                    const set2 = new VersionableSet(set);
                    set2.add(4);
                    expect(set2.size).to.equal(2);
                    expect([...set2.values()]).to.deep.equal([3, 4]);
                    set.add(5);
                    expect(set2.size).to.equal(2);
                });
                it('custom class who contains proxy of Versionable', () => {
                    class SuperObject extends VersionableObject {
                        obj: object;
                        ref = 0;
                        constructor() {
                            super();
                            this.obj = proxifyVersionable(new VersionableObject(), {
                                set: (obj: object, prop: string, value: number): boolean => {
                                    obj[prop] = value;
                                    if (value === 42) {
                                        this.ref++;
                                    }
                                    return true;
                                },
                            });
                        }
                    }
                    const instance = new SuperObject();
                    expect(instance.ref).to.equal(0);
                    instance.obj['A'.toString()] = 99;
                    expect(instance.ref).to.equal(0);
                    instance.obj['A'.toString()] = 42;
                    expect(instance.ref).to.equal(1);

                    memory.attach(instance);

                    expect(instance.obj).to.be.an.instanceof(VersionableObject);
                    expect(instance.obj['A'.toString()]).to.equal(42);
                    expect(instance.ref).to.equal(1);
                    instance.obj['B'.toString()] = 99;
                    expect(instance.ref).to.equal(1);
                    instance.obj['B'.toString()] = 42;
                    expect(instance.ref).to.equal(2);
                });
                it('custom class who contains get overwrite of Versionable', () => {
                    class SuperObject extends VersionableObject {
                        obj: Record<string, number>;
                        constructor() {
                            super();
                            this.obj = new VersionableObject() as Record<string, number>;
                            Object.defineProperty(this.obj, 'truc', {
                                get: (): number => {
                                    return 42;
                                },
                                set: (): void => {
                                    return;
                                },
                            });
                        }

                        get getter(): Record<string, number> {
                            return this.obj;
                        }
                    }
                    const instance = new SuperObject();
                    instance.obj.A = 99;
                    expect(instance.obj.A).to.equal(99);
                    expect(instance.obj.truc).to.equal(42);
                    instance.obj.truc = 99;
                    expect(instance.obj.truc).to.equal(42);
                    expect(instance.obj).to.equal(instance.getter);

                    memory.attach(instance);

                    expect(instance.obj).to.be.an.instanceof(VersionableObject);
                    instance.obj.B = 99;
                    expect(instance.obj.B).to.equal(99);
                    expect(instance.obj.truc).to.equal(42);
                    instance.obj.truc = 99;
                    expect(instance.obj.truc).to.equal(42);
                    expect(instance.obj).to.equal(instance.getter);
                });
            });

            describe('make versionable', () => {
                const memory = new Memory();
                memory.create('1');
                memory.switchTo('1');

                it('object', () => {
                    const obj: Record<string, number> = {
                        a: 1,
                        b: 2,
                        c: 3,
                    };
                    Object.defineProperty(obj, 'z', {
                        get() {
                            return 42;
                        },
                        enumerable: false,
                        configurable: false,
                    });
                    const proxy = makeVersionable(obj);
                    memory.attach(proxy);
                    expect(proxy.a).to.equal(1);
                    expect(proxy.b).to.equal(2);
                    expect(proxy.c).to.equal(3);
                    expect(proxy.z).to.equal(42);
                });
                it('object who contains Object', () => {
                    const obj = makeVersionable({
                        a: 1,
                        b: {
                            x: 1,
                            y: 2,
                        },
                        c: 3,
                    });
                    memory.attach(obj);
                    expect(obj.a).to.equal(1);
                    expect(obj.b).to.be.a('object');
                    expect(Object.keys(obj.b).join()).to.equal('x,y');
                    expect(obj.b.x).to.equal(1);
                    expect(obj.b.y).to.equal(2);
                    expect(obj.c).to.equal(3);
                });
                it('object who contains Object who contains Object', () => {
                    const obj = makeVersionable({
                        a: 1,
                        b: {
                            x: 1,
                            y: {
                                e: 1,
                                y: 2,
                            },
                        },
                        c: 3,
                    });
                    memory.attach(obj);
                    expect(obj.b).to.be.a('object');
                    expect(Object.keys(obj.b).join()).to.equal('x,y');
                    expect(obj.b.x).to.equal(1);
                    expect(obj.b.y).to.be.a('object');
                    expect(Object.keys(obj.b.y).join()).to.equal('e,y');
                    expect(obj.b.y.e).to.equal(1);
                    expect(obj.b.y.y).to.equal(2);
                });
                it('object who contains Set', () => {
                    const obj = makeVersionable({
                        a: 1,
                        b: new Set(['x', 'y', 'z']),
                        c: 3,
                    });
                    memory.attach(obj);
                    expect(obj.a).to.equal(1);
                    expect(obj.b).to.be.instanceOf(Set);
                    expect(obj.b.has('x')).to.equal(true);
                    expect(obj.b.has('y')).to.equal(true);
                    expect(obj.b.has('z')).to.equal(true);
                    expect(obj.b.has('h')).to.equal(false);
                    expect(obj.c).to.equal(3);
                });
                it('object who contains Array', () => {
                    const obj = makeVersionable({
                        a: 1,
                        b: ['x', 'y', 'z'],
                        c: 3,
                    });
                    memory.attach(obj);
                    expect(obj.a).to.equal(1);
                    expect(obj.b).to.be.instanceOf(Array);
                    expect(obj.b.indexOf('x')).to.equal(0, "should find 'x' at 0");
                    expect(obj.b.indexOf('y')).to.equal(1, "should find 'y' at 0");
                    expect(obj.b.indexOf('z')).to.equal(2, "should find 'z' at 0");
                    expect(obj.b.indexOf('h')).to.equal(-1, "should not find 'h'");
                    let str = '';
                    obj.b.forEach(v => {
                        str += v;
                    });
                    expect(str).to.equal('xyz', 'should use forEach');
                    expect(obj.c).to.equal(3);

                    memory.switchTo('');
                    expect(obj).to.deep.equal({}, 'should not find object in other memory slice');
                    memory.switchTo('1');
                    expect(obj).to.deep.equal(
                        {
                            a: 1,
                            b: ['x', 'y', 'z'],
                            c: 3,
                        },
                        'Should have all values',
                    );
                });
                it('complexe', () => {
                    const full = makeVersionable({
                        a: 1,
                        b: ['x', 'y', 'z'],
                        c: new Set(['x', 'y', 'z']),
                        d: {
                            x: 1,
                            y: {
                                e: 1,
                                y: 2,
                            },
                        },
                        e: [],
                        f: {},
                        g: new Set(),
                        h: 'a',
                        i: [{ 'a': 1 }, 55],
                        j: new Set([{ 'b': 1 }]),
                        k: [['a'], ['b', 'c', 'd'], ['x', 'y', 'z']],
                    });

                    expect(!!full.i[0][memoryProxyPramsKey].ID).to.equal(
                        true,
                        'proxify object in array',
                    );
                    const list = [];
                    full.j.forEach((item: object) => {
                        list.push(item);
                    });
                    expect(!!list[0][memoryProxyPramsKey].ID).to.equal(
                        true,
                        'proxify object in set',
                    );
                    expect(!!full.k[0][memoryProxyPramsKey].ID).to.equal(
                        true,
                        'proxify array in array',
                    );

                    memory.attach(full);

                    memory.create('1-a');
                    memory.switchTo('1-a');
                    full.k[1][3] = 'e';
                    expect(full.k[1]).to.deep.equal(
                        ['b', 'c', 'd', 'e'],
                        'should link to memory and change the array in array',
                    );
                    memory.switchTo('1');
                    expect(full.k[1]).to.deep.equal(
                        ['b', 'c', 'd'],
                        'should have the previous value in the array in array',
                    );
                });
                it('make versionable a class who extends Set class', () => {
                    class TestSet extends Set {
                        method(): number {
                            this.add(5);
                            return 3;
                        }
                    }
                    let set = new TestSet();
                    expect(set.size).to.equal(0, 'before link, set is empty');
                    expect(set.method()).to.equal(3, 'before link, call method');
                    expect(set.size).to.equal(1, 'before link, set contains the value');

                    set = makeVersionable(new TestSet());
                    expect(set.size).to.equal(0, 'make versionable, set is empty');
                    expect(set.method()).to.equal(3, 'make versionable, call method');
                    expect(set.size).to.equal(1, 'make versionable, set contains the value');

                    set = makeVersionable(new TestSet());
                    const memory = new Memory();
                    memory.create('1');
                    memory.switchTo('1');
                    memory.attach(set);
                    expect(set.size).to.equal(0, 'linked, set is empty');
                    expect(set.method()).to.equal(3, 'linked, call method');
                    expect(set.size).to.equal(1, 'linked, set contains the value');
                });
            });

            describe('specific getter', () => {
                it('object getter should keep proxy for "this"', () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let obj: any = null;
                    let test = 0;
                    obj = makeVersionable({
                        get test() {
                            if (obj) {
                                test++;
                                expect(this).to.equal(obj);
                            }
                            return test;
                        },
                    });
                    expect(obj.test).to.equal(1);
                });
                it('custom class getter should keep proxy for "this"', () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let obj: any = null;
                    let test = 0;
                    class Custom extends VersionableObject {
                        get test(): number {
                            if (obj) {
                                test++;
                                expect(this).to.equal(obj);
                            }
                            return test;
                        }
                    }
                    obj = new Custom();
                    expect(obj.test).to.equal(1);
                });
                it('extended custom class getter should keep proxy for "this"', () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let obj: any = null;
                    let test = 0;
                    class Custom extends VersionableObject {
                        get test(): number {
                            if (obj) {
                                test++;
                                expect(this).to.equal(obj);
                            }
                            return test;
                        }
                    }
                    class CustomCustom extends Custom {}
                    obj = new CustomCustom();
                    expect(obj.test).to.equal(1);
                });
                it('overwrite toString method', () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let obj: any = null;
                    class Custom extends VersionableObject {
                        toString(): string {
                            return '5';
                        }
                    }
                    class CustomCustom extends Custom {}
                    obj = new CustomCustom();
                    expect(typeof obj.toString).to.equal('function');
                    expect(obj.toString()).to.equal('5');
                });
                it('get constructor', () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let obj: any = null;
                    class Custom extends VersionableObject {
                        getConstructor(): string {
                            return this.constructor.name;
                        }
                    }
                    class CustomCustom extends Custom {}
                    obj = new CustomCustom();
                    expect(obj.getConstructor()).to.equal('CustomCustom');
                });
                it.skip('array getter should keep proxy for "this" (use defineProperty)', () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const obj = new VersionableArray() as any;
                    let test = 0;
                    Object.defineProperty(obj, 'test', {
                        get() {
                            if (obj) {
                                test++;
                                expect(this).to.equal(obj);
                            }
                            return test;
                        },
                    });
                    expect(obj.test).to.equal(1);
                });
                it('array slice', () => {
                    const memory = new Memory();
                    const array = makeVersionable([1, 2, 3, 4, 5]);
                    memory.attach(array);
                    const newArray = array.slice();
                    expect(newArray).to.deep.equal([1, 2, 3, 4, 5]);
                    expect(newArray[memoryProxyPramsKey]).to.equal(undefined);
                });
                it('array slice on VersionableArray', () => {
                    const memory = new Memory();
                    const array = new VersionableArray(1, 2, 3, 4, 5);
                    memory.attach(array);
                    const newArray = array.slice();
                    expect(newArray).to.deep.equal([1, 2, 3, 4, 5]);
                    expect(newArray[memoryProxyPramsKey].ID).to.not.equal(
                        array[memoryProxyPramsKey].ID,
                    );
                });
                it('array splice', () => {
                    const memory = new Memory();
                    const array = makeVersionable([1, 2, 3, 4, 5]);
                    memory.attach(array);
                    const newArray = array.splice(1, 3);
                    expect(array).to.deep.equal([1, 5]);
                    expect(newArray).to.deep.equal([2, 3, 4]);
                    expect(newArray[memoryProxyPramsKey]).to.equal(undefined);
                });
                it('array splice on VersionableArray', () => {
                    const memory = new Memory();
                    const array = new VersionableArray(1, 2, 3, 4, 5);
                    memory.attach(array);
                    const newArray = array.splice(1, 3);
                    expect(array).to.deep.equal([1, 5]);
                    expect(newArray).to.deep.equal([2, 3, 4]);
                    expect(newArray[memoryProxyPramsKey].ID).to.not.equal(
                        array[memoryProxyPramsKey].ID,
                    );
                });
                it('array forEach', () => {
                    const memory = new Memory();
                    const array = new VersionableArray(1, 2, 3, 4, 5);
                    memory.attach(array);
                    const values = [];
                    const indexes = [];
                    const arrays = [];
                    const res = array.forEach((value, index, array) => {
                        values.push(value);
                        indexes.push(index);
                        arrays.push(array);
                        return 9;
                    });
                    expect(res).to.equal(undefined);
                    expect(values).to.deep.equal([1, 2, 3, 4, 5]);
                    expect(indexes).to.deep.equal([0, 1, 2, 3, 4]);
                    expect(arrays).to.deep.equal([array, array, array, array, array]);
                });
                it('array map', () => {
                    const memory = new Memory();
                    const array = new VersionableArray(1, 2, 3, 4, 5);
                    memory.attach(array);
                    const values = [];
                    const indexes = [];
                    const arrays = [];
                    const res = array.map((value: number, index, array) => {
                        values.push(value);
                        indexes.push(index);
                        arrays.push(array);
                        return 8 + value;
                    });
                    expect(res[memoryProxyPramsKey]).to.equal(undefined);
                    expect(res).to.deep.equal([9, 10, 11, 12, 13]);
                    expect(values).to.deep.equal([1, 2, 3, 4, 5]);
                    expect(indexes).to.deep.equal([0, 1, 2, 3, 4]);
                    expect(arrays).to.deep.equal([array, array, array, array, array]);
                });
                it('array filter', () => {
                    const memory = new Memory();
                    const array = new VersionableArray(1, 2, 3, 4, 5);
                    memory.attach(array);
                    const values = [];
                    const indexes = [];
                    const arrays = [];
                    const res = array.filter((value: number, index, array) => {
                        values.push(value);
                        indexes.push(index);
                        arrays.push(array);
                        return !!(value % 2);
                    });
                    expect(res[memoryProxyPramsKey]).to.equal(undefined);
                    expect(res).to.deep.equal([1, 3, 5]);
                    expect(values).to.deep.equal([1, 2, 3, 4, 5]);
                    expect(indexes).to.deep.equal([0, 1, 2, 3, 4]);
                    expect(arrays).to.deep.equal([array, array, array, array, array]);
                });
                it('array indexOf', () => {
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');

                    const result = [];
                    const array = new VersionableArray();
                    for (let k = 0; k < 20; k++) {
                        array.push(k);
                        result.push(k);
                    }
                    memory.attach(array);
                    for (let k = 20; k < 40; k++) {
                        array.push(k);
                        result.push(k);
                    }

                    for (let k = 0, len = array.length; k < len; k++) {
                        expect(array.indexOf(k)).to.equal(k);
                    }
                    expect(array.indexOf(-99)).to.equal(-1);

                    array[3] = -3;

                    expect(array.indexOf(3)).to.equal(-1);
                    expect(array.indexOf(-3)).to.equal(3);
                });
                it('array indexOf value several times', () => {
                    const array = new VersionableArray<number>(0, 1, 2, 3, 1, 4);
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    memory.attach(array);

                    expect(array.indexOf(1)).to.equal(1, 'should return the first index');
                    array[1] = 42;
                    expect(array.indexOf(1)).to.equal(4, 'should return the other index');
                    expect(array.indexOf(4)).to.equal(5, 'should the index');
                    array[1] = 4;
                    expect(array.indexOf(4)).to.equal(1, 'should the newest index');
                });
            });

            describe('specific setter', () => {
                it('object setter should keep proxy for "this"', () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let obj: any = null;
                    let test = 0;
                    obj = makeVersionable({
                        get test() {
                            return 0;
                        },
                        set test(x: number) {
                            test++;
                            expect(this).to.equal(obj);
                        },
                    });
                    obj.test = 1;
                    expect(test).to.equal(1);
                });
                it('custom class setter should keep proxy for "this"', () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let obj: any = null;
                    let test = 0;
                    class Custom extends VersionableObject {
                        get test(): number {
                            return 0;
                        }
                        set test(x: number) {
                            test++;
                            expect(this).to.equal(obj);
                        }
                    }
                    obj = new Custom();
                    obj.test = 1;
                    expect(test).to.equal(1);
                });
                it('extended custom class setter should keep proxy for "this"', () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let obj: any = null;
                    let test = 0;
                    class Custom extends VersionableObject {
                        get test(): number {
                            return 0;
                        }
                        set test(x: number) {
                            test++;
                            expect(this).to.equal(obj);
                        }
                    }
                    class CustomCustom extends Custom {}
                    obj = new CustomCustom();
                    obj.test = 1;
                    expect(test).to.equal(1);
                });
                it('array setter should keep proxy for "this"', () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const obj = new VersionableArray() as any;
                    let test = 0;
                    Object.defineProperty(obj, 'test', {
                        get() {
                            return 0;
                        },
                        set() {
                            test++;
                            expect(this).to.equal(obj);
                        },
                    });
                    obj.test = 1;
                    expect(test).to.equal(1);
                });
                it('use Object.assing on versionable object', () => {
                    const versionable = makeVersionable({ test: 1 });
                    const obj = makeVersionable({ test: 5 });
                    Object.assign(obj, versionable);
                    expect(obj[memoryProxyPramsKey]).to.not.equal(versionable[memoryProxyPramsKey]);
                    expect(obj.test).to.equal(1);
                    obj.test = 3;
                    expect(obj.test).to.equal(3);
                    expect(versionable.test).to.equal(1, 'Original object value');
                });
                it('use Object.assing on versionable array', () => {
                    const versionable = makeVersionable([1, 2, 3]);
                    const array = makeVersionable([]);
                    Object.assign(array, versionable);
                    expect(array[memoryProxyPramsKey]).to.not.equal(
                        versionable[memoryProxyPramsKey],
                    );
                    expect(array).to.deep.equal([1, 2, 3]);
                    array[1] = 42;
                    expect(array[1]).to.equal(42);
                    expect(versionable[1]).to.equal(2, 'Original object value');
                });
                it('array changes with splice', () => {
                    const memory = new Memory();
                    const array = makeVersionable(['x', 'y', 'z']);
                    memory.attach(array);
                    memory.create('1');
                    memory.create('test');
                    memory.switchTo('test');
                    array.splice(1, 0, 'B'); // ['x', 'B', 'y', 'z']
                    array.push('z'); // ['x', 'B', 'y', 'z', 'z']
                    array.splice(3, 0, 'A'); // ['x', 'B', 'y', 'A', 'z', 'z']

                    expect(array.slice()).to.deep.equal(['x', 'B', 'y', 'A', 'z', 'z']);

                    array.splice(1, 2); // ['x', 'A', 'z', 'z']
                    array[2] = 'y'; // ['x', 'A', 'y', 'z']

                    expect(array.slice()).to.deep.equal(['x', 'A', 'y', 'z'], 'before switch');

                    memory.switchTo('1');
                    memory.switchTo('test');

                    expect(array.slice()).to.deep.equal(['x', 'A', 'y', 'z']);
                });
                it('array changes with splice without second value', () => {
                    const memory = new Memory();
                    const array = makeVersionable(['x', 'y', 'z']);
                    memory.attach(array);
                    memory.create('1');
                    memory.create('test');
                    memory.switchTo('test');
                    array.splice(1);
                    memory.switchTo('1');
                    memory.switchTo('test');
                    expect(array.slice()).to.deep.equal(['x']);
                });
            });

            describe('specific updates', () => {
                const memory = new Memory();
                const full = makeVersionable({
                    a: 1,
                    b: ['x', 'y', 'z'],
                    c: new Set(['x', 'y', 'z']),
                    d: {
                        x: 1,
                        y: {
                            e: 1,
                            y: 2,
                        },
                    },
                    e: [],
                    f: {},
                    g: new Set(),
                    h: 'a',
                    i: [{ 'a': 1 }, 55],
                    j: new Set([{ 'b': 1 }]) as Set<object>,
                });
                memory.create('1');
                memory.switchTo('1');
                memory.attach(full);

                it('remove an attribute', () => {
                    memory.switchTo('1');
                    memory.remove('test'); // use remove before create to avoid previous test error propagation
                    memory.create('test');
                    memory.switchTo('test');
                    memory.create('test-b');
                    memory.create('test-a');
                    memory.switchTo('test-a');

                    full.d.y.e = 3;
                    delete full.d.y.y;

                    memory.create('test-a-1');
                    memory.switchTo('test-b');

                    full.d.y.e = 5;
                    full.d.y.y = 6;

                    memory.switchTo('test-a-1');

                    full.d.y.e = 7;

                    expect(full.d.y).to.deep.equal({ e: 7 }, 'after a change without read');

                    memory.switchTo('test-a');

                    expect(full.d.y).to.deep.equal(
                        { e: 3 },
                        'after swith check if memory writed on new slice',
                    );
                });
                it('remove twice an attribute', () => {
                    memory.switchTo('1');
                    memory.remove('test'); // use remove before create to avoid previous test error propagation
                    memory.create('test');
                    memory.switchTo('test');

                    memory.create('test-a');
                    memory.create('test-b');
                    memory.switchTo('test-a');

                    full.d.y.e = 3;
                    delete full.d.y.y;

                    memory.create('test-a-1');
                    memory.switchTo('test-b');

                    full.d.y.e = 5;
                    full.d.y.y = 6;

                    memory.switchTo('test-a-1');

                    delete full.d.y.y;

                    expect(full.d.y).to.deep.equal({ e: 3 }, 'after a change without read');

                    memory.switchTo('test-a');

                    expect(full.d.y).to.deep.equal(
                        { e: 3 },
                        'after swith check if memory writed on new slice',
                    );
                });
                it('update array properties', () => {
                    memory.switchTo('1');
                    memory.remove('test'); // use remove before create to avoid previous test error propagation
                    memory.create('test');
                    memory.switchTo('test');

                    const array = new VersionableArray();

                    const bibi = function toto(): number {
                        return 1;
                    };
                    array['a+b'] = bibi;

                    memory.attach(array);

                    memory.create('test-a');
                    memory.switchTo('test-a');

                    const toto = function toto(): number {
                        return 1;
                    };
                    array['x+y'] = toto;

                    memory.switchTo('test');
                    expect(Object.keys(array)).to.deep.equal(['a+b'], 'has origin key');
                    expect(array['x+y']).to.equal(undefined, "don't add method on other slice");
                    expect(array['a+b']).to.equal(bibi, 'add method in the linked slice');
                    memory.switchTo('test-a');
                    expect(Object.keys(array)).to.deep.equal(
                        ['a+b', 'x+y'],
                        'has origin and additional keys',
                    );
                    expect(array['x+y']).to.equal(toto, 'add method on this slice');
                    expect(array['a+b']).to.equal(bibi, 'add method in the child of linked slice');
                });
                it('update array properties with object', () => {
                    const obj0 = new VersionableObject({ z: 42 });
                    const obj1 = new VersionableObject({ a: 1 });
                    const obj2 = new VersionableObject({ b: 2 });
                    const array = new VersionableArray();
                    array['x+y'] = obj0;
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    memory.attach(array);
                    expect(array['x+y']).to.equal(obj0, 'add an object as property');
                    array['x+y'] = obj1;
                    expect(array['x+y']).to.equal(obj1, 'add an object as property');
                    array['x+y'] = obj2;
                    expect(array['x+y']).to.equal(obj2, 'change the property with an other object');
                    delete array['x+y'];
                    expect(array).to.deep.equal([], 'remove the property');
                });
                it('remove array properties without memory', () => {
                    const array = new VersionableArray();
                    array['x+y'] = 1;
                    expect(array['x+y']).to.equal(1, 'should have the default property');
                    delete array['x+y'];
                    expect(array['x+y']).to.equal(undefined, 'should remove the property');
                });
                it('remove array properties in memory', () => {
                    const array = new VersionableArray();
                    array['x+y'] = 1;
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    memory.attach(array);
                    expect(array['x+y']).to.equal(1, 'should have the default property');
                    delete array['x+y'];
                    expect(array['x+y']).to.equal(undefined, 'should remove the property');
                    memory.create('next');
                    memory.switchTo('next');
                    array['x+y'] = 2;
                    expect(array['x+y']).to.equal(2, 'should update the property');
                    delete array['x+y'];
                    expect(array['x+y']).to.equal(undefined, 'should remove again the property');
                });
                it('create array with value only at index 5 and 10', () => {
                    const array = new VersionableArray();
                    const res = [];
                    const obj = new VersionableObject({ a: 1 });
                    res[5] = obj;
                    res[10] = obj;
                    array[5] = obj;
                    array[10] = obj;
                    expect(array).to.deep.equal(res, 'before link');
                    const memory = new Memory();
                    memory.create('a');
                    memory.switchTo('a');
                    memory.create('b');
                    memory.switchTo('b');
                    memory.attach(array);
                    expect(array).to.deep.equal(res, 'after link');
                    memory.switchTo('a');
                    memory.switchTo('b');
                    expect(array).to.deep.equal(res, 'after switch slices');
                });
                it('add item in array at index 5', () => {
                    const array = new VersionableArray();
                    const res = [];
                    const obj = new VersionableObject({ a: 1 });
                    res[5] = obj;
                    res[10] = obj;
                    const memory = new Memory();
                    memory.create('a');
                    memory.switchTo('a');
                    memory.attach(array);
                    memory.create('b');
                    memory.switchTo('b');
                    array[5] = obj;
                    array[10] = obj;
                    expect(array).to.deep.equal(res, 'after update');
                    memory.switchTo('a');
                    memory.switchTo('b');
                    expect(array).to.deep.equal(res, 'after switch slices');
                });
                it('change array length', () => {
                    const array = new VersionableArray(1, 2, 3);
                    expect(array).to.deep.equal([1, 2, 3]);

                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    memory.attach(array);
                    expect(array).to.deep.equal([1, 2, 3]);
                    array.length = 1;
                    expect(array).to.deep.equal([1]);
                });
                it('use set in array versionableSet', () => {
                    const set1 = new VersionableSet();
                    const set2 = new VersionableSet();
                    const array = new VersionableArray(set1, set2);
                    expect(array).to.deep.equal([set1, set2]);

                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    memory.attach(array);
                    expect(array).to.deep.equal([set1, set2]);
                    array.length = 1;
                    expect(array).to.deep.equal([set1]);
                });
                it('unshift object in array', () => {
                    const obj = new VersionableObject({ a: 1 });
                    const array = new VersionableArray();
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    memory.attach(array);
                    array.unshift(obj);
                    expect(array).to.deep.equal([obj]);
                });
                it('shift object in array', () => {
                    const obj = new VersionableObject();
                    const array = new VersionableArray(obj);
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    memory.attach(array);
                    const shifted = array.shift();
                    expect(array).to.deep.equal([]);
                    expect(shifted).to.equal(obj);
                });
                it('update array in order', () => {
                    memory.switchTo('1');
                    memory.remove('test'); // use remove before create to avoid previous test error propagation
                    memory.create('test');
                    memory.switchTo('test');

                    const result = [];
                    const array = new VersionableArray();
                    for (let k = 0; k < 5000; k++) {
                        array.push(k);
                        result.push(k);
                    }

                    memory.attach(array);
                    expect(array).to.deep.equal(result, 'link this array');

                    for (let k = 0; k < 100; k++) {
                        array.unshift(k);
                        result.unshift(k);
                    }

                    array.unshift(999);
                    result.unshift(999);
                    array.push(42);
                    result.push(42);

                    memory.create('test-a');
                    memory.switchTo('test-a');

                    array.push(2000);

                    memory.switchTo('test');

                    expect(array).to.deep.equal(result);
                });
                it('array multi splice in same memory slice', () => {
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');

                    const array = makeVersionable([1, 2, 3]);
                    memory.attach(array);

                    memory.create('test-1');
                    memory.switchTo('test-1');

                    array.splice(2, 0, 6, 7);
                    array.splice(1, 0, 4, 5);
                    expect(array.slice()).to.deep.equal([1, 4, 5, 2, 6, 7, 3]);

                    const sub = array.splice(1, 5);
                    expect(array.slice()).to.deep.equal([1, 3]);
                    expect(sub).to.deep.equal([4, 5, 2, 6, 7]);

                    memory.switchTo('test');
                    memory.switchTo('test-1');
                    expect(array.slice()).to.deep.equal([1, 3], 'Test internal memory');
                });
                it('default value for array', () => {
                    const memory = new Memory();
                    const array = new VersionableArray<number>(1, 2, 3, 4, 5);
                    memory.attach(array);
                    memory.create('a');
                    memory.switchTo('a');
                    array[1] = 9;
                    expect(array).to.deep.equal([1, 9, 3, 4, 5]);
                    memory.switchTo('');
                    memory.create('b');
                    memory.switchTo('b');
                    expect(array).to.deep.equal([1, 2, 3, 4, 5]);
                });
                it('delete item in array', () => {
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');

                    const array = new VersionableArray<number>(1, 2, 3, 4, 5);
                    memory.attach(array);
                    delete array[0];
                    array[0] = 1;
                    delete array[1];
                    array[1] = 9;
                    delete array[1];
                    expect(array).to.deep.equal([1, undefined, 3, 4, 5]);
                });
                it('delete item in array and switch memory', () => {
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');

                    const array = new VersionableArray<number>(1, 2, 3, 4, 5);
                    memory.attach(array);

                    memory.create('1-1');
                    memory.switchTo('1-1');
                    delete array[1];

                    expect(array).to.deep.equal([1, undefined, 3, 4, 5], 'remove one item');
                    const array1 = array.slice();

                    memory.switchTo('test');
                    memory.create('1-2');
                    memory.switchTo('1-2');
                    delete array[0];
                    array[0] = 1;
                    delete array[1];
                    array[1] = 9;
                    delete array[1];
                    const array2 = array.slice();

                    expect(array2).to.deep.equal(array1, 'array have same value');
                });
                it('array push and pop in same slide memory have a clean memory slice values', () => {
                    const memory = new Memory();
                    const array = new VersionableArray<number>(1, 2, 3, 4, 5);
                    memory.attach(array);
                    memory.create('1');
                    memory.switchTo('1');
                    array.push(9);
                    array.push(9);
                    array.push(9);
                    array.pop();
                    array.pop();
                    const currentSlice = memory._currentSlice.data;
                    expect(currentSlice[array[memoryProxyPramsKey].ID]).to.deep.equal({
                        props: {},
                        patch: { '094': 9 },
                    });
                });
                it('use splice and switch memory', () => {
                    const memory = new Memory();
                    const array = makeVersionable(['x', 'y', 'z']);
                    memory.attach(array);

                    memory.create('test');
                    memory.switchTo('test');

                    memory.create('1-1');
                    memory.switchTo('1-1');
                    array.splice(1, 0, 'A');

                    expect(array.slice()).to.deep.equal(['x', 'A', 'y', 'z']);

                    memory.switchTo('test');
                    memory.create('1-2');
                    memory.switchTo('1-2');
                    array.splice(1, 0, 'B');

                    expect(array.slice()).to.deep.equal(['x', 'B', 'y', 'z']);
                });
                it('move item but finish at the same index keep same order', () => {
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');

                    const array = makeVersionable([1, 2, 3]);
                    memory.attach(array);

                    memory.create('test-1');
                    memory.switchTo('test-1');

                    array.splice(2, 0, 6, 7);
                    array.splice(1, 0, 4, 5);
                    array.splice(1, 5);

                    array.splice(1, 0, 2);
                    expect(array.slice()).to.deep.equal([1, 2, 3]);

                    memory.switchTo('test');
                    memory.switchTo('test-1');

                    expect(array.slice()).to.deep.equal([1, 2, 3], 'Test internal memory');
                });
                it('create object in a slice and read it in other', () => {
                    memory.switchTo('1');
                    memory.remove('test'); // use remove before create to avoid previous test error propagation
                    memory.create('test');
                    memory.switchTo('test');
                    memory.create('test-a');
                    memory.switchTo('test-a');
                    const obj = new VersionableObject();
                    obj['x+y'] = 3;
                    memory.attach(obj);
                    const array = new VersionableArray();
                    array.push(3);
                    memory.attach(array);
                    const set = new VersionableSet();
                    set.add(3);
                    memory.attach(set);
                    memory.switchTo('test');
                    expect(obj['x+y']).to.equal(undefined);
                    expect(array).to.deep.equal([]);
                    expect(set).to.deep.equal(new Set());
                });
                it('remove attribute on un-linked object', () => {
                    const obj = makeVersionable({ a: 1, b: 2 });
                    delete obj.a;
                    expect(obj).to.deep.equal({ b: 2 }, 'before link');
                    const memory = new Memory();
                    memory.create('1');
                    memory.switchTo('1');
                    memory.attach(obj);
                    expect(obj).to.deep.equal({ b: 2 }, 'after link');
                });
                it('remove object in set', () => {
                    memory.switchTo('1');
                    memory.remove('test'); // use remove before create to avoid previous test error propagation
                    memory.create('test');
                    memory.switchTo('test');
                    memory.create('test-a');
                    memory.switchTo('test-a');
                    let jObj: object;
                    full.j.forEach((obj: object) => {
                        jObj = obj;
                    });
                    full.j.delete(new VersionableObject());
                    expect(full.j).to.deep.equal(
                        new Set([jObj]),
                        'delete an object not contains in set',
                    );
                    full.j.delete(jObj);
                    expect(full.j).to.deep.equal(new Set(), 'delete the object');
                    full.j.clear();
                    expect(full.j).to.deep.equal(new Set(), 'clear empty set');
                    full.j.add(jObj);
                    full.j.clear();
                    expect(full.j).to.deep.equal(new Set(), 'clear owner slice set');
                    memory.switchTo('test');
                    expect(full.j).to.deep.equal(new Set([jObj]), 'other slice value');
                    memory.create('test-b');
                    memory.switchTo('test-b');
                    full.j.clear();
                    expect(full.j).to.deep.equal(new Set(), 'clear set');
                });
                it('add function in set', () => {
                    const set = new VersionableSet();
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    memory.attach(set);
                    function a(): void {
                        return;
                    }
                    function b(): void {
                        return;
                    }
                    set.add(a);
                    expect(set).to.deep.equal(new Set([a]));
                    memory.create('other');
                    memory.switchTo('other');
                    set.add(b);
                    expect(set).to.deep.equal(new Set([a, b]));
                });
                it('clear versionableSet', () => {
                    let set = new VersionableSet([1, 2, 3]);
                    expect(set.size).to.equal(3);
                    expect(set.has(1)).to.equal(true);
                    set.clear();
                    expect(set.size).to.equal(0);
                    expect(set.has(1)).to.equal(false);

                    set = new VersionableSet([1, 2, 3]);
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    memory.attach(set);
                    set.clear();
                    expect(set.size).to.equal(0, 'linked');
                    expect(set.has(1)).to.equal(false, 'linked');
                });
                it('replace attribute by set', () => {
                    const obj = makeVersionable({
                        set: new Set([1, 2, 3]),
                    });
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    memory.attach(obj);

                    const set = new VersionableSet([4, 5, 6]);

                    expect(obj).to.deep.equal({
                        set: new Set([1, 2, 3]),
                    });
                    memory.create('other');
                    memory.switchTo('other');
                    obj.set = set as Set<number>;
                    expect(obj).to.deep.equal({
                        set: new Set([4, 5, 6]),
                    });
                    memory.switchTo('test');
                    expect(obj).to.deep.equal(
                        {
                            set: new Set([1, 2, 3]),
                        },
                        'check previous value',
                    );
                    memory.switchTo('other');
                    expect(obj).to.deep.equal(
                        {
                            set: new Set([4, 5, 6]),
                        },
                        'check again',
                    );
                });
            });

            describe('mutliple updates', () => {
                const memory = new Memory();
                const full = makeVersionable({
                    a: 1,
                    b: ['x', 'y', 'z'],
                    c: new Set(['x', 'y', 'z']),
                    d: {
                        x: 1,
                        y: {
                            e: 1,
                            y: 2,
                        },
                    },
                    e: [],
                });

                it('Link object', () => {
                    memory.create('1');
                    memory.switchTo('1');
                    memory.attach(full);
                });
                it('should update an object (1)', () => {
                    full.a = 42;
                    expect(full.a).to.equal(42);
                });
                it('should update an object in object (1)', () => {
                    full.d.y.e = 42;
                    expect(full.d.y.e).to.equal(42);
                });
                it('should update a set in object (1)', () => {
                    full.c.delete('y');
                    full.c.add('aaa');

                    const items = [];
                    full.c.forEach(v => {
                        items.push(v);
                    });
                    expect(items.join()).to.equal('x,z,aaa');
                });
                it('should update an array in object (1)', () => {
                    full.b.push('t');
                    full.b.splice(1, 2);
                    expect(full.b.join()).to.equal('x,t');
                });
                it('should have all object values (1)', () => {
                    expect(JSON.stringify(full)).to.equal(
                        JSON.stringify({
                            a: 42,
                            b: ['x', 't'],
                            c: new Set(['x', 'z', 'aaa']),
                            d: {
                                x: 1,
                                y: {
                                    e: 42,
                                    y: 2,
                                },
                            },
                            e: [],
                        }),
                    );
                });

                it('create slice memory (1)', () => {
                    memory.create('1-1');
                    memory.create('1-2');
                });

                it('should have the same value in the created slide', () => {
                    memory.switchTo('1');
                    memory.switchTo('1-1');
                    expect(full.a).to.equal(42, "number 'a'");
                    expect(full.d.y.e).to.equal(42, "number in object 'd.y.e'");
                    expect(full.b).to.deep.equal(
                        ['x', 't'],
                        "push 't' and splice(1, 2) from ['x', 'y', 'z']",
                    );
                    const items = [];
                    full.c.forEach(v => {
                        items.push(v);
                    });
                    expect(items.join()).to.equal(
                        'x,z,aaa',
                        "delete 'y' and add 'aaa' in Set(['x', 'y', 'z'])",
                    );
                    expect(JSON.stringify(full)).to.equal(
                        JSON.stringify({
                            a: 42,
                            b: ['x', 't'],
                            c: new Set(['x', 'z', 'aaa']),
                            d: {
                                x: 1,
                                y: {
                                    e: 42,
                                    y: 2,
                                },
                            },
                            e: [],
                        }),
                    );
                    memory.switchTo('1');
                });

                it('should have memory slice values', () => {
                    memory.switchTo('1');
                    memory.switchTo('1-1');
                    full.a = 3;
                    expect(full.a).to.equal(3);
                    memory.switchTo('1-2');
                    expect(full.a).to.equal(42);
                    memory.switchTo('1');
                });
                it('should switch memory slice (1 -> 1-1)', () => {
                    memory.switchTo('1-1');
                });
                it('should update an object (1-1)', () => {
                    full.a = 5;
                    expect(full.a).to.equal(5);
                });
                it('should update an object in object (1-1)', () => {
                    full.d.y.y = 5;
                    expect(full.d.y.y).to.equal(5);
                });
                it('should update a set in object (1-1)', () => {
                    full.c.delete('aaa');
                    full.c.add('bbb');
                    full.c.add('ccc');

                    const items = [];
                    full.c.forEach(v => {
                        items.push(v);
                    });
                    expect(items.join()).to.equal('x,z,bbb,ccc');
                });
                it('should update an array in object (1-1)', () => {
                    full.b.unshift('o');
                    expect(full.b.join()).to.equal('o,x,t', "unshift 'o' in ['x', 't']");
                });
                it('should have all object values (1-1)', () => {
                    const items = [];
                    full.c.forEach(v => {
                        items.push(v);
                    });
                    expect(items.join()).to.equal(
                        'x,z,bbb,ccc',
                        "delete 'aaa' and add 'bbb' + 'ccc' in Set(['x' , 'z', 'aaa'])",
                    );

                    expect(JSON.stringify(full)).to.equal(
                        JSON.stringify({
                            a: 5,
                            b: ['o', 'x', 't'],
                            c: new Set(['x', 'z', 'bbb', 'ccc']),
                            d: {
                                x: 1,
                                y: {
                                    e: 42,
                                    y: 5,
                                },
                            },
                            e: [],
                        }),
                    );
                });
                it('should switch to an other memory slice (1-1 -> 1-2)', () => {
                    memory.switchTo('1-2');
                });
                it('should read the content without previous slice updates (1-2)', () => {
                    expect(JSON.stringify(full)).to.equal(
                        JSON.stringify({
                            a: 42,
                            b: ['x', 't'],
                            c: new Set(['x', 'z', 'aaa']),
                            d: {
                                x: 1,
                                y: {
                                    e: 42,
                                    y: 2,
                                },
                            },
                            e: [],
                        }),
                    );
                    const items = [];
                    full.c.forEach(v => {
                        items.push(v);
                    });
                    expect(items.join()).to.equal('x,z,aaa');
                });
                it('should update an object (1-2)', () => {
                    full.a = 3;
                    expect(full.a).to.equal(3);
                });
                it('should update an object in object (1-2)', () => {
                    full.d.y.y = 9;
                    expect(full.d.y.y).to.equal(9);
                });
                it('should update a set in object (1-2)', () => {
                    full.c.delete('x');

                    const items = [];
                    full.c.forEach(v => {
                        items.push(v);
                    });
                    expect(items.join()).to.equal('z,aaa');
                });
                it('should update an array in object (1-2)', () => {
                    full.b.splice(1, 1, 'OO');
                    expect(full.b.join()).to.equal('x,OO');
                });
                it('should have all object values (1-2)', () => {
                    expect(JSON.stringify(full)).to.equal(
                        JSON.stringify({
                            a: 3,
                            b: ['x', 'OO'],
                            c: new Set(['z', 'aaa']),
                            d: {
                                x: 1,
                                y: {
                                    e: 42,
                                    y: 9,
                                },
                            },
                            e: [],
                        }),
                    );
                });
                it('should add a key in memory and have all object values (1-2)', () => {
                    memory.attach(full);
                    expect(JSON.stringify(full)).to.equal(
                        JSON.stringify({
                            a: 3,
                            b: ['x', 'OO'],
                            c: new Set(['z', 'aaa']),
                            d: {
                                x: 1,
                                y: {
                                    e: 42,
                                    y: 9,
                                },
                            },
                            e: [],
                        }),
                    );
                });

                it('should switch to an other memory slice (1-2 -> 1-1)', () => {
                    memory.switchTo('1-1');
                });

                it('should have again all object values (1-1)', () => {
                    expect(full.b.join()).to.equal('o,x,t', "unshift 'o' in ['x', 't']");
                    const items = [];
                    full.c.forEach(v => {
                        items.push(v);
                    });
                    expect(items.join()).to.equal(
                        'x,z,bbb,ccc',
                        "delete 'aaa' and add 'bbb' + 'ccc' in Set(['x' , 'z', 'aaa'])",
                    );

                    expect(JSON.stringify(full)).to.equal(
                        JSON.stringify({
                            a: 5,
                            b: ['o', 'x', 't'],
                            c: new Set(['x', 'z', 'bbb', 'ccc']),
                            d: {
                                x: 1,
                                y: {
                                    e: 42,
                                    y: 5,
                                },
                            },
                            e: [],
                        }),
                    );
                });
            });

            describe('update without read values', () => {
                const memory = new Memory();
                const full = makeVersionable({
                    a: 1,
                    b: ['x', 'y', 'z'],
                    c: new Set(['x', 'y', 'z']),
                    d: {
                        x: 1,
                        y: {
                            e: 1,
                            y: 2,
                        },
                    },
                    e: [],
                    f: {},
                    g: new Set(),
                    h: 'a',
                    i: [{ 'a': 1 }, 55],
                    j: new Set([{ 'b': 1 }]) as Set<object>,
                });
                memory.create('1');
                memory.switchTo('1');
                memory.attach(full);

                it('update object after switch without read values', () => {
                    memory.switchTo('1');
                    memory.remove('test'); // use remove before create to avoid previous test error propagation
                    memory.create('test');
                    memory.switchTo('test');

                    memory.create('test-a');
                    memory.create('test-b');
                    memory.switchTo('test-a');

                    full.d.y.e = 3;
                    full.d.y.y = 4;

                    memory.create('test-a-1');
                    memory.switchTo('test-b');

                    full.d.y.e = 5;
                    full.d.y.y = 6;

                    memory.switchTo('test-a-1');

                    full.d.y.e = 7;

                    expect(full.d.y).to.deep.equal({
                        e: 7,
                        y: 4,
                    });
                });
                it('check if attribute in object without read values', () => {
                    memory.switchTo('1');
                    memory.remove('test'); // use remove before create to avoid previous test error propagation
                    memory.create('test');
                    memory.switchTo('test');
                    memory.create('test-b');
                    memory.create('test-a');
                    memory.switchTo('test-a');

                    delete full.d.y.y;

                    memory.create('test-a-1');
                    memory.switchTo('test-b');

                    full.d.y.y = 6;

                    memory.switchTo('test-a-1');

                    expect('y' in full.d.y).to.equal(false, 'after a change without read');

                    memory.switchTo('test-a');

                    expect('y' in full.d.y).to.equal(
                        false,
                        'after swith check if memory writed on new slice',
                    );

                    memory.switchTo('test-b');

                    expect('y' in full.d.y).to.equal(
                        true,
                        'check if the reload work for "in" instruction',
                    );
                });
                it('update array after switch without read values', () => {
                    memory.switchTo('1');
                    memory.remove('test'); // use remove before create to avoid previous test error propagation
                    memory.create('test');
                    memory.switchTo('test');

                    memory.create('test-a');
                    memory.create('test-b');
                    memory.switchTo('test-a');

                    const obj = new VersionableObject();
                    full.e.push(obj, obj, obj);

                    memory.create('test-a-1');
                    memory.switchTo('test-b');

                    full.e.push(new VersionableArray());

                    memory.switchTo('test-a-1');

                    const set = new VersionableSet();
                    full.e[1] = set;

                    expect(full.e).to.deep.equal([obj, set, obj], 'after a change without read');

                    memory.switchTo('test-a');

                    expect(full.e).to.deep.equal(
                        [obj, obj, obj],
                        'after swith check if memory writed on new slice',
                    );
                });
                it('update array length after switch without read values', () => {
                    memory.switchTo('1');
                    memory.remove('test'); // use remove before create to avoid previous test error propagation
                    memory.create('test');
                    memory.switchTo('test');

                    memory.create('test-a');
                    memory.create('test-b');
                    memory.switchTo('test-a');

                    const obj = new VersionableObject();
                    const array = new VersionableArray();
                    full.e.push(obj, array);

                    memory.create('test-a-1');
                    memory.switchTo('test-b');

                    full.e.push(33);

                    memory.switchTo('test-a-1');

                    full.e.length = 1;
                    const set = makeVersionable({ a: 1 });
                    full.e.push(set);

                    expect(full.e).to.deep.equal([obj, set], 'after a change without read');

                    memory.switchTo('test-a');

                    expect(full.e).to.deep.equal(
                        [obj, array],
                        'after swith check if memory writed on new slice',
                    );
                });
                it('update set after switch without read values', () => {
                    memory.switchTo('1');
                    memory.remove('test'); // use remove before create to avoid previous test error propagation
                    memory.create('test');
                    memory.switchTo('test');

                    memory.create('test-a');
                    memory.create('test-b');
                    memory.switchTo('test-a');

                    full.c.add('a');

                    memory.create('test-a-1');
                    memory.switchTo('test-b');

                    full.c.delete('y');

                    memory.switchTo('test-a-1');

                    full.c.clear();

                    expect(full.c).to.deep.equal(new Set(), 'after a change without read');

                    memory.switchTo('test-a');

                    expect(full.c).to.deep.equal(
                        new Set(['x', 'y', 'z', 'a']),
                        'after swith check if memory writed on new slice',
                    );
                });
                it('update set and call building methods', () => {
                    memory.switchTo('1');
                    memory.remove('test'); // use remove before create to avoid previous test error propagation
                    memory.create('test');
                    memory.switchTo('test');
                    memory.create('test-b');
                    memory.create('test-a');
                    memory.switchTo('test-a');
                    const set = full.j;
                    set.add(new VersionableObject());
                    memory.switchTo('test-b');
                    let iter = set.values().next();
                    expect(iter.value).to.deep.equal({ 'b': 1 });
                    memory.switchTo('test-a');
                    memory.switchTo('test-b');
                    iter = set.keys().next();
                    expect(iter.value).to.deep.equal({ 'b': 1 });
                    memory.switchTo('test-a');
                    memory.switchTo('test-b');
                    iter = set.entries().next();
                    expect(iter.value).to.deep.equal([{ 'b': 1 }, { 'b': 1 }]);
                });
            });

            describe('memory slices', () => {
                it('remove slice and children (check = no error)', () => {
                    const memory = new Memory();
                    memory.create('1');
                    memory.switchTo('1');
                    memory.create('test');
                    memory.switchTo('test');

                    memory.create('test-0');
                    memory.create('test-b-0');
                    memory.switchTo('test-0');
                    memory.create('test-c-0');

                    memory.switchTo('1');
                    memory.remove('test');

                    memory.create('test-0');
                    memory.create('test-b-0');
                    memory.create('test-c-0');
                });
                it('remove slice avoid memory leak', () => {
                    const memory = new Memory();
                    memory.create('1');
                    memory.create('2');
                    memory.create('3');
                    const obj = new VersionableObject();

                    memory.switchTo('1');
                    const array1 = new VersionableArray();
                    memory.attach(array1);

                    array1.push(obj);

                    memory.switchTo('2');
                    const array2 = new VersionableArray();
                    memory.attach(array2);

                    array2.push(obj);

                    memory.switchTo('3');

                    expect(memory._proxies[obj[memoryProxyPramsKey].ID]).to.deep.equal(obj);

                    memory.remove('1');

                    expect(memory._proxies[obj[memoryProxyPramsKey].ID]).to.deep.equal(obj);

                    memory.remove('2');

                    expect(memory._proxies[obj[memoryProxyPramsKey].ID]).to.deep.equal(undefined);
                });
            });

            describe('snapshot', () => {
                it('create a snapshot from 8 slices', () => {
                    const memory = new Memory();
                    memory.create('1');
                    memory.switchTo('1');
                    memory.create('test');
                    memory.switchTo('test');
                    for (let k = 0; k < 8; k++) {
                        memory.create('test-' + k);
                        memory.switchTo('test-' + k);
                    }
                    memory.create('other');
                    memory.switchTo('other');
                    expect(memory.getPath('other').join()).to.deep.equal(
                        'other,test-7,test-6,test-5,test-4,test-3,test-2,test-1,test-0,test,1',
                    );
                    memory.snapshot('test-0', 'test-7', 'snap');
                    memory.switchTo('snap');
                    memory.create('after-snap');

                    expect(memory.getPath('after-snap').join()).to.deep.equal(
                        'after-snap,snap,test,1',
                    );
                    expect(memory.getPath('after-snap', true).join()).to.deep.equal(
                        'after-snap,snap,test-6,test-5,test-4,test-3,test-2,test-1,test-0,test,1',
                    );
                    expect(memory.getPath('other').join()).to.deep.equal('other,snap,test,1');
                    expect(memory.getPath('test-7').join()).to.deep.equal(
                        'test-7,test-6,test-5,test-4,test-3,test-2,test-1,test-0,test,1',
                    );
                });
                it('remove slice and children after snapshot (check = no error)', () => {
                    const memory = new Memory();
                    memory.create('1');
                    memory.switchTo('1');
                    memory.create('test');
                    memory.switchTo('test');
                    for (let k = 0; k < 8; k++) {
                        memory.create('test-' + k);
                        memory.switchTo('test-' + k);
                    }
                    memory.create('other');
                    memory.switchTo('other');
                    memory.snapshot('test-0', 'test-7', 'snap');
                    memory.switchTo('1');
                    memory.remove('test');

                    // can re-create wihtout error (tested previously)
                    for (let k = 0; k < 8; k++) {
                        memory.create('test-' + k);
                        memory.switchTo('test-' + k);
                    }
                    memory.create('other');
                    memory.switchTo('other');
                    memory.snapshot('test-0', 'test-7', 'snap');
                });
                it('snapshot array changes', () => {
                    const memory = new Memory();
                    memory._numberOfFlatSlices = 20;
                    memory._numberOfSlicePerSnapshot = 8;

                    memory.create('1');
                    memory.switchTo('1');
                    const array = new VersionableArray();
                    memory.attach(array);
                    array.push(0);

                    memory.create('test');
                    memory.switchTo('test');
                    array.push(1);
                    memory.create('test-0');
                    memory.switchTo('test-0');
                    array.push(2);
                    memory.create('test-1');
                    memory.switchTo('test-1');
                    array.push(3);
                    memory.create('test-2');
                    memory.switchTo('test-2');
                    array.push(4);

                    const ID = Object.keys(memory._slices.test.data)[0];
                    let patch = memory._slices.test.data[ID];
                    expect(Object.values(patch.patch)).to.deep.equal([1]);

                    memory.snapshot('test', 'test-1', 'snap');

                    expect(Object.keys(memory._slices.snap.data).length).to.equal(1);
                    patch = memory._slices.snap.data[ID];
                    expect(Object.values(patch.patch)).to.deep.equal([1, 2, 3]);
                });
                it('snapshot set changes', () => {
                    const memory = new Memory();
                    memory._numberOfFlatSlices = 20;
                    memory._numberOfSlicePerSnapshot = 8;

                    memory.create('1');
                    memory.switchTo('1');
                    const set = new VersionableSet();
                    memory.attach(set);
                    set.add(0);
                    set.add(-1);

                    memory.create('test');
                    memory.switchTo('test');
                    set.delete(-1);
                    set.add(1);
                    set.add(2);
                    memory.create('test-0');
                    memory.switchTo('test-0');
                    set.delete(0);
                    memory.create('test-1');
                    memory.switchTo('test-1');
                    set.delete(2);
                    set.add(3);
                    set.add(-1);
                    memory.create('test-2');
                    memory.switchTo('test-2');
                    set.add(3);

                    const ID = Object.keys(memory._slices.test.data)[0];
                    let patch = memory._slices.test.data[ID];
                    expect(patch.add.size).to.deep.equal(2);
                    expect(patch.delete.size).to.deep.equal(1);

                    memory.snapshot('test', 'test-1', 'snap');

                    expect(Object.keys(memory._slices.snap.data).length).to.equal(1);
                    patch = memory._slices.snap.data[ID];

                    const add = [];
                    patch.add.forEach((item: number) => add.push(item));
                    expect(add).to.deep.equal([1, 3]);
                    const remove = [];
                    patch.delete.forEach((item: number) => remove.push(item));
                    expect(remove).to.deep.equal([0]);
                });
                it('snapshot object changes', () => {
                    const memory = new Memory();
                    memory._numberOfFlatSlices = 20;
                    memory._numberOfSlicePerSnapshot = 8;

                    memory.create('1');
                    memory.switchTo('1');
                    const obj = new VersionableObject();
                    memory.attach(obj);
                    obj['x+y'] = 1;

                    memory.create('test');
                    memory.switchTo('test');
                    obj['a-z'] = new VersionableObject();
                    const ID1 = obj['a-z'][memoryProxyPramsKey].ID;
                    obj['x+y'] = 2;
                    memory.create('test-0');
                    memory.switchTo('test-0');
                    obj['a+b'] = 0;
                    memory.create('test-1');
                    memory.switchTo('test-1');
                    obj['a-z'] = new VersionableArray();
                    const ID2 = obj['a-z'][memoryProxyPramsKey].ID;
                    obj['a+b'] = 3;
                    obj['x+y'] = 1;
                    memory.create('test-2');
                    memory.switchTo('test-2');
                    obj['x+y'] = 10;
                    obj['w+u'] = 10;

                    const ID = Object.keys(memory._slices.test.data)[0];
                    let patch = memory._slices.test.data[ID];

                    expect(patch).to.deep.equal({ props: { 'a-z': ID1, 'x+y': 2 } });

                    memory.snapshot('test', 'test-1', 'snap');

                    expect(Object.keys(memory._slices.snap.data).length).to.equal(1);
                    patch = memory._slices.snap.data[ID];

                    expect(patch).to.deep.equal({
                        props: { 'a-z': ID2, 'x+y': 1, 'a+b': 3 },
                    });
                });
                it('auto-snapshot', () => {
                    const memory = new Memory();
                    memory._numberOfFlatSlices = 20;
                    memory._numberOfSlicePerSnapshot = 8;

                    const array = new VersionableArray();
                    memory.create('test');
                    memory.switchTo('test');
                    memory.attach(array);

                    for (let k = 0; k < 100; k++) {
                        memory.create('test-' + k);
                        memory.switchTo('test-' + k);
                        array.push(k);
                    }

                    const sliceKeys = Object.keys(memory._slices);
                    expect(sliceKeys.length).to.equal(1 + 100 + (100 - 20) / 8);
                });
                it('compress array changes', () => {
                    const memory = new Memory();
                    memory._numberOfFlatSlices = 20;
                    memory._numberOfSlicePerSnapshot = 8;

                    memory.create('1');
                    memory.switchTo('1');
                    const array = new VersionableArray();
                    memory.attach(array);
                    array.push(0);

                    memory.create('test');
                    memory.switchTo('test');
                    array.push(1);
                    memory.create('test-0');
                    memory.switchTo('test-0');
                    array.push(2);
                    const obj = new VersionableObject();
                    memory.attach(obj);
                    obj['x+y'] = 3;
                    memory.create('test-1');
                    memory.switchTo('test-1');
                    array.push(3);
                    memory.create('test-2');
                    memory.switchTo('test-2');
                    array.push(4);

                    const ID = Object.keys(memory._slices.test.data)[0];
                    let patch = memory._slices.test.data[ID];
                    expect(Object.values(patch.patch)).to.deep.equal([1]);
                    expect(Object.keys(memory._slices).length).to.equal(6);

                    memory.compress('test', 'test-1');

                    expect(Object.keys(memory._slices).length).to.equal(4);
                    expect(Object.keys(memory._slices.test.data).length).to.equal(2);
                    patch = memory._slices.test.data[ID];
                    expect(Object.values(patch.patch)).to.deep.equal([1, 2, 3]);
                    patch = memory._slices.test.data[obj[memoryProxyPramsKey].ID];
                    expect(patch).to.deep.equal({ props: { 'x+y': 3 } });
                });
            });

            describe('root & path', () => {
                it('link to memory & markAsDiffRoot', () => {
                    const obj = makeVersionable({
                        toto: {
                            titi: {
                                m: 6,
                            },
                        },
                        tutu: {
                            a: 1,
                        },
                    });
                    markAsDiffRoot(obj.toto);
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    memory.attach(obj);
                    expect([...memory.getRoots(obj.toto.titi)]).to.deep.equal([obj.toto], 'titi');
                    expect([...memory.getRoots(obj.toto)]).to.deep.equal([obj.toto], 'toto');
                    expect([...memory.getRoots(obj.tutu)]).to.deep.equal([obj], 'tutu');
                });
                it('link to memory & markAsDiffRoot with change slice', () => {
                    const obj = makeVersionable({
                        toto: {
                            titi: {
                                m: 6,
                            },
                            tata: {},
                        },
                        tutu: {
                            a: 1,
                        },
                    });
                    markAsDiffRoot(obj.toto);
                    const memory = new Memory();
                    memory.create('1');
                    memory.switchTo('1');
                    memory.attach(obj);
                    memory.create('2');
                    memory.switchTo('2');
                    obj.toto.tata = obj.tutu;

                    expect(obj.toto.tata).to.deep.equal(obj.tutu);

                    expect([...memory.getRoots(obj.toto.titi)]).to.deep.equal([obj.toto], 'titi');
                    expect([...memory.getRoots(obj.toto)]).to.deep.equal([obj.toto], 'toto');
                    const test1 = [];
                    memory.getRoots(obj.tutu).forEach(obj => test1.push(obj));
                    expect(test1).to.deep.equal([obj.toto, obj], 'tutu');
                    const test2 = [];
                    memory.getRoots(obj.toto.tata).forEach(obj => test2.push(obj));
                    expect(test2).to.deep.equal([obj.toto, obj], 'tata');
                });
                it('should get the changed object', () => {
                    const tata = {
                        m: 6,
                    };
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const obj: any = makeVersionable({
                        toto: {
                            titi: {
                                tata: tata,
                            },
                        },
                        tutu: {
                            a: 1,
                            tata: tata,
                        },
                        vroum: {
                            b: 2,
                        },
                        array: [
                            { x: 1 },
                            { x: 2 },
                            { x: 3 },
                            { x: 4 },
                            { x: 5 },
                            { x: 6 },
                            { x: 7 },
                            { x: 8 },
                        ],
                    });
                    markAsDiffRoot(obj.toto);
                    markAsDiffRoot(obj.tutu);
                    const memory = new Memory();
                    memory.create('test');
                    memory.switchTo('test');
                    memory.attach(obj);
                    memory.create('test-1');
                    memory.switchTo('test-1');

                    expect(memory.getChangesLocations('test', 'test-1')).to.deep.equal({
                        add: [],
                        move: [],
                        remove: [],
                        update: [],
                    });

                    obj.toto.titi.tata.m = 4;
                    obj.tutu.a = 6;
                    const vroum = obj.vroum;
                    delete obj.vroum;
                    const x2 = obj.array[1];
                    obj.array.splice(1, 1);
                    obj.array.splice(3, 0, makeVersionable({ z: 1 }));
                    obj.yop = makeVersionable({ a: 1 });

                    expect(memory.getChangesLocations('test', 'test-1')).to.deep.equal({
                        add: [obj.array[3], obj.yop],
                        move: [],
                        remove: [vroum, x2],
                        update: [
                            [obj, ['vroum', 'yop']],
                            [obj.tutu, ['a']],
                            [obj.array, [1, 3]],
                            [obj.toto.titi.tata, ['m']],
                        ],
                    });
                });
            });
        });
    });
});
