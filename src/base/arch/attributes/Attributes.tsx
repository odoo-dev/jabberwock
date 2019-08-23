(function () {
'use strict';

class Attributes {
    constructor (archNode, attributes) {
        var self = this;
        this.archNode = archNode;
        this.__order__ = [];
        if (attributes instanceof Attributes) {
            this.__order__ = attributes.__order__.map(function (name) {
                var value = attributes[name];
                if (name === 'class') {
                    value = new we3.ClassName(archNode, value);
                } else if (name === 'style') {
                    value = new we3.Style(archNode, value);
                }
                self[name] = value;
                return name;
            });
        } else {
            attributes.forEach(function (attribute) {
                self.add(attribute[0], attribute[1]);
            });
        }
    }
    add (name, value) {
        if ((name !== 'class' && name !== 'style' || value !== '') && !this.archNode.isAllowUpdate()) {
            console.warn("cannot update style of a non editable node");
            return;
        }
        if (this.__order__.indexOf(name) === -1) {
            this.__order__.push(name);
        }
        if (name === 'class') {
            if (this.class && this.class.toString() === value + '') {
                return;
            }
            value = new we3.ClassName(this.archNode, value);
        } else if (name === 'style') {
            if (this.style && this.style.toString() === value + '') {
                return;
            }
            value = new we3.Style(this.archNode, value);
        } else if (value === null || value === '') {
            return this.remove(name);
        }
        if (this[name] + '' !== value + '') {
            this[name] = value;
            this.archNode._triggerChange(null);
        }
    }
    clear () {
        if (!this.archNode.isAllowUpdate()) {
            console.warn("cannot update attribute of a non editable node");
            return;
        }
        var self = this;
        this.__order__.forEach(function (name) {
            delete self[name];
        });
        this.__order__ = [];
    }
    isEqual (obj, options) {
        if (!obj) {
            return !this.__order__.length;
        }
        var self = this;
        var isEqual = true;
        var list = this.__order__.slice();
        obj.__order__.forEach(function (name) {
            if (list.indexOf(name) === -1) {
                list.push(name);
            }
        });
        list.forEach(function (name) {
            if (!name.indexOf('_') || !isEqual || options && options.blackList && options.blackList.indexOf(name) !== -1) {
                return;
            }
            if (name === 'class' || name === 'style') {
                isEqual = self[name].isEqual(obj[name], options);
            } else if (self[name] instanceof Array && obj[name] instanceof Array) {
                isEqual = self[name].every(function (item, index) {
                    return obj[name][index] && item === obj[name][index];
                });
            } else if (self[name] !== obj[name]) {
                isEqual = false;
            }
        });
        return isEqual;
    }
    forEach (fn) {
        this.__order__.forEach(fn.bind(this));
    }
    remove (name) {
        if (!this.archNode.isAllowUpdate()) {
            console.warn("cannot update attribute of a non editable node");
            return;
        }
        var index = this.__order__.indexOf(name);
        if (index !== -1) {
            this.__order__.splice(index, 1);
            this.archNode._triggerChange(null);
        }
        delete this[name];
    }
    set (name, value) {
        this.add(name, value);
    }
    toJSON () {
        var self = this;
        var attributes = [];
        this.__order__.forEach(function (name) {
            var value = name in self ? self[name].toString() : '';
            if (value.length) {
                attributes.push([name, value]);
            }
        });
        return attributes;
    }
    toString () {
        var self = this;
        var string = '';
        this.__order__.forEach(function (name) {
            var value = name in self ? self[name].toString() : '';
            if (!value.length) {
                return;
            }
            if (string.length) {
                string += ' ';
            }
            string += name + '="' + value.replace('"', '\\"') + '"';
        });
        return string;
    }
}

we3.Attributes = Attributes;

})();
