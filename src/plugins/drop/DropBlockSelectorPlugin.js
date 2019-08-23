(function () {
'use strict';

class DropBlockSelectorPlugin extends we3.AbstractPlugin {
    /**
     * @constructor
     * @param {Object} parent
     * @param {Object} params
     * @param {Object} options
     */
    constructor(parent, params, options) {
        super(...arguments);
        this.dependencies = ['Arch', 'DropBlock', 'Selector'];
        this.dropzonesData = (this.options.blockSelector || [])
            .filter(function (data) {
                return (data.dropIn || data.dropNear);
            });
    }
    /**
     * @override
     */
    start() {
        var promise = super.start(...arguments);
        this.dependencies.DropBlock
            .on('dropzones_data_demand', this, this._onDropzonesDataDemand.bind(this));
        return promise;
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     */
    _onDropzonesDataDemand(items) {
        var self = this;
        var Selector = this.dependencies.Selector;
        var Arch = this.dependencies.Arch;

        // If no specific target is asked by a predefined series of items,
        // consider all of them.
        if (!items.length) {
            var ids = this.dropzonesData.map(function (zone) {
                return Selector.search(zone.selector);
            });
            we3.utils.uniq(we3.utils.flatten(ids)).forEach(function (id) {
                items.push({target: id});
            });
        }

        // For each defined target, associate the related arch node and a dropIn
        // and a dropNear function if any.
        items.forEach(function (item) {
            if (typeof item.target === 'number') {
                item.arch = Arch.getClonedArchNode(item.target);
            } else {
                item.arch = Arch.parse(item.target).firstChild();
            }

            var dropInSelectors = [];
            var dropNearSelectors = [];
            self.dropzonesData.forEach(function (zone) {
                if (Selector.is(item.arch, zone.selector)
                        && (!zone.exclude || !Selector.is(item.arch, zone.exclude))) {
                    if (zone.dropIn) {
                        dropInSelectors.push(zone.dropIn);
                    }
                    if (zone.dropNear) {
                        dropNearSelectors.push(zone.dropNear);
                    }
                }
            });
            item.dropIn = makeDropFunction(dropInSelectors);
            item.dropNear = makeDropFunction(dropNearSelectors);
        });

        function makeDropFunction(dropSelectors) {
            return function () {
                return we3.utils.uniq(we3.utils.flatten(dropSelectors.map(function (selector) {
                    if (selector === 'root') {
                        return [1];
                    }
                    return Selector.search(selector);
                })));
            };
        }
    }
}

we3.addPlugin('DropBlockSelector', DropBlockSelectorPlugin);

})();
