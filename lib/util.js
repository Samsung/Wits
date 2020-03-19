const fs = require('fs');
const path = require('path');

const regExp = require('./regexp.js');
const CURRENT_PROJECT_PATH = process.cwd();

module.exports = {
    WITS_BASE_PATH: __dirname,
    CURRENT_PROJECT_PATH: CURRENT_PROJECT_PATH,
    isIpAddress: ip => {
        return regExp.IP_ADDRESS.test(ip);
    },
    isRemoteUrl: url => {
        return regExp.REMOTE_URI.test(url);
    },
    getAbsolutePath: inputPath => {
        return path
            .join(CURRENT_PROJECT_PATH, inputPath)
            .replace(regExp.BACKSLASH, '/');
    },
    createEmptyFile: (filepath, name) => {
        try {
            fs.accessSync(path.join(filepath, name));
        } catch (e) {
            try {
                fs.writeFileSync(path.join(filepath, name), '', 'utf8');
            } catch (error) {
                console.log(`Failed to createEmptyFile ${name} ${error}`);
                process.exit(0);
            }
        }
    },

    isFileExist: filePath => {
        try {
            fs.accessSync(filePath);
            return true;
        } catch (e) {
            return false;
        }
    },

    isPropertyExist: (data, propertyName) => {
        if (
            data !== null &&
            typeof data === 'object' &&
            data.hasOwnProperty(propertyName)
        ) {
            return true;
        }
        return false;
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
