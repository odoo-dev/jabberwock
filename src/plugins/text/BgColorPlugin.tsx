(function () {
'use strict';

const ColorPlugin = we3.getPlugin('Color');

class BgColorPlugin extends ColorPlugin {
    constructor () {
        super(...arguments);
        this.buttons = {
            template: 'we3.buttons.bgcolor',
            active: '_active',
            enabled: '_enabled',
        };
        this._classPrefix = this._classPrefixes && this._classPrefixes.background || 'color-';
        this._styleName = 'background-color';
    }
}

we3.addPlugin('BgColor', BgColorPlugin);

})();
