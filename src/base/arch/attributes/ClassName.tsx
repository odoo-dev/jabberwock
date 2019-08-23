(function () {
  'use strict';

var regMultiSpace = /\s\s+/g;

class ClassName {
    constructor (archNode, classNames) {
        this.archNode = archNode;
        if (!classNames) {
            classNames = '';
        }
        if (classNames instanceof ClassName) {
            this.value = classNames.value.slice();
        } else {
            this.value = classNames.trim().length ? classNames.replace(regMultiSpace, ' ').split(' ') : [];
        }
    }
    get length () {
        return this.toString().length;
    }
    /**
     * Return the classes as a space-separated string.
     *
     * @returns {string}
     */
    toString () {
        return this.value.sort().join(' ');
    }

    /**
     * Add class(es).
     *
     * @param {string} classNames
     */
    add (classNames) {
        if (!this.archNode.isAllowUpdate()) {
            console.warn("cannot update class of a non editable node");
            return;
        }
        var self = this;
        classNames.replace(regMultiSpace, ' ').split(' ').forEach(function (className) {
            var index = self.value.indexOf(className);
            if (index === -1) {
                self.value.push(className);
                self.archNode._triggerChange(null);
            }
        });
    }
    /**
     * Return true if `className` is contained in the classes.
     *
     * @param {string} className
     * @returns {Boolean}
     */
    contains (className) {
        return this.value.indexOf(className) !== -1;
    }
    /**
     * Return true if this ClassName object is equal to the given ClassName object.
     *
     * @param {ClassName} [obj]
     * @param {Object} [options]
     * @returns {Boolean}
     */
    isEqual (obj, options) {
        if (!obj) {
            return !this.value.length;
        }
        var self = this;
        var isEqual = true;
        this.value.concat(obj.value).forEach(function (className) {
            if (!isEqual || options && options.blackListClassNames && options.blackListClassNames.indexOf(className) !== -1) {
                return;
            }
            if (self.value.indexOf(className) === -1 || obj.value.indexOf(className) === -1) {
                isEqual = false;
            }
        });
        return isEqual;
    }
    /**
     * Remove the given class(es).
     *
     * @param {string} classNames
     */
    remove (classNames) {
        if (!this.archNode.isAllowUpdate()) {
            console.warn("cannot update class of a non editable node");
            return;
        }
        var self = this;
        classNames.replace(regMultiSpace, ' ').split(' ').forEach(function (className) {
            var index = self.value.indexOf(className);
            if (index !== -1) {
                self.value.splice(index, 1);
                self.archNode._triggerChange(null);
            }
        });
    }
    /**
     * Toggle a class.
     *
     * @param {string} className
     */
    toggle (className) {
        if (this.contains(className)) {
            this.remove(className);
        } else {
            this.add(className);
        }
    }
}

we3.ClassName = ClassName;

})();
