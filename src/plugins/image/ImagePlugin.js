(function () {
'use strict';

class ImagePlugin extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.templatesDependencies = ['src/xml/media.xml'];
        this.dependencies = ['Arch', 'Media'];
        this.buttons = {
            template: 'we3.buttons.image',
            active: '_active',
        };
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    displayRecord (record) {
        var img = document.createElement('img');
        img.setAttribute('title', record.title || record.name);
        img.setAttribute('alt', record.alt);
        img.setAttribute('src', record.url);
        img.className = record.className || '';
        return img;
    }
    getArchNode (archNode) {
        return archNode.ancestor('isImg');
    }
    toggleClass (value, archNode) {
        archNode.className.toggle(value);
        this.dependencies.Arch.importUpdate(archNode.toJSON());
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _active (buttonName, focusNode) {
        return focusNode.className.contains(buttonName);
    }
}

we3.addPlugin('Image', ImagePlugin);

})();
