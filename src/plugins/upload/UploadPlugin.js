(function () {
'use strict';

var uniqueName = 0;

class UploadPlugin extends we3.AbstractPlugin {
    static get conflicts () {
        return ['ImageUrl', 'DocumentUrl'];
    }
    /**
     *
     * @override
     *
     * @param {Object} parent
     * @param {Object} params
     *
     * @param {Object} params.upload
     * @param {string} [params.upload.add]
     * @param {string} [params.upload.remove]
     * @param {string} [params.upload.search]
     * @param {function} [params.upload.onUpload(pluginName, records)]
     *      Called when a document is uploaded
     * @param {function} [params.upload.onSelect(pluginName, record)]
     *      Called to use the selected documents
     *      Usefull to set new attributes (title, access token...)
     *      The method return a promise resoved by the JSON (which represents the archNode)
     * @param {Object} [params.xhr] any information to insert in the add from (input name, value)
     **/
    constructor () {
        super(...arguments);
        this.templatesDependencies = ['src/xml/upload.xml'];
        if (!this.options.upload) {
            console.error("'UploadImage' plugin should use 'upload' options");
            return;
        }
        if (!this.options.upload.add && !this.options.upload.search) {
            console.error("'UploadImage' plugin should use 'uploadUrl.url' or 'uploadUrl.search' options");
        }
        this._limit = this.options.upload.limit || 18;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     *
     * @override
     *
     * @param {Object} params
     * @param {function} params.displayRecord
     * @param {function} params.updateSelection
     * @param {boolean} [params.multi]
     * @param {object[]} [params.inputs]
     * @param {string[]} [params.filters]
     * @param {string} [params.accept]
     **/
    createUploadForm (pluginName, params) {
        var fragment = this._renderTemplate('we3.modal.media.upload');
        var form = fragment.firstChild;
        var iframeName = 'we3-fileframe-' + (++uniqueName);
        form.setAttribute('data-plugin', pluginName);
        form.setAttribute('target', iframeName);
        form.setAttribute('action', this.options.upload.add);
        form.querySelector('iframe').setAttribute('name', iframeName);
        form.querySelector('input[name="filters"]', params.filters ? params.filters.join('_') : ''); // TODO change firstFilters
        form.querySelector('input[name="upload"]').setAttribute('accept', params.accept || '');
        form.querySelector('input[name="url"]').setAttribute('placeholder', 'https://www.odoo.com/logo.png');
        if (this.options.xhr) {
            for (var name in this.options.xhr) {
                var input = document.createElement('input');
                input.setAttribute('name', name);
                input.setAttribute('type', 'hidden');
                input.setAttribute('value', this.options.xhr[name]);
                input.value = this.options.xhr[name];
                form.appendChild(input);
            }
        }
        if (params.inputs) {
            params.inputs.forEach(function (opt) {
                var input = document.createElement('input');
                for (var key in opt) {
                    input.setAttribute(key, opt[key]);
                }
                if (opt.value) {
                    input.value = opt.value;
                }
                form.appendChild(input);
            });
        }

        form._display = params.displayRecord;
        form._update = params.updateSelection;
        form._multi = params.multi;
        form._records = [];

        if (!this.options.upload.add) {
            form.querySelector('we3-group[name="upload"]').style.display = 'none';
            form.querySelector('we3-group[name="url"]').style.display = 'none';
        }
        if (!this.options.upload.search) {
            form.querySelector('we3-group[name="search"]').style.display = 'none';
            form.querySelector('we3-message-loaded').style.display = 'none';
        } else {
            this._search(form);
        }

        return fragment;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _addDocuments (form, records) {
        if (!records.length) {
            return;
        }
        var docs = this._displayData(form, records, form._records.length - this._limit, true);
        docs.forEach(this._selectDocument.bind(this, form));
        form._update(this._getSelectedDocuments(form));
    }
    _displayData (form, records, offset, insertBefore) {
        var docs = [];
        var documents = form.querySelector('we3-documents');
        if (!form._records) {
            documents.innerHTML = '';
        }
        form._records = (form._records || []).concat(records);

        var nb = this._limit;
        records.forEach(function (record) {
            if (!nb) {
                return;
            }
            var doc = document.createElement('we3-document');
            docs.push(doc);
            doc.setAttribute('data-id', record.id);
            var content;
            if (form._display) {
                content = form._display(record);
            }
            doc.appendChild(content);
            if (record.selected) {
                doc.className = 'we3-selected';
            }
            if (insertBefore && documents.childNodes.length) {
                documents.insertBefore(doc, documents.firstChild);
            } else {
                documents.appendChild(doc);
            }
            nb--;
        });

        if (form._records.length > offset + this._limit) {
            form.querySelector('we3-button[data-method="_onLoadMore"]').style.display = '';
            form.querySelector('we3-message-loaded').style.display = 'none';
        } else {
            form.querySelector('we3-button[data-method="_onLoadMore"]').style.display = 'none';
            form.querySelector('we3-message-loaded').style.display = '';
        }

        return docs;
    }
    _getSelectedDocuments (form) {
        var records = [];
        for (var k = 0; k < form._records.length; k++) {
            if (form._records[k].selected) {
                records.push(form._records[k]);
            }
        }
        return records;
    }
    _search (form, offset) {
        var self = this;
        var search = form.querySelector('input[name="search"]').value || '';
        return this.options.getXHR(form.getAttribute('data-plugin'), this.options.upload.search, {
            search: search,
            limit: this._limit + (offset ? 0 : 1),
            offset: offset || 0,
        }).then(function (records) {
            if (!(records instanceof Array)) {
                console.error(records);
                throw new Error("Should load a record list");
            }
            self._displayData(form, records, offset ? offset - 1 : 0);
        });
    }
    _selectDocument (form, doc) {
        if (!form._multi) {
            var selected = form.querySelector('we3-document.we3-selected');
            if (selected) {
                this.__selectDocument(form, selected);
            }
        }
        this.__selectDocument(form, doc);
    }
    __selectDocument (form, doc) {
        doc.classList.toggle('we3-selected');
        var selected = doc.classList.contains('we3-selected');
        var id = doc.getAttribute('data-id');
        var record;
        for (var k = 0; k < form._records.length; k++) {
            record = form._records[k];
            if (record.id && record.id.toString() === id) {
                record.selected = selected;
                break;
            }
        }
    }
    /**
     * @returns {Promise}
     */
    _uploadImageIframe (form) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var iframe = form.querySelector('iframe');
            iframe.addEventListener('load', self._onUploadImageIframeLoaded.bind(self, resolve, form, reject), false);
            form.submit();
            form.querySelector('input[name="upload"]').value = '';
            form.querySelector('input[name="url"]').value = '';
        });
    }
    _updateURLInputbuttons (form) {
        var buttons = form.querySelector('we3-group[name="url"]');
        var button = buttons.querySelector('we3-button');
        var inputValue = form.querySelector('input[name="url"]').value;
        var isURL = /^((https?|ftp):\/)?\/([a-z0-9_-]+\.)+[a-z0-9]+.+$/i.test(inputValue); // TODO improve
        if (isURL) {
            button.classList.add('btn-primary');
            button.removeAttribute('disabled');
            button.removeAttribute('data-error');
        } else {
            button.classList.remove('btn-primary');
            button.setAttribute('disabled', 'disabled');
            button.setAttribute('data-error', 'true');
        }
        if (inputValue === '') {
            button.removeAttribute('data-url');
        } else {
            button.setAttribute('data-url', inputValue);
        }
    }

    //--------------------------------------------------------------------------
    // Handle
    //--------------------------------------------------------------------------

    _onLoadMore (value, ev) {
        var form = ev.target.closest('form');
        return this._search(form, form._records.length);
    }
    _onSearch (value, ev) {
        var form = ev.target.closest('form');
        var documents = form.querySelector('we3-documents');
        form._records = false;
        return this._search(form, 0);
    }
    _onSelectDocument (value, ev) {
        var doc = ev.srcElement.closest('we3-document');
        var form = doc.closest('form');
        this._selectDocument(form, doc);
        form._update(this._getSelectedDocuments(form));
    }
    _onUpload (value, ev) {
        var clickEvent = new MouseEvent('click', {});
        ev.target.previousElementSibling.dispatchEvent(clickEvent);
    }
    _onUploadFileInput (value, ev) {
        var form = ev.target.closest('form');
        form.querySelector('we3-message-error').innerHTML = '';
        this._uploadImageIframe(form);
    }
    _onUploadImageIframeLoaded (resolve, form, onError) {
        var iframe = form.querySelector('iframe');
        var iWindow = iframe.contentWindow;
        var records = iWindow.records || iWindow.attachments || [];
        var error = iWindow.error;

        _.each(records, function (record) {
            record.url = record.url || _.str.sprintf('/web/image/%s/%s', record.id, encodeURI(record.title || record.name)); // Name is added for SEO purposes
        });
        if (error) {
            form.querySelector('we3-message-error').innerHTML = 'error';
            onError(error);
        }
        if (this.options.upload.onUpload) {
            records = this.options.upload.onUpload(form.getAttribute('data-plugin'), records);
        }
        this.triggerUp('uploadFile', {pluginName: form.getAttribute('data-plugin'), records: records});
        this._addDocuments(form, records);
        resolve(records);
    }
    _onURLInputChange (value, ev) {
        var form = ev.target.closest('form');
        this._updateURLInputbuttons(form);
    }
    _onURLButtonClick (value, ev) {
        console.warn('TODO use upload ?');
        // validate form
        var form = ev.target.closest('form');
        var input = ev.target.previousElementSibling;
        var ext = input.value.split('.').pop();
        var records = [{
            title: input.value,
            alt: input.value,
            url: input.value,
            className: 'o_image',
            selected: true,
            mimetype: 'application/' + ext,
        }];
        input.value = '';
        this._updateURLInputbuttons(form);
        this._addDocuments(form, records);
    }
}

we3.addPlugin('Upload', UploadPlugin);

})();
