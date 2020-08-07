const os = require('os');
const fs = require('fs');
const path = require('path');
const ip = require('ip');
const platform = os.platform();

const regExp = require('./regexp.js');

const CURRENT_PROJECT_PATH = process.cwd();
const CRYPT_TOOL_NAME =
    platform === 'win32'
        ? 'wincrypt.exe'
        : platform === 'linux'
        ? 'secret-tool'
        : 'security';
const SDB_TOOL_NAME =
    platform === 'win32'
        ? 'win/sdb.exe'
        : platform === 'linux'
        ? 'linux/sdb'
        : 'mac/sdb';

module.exports = {
    WITS_BASE_PATH: __dirname,
    CURRENT_PROJECT_PATH: CURRENT_PROJECT_PATH,
    PROXY: '',
    TOOLS_CRYPT_PATH: path.resolve(
        __dirname,
        '../',
        'node_modules',
        '@tizentv',
        'webide-common-tizentv',
        'tools',
        'certificate-encryptor',
        `${CRYPT_TOOL_NAME}`
    ),
    TOOLS_SDB_PATH: path.resolve(
        __dirname,
        '../',
        'node_modules',
        '@tizentv',
        'webide-common-tizentv',
        'tools',
        'sdb',
        `${SDB_TOOL_NAME}`
    ),
    PLATFORM: platform,
    isIpAddress: ip => {
        return regExp.IP_ADDRESS.test(ip);
    },

    isRemoteUrl: url => {
        return regExp.REMOTE_URI.test(url);
    },

    isProxy: address => {
        return regExp.PROXY.test(address);
    },

    getAbsolutePath: inputPath => {
        return path
            .join(CURRENT_PROJECT_PATH, inputPath)
            .replace(regExp.BACKSLASH, '/');
    },

    createEmptyFile: (filepath, content) => {
        if (content === undefined) {
            content = '';
        }
        try {
            fs.accessSync(path.join(filepath));
        } catch (e) {
            try {
                fs.writeFileSync(path.join(filepath), content, 'utf8');
                fs.chmodSync(path.join(filepath), '0775');
            } catch (error) {
                console.error(`Failed to createEmptyFile ${filepath} ${error}`);
                util.exit();
            }
        }
    },

    removeFile: filepath => {
        if (fs.existsSync(filepath)) {
            try {
                fs.unlinkSync(filepath);
            } catch (e) {
                console.error(`Failed to removeFile ${filepath} ${e}`);
                throw e;
            }
        }
    },

    moveFile: (src, dest) => {
        try {
            if (module.exports.isFileExist(src)) {
                module.exports.copyFile(src, dest);
                module.exports.removeFile(src);
            }
        } catch (e) {
            console.error(`Failed to moveFile: ${e}`);
            throw e;
        }
    },

    copyFile: (src, dest) => {
        try {
            if (module.exports.isFileExist(src)) {
                fs.createReadStream(src).pipe(fs.createWriteStream(dest));
            }
        } catch (e) {
            console.error(`Failed to copyFile: ${e}`);
            throw e;
        }
    },

    setCurrentAppPath: path => {
        if (path !== '.') {
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
        const networkInterfaces = os.networkInterfaces();
        const ipAddresses = [];

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
    },

    displayBanner() {
        console.log(' _      ____________  ');
        console.log('| | /| / /  _/_  __/__');
        console.log('| |/ |/ // /  / / (_-<');
        console.log('|__/|__/___/ /_/ /___/\n');
    },

    exit: () => {
        process.exit(0);
    }
};

function isIpv4Address(eth) {
    if (eth.family === 'IPv4' && eth.address !== '127.0.0.1' && !eth.internal) {
        return true;
    } else {
        return false;
    }
}
