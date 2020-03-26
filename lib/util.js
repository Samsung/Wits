const fs = require('fs');
const path = require('path');

const regExp = require('./regexp.js');

module.exports = {
    isIpAddress: ip => {
        return regExp.IP_ADDRESS.test(ip);
    },
    isRemoteUrl: url => {
        return regExp.REMOTE_URI.test(url);
    },
    getAbsolutePath: inputPath => {
        return path
            .join(__dirname, '../', inputPath)
            .replace(regExp.BACKSLASH, '/');
    },
    getProfileInfo: () => {
        try {
            let info = JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, '../profileInfo.json'),
                    'utf8'
                )
            );
            return {
                name: info.name,
                path: info.path
            };
        } catch (e) {
            console.log('Failed to getProfileInfo');
            process.exit(0);
        }
    },
    clearComment: data => {
        return data.replace(regExp.COMMENT, '');
    },
    getSocketPort: () => {
        const REMIND_SOCKET_PORT_LEN = 3;
        const MAX_DIGIT = 9;
        let port = Math.floor(Math.random() * MAX_DIGIT) + 1 + '';
        for (let i = 0; i < REMIND_SOCKET_PORT_LEN; i++) {
            port += Math.floor(Math.random() * MAX_DIGIT) + '';
        }
        return Number(port);
    }
};
