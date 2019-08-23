(function () {
'use strict';

//--------------------------------------------------------------------------
// Handle (hover image)
//--------------------------------------------------------------------------

// Make sure not to forget https://github.com/odoo/odoo/pull/31226 !!!
// var HandlePlugin = Plugins.handle.extend({
//     /**
//      * Update the handle.
//      *
//      * @param {Node} target
//      * @returns {Boolean}
//      */
//     update (target) {
//         if (this.context.isDisabled()) {
//             return false;
//         }
//         var isImage = this.utils.isImg(target);
//         var $selection = this.$handle.find('.note-control-selection');
//         this.context.invoke('imagePopover.update', target);
//         if (!isImage) {
//             return isImage;
//         }

//         var $target = $(target);
//         var pos = $target.offset();
//         var posContainer = $selection.closest('.note-handle').offset();

//         // exclude margin
//         var imageSize = {
//             w: $target.outerWidth(false),
//             h: $target.outerHeight(false)
//         };
//         $selection.css({
//             display: 'block',
//             left: pos.left - posContainer.left,
//             top: pos.top - posContainer.top,
//             width: imageSize.w,
//             height: imageSize.h,
//         }).data('target', $target); // save current target element.

//         var src = $target.attr('src');
//         var sizingText = imageSize.w + 'x' + imageSize.h;
//         if (src) {
//             var origImageObj = new Image();
//             origImageObj.src = src;
//             sizingText += ' (' + this.lang.image.original + ': ' + origImageObj.width + 'x' + origImageObj.height + ')';
//         }
//         $selection.find('.note-control-selection-info').text(sizingText);

//         return isImage;
//     },
// });

// we3.addPlugin('Handle', HandlePlugin);

})();