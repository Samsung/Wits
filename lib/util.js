
let fs = require('fs');
let path = require('path');

const REG_EXP = require('./regexp.js');

module.exports = {
    isIpAddress: (ip) => {
        return REG_EXP.IP_ADDRESS.test(ip);
    },
    isRemoteUrl: (url) => {
        return REG_EXP.REMOTE_URI.test(url);
    },
    getAbsolutePath: (inputPath) => {
        return path.join(__dirname, '../' ,inputPath).replace(REG_EXP.BACKSLASH, '/');
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
        return data.replace(REG_EXP.COMMENT,'');
    }
}