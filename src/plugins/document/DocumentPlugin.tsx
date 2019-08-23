(function () {
'use strict';

var utils = we3.utils;

 class DocumentPlugin extends we3.AbstractPlugin {
    getArchNode (archNode) {
        return archNode.ancestor('isDocument');
    }
    displayRecord (record) {
        var a = document.createElement('a');
        a.setAttribute('title', record.title || record.name);
        a.setAttribute('data-mimetype', record.mimetype);
        var ext = record.url.match(/\.([a-z0-9]+)$/i);
        if (ext) {
            ext = ext[1];
            a.setAttribute('data-ext', ext.toLowerCase());
        }
        a.setAttribute('href', record.url);
        a.setAttribute('target', '_BLANK');
        a.className = record.className || '';
        a.classList.add('we3-document');

        var img = document.createElement('img');
        var mimetype = 'unknown';
        var mimetypes = utils.defaults(this.options.Media.mimetypes, we3.options.Media.mimetypes);
        for (var m in mimetypes) {
            if (mimetypes[m].mimetype.test(record.mimetype) || ext && mimetypes[m].ext && mimetypes[m].ext.test(ext)) {
                mimetype = m;
                break;
            }
        }
        img.setAttribute('src', this.options.xhrPath + 'src/img/mimetypes/' + mimetype + '.svg');
        img.classList.add('we3-document-image');
        a.appendChild(img);
        return a;
    }
}

we3.addPlugin('Document', DocumentPlugin);

})();
