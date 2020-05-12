const userInfoHelper = require('../lib/userInfoHelper.js');
const hostAppHelper = require('../lib/hostAppHelper.js');
const appLaunchHelper = require('../lib/appLaunchHelper.js');
const watchHelper = require('../lib/watchHelper.js');

module.exports = {
    run: async () => {
        console.log(`Start running Wits watch mode............`);
        let data = await userInfoHelper.getLatestWitsconfigInfo()
            .connectionInfo;
        let baseAppPath = userInfoHelper.getBaseAppPath(
            data.baseAppPath
        );

        let deviceInfo = await userInfoHelper.getDeviceInfo(data.deviceIp);

        let hostAppId = hostAppHelper.getHostAppId(baseAppPath);
        let deviceName = deviceInfo.deviceName;
        data.baseAppPath = baseAppPath;

        watchHelper.openSocketServer(data, deviceInfo);
        appLaunchHelper.terminateApp(deviceName, hostAppId);
        data.isDebugMode
            ? appLaunchHelper.launchDebugMode(
                  deviceName,
                  hostAppId,
                  data.deviceIp
              )
            : appLaunchHelper.launchApp(deviceName, hostAppId);
    }
};
