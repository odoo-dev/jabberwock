(function () {
'use strict';

we3.utils.regex.Jinja = {
    jinjaExp: /(^|\n)\s*%\s?(end|endif|else|if|set)/,
    jinjaLineExp: /^\n?\s*((%\s?(end|endif|else|(if|set) [^\n]+)?)|(\{%.*%\})|(\$\{[^}]+\}\s*%?))\s*\n?$/,
};

})();

