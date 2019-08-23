(function () {
  'use strict';

var regSplitStyles = /\s*;\s*/;
var regSplitStyle = /\s*:\s*/;

const Attributes = we3.Attributes;

class Style extends Attributes {
    constructor (archNode, style) {
        if (!style) {
            style = '';
        }
        if (style instanceof Style) {
            super(archNode, style);
        } else {
            super(archNode, []);
            var self = this;
            style.trim().split(regSplitStyles).forEach(function (style) {
                var split = style.split(regSplitStyle);
                if (split.length === 2) {
                    self.add(split[0], split[1]);
                }
            });
        }
    }
    add (name, value) {
        if (!this.archNode.isAllowUpdate()) {
            console.warn("cannot update style of a non editable node");
            return;
        }
        if (value.trim() === '') {
            return this.remove(name);
        }
        if (this.__order__.indexOf(name) === -1) {
            this.__order__.push(name);
        }
        if (this[name] !== value) {
            this[name] = value;
            this.archNode._triggerChange(null);
        }
    }
    get length () {
        return this.__order__.length;
    }
    update (style) {
        var self = this;
        Object.keys(style).forEach (function (key) {
            self.add(key, style[key]);
        });
    }
    toString () {
        var self = this;
        var string = '';
        this.__order__.forEach(function (name) {
            var value = self[name].toString();
            if (!value.length) {
                return;
            }
            if (string.length) {
                string += '; ';
            }
            string += name + ':' + value.replace('"', '\\"');
        });
        return string;
    }
}

we3.Style = Style;

})();
