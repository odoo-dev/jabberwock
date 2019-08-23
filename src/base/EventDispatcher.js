(function () {
'use strict';

/**
 * Mixin to structure objects' life-cycles folowing a parent-children
 * relationship. Each object can a have a parent and multiple children.
 * When an object is destroyed, all its children are destroyed too releasing
 * any resource they could have reserved before.
 *
 * @name we3Parented
 * @mixin
 */
we3.Parented = class {
    constructor (parent) {
        this._parentedMixin = true;
        this._parentedDestroyed = false;
        this._parentedChildren = [];
        this._parentedParent = null;
        this._setParent(parent);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Inform the object it should destroy itself, releasing any
     * resource it could have reserved.
     */
    destroy () {
        this.getChildren().forEach(function (el) {
            el.destroy();
        });
        this._setParent(undefined);
        this._parentedDestroyed = true;
    }
    /**
     * Return a list of the children of the current object.
     *
     * @returns {Object []}
     */
    getChildren () {
        return this._parentedChildren.slice();
    }
    /**
     * Returns true if destroy() was called on the current object.
     *
     * @returns {Boolean}
     */
    isDestroyed () {
        return this._parentedDestroyed;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return the current parent of the object (or null).
     *
     * @returns {Object}
     */
    _getParent () {
        return this._parentedParent;
    }
    /**
     * Set the parent of the current object. When calling this method, the
     * parent will also be informed and will return the current object
     * when its getChildren() method is called. If the current object did
     * already have a parent, it is unregistered before, which means the
     * previous parent will not return the current object anymore when its
     * getChildren() method is called.
     *
     * @param {Object} parent
     */
    _setParent (parent) {
        if (this._getParent()) {
            if (this._getParent()._parentedMixin) {
                var siblings = this._getParent().getChildren();
                siblings.splice(siblings.indexOf(this));
                this._getParent()._parentedChildren = siblings;
            }
        }
        this._parentedParent = parent;
        if (parent && parent._parentedMixin) {
            parent._parentedChildren.push(this);
        }
    }
};

var Event = class {
    constructor (target, name, data) {
        this._stopped = false;
        this.target = target;
        this.name = name;
        this.data = data && data.slice ? data.slice() : Object.assign({}, data);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Stop the event's propagation.
     */
    stopPropagation () {
        this._stopped = true;
    }

    get isStopped () {
        this._stopped = true;
    }
}

/**
 * Backbone's events. Do not ever use it directly, use EventDispatcherMixin instead.
 *
 * This class just handle the dispatching of events, it is not meant to be extended,
 * nor used directly. All integration with parenting and automatic unregistration of
 * events is done in EventDispatcherMixin.
 *
 * Copyright notice for the following Class:
 *
 * (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
 * Backbone may be freely distributed under the MIT license.
 * For all details and documentation:
 * http://backbonejs.org
 *
 */
var Events = class {
    /**
     * Return the list of callback functions.
     *
     * @returns {function []}
     */
    callbackList () {
        var lst = [];
        if (!this._callbacks) {
            return lst;
        }
        var callbacks = this._callbacks;
        Object.keys(callbacks).forEach(function (eventName) {
            var node = callbacks[eventName];
            while ((node = node.next) && node.next) {
                lst.push([eventName, node.callback, node.context]);
            }
        });
        return lst;
    }
    /**
     * Unbind events.
     *
     * @param {string} [events]
     * @param {function} [callback]
     * @param {Object} [context]
     * @returns {Events} self
     */
    off (events, callback, context) {
        var ev, calls, node;
        if (!events) {
            delete this._callbacks;
        } else if ((calls = this._callbacks)) {
            events = events.split(/\s+/);
            while ((ev = events.shift())) {
                node = calls[ev];
                delete calls[ev];
                if (!callback || !node)
                    continue;
                while ((node = node.next) && node.next) {
                    if (node.callback === callback
                            && (!context || node.context === context))
                        continue;
                    this.on(ev, node.callback, node.context);
                }
            }
        }
        return this;
    }
    /**
     * Bind events.
     *
     * @param {string} [events]
     * @param {function} [callback]
     * @param {Object} [context]
     * @returns {Events} self
     */
    on (events, callback, context) {
        var ev;
        events = events.split(/\s+/);
        var calls = this._callbacks || (this._callbacks = {});
        while ((ev = events.shift())) {
            var list = calls[ev] || (calls[ev] = {});
            var tail = list.tail || (list.tail = list.next = {});
            tail.callback = callback;
            tail.context = context;
            list.tail = tail.next = {};
        }
        return this;
    }
    /**
     * Trigger events.
     *
     * @param {string} events 
     * @returns {Events} self
     */
    trigger (events) {
        var event, node, calls, tail, args, all, rest;
        if (!(calls = this._callbacks))
            return this;
        all = calls.all;
        (events = events.split(/\s+/)).push(null);
        // Save references to the current heads & tails.
        while ((event = events.shift())) {
            if (all)
                events.push({
                    next : all.next,
                    tail : all.tail,
                    event : event
                });
            if (!(node = calls[event]))
                continue;
            events.push({
                next : node.next,
                tail : node.tail
            });
        }
        rest = Array.prototype.slice.call(arguments, 1);
        while ((node = events.pop())) {
            tail = node.tail;
            args = node.event ? [ node.event ].concat(rest) : rest;
            while ((node = node.next) !== tail) {
                node.callback.apply(node.context || this, args);
            }
        }
        return this;
    }
};

/**
 * Mixin containing an event system. Events are also registered by specifying the target object
 * (the object which will receive the event when it is raised). Both the event-emitting object
 * and the target object store or reference to each other. This is used to correctly remove all
 * reference to the event handler when any of the object is destroyed (when the destroy() method
 * from ParentedMixin is called). Removing those references is necessary to avoid memory leak
 * and phantom events (events which are raised and sent to a previously destroyed object).
 *
 * @name EventDispatcherMixin
 */
we3.EventDispatcher = class extends we3.Parented {
    constructor (parent) {
        super(parent);
        this._eventDispatcherMixin = true;
        this._edispatcherEvents = new Events();
        this._edispatcherRegisteredEvents = [];
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Inform the object it should destroy itself, releasing any
     * resource it could have reserved.
     */
    destroy () {
        var self = this;
        _.each(this._edispatcherRegisteredEvents, function (event) {
            event.source._edispatcherEvents.off(event.name, event.func, self);
        });
        this._edispatcherRegisteredEvents = [];
        _.each(this._edispatcherEvents.callbackList(), function (cal) {
            this.off(cal[0], cal[2], cal[1]);
        }, this);
        this._edispatcherEvents.off();
        super.destroy();
    }
    /**
     * Unbind events.
     *
     * @param {string} events
     * @param {Object} dest
     * @param {function} func
     * @returns {EventDispatcher} self
     */
    off (events, dest, func) {
        var self = this;
        events = events.split(/\s+/);
        _.each(events, function (eventName) {
            self._edispatcherEvents.off(eventName, func, dest);
            if (dest && dest._eventDispatcherMixin) {
                dest._edispatcherRegisteredEvents = _.filter(dest._edispatcherRegisteredEvents, function (el) {
                    return !(el.name === eventName && el.func === func && el.source === self);
                });
            }
        });
        return this;
    }
    /**
     * Bind events.
     *
     * @param {string} events
     * @param {Object} dest
     * @param {function} func
     * @returns {EventDispatcher} self
     */
    on (events, dest, func) {
        var self = this;
        if (typeof func !== "function") {
            throw new Error("Event handler must be a function.");
        }
        events = events.split(/\s+/);
        _.each(events, function (eventName) {
            self._edispatcherEvents.on(eventName, func, dest);
            if (dest && dest._eventDispatcherMixin) {
                dest._edispatcherRegisteredEvents.push({name: eventName, func: func, source: self});
            }
        });
        return this;
    }
    /**
     * Bind events. Similar to `on`, but `func` is executed only once.
     *
     * @param {string} events
     * @param {Object} dest
     * @param {function} func
     * @returns {EventDispatcher} self
     */
    once (events, dest, func) {
        var self = this;
        if (typeof func !== "function") {
            throw new Error("Event handler must be a function.");
        }
        self.on(events, dest, function what() {
            func.apply(this, arguments);
            self.off(events, dest, what);
        });
    }
    /**
     * Trigger events.
     *
     * @returns {EventDispatcher} self
     */
    trigger () {
        this._edispatcherEvents.trigger.apply(this._edispatcherEvents, arguments);
        return this;
    }
    /**
     * Trigger an event and make it bubble up.
     *
     * @param {string} name
     * @param {Object} info
     * @returns {Event}
     */
    triggerUp (name, info) {
        var event = new Event(this, name, info);
        //console.info('event: ', name, info);
        this._triggerUp(event);
        return event;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Trigger an event and make it bubble up.
     *
     * @private
     * @param {string} event
     */
    _triggerUp (event) {
        var parent;
        this.trigger(event.name, event);
        if (!event.isStopped && (parent = this._parentedParent)) {
            if (parent._triggerUp) {
                parent._triggerUp(event);
            } else if (parent.trigger) {
                parent.trigger(event.name, event);
            }
        }
    }
};

})();
