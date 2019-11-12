
const fs = require('fs');
const path = require('path');

const regExp = require('./regexp.js');

module.exports = {
    isIpAddress: (ip) => {
        return regExp.IP_ADDRESS.test(ip);
    },
    isRemoteUrl: (url) => {
        return regExp.REMOTE_URI.test(url);
    },
    getAbsolutePath: (inputPath) => {
        return path.join(__dirname, '../' ,inputPath).replace(regExp.BACKSLASH, '/');
    },
    getProfileInfo: () => {
        try {
            let info = JSON.parse(fs.readFileSync(path.join(__dirname, '../profileInfo.json'),'utf8'));
            return {
                name: info.name,
                path: info.path
            };
        }
        catch(e) {
            console.log('Failed to getProfileInfo');
            process.exit(0);
        }
    },
    clearComment: (data) => {
        return data.replace(regExp.COMMENT,'');
    }
}