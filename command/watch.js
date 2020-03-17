const userInfoHelper = require('../lib/userInfoHelper.js');
const hostAppHelper = require('../lib/hostAppHelper.js');
const appLaunchHelper = require('../lib/appLaunchHelper.js');
const watchHelper = require('../lib/watchHelper.js');

module.exports = {
    run: async () => {
        console.log(`Start running Wits watch mode............`);
        let data = await userInfoHelper.getLatestWitsconfigInfo();
        let deviceIpAddress = data.deviceIpAddress;
        let baseAppPath = data.baseAppPath;
        let isDebugMode = data.isDebugMode;
        let socketPort = data.socketPort;

        let deviceInfo = await userInfoHelper.getDeviceInfo(deviceIpAddress);

        let hostAppId = hostAppHelper.getHostAppId();
        let deviceName = deviceInfo.deviceName;

        watchHelper.openSocketServer(baseAppPath, deviceInfo, socketPort);
        appLaunchHelper.terminateApp(deviceName, hostAppId);
        isDebugMode
            ? appLaunchHelper.launchDebugMode(
                  deviceName,
                  hostAppId,
                  deviceIpAddress
              )
            : appLaunchHelper.launchApp(deviceName, hostAppId);
    }
};
