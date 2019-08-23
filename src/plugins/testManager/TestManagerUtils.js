(function () {
'use strict';

const regex = we3.utils.regex.TestManagerPlugin = {};

const rangeCollapsed = regex.rangeCollapsed = '\u25C6'; // ◆
const rangeStart = regex.rangeStart = '\u25B6'; // ▶
const rangeEnd = regex.rangeEnd = '\u25C0'; // ◀
const other = regex.other = '[^' + regex.rangeStart + '' + regex.rangeEnd + ']*';

regex.range = new RegExp('(' + rangeStart + '|' + rangeEnd + '|' + rangeCollapsed + ')', 'g');
regex.rangeToCollapsed = new RegExp(rangeStart + rangeEnd, 'g');
regex.rangeCollapsed = new RegExp('^(' + other + ')(' + rangeCollapsed + ')(' + other + ')$');
regex.space = /\u00A0/g;
regex.invisible = /\uFEFF/g;

})();

