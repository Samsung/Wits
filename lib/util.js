const os = require('os');
const fs = require('fs');
const path = require('path');
const ip = require('ip');
const mkdirp = require('mkdirp');
const tools = require('@tizentv/tools');
const chalk = require('chalk');

const regExp = require('./regexp.js');
const { logger } = require('./logger');

const platform = os.platform();
const CURRENT_PROJECT_PATH = process.cwd();

module.exports = {
  WITS_BASE_PATH: __dirname,
  CURRENT_PROJECT_PATH: CURRENT_PROJECT_PATH,
  PROXY: '',
  RESOURCE_PATH: (() => {
    if (platform === 'win32') {
      return path.resolve(__dirname, '../', 'resource');
    } else {
      return path.resolve(os.homedir(), '.wits', 'resource');
    }
  })(),
  TOOLS_SDB_PATH: '',
  PLATFORM: platform,
  ISVERVOSE: false,
  initTools: async () => {
    module.exports.TOOLS_SDB_PATH = await tools.getSdbPath();
  },
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
        logger.error(
          chalk.red(`Failed to createEmptyFile ${filepath} ${error}`)
        );
        process.exit(0);
      }
    }
  },

  createEmptyDirectory: dirname => {
    try {
      mkdirp.sync(dirname);
    } catch (error) {
      logger.error(
        chalk.red(`Failed to createEmptyDirectory ${dirname} ${error}`)
      );
    }
  },

  removeFile: filepath => {
    if (fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
      } catch (e) {
        logger.error(chalk.red(`Failed to removeFile ${filepath} ${e}`));
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
      logger.error(chalk.red(`Failed to moveFile: ${e}`));
      throw e;
    }
  },

  copyFile: (src, dest) => {
    try {
      if (module.exports.isFileExist(src)) {
        fs.createReadStream(src).pipe(fs.createWriteStream(dest));
      }
    } catch (e) {
      logger.error(chalk.red(`Failed to copyFile: ${e}`));
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

  displayOutput: logs => {
    if (module.exports.ISVERVOSE === true) {
      logger.log(logs);
    }
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
    logger.log(' _      ____________  ');
    logger.log('| | /| / /  _/_  __/__');
    logger.log('| |/ |/ // /  / / (_-<');
    logger.log('|__/|__/___/ /_/ /___/\n');
  },

  chmodAll(path) {
    try {
      fs.accessSync(path, fs.constants.S_IXUSR);
    } catch (e) {
      fs.chmodSync(path, fs.constants.S_IRWXU | fs.constants.S_IRWXG);
    }
  },

  exit: () => {
    process.exit(0);
  },

  parseDeviceIp: option => {
    if (typeof option !== 'string') {
      return null;
    }
    const deviceIp = option.split('deviceIp=')[1];
    if (module.exports.isIpAddress(deviceIp)) {
      return deviceIp;
    }
    return null;
  }
};

function isIpv4Address(eth) {
  if (eth.family === 'IPv4' && eth.address !== '127.0.0.1' && !eth.internal) {
    return true;
  } else {
    return false;
  }
}
