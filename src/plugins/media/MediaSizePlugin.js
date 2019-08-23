(function () {
'use strict';

//--------------------------------------------------------------------------
// Size button
//--------------------------------------------------------------------------

class MediaSizePlugin extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['Arch'];
        this.templatesDependencies = ['src/xml/media.xml'];
        this.buttons = {
            template: 'we3.buttons.size',
            active: '_active',
            enabled: '_enabled',
        };
    }

    update (size, archNode) {
        archNode.style.add('width', size === 'auto' ? '' : size);
        this.dependencies.Arch.importUpdate(archNode.toJSON());
    }

    _active (buttonName, focusNode) {
        var size = buttonName.split('-')[1];
        if (size === 'auto') {
            size = '';
        }
        return (focusNode.style.width ? focusNode.style.width.replace('%', '') : '') ===  size;
    }
    _enabled (buttonName, focusNode) {
        return focusNode.isMedia && focusNode.isMedia();
    }
}

we3.addPlugin('MediaSize', MediaSizePlugin);

})();
