import { expect } from 'chai';
import { describePlugin, testEditor } from '../../utils/src/testUtils';
import { Xml } from '../src/Xml';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { Attributes } from '../src/Attributes';
import { CssStyle } from '../src/CssStyle';
import { ClassList } from '../src/ClassList';

describePlugin(Xml, () => {
    describe('Attributes', () => {
        describe('parse/render', () => {
            it('should parse attributes and render them', async () => {
                await testEditor(BasicEditor, {
                    contentBefore:
                        '<p style="  width:  800px;  color: red" height="5em"  class="how many roads must a man go down"  disabled>42</p>',
                    contentAfter:
                        '<p style="width: 800px; color: red;" height="5em" class="how many roads must a man go down" disabled="">42</p>',
                });
            });
        });
        describe('constructor', () => {
            it('should create a new empty Attributes', async () => {
                const attributes = new Attributes();
                expect(attributes instanceof Attributes).to.be.true;
                expect(attributes.length).to.equal(0);
            });
            it('should create a new Attributes from another', async () => {
                const attributes = new Attributes({
                    'eye-color': 'green',
                    style: 'color: pink;',
                    class: 'super classy',
                });
                const newAttributes = new Attributes(attributes);
                expect(newAttributes instanceof Attributes).to.be.true;
                expect(newAttributes.length).to.equal(3);
                expect(newAttributes.keys()).to.deep.equal(['eye-color', 'style', 'class']);
                expect(newAttributes.values()).to.deep.equal([
                    'green',
                    'color: pink;',
                    'super classy',
                ]);
                expect(newAttributes.style.length).to.equal(1);
                expect(newAttributes.style.cssText).to.equal('color: pink;');
                expect(newAttributes.classList.length).to.equal(2);
                expect(newAttributes.classList.className).to.equal('super classy');
                expect(newAttributes.get('eye-color')).to.equal('green');
                expect(newAttributes.get('style')).to.equal('color: pink;');
                expect(newAttributes.get('class')).to.equal('super classy');
            });
        });
        describe('name', () => {
            it('should show the attributes as one string', async () => {
                const attributes = new Attributes({
                    'nose-type': 'crooked',
                    'eye-color': 'green',
                });
                expect(attributes.name).to.equal('{nose-type: "crooked", eye-color: "green"}');
            });
            it('should show the attributes as one string (with style and classes)', async () => {
                const attributes = new Attributes({
                    'nose-type': 'crooked',
                    'eye-color': 'green',
                    style: 'color: pink;',
                    class: 'super classy',
                });
                expect(attributes.name).to.equal(
                    '{nose-type: "crooked", eye-color: "green", style: "color: pink;", class: "super classy"}',
                );
            });
        });
        describe('clone', () => {
            it('should clone Attributes', async () => {
                const attributes = new Attributes({
                    'eye-color': 'green',
                    style: 'color: pink;',
                    class: 'super classy',
                });
                const newAttributes = attributes.clone();
                expect(newAttributes instanceof Attributes).to.be.true;
                expect(newAttributes.length).to.equal(3);
                expect(newAttributes.keys()).to.deep.equal(['eye-color', 'style', 'class']);
                expect(newAttributes.values()).to.deep.equal([
                    'green',
                    'color: pink;',
                    'super classy',
                ]);
                expect(newAttributes.style.length).to.equal(1);
                expect(newAttributes.style.cssText).to.equal('color: pink;');
                expect(newAttributes.classList.length).to.equal(2);
                expect(newAttributes.classList.className).to.equal('super classy');
                expect(newAttributes.get('eye-color')).to.equal('green');
                expect(newAttributes.get('style')).to.equal('color: pink;');
                expect(newAttributes.get('class')).to.equal('super classy');
            });
        });
        describe('has', () => {
            it('should find that the Attributes have a key', async () => {
                const attributes = new Attributes({
                    'eye-color': 'green',
                    style: 'color: pink;',
                    class: 'super classy',
                });
                expect(attributes.has('eye-color')).to.be.true;
                expect(attributes.has('style')).to.be.true;
                expect(attributes.has('class')).to.be.true;
            });
            it("should find that the Attributes doesn't have a key", async () => {
                const attributes = new Attributes({
                    'eye-color': 'green',
                    style: 'color: pink;',
                });
                expect(attributes.has('nose-type')).to.be.false;
                expect(attributes.has(' ')).to.be.false;
                expect(attributes.has('class')).to.be.false;
                expect(attributes.has('styles')).to.be.false;
            });
            it('should find that the Attributes have a style but no class', async () => {
                const attributes = new Attributes({
                    style: 'color: pink;',
                });
                attributes.style.set('color', 'pink');
                expect(attributes.has('style')).to.be.true;
                expect(attributes.has('class')).to.be.false;
            });
        });
        describe('keys', () => {
            it('should return the keys in the Attributes record', async () => {
                const attributes = new Attributes({
                    'eye-color': 'green',
                    style: 'color: pink;',
                });
                expect(attributes.keys()).to.deep.equal(['eye-color', 'style']);
            });
        });
        describe('values', () => {
            it('should return the values in the Attributes record', async () => {
                const attributes = new Attributes({
                    'eye-color': 'green',
                    style: 'color: pink;',
                    class: 'super classy',
                });
                expect(attributes.values()).to.deep.equal([
                    'green',
                    'color: pink;',
                    'super classy',
                ]);
            });
        });
        describe('get', () => {
            it('should get a specific attribute', async () => {
                const attributes = new Attributes({
                    'eye-color': 'green',
                    style: 'color: pink;',
                    class: 'super classy',
                });
                expect(attributes.get('eye-color')).to.equal('green');
                expect(attributes.get('style')).to.equal('color: pink;');
                expect(attributes.get('class')).to.equal('super classy');
            });
            it("should not get an attribute that doesn't exist", async () => {
                const attributes = new Attributes({
                    'eye-color': 'green',
                    style: 'color: pink;',
                    class: 'super classy',
                });
                expect(attributes.get('color')).to.be.undefined;
            });
        });
        describe('set', () => {
            it('should set a key in the record', async () => {
                const attributes = new Attributes();
                expect(attributes.length).to.equal(0);
                expect(attributes.keys()).to.deep.equal([]);
                attributes.set('eye-color', 'green');
                expect(attributes.length).to.equal(1);
                expect(attributes.keys()).to.deep.equal(['eye-color']);
                expect(attributes.values()).to.deep.equal(['green']);
                expect(attributes.get('eye-color')).to.equal('green');
            });
            it('should set the style key in the record', async () => {
                const attributes = new Attributes();
                expect(attributes.length).to.equal(0);
                expect(attributes.keys()).to.deep.equal([]);
                attributes.set('style', ' width : 500px;  color: green   ');
                expect(attributes.length).to.equal(1);
                expect(attributes.keys()).to.deep.equal(['style']);
                expect(attributes.values()).to.deep.equal(['width: 500px; color: green;']);
                expect(attributes.get('style')).to.equal('width: 500px; color: green;');
                expect(attributes.style.length).to.equal(2);
                expect(attributes.style.keys()).to.deep.equal(['width', 'color']);
                expect(attributes.style.values()).to.deep.equal(['500px', 'green']);
                expect(attributes.style.get('width')).to.equal('500px');
                expect(attributes.style.get('color')).to.equal('green');
            });
        });
        describe('remove', () => {
            it('should remove a key from the record', async () => {
                const attributes = new Attributes({
                    'eye-color': 'red',
                    'nose-type': 'none',
                });
                expect(attributes.length).to.equal(2);
                expect(attributes.keys()).to.deep.equal(['eye-color', 'nose-type']);
                attributes.remove('eye-color');
                expect(attributes.length).to.equal(1);
                expect(attributes.keys()).to.deep.equal(['nose-type']);
            });
            it('should remove the style', async () => {
                const attributes = new Attributes({
                    style: 'color: red; background-color: yellow',
                });
                expect(attributes.length).to.equal(1);
                expect(attributes.keys()).to.deep.equal(['style']);
                expect(attributes.style.length).to.equal(2);
                attributes.remove('style');
                expect(attributes.length).to.equal(0);
                expect(attributes.style instanceof CssStyle).to.be.true;
                expect(attributes.style.length).to.equal(0);
                expect(attributes.get('style')).to.be.undefined;
            });
            it('should remove the classList', async () => {
                const attributes = new Attributes({
                    class: 'cool stuff',
                });
                expect(attributes.length).to.equal(1);
                expect(attributes.keys()).to.deep.equal(['class']);
                expect(attributes.classList.length).to.equal(2);
                attributes.remove('class');
                expect(attributes.length).to.equal(0);
                expect(attributes.classList instanceof ClassList).to.be.true;
                expect(attributes.classList.length).to.equal(0);
                expect(attributes.get('class')).to.be.undefined;
            });
            it('should remove two keys from the record', async () => {
                const attributes = new Attributes({
                    'eye-color': 'red',
                    'nose-type': 'none',
                });
                expect(attributes.length).to.equal(2);
                expect(attributes.keys()).to.deep.equal(['eye-color', 'nose-type']);
                attributes.remove('nose-type', 'eye-color');
                expect(attributes.length).to.equal(0);
                expect(attributes.keys()).to.deep.equal([]);
            });
            it('should not remove a key', async () => {
                const attributes = new Attributes({
                    'eye-color': 'red',
                    'nose-type': 'none',
                });
                expect(attributes.length).to.equal(2);
                expect(attributes.keys()).to.deep.equal(['eye-color', 'nose-type']);
                attributes.remove('nose-color');
                expect(attributes.length).to.equal(2);
                expect(attributes.keys()).to.deep.equal(['eye-color', 'nose-type']);
            });
            it('should remove one key but not another', async () => {
                const attributes = new Attributes({
                    'eye-color': 'red',
                    'nose-type': 'none',
                });
                expect(attributes.length).to.equal(2);
                expect(attributes.keys()).to.deep.equal(['eye-color', 'nose-type']);
                attributes.remove('nose-color', 'eye-color');
                expect(attributes.length).to.equal(1);
                expect(attributes.keys()).to.deep.equal(['nose-type']);
            });
        });
        describe('clear', () => {
            it('should remove all the keys in the record', async () => {
                const attributes = new Attributes({
                    'eye-color': 'red',
                    'nose-type': 'none',
                    style: 'color: white;',
                });
                expect(attributes.length).to.equal(3);
                attributes.clear();
                expect(attributes.length).to.equal(0);
                expect(attributes.keys()).to.deep.equal([]);
                expect(attributes.style.length).to.equal(0);
                expect(attributes.classList.length).to.equal(0);
            });
        });
    });
    describe('CssStyle', () => {
        describe('parse/render', () => {
            it('should parse a style and render it', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="  width:  800px;  color: red">Stylish</p>',
                    contentAfter: '<p style="width: 800px; color: red;">Stylish</p>',
                });
            });
        });
        describe('constructor', () => {
            it('should create a new empty CssStyle', async () => {
                const style = new CssStyle();
                expect(style instanceof CssStyle).to.be.true;
                expect(style.length).to.equal(0);
            });
            it('should create a new CssStyle from a string', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style instanceof CssStyle).to.be.true;
                expect(style.length).to.equal(2);
                expect(style.keys()).to.deep.equal(['width', 'color']);
                expect(style.values()).to.deep.equal(['800px', 'red']);
            });
            it('should create a new CssStyle from a record', async () => {
                const style = new CssStyle({
                    width: '800px',
                    color: 'red',
                });
                expect(style instanceof CssStyle).to.be.true;
                expect(style.length).to.equal(2);
                expect(style.keys()).to.deep.equal(['width', 'color']);
                expect(style.values()).to.deep.equal(['800px', 'red']);
            });
        });
        describe('cssText', () => {
            it('should show the styles as one string (get)', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.cssText).to.equal('width: 800px; color: red;');
            });
            it('should reinitialize the set with the given string (set)', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                style.cssText = ' color :  blue;  height: 5em   ';
                expect(style.cssText).to.equal('color: blue; height: 5em;');
                expect(style.length).to.equal(2);
            });
        });
        describe('parseCssText', () => {
            it('should parse a style and render it', async () => {
                const style = new CssStyle();
                const parsedRecord = style.parseCssText(' color :  blue;  height: 5em  ; ');
                expect(parsedRecord).to.deep.equal({
                    color: 'blue',
                    height: '5em',
                });
            });
        });
        describe('clone', () => {
            it('should clone a style', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                const clone = style.clone();
                expect(clone.length).to.equal(style.length);
                expect(clone.cssText).to.equal(style.cssText);
                expect(clone.keys()).to.deep.equal(style.keys());
                expect(clone.values()).to.deep.equal(style.values());
            });
        });
        describe('has', () => {
            it('should find that the style has a key', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.has('width')).to.be.true;
                expect(style.has('color')).to.be.true;
            });
            it("should find that the style doesn't have a key", async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.has('height')).to.be.false;
                expect(style.has(' ')).to.be.false;
                expect(style.has('background color')).to.be.false;
                expect(style.has('colors')).to.be.false;
            });
        });
        describe('keys', () => {
            it('should return the keys in the style record', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.keys()).to.deep.equal(['width', 'color']);
            });
        });
        describe('values', () => {
            it('should return the values in the style record', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.values()).to.deep.equal(['800px', 'red']);
            });
        });
        describe('get', () => {
            it('should get a specific style', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.get('color')).to.equal('red');
            });
            it("should not get a style that doesn't exist", async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.get('background-color')).to.be.undefined;
            });
        });
        describe('set', () => {
            it('should set a key in the record', async () => {
                const style = new CssStyle();
                expect(style.length).to.equal(0);
                expect(style.keys()).to.deep.equal([]);
                style.set('color', 'red');
                expect(style.length).to.equal(1);
                expect(style.keys()).to.deep.equal(['color']);
                expect(style.values()).to.deep.equal(['red']);
                expect(style.get('color')).to.equal('red');
            });
        });
        describe('remove', () => {
            it('should remove a key from the record', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.length).to.equal(2);
                expect(style.keys()).to.deep.equal(['width', 'color']);
                style.remove('color');
                expect(style.length).to.equal(1);
                expect(style.keys()).to.deep.equal(['width']);
                expect(style.values()).to.deep.equal(['800px']);
                expect(style.get('width')).to.equal('800px');
                style.remove('width');
                expect(style.length).to.equal(0);
                expect(style.keys()).to.deep.equal([]);
            });
            it('should remove two keys from the record', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.length).to.equal(2);
                expect(style.keys()).to.deep.equal(['width', 'color']);
                style.remove('color', 'width');
                expect(style.length).to.equal(0);
                expect(style.keys()).to.deep.equal([]);
            });
            it('should not remove a key', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.length).to.equal(2);
                expect(style.keys()).to.deep.equal(['width', 'color']);
                style.remove('background-color');
                expect(style.length).to.equal(2);
                expect(style.keys()).to.deep.equal(['width', 'color']);
            });
            it('should remove one key but not another', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.length).to.equal(2);
                expect(style.keys()).to.deep.equal(['width', 'color']);
                style.remove('color', 'background-color');
                expect(style.length).to.equal(1);
                expect(style.keys()).to.deep.equal(['width']);
            });
        });
        describe('clear', () => {
            it('should remove all the keys in the record', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.length).to.equal(2);
                style.clear();
                expect(style.length).to.equal(0);
                expect(style.keys()).to.deep.equal([]);
            });
        });
        describe('reset', () => {
            it('should remove all the keys in the record', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.length).to.equal(2);
                style.reset();
                expect(style.length).to.equal(0);
                expect(style.keys()).to.deep.equal([]);
            });
            it('should remove all the keys and replace them with a new record of styles', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.length).to.equal(2);
                style.reset({
                    height: '5em',
                    'background-color': 'blue',
                });
                expect(style.length).to.equal(2);
                expect(style.keys()).to.deep.equal(['height', 'background-color']);
                expect(style.get('height')).to.equal('5em');
                expect(style.get('background-color')).to.equal('blue');
            });
            it('should remove all the keys and replace them with a new parsed record of styles', async () => {
                const style = new CssStyle('  width:  800px;  color: red');
                expect(style.length).to.equal(2);
                style.reset('height : 5em;background-color: blue ');
                expect(style.length).to.equal(2);
                expect(style.keys()).to.deep.equal(['height', 'background-color']);
                expect(style.get('height')).to.equal('5em');
                expect(style.get('background-color')).to.equal('blue');
            });
        });
    });
    describe('ClassList', () => {
        describe('parse/render', () => {
            it('should parse a class name and render it', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p class="how many roads must a man go down">42</p>',
                    contentAfter: '<p class="how many roads must a man go down">42</p>',
                });
            });
        });
        describe('constructor', () => {
            it('should create a new empty ClassList', async () => {
                const classList = new ClassList();
                expect(classList instanceof ClassList).to.be.true;
                expect(classList.length).to.equal(0);
            });
            it('should create a new ClassList from a string', async () => {
                const classList = new ClassList('these are all classes all');
                expect(classList instanceof ClassList).to.be.true;
                expect(classList.length).to.equal(4);
                expect(classList.items()).to.deep.equal(['these', 'are', 'all', 'classes']);
            });
            it('should create a new ClassList from a set', async () => {
                const classList = new ClassList('these', 'are', 'all', 'classes');
                expect(classList instanceof ClassList).to.be.true;
                expect(classList.length).to.equal(4);
                expect(classList.items()).to.deep.equal(['these', 'are', 'all', 'classes']);
            });
        });
        describe('className', () => {
            it('should show the classes in alphabetical order, as one string (get)', async () => {
                const classList = new ClassList('these are all classes all');
                expect(classList.className).to.equal('these are all classes');
            });
            it('should reinitialize the set with the given string (set)', async () => {
                const classList = new ClassList('these are all classes all');
                classList.className = 'Ileana rocks';
                expect(classList.className).to.equal('Ileana rocks');
                expect(classList.length).to.equal(2);
            });
        });
        describe('parseClassName', () => {
            it('should parse a class name and render it', async () => {
                const classList = new ClassList();
                const parsedSet = classList.parseClassName('classes are for losers are they not');
                expect(Array.from(parsedSet)).to.deep.equal([
                    'classes',
                    'are',
                    'for',
                    'losers',
                    'they',
                    'not',
                ]);
            });
        });
        describe('clone', () => {
            it('should clone a class list', async () => {
                const classList = new ClassList('my favorite classes');
                const clone = classList.clone();
                expect(clone.length).to.equal(classList.length);
                expect(clone.className).to.equal(classList.className);
                expect(clone.items()).to.deep.equal(classList.items());
            });
        });
        describe('has', () => {
            it('should find that the class list has a class', async () => {
                const classList = new ClassList('my favorite classes');
                expect(classList.has('my')).to.be.true;
                expect(classList.has('favorite')).to.be.true;
                expect(classList.has('classes')).to.be.true;
            });
            it("should find that the class list doesn't have a class", async () => {
                const classList = new ClassList('my favorite classes');
                expect(classList.has('your')).to.be.false;
                expect(classList.has(' ')).to.be.false;
                expect(classList.has('my favorite')).to.be.false;
                expect(classList.has('class')).to.be.false;
            });
        });
        describe('items', () => {
            it('should return the items in the class list', async () => {
                const classList = new ClassList('classes are for losers are they not');
                expect(classList.items()).to.deep.equal([
                    'classes',
                    'are',
                    'for',
                    'losers',
                    'they',
                    'not',
                ]);
            });
        });
        describe('add', () => {
            it('should add a class', async () => {
                const classList = new ClassList();
                expect(classList.length).to.equal(0);
                expect(classList.items()).to.deep.equal([]);
                classList.add('Georges');
                expect(classList.length).to.equal(1);
                expect(classList.items()).to.deep.equal(['Georges']);
                classList.add('Abitbol');
                expect(classList.length).to.equal(2);
                expect(classList.items()).to.deep.equal(['Georges', 'Abitbol']);
            });
            it('should add two classes', async () => {
                const classList = new ClassList();
                expect(classList.length).to.equal(0);
                expect(classList.items()).to.deep.equal([]);
                classList.add('Georges Abitbol');
                expect(classList.length).to.equal(2);
                expect(classList.items()).to.deep.equal(['Georges', 'Abitbol']);
            });
            it('should add two classes (with spaces)', async () => {
                const classList = new ClassList();
                expect(classList.length).to.equal(0);
                expect(classList.items()).to.deep.equal([]);
                classList.add(' Georges  Abitbol ');
                expect(classList.length).to.equal(2);
                expect(classList.items()).to.deep.equal(['Georges', 'Abitbol']);
            });
        });
        describe('remove', () => {
            it('should remove a class', async () => {
                const classList = new ClassList('Georges Abitbol');
                expect(classList.length).to.equal(2);
                expect(classList.items()).to.deep.equal(['Georges', 'Abitbol']);
                classList.remove('Georges');
                expect(classList.length).to.equal(1);
                expect(classList.items()).to.deep.equal(['Abitbol']);
                classList.remove('Abitbol');
                expect(classList.length).to.equal(0);
                expect(classList.items()).to.deep.equal([]);
            });
            it('should remove two classes', async () => {
                const classList = new ClassList('Georges Abitbol');
                expect(classList.length).to.equal(2);
                expect(classList.items()).to.deep.equal(['Georges', 'Abitbol']);
                classList.remove('Abitbol Georges');
                expect(classList.length).to.equal(0);
                expect(classList.items()).to.deep.equal([]);
            });
            it('should not remove a class', async () => {
                const classList = new ClassList('Georges Abitbol');
                expect(classList.length).to.equal(2);
                expect(classList.items()).to.deep.equal(['Georges', 'Abitbol']);
                classList.remove('George');
                expect(classList.length).to.equal(2);
                expect(classList.items()).to.deep.equal(['Georges', 'Abitbol']);
            });
            it('should remove one class but not another', async () => {
                const classList = new ClassList('Georges Abitbol');
                expect(classList.length).to.equal(2);
                expect(classList.items()).to.deep.equal(['Georges', 'Abitbol']);
                classList.remove('Abitbol George');
                expect(classList.length).to.equal(1);
                expect(classList.items()).to.deep.equal(['Georges']);
            });
            it('should remove a class (with spaces)', async () => {
                const classList = new ClassList('Georges Abitbol');
                expect(classList.length).to.equal(2);
                expect(classList.items()).to.deep.equal(['Georges', 'Abitbol']);
                classList.remove(' Georges  ');
                expect(classList.length).to.equal(1);
                expect(classList.items()).to.deep.equal(['Abitbol']);
            });
        });
        describe('clear', () => {
            it('should remove all the classes', async () => {
                const classList = new ClassList('Georges Abitbol is the classiest man alive');
                expect(classList.length).to.equal(7);
                classList.clear();
                expect(classList.length).to.equal(0);
                expect(classList.items()).to.deep.equal([]);
            });
        });
        describe('reset', () => {
            it('should remove all the classes', async () => {
                const classList = new ClassList('Georges Abitbol is the classiest man alive');
                expect(classList.length).to.equal(7);
                classList.reset();
                expect(classList.length).to.equal(0);
                expect(classList.items()).to.deep.equal([]);
            });
            it('should remove all the classes and replace them with a new set of classes', async () => {
                const classList = new ClassList('Georges Abitbol is the classiest man alive');
                expect(classList.length).to.equal(7);
                classList.reset('try', 'the', 'chocolate', 'mousse');
                expect(classList.length).to.equal(4);
                expect(classList.items()).to.deep.equal(['try', 'the', 'chocolate', 'mousse']);
            });
            it('should remove all the classes and replace them with a new parsed set of classes', async () => {
                const classList = new ClassList('Georges Abitbol is the classiest man alive');
                expect(classList.length).to.equal(7);
                classList.reset('try the chocolate mousse');
                expect(classList.length).to.equal(4);
                expect(classList.items()).to.deep.equal(['try', 'the', 'chocolate', 'mousse']);
            });
        });
        describe('toggle', () => {
            it('should add a class by toggling', async () => {
                const classList = new ClassList();
                classList.toggle('classy');
                expect(classList.length).to.equal(1);
                expect(classList.items()).to.deep.equal(['classy']);
            });
            it('should remove a class by toggling', async () => {
                const classList = new ClassList('classy');
                expect(classList.length).to.equal(1);
                expect(classList.items()).to.deep.equal(['classy']);
                classList.toggle('classy');
                expect(classList.length).to.equal(0);
                expect(classList.items()).to.deep.equal([]);
            });
            it('should add two classes by toggling', async () => {
                const classList = new ClassList();
                classList.toggle('Georges Abitbol');
                expect(classList.length).to.equal(2);
                expect(classList.items()).to.deep.equal(['Georges', 'Abitbol']);
            });
            it('should remove two classes by toggling', async () => {
                const classList = new ClassList('Georges Abitbol');
                expect(classList.length).to.equal(2);
                expect(classList.items()).to.deep.equal(['Georges', 'Abitbol']);
                classList.toggle('Abitbol Georges');
                expect(classList.length).to.equal(0);
                expect(classList.items()).to.deep.equal([]);
            });
            it('should remove four classes by toggling with rest parameters', async () => {
                const classList = new ClassList('Georges Abitbol is classy');
                expect(classList.length).to.equal(4);
                expect(classList.items()).to.deep.equal(['Georges', 'Abitbol', 'is', 'classy']);
                classList.toggle('Abitbol classy', 'is Georges');
                expect(classList.length).to.equal(0);
                expect(classList.items()).to.deep.equal([]);
            });
            it('should add a class and remove another, by toggling', async () => {
                const classList = new ClassList('Georges is classy');
                expect(classList.length).to.equal(3);
                classList.toggle('Georges Antoine');
                expect(classList.length).to.equal(3);
                expect(classList.items()).to.deep.equal(['is', 'classy', 'Antoine']);
            });
            it('should add two classes and remove two others, by toggling with rest parameters', async () => {
                const classList = new ClassList('Georges Abitbol is classy');
                expect(classList.length).to.equal(4);
                classList.toggle('Georges Guenet', 'Antoine Abitbol');
                expect(classList.length).to.equal(4);
                expect(classList.items()).to.deep.equal(['is', 'classy', 'Guenet', 'Antoine']);
            });
        });
    });
});
