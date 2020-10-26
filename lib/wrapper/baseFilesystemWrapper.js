var fsWrappingAPIList = [
    'openFile',
    'createDirectory',
    'deleteFile',
    'deleteDirectory',
    'copyFile',
    'copyDirectory',
    'moveFile',
    'moveDirectory',
    'rename',
    'listDirectory',
    'toURI',
    'isFile',
    'isDirectory',
    'pathExists',
    'resolve'
];
(function () {
    makeFsWrapper();
})();

function makeFsWrapper() {
    var originalTizenFs = {};
    fsWrappingAPIList.forEach(function (apiName) {
        originalTizenFs[apiName] = deepClone(tizen.filesystem[apiName]);
        tizen.filesystem[apiName] = function () {
            if (typeof arguments[0] === 'string') {
                arguments[0] = arguments[0].replace(
                    'wgt-package',
                    '{{CONTENT_PATH}}'
                );
            }
            return originalTizenFs[apiName].apply(this, arguments);
        };
    });
}

function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    var result = Array.isArray(obj) ? [] : {};

    for (var key of Object.keys(obj)) {
        result[key] = deepClone(obj[key]);
    }

    return result;
}
