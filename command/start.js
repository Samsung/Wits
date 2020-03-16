const userInfoHelper = require('../lib/userInfoHelper.js');
const hostAppHelper = require('../lib/hostAppHelper.js');
const appLaunchHelper = require('../lib/appLaunchHelper.js');
const watchHelper = require('../lib/watchHelper.js');

process.on('SIGINT', () => {
    console.log(`Exit Wits............`);
    watchHelper.closeSocketServer();
    process.exit(0);
});

module.exports = {
    run: async () => {
        console.log(`Start running Wits............`);

        let data = await userInfoHelper.getWitsSettingInfo();
        let deviceIpAddress = data.userAnswer.deviceIpAddress;
        let baseAppPath = data.userAnswer.baseAppPath;
        let isDebugMode = data.userAnswer.isDebugMode;
        let socketPort = data.userAnswer.socketPort;

        let deviceInfo = await userInfoHelper.getDeviceInfo(deviceIpAddress);

        await hostAppHelper.setHostAppEnv(data.userAnswer, deviceInfo);
        hostAppHelper.buildPackage(data.profileInfo);

        let hostAppId = hostAppHelper.getHostAppId();
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
