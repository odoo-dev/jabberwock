interface RootInterface {
    a: string;
}
interface RootInterface2 {
    z: string;
}

class Root implements RootInterface {
    a: string;
}
//test
// fooooo
// bar
class Root2 {
    root2key: string;
}

class Foo {
    fookey: RootInterface & RootInterface2;
}
class RootElement extends Root {
    /**
     * Dummy stuff for rootElementProperty
     */
    rootElementProperty: string;
    z: string;
}

class ChildElement extends RootElement implements RootInterface2 {
    /**
     * Dummy stuff for childElementProperty
     */
    childElementProperty: string;
}

class ChildOfChild extends ChildElement {
    /**
     * Dummy stuff for childElementProperty
     */
    childOfChildPro: string;
}

class ChildElement2 extends RootElement implements RootInterface2 {
    /**
     * Dummy stuff for childElementProperty2
     */
    childElementProperty2: string;
}

export function exportedPluck<T, K extends keyof T>(o: T, propertyNames: K[]): T[K][] {
    return propertyNames.map(n => o[n]);
}

/**
 * Interface A is great
 *
 * And also **amazing**
 */
interface A {
    a: string;
}
interface B extends A {
    b: string;
}

export class AwesomeFoo {
    a: string;
    b: number;
    name: string;
    readonly foo: string | undefined;
    private test(): void {
        console.log('nothing');
    }
    /** array of string */
    arrayOfString: string[];
    /** double array of string */
    doubleArrayOfString: string[][];
    // intrinsic
    intersection: A & B;
    // reflection
    stringLiteral: 'nice';
    tuple: [string, number];
    // type-operator
    // type-parameter
    // union
    // unknown

    /**
     * test bar\
     * hehe\
     * hoho
     */
    bar: { content: string };
    // test editable
    /**
     * @deprecated
     */
    f: boolean;

    /**
     * I got the impression that the comments are only for functions
     */
    fun(): void {
        console.log('fune');
    }

    /**
     * this is **foo**
     *
     * and *bar*
     *
     * lol
     * @param editable This is editable
     *                  and this is verry good
     */
    constructor() {
        console.log('foo');
    }

    pluck<T, K extends keyof T>(o: T, propertyNames: K[]): T[K][] {
        return propertyNames.map(n => o[n]);
    }
    /**
     *
     * @param f This is foo
     *          and the **line continue**.\
     *          And then break.
     * @param one this is one
     * @param two this is two
     * @return something great
     */
    aaafooFn(f: any, one?, two?): string {
        if (!two) {
            two = 'lol';
        }
        return 'hoho';
    }
    // addPlugin(pluginClass: typeof JWPlugin, lol?: any): void {
    //     const pluginInstance: JWPlugin = new pluginClass(this.dispatcher, this.vDocument);
    //     this.pluginsRegistry.push(pluginInstance); // todo: use state
    // }
}
