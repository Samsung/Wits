module.exports = {
    REMOTE_URI: new RegExp(
        /(http|ftp|https):\/\/([\w+?\.\w+])+([a-zA-Z0-9\~\!\@\#\$\%\^\&\*\(\)_\-\=\+\\\/\?\.\:\,\,]*)?/
    ),
    COMMENT: new RegExp(/<!--\s*.*?\s*-->/g),
    HOST_DATA: new RegExp(
        /({{CONTENT_PATH}})|({{HOST_IP}})|({{HOST_PORT}})|({{CONTENT_SRC}})|({{HOST_BASE_CONTENT_PATH}})/g
    ),
    HOST_WIDTH: new RegExp(/({{HOST_WIDTH}})/g),
    CONTENT_SRC: new RegExp(/(content*.*src=("|')*.*("|'))/gi),
    CONTENT_SRC_ATTRIBUTE: new RegExp(/((content*.*src=)|"|')/gi),
    APPLICATION_ID: new RegExp(/(tizen:application*.*id=("|')\w+.\w+)("|')/gi),
    APPLICATION_ID_ATTRIBUTE: new RegExp(/((tizen:application*.*id=)|"|')/gi),
    PRIVILEGE: new RegExp(/tizen:privilege/),
    DEBUG_PORT: new RegExp(/(port(.*):\s+\d+)/g),
    BACKSLASH: new RegExp(/\\/gi),
    NUMBER_ONLY: new RegExp(/^\d+(?!\w+)/g),
    IP_ADDRESS: new RegExp(
        /^(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))$/
    ),
    PROXY: new RegExp(
        /(http|https):\/\/+(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])):\d{1,5}/gi
    ),
    NUMBER_WORD: new RegExp(/\d+/),
    FIRST_BACKSLASH: new RegExp(/^(\/)/),
    FIND_CR: new RegExp(/\r/),
    FIND_ALL_CR: new RegExp(/\r/g),
    PUSHED_FILE_MESSAGE: RegExp(/(pushed)*.*(100%)/),
    CONTAIN_WHITESPACE: new RegExp(/\s+|\s/g)
};
