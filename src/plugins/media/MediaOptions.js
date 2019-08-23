we3.options.Media = {
    mimetypes: {
        image: {
            mimetype: /^image|(png$)/,
            ext: /gif|jpe|jpg|png/,
        },
        audio: {
            mimetype: /^audio/,
        },
        binary: {
            mimetype: /octet-stream|download|python/,
            ext: /py/,
        },
        video: {
            mimetype: /^video/,
            ext: /avi|mp4/,
        },
        archive: {
            mimetype: /(zip|package)|(archive$)|(tar$)|(compressed$)/,
            ext: /zip|tar|rar/,
        },
        pdf: {
            mimetype: /pdf$/,
            ext: /pdf/,
        },
        document: {
            mimetype: /(^text-master)|document|msword|wordprocessing/,
            ext: /docx?|odt|ott|uot|fodt/,
        },
        web_code: {
            mimetype: /xml|html/,
            ext: /xml|htm|html|xhtml/,
        },
        web_style: {
            mimetype: /(less|css)$/,
            ext: /less|css/,
        },
        text: {
            mimetype: /(^text)|(rtf$)/,
            ext: /rtf|txt/,
        },
        disk: {
            mimetype: /-image|diskimage/,
            ext: /dmg/,
        },
        spreadsheet: {
            mimetype: /csv|vc|excel|mods|spreadsheet|(numbers$)|(calc$)/,
            ext: /csv|xlsx?|ots|ods|uos|fods/,
        },
        certificate: {
            mimetype: /(^key)|cert|rules|pkcs|(stl$)|(crl$)/,
        },
        presentation: {
            mimetype: /presentation|keynote|teacher|slideshow|powerpoint/,
            ext: /pptx?|ppsx|potm|pptm|otp|odp|uop|fodp/,
        },
        font: {
            mimetype: /-font|font-/,
            ext: /ttf/,
        },
        print: {
            mimetype: /-dvi/,
        },
        script: {
            mimetype: /script|x-sh|(bat$)|(cgi$)|(-c$)|java|ruby/,
            ext: /bat/,
        },
        javascript: {
            mimetype: /javascript/,
            ext: /js/,
        },
        calendar: {
            mimetype: /calendar|(ldif$)/,
            ext: /ical|ics|ifb|icalendar/,
        },
        vector: {
            mimetype: /svg|((postscript|cdr|xara|cgm|graphics|draw)$)/,
            ext: /svg/,
        },
    },
};