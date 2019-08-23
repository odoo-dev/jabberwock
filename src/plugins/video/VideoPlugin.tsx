(function () {
'use strict';

class VideoPlugin extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['Media'];

        this.featuresSelected = new Set();
        this.currentUrl = "";

        this._providers = {
            youtube: {
                features: {
                    autoplay: {},
                    loop: {},
                    controls: {default: true},
                    fs: {name: 'Fullscreen', default: true, depend: 'controls'},
                    modestbranding: {default: true, name: 'Logo', depend: 'controls'},
                },
                parseUrl: (url, options)=>{
                    const m = url.match(/^(?:(?:https?:)?\/\/)?(?:www\.)?(?:youtu\.be\/|youtube(-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((?:\w|-){11})(?:\S+)?$/);
                    return m && (m[2].length === 11) && ('//www.youtube' + (m[1] || '') + '.com/embed/' + m[2]);
                },
            },
            dailymotion: {
                features: {
                    autoplay: {},
                    'mute': {},
                    'ui-start-screen-info': {name: 'Start infos', default: true},
                    'queue-autoplay-next': {name: 'Queue next', default: true},
                    controls: {default: true},
                    'ui-logo': {name: 'Logo', default: true, depend: 'controls'},
                    'sharing-enable': {name: 'Sharing', default: true, depend: 'controls'},
                },
                parseUrl: (url, options)=>{
                    const m = url.match(/.+dailymotion.com\/(video|hub|embed)\/([^_]+)[^#]*(#video=([^_&]+))?/);
                    return m && m[2].length && ('//www.dailymotion.com/embed/video/' + m[2].replace('video/', ''));
                },
            },
            vimeo: {
                features: {
                    autoplay: {},
                    loop: {},
                },
                parseUrl: (url, options)=>{
                    const m = url.match(/\/\/(player.)?vimeo.com\/([a-z]*\/)*([0-9]{6,11})[?]?.*/);
                    return m && m[3].length && '//player.vimeo.com/video/' + m[3];
                },
            },
            instagram: {
                features: {},
                parseUrl: (url, options)=>{
                    const m = url.match(/(.*)instagram.com\/p\/(.[a-zA-Z0-9]*)/);
                    return m && m[2].length && ('//www.instagram.com/p/' + m[2] + '/embed/');
                },
            },
            vine: {
                features: {},
                parseUrl: (url, options)=>{
                    const m = url.match(/\/\/vine.co\/v\/(.[a-zA-Z0-9]*)/);
                    return m && m[0] && (m[0] + '/embed/simple');
                },
            },
            youku: {
                features: {},
                parseUrl: (url, options)=>{
                    const m = url.match(/(.*).youku\.com\/(v_show\/id_|embed\/)(.+)/);
                    if (m && m[3].length) {
                        const index = m[3].indexOf('.html?');
                        const id = index >= 0 ? m[3].substring(0, index) : m[3];
                        return '//player.youku.com/embed/' + id;
                    } else {
                        return false;
                    }
                },
            },
        };

    }

    /**
     * @override
     */
    start () {
        var title = this.options.translate('VideoUrl', 'Video');
        this.dependencies.Media.addPanel('video', title, this._renderMediaTab.bind(this), this._onSaveMedia.bind(this), 40);
        return super.start();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    getArchNode (archNode) {
        return archNode.ancestor('isVideo');
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Render the whole widget and add event on the textarea.
     *
     * @private
     * @param {ArchNode} mediaArchNode
     */
    _renderMediaTab (mediaArchNode) {
        this._fragment = this._renderTemplate('we3.modal.media.video');
        this._formControl = this._fragment.querySelector('.form-control');
        this._optionsContainer = this._fragment.querySelector('.o_video_dialog_options');
        this._videoContainer = this._fragment.querySelector('.media_iframe_video');
        this._formControl.addEventListener('keyup', this._updateVideoPreview.bind(this));
        return {
            active: mediaArchNode && mediaArchNode.isVideo && mediaArchNode.isVideo(),
            content: this._fragment,
        };
    }

    /**
     * Update the video options and preview.
     *
     * @private
     */
    _updateVideoPreview () {
        const code = this._formControl.value;
        const extractedUrl = this._extractEmbeded(code) || code;
        this.currentProvider = Object.values(this._providers)
                               .find((provider) => this.currentUrl = provider.parseUrl(extractedUrl));
        this._renderOptionElements(this.currentProvider);
        this._renderVideo();
    }

    /***
     * Extract an url from an embeded code.
     *
     * @param {string} code The code that might contain an url through src="<url>" or href="<url>"
     * @return {String|undefined} The extracted url if it found one. Otherwise return undefined.
     */
    _extractEmbeded (code) {
        var embedMatch = code.match(/(src|href)=["']?([^"']+)?/);
        if (embedMatch) {
            if (embedMatch[2].length > 0 && embedMatch[2].indexOf('instagram')) {
                return embedMatch[2]; // Instagram embed code is different
            } else {
                return embedMatch[1];
            }
        }
    }

    /***
     * Render the video preview.
     *
     */
    _renderVideo () {
        if (this.currentProvider) {
            const iframe = this._videoContainer.querySelector('iframe');
            if (iframe) {
                iframe.outerHTML = '';
            }
            this.videoElement = this._getVideo(this.currentProvider);
            this._videoContainer.appendChild(this.videoElement);
        }
    }

    /**
     * Create a video element from an url.
     * @param {string} url
     * @param {Object} options
     * @returns {Element} the constructed video element
     */
    _getVideo (provider, url, options) {
        const videoElement = document.createElement('iframe');
        videoElement.setAttribute('width', 1280);
        videoElement.setAttribute('height', 720);
        videoElement.setAttribute('frameborder', 0);
        videoElement.setAttribute('class', 'o_video_dialog_iframe');
        const optionsList = Object.keys(provider.features).map(featureKey => {
            return featureKey + '=' + (this.featuresSelected.has(featureKey) ? '1' : '0');
        });
        videoElement.setAttribute('src', this.currentUrl + '?' + optionsList.join('&'));
        return videoElement;
    }

    /***
     * Render the options of the video depending on the specified provider.
     *
     * @param {Object} rovider The provider object.
     */
    _renderOptionElements (provider) {
        this._optionsContainer.innerHTML = "";
        if (!provider) {
            return;
        }

        const inputElements = {};
        const depends = {};
        Object.keys(provider.features).forEach((featureKey)=>{
            const feature = provider.features[featureKey];
            const groupElement = this._getOptionElement(feature, featureKey);
            const inputElement = groupElement.querySelector('input');
            inputElements[featureKey] = inputElement;

            if (feature.depend) {
                if (!depends[feature.depend]) {
                    depends[feature.depend] = [groupElement];
                } else {
                    depends[feature.depend].push(groupElement);
                }
            }

            inputElement.addEventListener('click', (ev)=>{
                this._toggleFeature(featureKey, depends);
            });
            this._optionsContainer.appendChild(groupElement);
        });
    }

    /**
     * Get an option element that is rendered depending if it is selected or not.
     *
     * @param {Object} feature The feature object.
     * @param {String} featureKey The key.
     * @returns {HTMLElement} The option element.
     */
    _getOptionElement (feature, featureKey) {
        const groupElement = document.createElement('we3-group');
        const labelElement = document.createElement('label');
        labelElement.setAttribute('class', 'o_switch mb0');
        groupElement.appendChild(labelElement);
        const inputElement = document.createElement('input');
        if (feature.default === true) {
            inputElement.setAttribute('checked', true);
            this.featuresSelected.add(featureKey);
        } else {
            this.featuresSelected.delete(featureKey);
        }
        inputElement.setAttribute('type', 'checkbox');
        const featureName = feature.name || featureKey.charAt(0).toUpperCase() + featureKey.slice(1);
        const textElement = document.createTextNode(featureName);
        labelElement.appendChild(inputElement);
        labelElement.appendChild(document.createElement('span'));
        labelElement.appendChild(textElement);
        return groupElement;
    }

    /**
     * Toggle a feature with "key", while considering it's dependency.
     *
     * @param {String} featureKey The key feature to toggle.
     * @param {Object} depends An object where the key is the dependent feature name and the value,
     *                         the HTMLElement associated.
     */
    _toggleFeature (featureKey, depends) {
        if (this.featuresSelected.has(featureKey)) {
            this.featuresSelected.delete(featureKey);
            (depends[featureKey] || []).forEach((element)=>{
                element.style.display = 'none';
            });
        } else {
            this.featuresSelected.add(featureKey);
            (depends[featureKey] || []).forEach((element)=>{
                element.style.display = 'block';
            });
        }
        this._renderVideo();
    }

    //--------------------------------------------------------------------------
    // Handle
    //--------------------------------------------------------------------------

    _onSaveMedia (panel) {
        return new Promise(resolve => {
            resolve(this._videoContainer.outerHTML);
        });
    }
}

we3.addPlugin('Video', VideoPlugin);

})();
