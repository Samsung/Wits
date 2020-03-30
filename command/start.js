const path = require('path');

const util = require('../lib/util.js');
const userInfoHelper = require('../lib/userInfoHelper.js');
const hostAppHelper = require('../lib/hostAppHelper.js');
const appLaunchHelper = require('../lib/appLaunchHelper.js');
const watchHelper = require('../lib/watchHelper.js');

const CONTAINER_DIRECTORY_NAME = 'container';
const CONTAINER_DIRECTORY_PATH = path.join(
    util.WITS_BASE_PATH,
    '../',
    CONTAINER_DIRECTORY_NAME
);

module.exports = {
    run: async () => {
        console.log(`Start running Wits............`);

        checkConfiguration();

        let userAnswer = await userInfoHelper.getUserAnswer();
        let deviceInfo = await userInfoHelper.getDeviceInfo(
            userAnswer.deviceIp
        );
        let profileInfo = {
            name: userAnswer.profileName,
            path: userAnswer.profilePath
        };

        await hostAppHelper.setHostAppEnv(userAnswer, deviceInfo);
        hostAppHelper.buildPackage(profileInfo);

        let hostAppId = hostAppHelper.getHostAppId(userAnswer.baseAppPath);
        let hostAppName = hostAppId.split('.')[1];
        let deviceName = deviceInfo.deviceName;

        appLaunchHelper.unInstallPackage(deviceName, hostAppName);
        appLaunchHelper.installPackage(deviceInfo, hostAppName);
        watchHelper.openSocketServer(userAnswer, deviceInfo);
        userAnswer.isDebugMode
            ? appLaunchHelper.launchDebugMode(
                  deviceName,
                  hostAppId,
                  userAnswer.deviceIp
              )
            : appLaunchHelper.launchApp(deviceName, hostAppId);
    }
};

function checkConfiguration() {
    if (!util.isFileExist(CONTAINER_DIRECTORY_PATH)) {
        console.error(
            `Wits configuration is failed. "wits -i" is required before running "wits -s"`
        );
        process.exit(0);
    }
}
