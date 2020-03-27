const userInfoHelper = require('../lib/userInfoHelper.js');
const hostAppHelper = require('../lib/hostAppHelper.js');
const appLaunchHelper = require('../lib/appLaunchHelper.js');
const watchHelper = require('../lib/watchHelper.js');

module.exports = {
    run: async () => {
        console.log(`Start running Wits watch mode............`);
        let data = await userInfoHelper.getLatestWitsconfigInfo()
            .connectionInfo;
        let deviceIpAddress = data.ip;
        let baseAppPath = userInfoHelper.getBaseAppPath(
            data.recentlyBaseAppPath
        );
        let isDebugMode = data.isDebugMode;

        let deviceInfo = await userInfoHelper.getDeviceInfo(deviceIpAddress);

        let hostAppId = hostAppHelper.getHostAppId(baseAppPath);
        let deviceName = deviceInfo.deviceName;
        data.baseAppPath = baseAppPath;
        data.socketPort = data.port;

        watchHelper.openSocketServer(data, deviceInfo);
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
