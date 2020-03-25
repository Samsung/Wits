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
process.on('SIGINT', () => {
    console.log(`Exit Wits............`);
    watchHelper.closeSocketServer();
    process.exit(0);
});

module.exports = {
    run: async () => {
        console.log(`Start running Wits............`);

        if (!util.isFileExist(CONTAINER_DIRECTORY_PATH)) {
            console.error(
                'Wits configuration is failed. "wits -i" is required before running "wits -s"'
            );
            process.exit(0);
        }
        let data = await userInfoHelper.getWitsSettingInfo();
        let deviceIpAddress = data.userAnswer.deviceIpAddress;
        let baseAppPath = data.userAnswer.baseAppPath;
        let isDebugMode = data.userAnswer.isDebugMode;
        let socketPort = data.userAnswer.socketPort;

        let profileInfo = {
            name: data.userAnswer.profileName,
            path: data.userAnswer.profilePath
        };

        let deviceInfo = await userInfoHelper.getDeviceInfo(deviceIpAddress);

        await hostAppHelper.setHostAppEnv(data.userAnswer, deviceInfo);
        hostAppHelper.buildPackage(profileInfo);

        let hostAppId = hostAppHelper.getHostAppId(baseAppPath);
        let hostAppName = hostAppId.split('.')[1];
        let deviceName = deviceInfo.deviceName;

        appLaunchHelper.unInstallPackage(deviceName, hostAppName);
        appLaunchHelper.installPackage(deviceInfo, hostAppName);
        watchHelper.openSocketServer(baseAppPath, deviceInfo, socketPort);
        isDebugMode
            ? appLaunchHelper.launchDebugMode(
                  deviceName,
                  hostAppId,
                  deviceIpAddress
              )
            : appLaunchHelper.launchApp(deviceName, hostAppId);
    }
};
