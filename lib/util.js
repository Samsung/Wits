const os = require('os');
const fs = require('fs');
const path = require('path');
const ip = require('ip');
const platform = os.platform();

const regExp = require('./regexp.js');

const CURRENT_PROJECT_PATH = process.cwd();
const CRYPT_TOOL_NAME = platform === 'win32' ? 'wincrypt.exe' : (platform === 'linux' ? 'secret-tool' : 'security');
const SDB_TOOL_NAME = platform === 'win32' ? 'win/sdb.exe' : (platform === 'linux' ? 'linux/sdb' : 'mac/sdb');

module.exports = {
    WITS_BASE_PATH: __dirname,
    CURRENT_PROJECT_PATH: CURRENT_PROJECT_PATH,
    TOOLS_CRYPT_PATH: path.resolve(__dirname, '../', 'tools', 'certificate-encryptor', `${CRYPT_TOOL_NAME}`),
    TOOLS_SDB_PATH: path.resolve(__dirname, '../', 'tools', 'sdb', `${SDB_TOOL_NAME}`),
    PLATFORM: platform,
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
    
    removeFile: filepath => {
        if (fs.existsSync(filepath)) {
            console.log('Remove existing ' + filepath);
            try {
                fs.unlinkSync(filepath);
            } catch (error) {
                console.log(`Failed to removeFile ${filepath} ${error}`);
            }
        }
    },

    setCurrentAppPath: (path) => {
        if(path !== '.') {
            module.exports.CURRENT_PROJECT_PATH = path;
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
    },

    getValidHostIp: (cInfo, answer) => {
        let hostIp = ip.address();
        if (module.exports.isPropertyExist(cInfo, 'hostIp')) {
            hostIp = cInfo.hostIp;
        }
        if (module.exports.isPropertyExist(answer, 'hostIp')) {
            hostIp = answer.hostIp;
        }
        return hostIp;
    },

    getHostIpAddresses: () => {
        let networkInterfaces = os.networkInterfaces();
        let ipAddresses = [];

        for (var eth in networkInterfaces) {
            var interfaces = networkInterfaces[eth];
            for (var i = 0; i < interfaces.length; i++) {
                var network = interfaces[i];
                if (isIpv4Address(network)) {
                    ipAddresses.push(network.address);
                }
            }
        }
        return ipAddresses;
    }
};

function isIpv4Address(eth) {
    if (eth.family === 'IPv4' && eth.address !== '127.0.0.1' && !eth.internal) {
        return true;
    } else {
        return false;
    }
}
