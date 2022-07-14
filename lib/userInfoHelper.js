const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const os = require('os');
const path = require('path');
const _ = require('lodash');

const util = require('./util.js');
const deviceConnectHelper = require('./deviceConnectHelper.js');
const regExp = require('./regexp.js');
const { logger } = require('./logger');

const EMULATOR_IP = '0.0.0.0';
const WITS_CONFIG_FILE_NAME = '.witsconfig.json';

module.exports = {
  WITS_USER_DATA: null,
  getRefinedData: () => {
    const result = {};

    const wInfo = module.exports.getLatestWitsconfigInfo();
    const cInfo = wInfo.connectionInfo;
    const pInfo = wInfo.profileInfo;

    const baseAppPath = module.exports.getBaseAppPath(cInfo.baseAppPath);

    util.setCurrentAppPath(baseAppPath);
    result.baseAppPath = baseAppPath;

    result.width = cInfo.width;
    result.deviceIp = cInfo.deviceIp;
    result.socketPort = cInfo.socketPort;
    result.hostIp = cInfo.hostIp;
    result.isDebugMode = cInfo.isDebugMode;
    result.profileName = pInfo.name;
    result.profilePath = pInfo.path;

    displayStoredInfo(result);

    return result;
  },
  askQuestion: async cInfo => {
    const result = {};
    const ask = await getUserAskData();
    const answer = await inquirer.prompt(ask);
    const baseAppPath = module.exports.getBaseAppPath(answer.baseAppPath);
    const hostIp = util.getValidHostIp(cInfo, answer);

    answer.socketPort = util.getSocketPort();
    answer.hostIp = hostIp;

    result.baseAppPath = baseAppPath;
    result.width = answer.width;
    result.deviceIp = answer.deviceIp;
    result.socketPort = answer.socketPort;
    result.hostIp = hostIp;
    result.isDebugMode = answer.isDebugMode;
    result.profileName = answer.profileName;
    result.profilePath = answer.profilePath;

    await module.exports.updateLatestUserAnswer(answer);
    return result;
  },
  getDeviceInfo: async deviceIp => {
    if ((deviceIp === null) | (deviceIp === undefined)) {
      logger.error(
        chalk.red(
          'There is no deviceIp, Please do "wits -i" for configuration.'
        )
      );
      util.exit();
    }
    return await deviceConnectHelper.getConnectedDeviceInfo(deviceIp);
  },
  getLatestWitsconfigInfo: () => {
    const result = initWitsconfigInfo();
    try {
      const wInfo = getWitsconfigData();

      const cInfo = wInfo.connectionInfo;
      const pInfo = wInfo.profileInfo;

      for (const key in cInfo) {
        result.connectionInfo[key] = cInfo[key];
      }

      for (const key in pInfo) {
        result.profileInfo[key] = pInfo[key];
      }

      if (util.isPropertyExist(wInfo, 'optionalInfo')) {
        result.optionalInfo = wInfo.optionalInfo;
      }

      return result;
    } catch (e) {
      logger.warn(`[warning] Failed to getLatestWitsconfigInfo >> ${e}`);
    }
  },
  getBaseAppPath: baseAppPath => {
    const appPath = baseAppPath ? baseAppPath : '.';
    return path.isAbsolute(appPath)
      ? appPath.replace(regExp.BACKSLASH, '/')
      : util.getAbsolutePath(appPath);
  },
  getOptionalInfo: async () => {
    const CONFIG_PATH = path.join(
      util.CURRENT_PROJECT_PATH,
      WITS_CONFIG_FILE_NAME
    );

    if (!util.isFileExist(CONFIG_PATH)) {
      return null;
    }
    const data = fs.readFileSync(CONFIG_PATH, 'utf8');
    if (data !== '' && typeof data === 'string') {
      const witsConfigData = JSON.parse(data);
      if (util.isPropertyExist(witsConfigData, 'optionalInfo')) {
        return witsConfigData.optionalInfo;
      }
    }
    return null;
  },
  updateLatestUserAnswer: async userAnswer => {
    const savingInfo = {};
    const wInfo = module.exports.getLatestWitsconfigInfo();
    const cInfo = wInfo.connectionInfo;
    const pInfo = wInfo.profileInfo;

    const latestConnectionInfo = {
      deviceIp: userAnswer.deviceIp ? userAnswer.deviceIp : cInfo.deviceIp,
      hostIp: userAnswer.hostIp ? userAnswer.hostIp : cInfo.hostIp,
      socketPort: userAnswer.socketPort
        ? userAnswer.socketPort
        : cInfo.socketPort,
      width: userAnswer.width ? userAnswer.width : cInfo.width,
      isDebugMode: userAnswer.hasOwnProperty('isDebugMode')
        ? userAnswer.isDebugMode
        : cInfo.isDebugMode
    };

    const profilePath = userAnswer.profilePath
      ? userAnswer.profilePath
      : pInfo.path;
    const latestProfileInfo = {
      path: profilePath.trim()
    };

    if (userAnswer.baseAppPath) {
      latestConnectionInfo['baseAppPath'] = userAnswer.baseAppPath;
      util.CURRENT_PROJECT_PATH = userAnswer.baseAppPath;
    }

    if (cInfo.baseAppPaths) {
      latestConnectionInfo['baseAppPaths'] = cInfo.baseAppPaths;
    }

    if (userAnswer.hostIp) {
      latestConnectionInfo.hostIp = userAnswer.hostIp;
    }

    savingInfo.connectionInfo = latestConnectionInfo;
    savingInfo.profileInfo = latestProfileInfo;

    if (util.isPropertyExist(wInfo, 'optionalInfo')) {
      savingInfo.optionalInfo = wInfo.optionalInfo;
    }

    module.exports.WITS_USER_DATA = savingInfo;

    try {
      fs.writeFileSync(
        path.join(util.CURRENT_PROJECT_PATH, WITS_CONFIG_FILE_NAME),
        JSON.stringify(savingInfo, null, 2),
        'utf8'
      );
    } catch (e) {
      logger.warn('[warning] Failed to set recently connection info');
    }
  }
};

function initWitsconfigInfo() {
  return {
    connectionInfo: {
      deviceIp: null,
      socketPort: '8498',
      width: '1920',
      isDebugMode: false
    },
    profileInfo: {
      path: getProfilePath()
    }
  };
}

function getProfilePath() {
  let profilePath = '';
  switch (util.PLATFORM) {
    case 'win32':
      profilePath = 'C:/tizen-studio-data/profile/profiles.xml';
      break;
    case 'linux':
    default:
      profilePath = path.resolve(
        os.homedir(),
        'tizen-studio-data',
        'profile',
        'profiles.xml'
      );
      break;
  }

  if (!util.isFileExist(profilePath)) {
    profilePath = path.resolve(
      path.join(util.WITS_BASE_PATH, '..', 'resource', 'profiles.xml')
    );
  }
  return profilePath;
}

function displayStoredInfo(data) {
  logger.log(``);
  logger.log(`      > [ Stored Information ]`);
  logger.log(``);
  logger.log(`      > baseAppPath  : ${data.baseAppPath}`);
  logger.log(`      > width        : ${data.width}`);
  logger.log(`      > deviceIp     : ${data.deviceIp}`);
  logger.log(`      > isDebugMode  : ${data.isDebugMode}`);
  logger.log(``);
  logger.log(`      > profile path : ${data.profilePath}`);
  logger.log(`      > hostIp       : ${data.hostIp}`);
  logger.log(``);
}

function getWitsconfigData() {
  try {
    const witsConfigInfo = JSON.parse(
      fs.readFileSync(
        path.join(util.CURRENT_PROJECT_PATH, WITS_CONFIG_FILE_NAME),
        'utf8'
      )
    );
    return witsConfigInfo;
  } catch (e) {
    logger.error(chalk.red(`Failed to getWitsconfig: ${e}`));
    util.exit();
  }
}

async function getUserAskData() {
  const wData = module.exports.getLatestWitsconfigInfo();
  const cInfo = wData.connectionInfo;
  const pInfo = wData.profileInfo;

  const baseAppPathQuestion = getBaseAppPathQuestion(cInfo);
  const hostIpQuestion = getHostIpQuestion(cInfo);

  const ask = [];
  ask.push(getDeviceIpQuestion(cInfo));
  if (hostIpQuestion !== null) {
    ask.push(hostIpQuestion);
  }
  ask.push(getWidthQuestion(cInfo));
  ask.push(getProfilePathQuestion(pInfo));
  ask.push(getIsDebugModeQuestion(cInfo));
  baseAppPathQuestion.type && ask.unshift(baseAppPathQuestion);

  return ask;
}

function getDeviceIpQuestion(cInfo) {
  return {
    type: 'input',
    name: 'deviceIp',
    message:
      'Input your Device Ip address(If using Emulator, input ' +
      EMULATOR_IP +
      ') :',
    default: cInfo.deviceIp,
    validate: function (input) {
      return util.isIpAddress(input)
        ? true
        : 'Invalid format of Ip address which is entered.';
    }
  };
}

function getWidthQuestion(cInfo) {
  return {
    type: 'input',
    name: 'width',
    message: 'Input your Application width (1920 or 1280) :',
    default: cInfo.width,
    validate: function (input) {
      return input === '1920' || input === '1280'
        ? true
        : 'Tizen web Application only support 1920 or 1280 width';
    }
  };
}

function getProfilePathQuestion(pInfo) {
  return {
    type: 'input',
    name: 'profilePath',
    message: 'Input the path of profile.xml :',
    default: pInfo.path
  };
}

function getIsDebugModeQuestion(cInfo) {
  return {
    type: 'confirm',
    name: 'isDebugMode',
    message: 'Do you want to launch with chrome DevTools? : ',
    default: cInfo.isDebugMode
  };
}

function getHostIpQuestion(cInfo) {
  let question = {};
  let recentlyIndex = 0;
  const addresses = util.getHostIpAddresses();
  if (addresses.length <= 1) {
    return null;
  }
  if (cInfo.hostIp) {
    recentlyIndex = addresses.indexOf(cInfo.hostIp);
  }
  question = {
    type: 'list',
    name: 'hostIp',
    message: 'Select your valid PC Ip address for connecting TV:',
    choices: addresses,
    default: recentlyIndex
  };
  return question;
}

function getBaseAppPathQuestion(connectionInfo) {
  let question = {};
  let baseAppPathIndex = 0;
  if (connectionInfo.baseAppPaths) {
    if (connectionInfo.baseAppPaths.length === 1) {
      question = {
        type: 'input',
        name: 'baseAppPath',
        message: 'Input your Application Path :',
        default: connectionInfo.baseAppPaths[0]
      };
    } else {
      baseAppPathIndex = connectionInfo.baseAppPaths.indexOf(
        connectionInfo.baseAppPath
      );
      question = {
        type: 'list',
        name: 'baseAppPath',
        message: 'Select the app path to launch Wits :',
        choices: connectionInfo.baseAppPaths,
        default: baseAppPathIndex >= 0 ? baseAppPathIndex : 0
      };
    }
  }
  return question;
}
