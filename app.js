const util = require('./lib/util.js');
const userInfo = require('./lib/userInfoHelper.js');
const deviceConnectHelper = require('./lib/deviceConnectHelper.js');
const hostAppHelper = require('./lib/hostAppHelper.js');
const appLaunchHelper = require('./lib/appLaunchHelper.js');
const watchHelper = require('./lib/watchHelper.js');

process.on('SIGINT', () => {
    console.log(`Exit Wits............`);
    watchHelper.closeSocketServer();
    process.exit(0);
});

(async function startWits() {
    console.log(`Start Wits............`);
    let profileInfo = util.getProfileInfo();
    let userAnswer = await userInfo.getUserAnswer();
    let deviceIpAddress = userAnswer.deviceIpAddress;
    let baseAppPath = userAnswer.baseAppPath;
    let isDebugMode = userAnswer.isDebugMode;
    let socketPort = userAnswer.socketPort;
    let deviceInfo = await deviceConnectHelper.getConnectedDeviceInfo(
        deviceIpAddress
    );

    await hostAppHelper.setHostAppEnv(userAnswer, deviceInfo);

    hostAppHelper.buildPackage(profileInfo);

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
})();
