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

        let data = userInfoHelper.getRefinedData();
        let deviceInfo = await userInfoHelper.getDeviceInfo(data.deviceIp);
        
        await hostAppHelper.setHostAppEnv(data, deviceInfo);
        try {
            await hostAppHelper.buildPackage();
        } catch(e) {
            console.log(`Failed to buildPackage: ${e}`);
        }

        console.log('============================== Start to install the package');

        let hostAppId = hostAppHelper.getHostAppId(data.baseAppPath);
        let hostAppName = hostAppId.split('.')[1];
        let deviceName = deviceInfo.deviceName;

        console.log('@@@@@@@@@@@@@1');
        appLaunchHelper.unInstallPackage(deviceName, hostAppName);
        console.log('@@@@@@@@@@@@@2');
        appLaunchHelper.installPackage(deviceInfo, hostAppName);
        console.log('@@@@@@@@@@@@@3');
        watchHelper.openSocketServer(data, deviceInfo);
        console.log('@@@@@@@@@@@@@4');
        data.isDebugMode
            ? appLaunchHelper.launchDebugMode(
                  deviceName,
                  hostAppId,
                  data.deviceIp
              )
            : appLaunchHelper.launchApp(deviceName, hostAppId);
            console.log('@@@@@@@@@@@@@5');
    }
};

function checkConfiguration() {
    if (!util.isFileExist(CONTAINER_DIRECTORY_PATH)) {
        console.error(
            `Wits configuration is failed. "wits -i" is required before running "wits -s"`
        );
    }
}
