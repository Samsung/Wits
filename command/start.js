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

        if (!checkConfiguration()) {
            console.error(
                'Wits configuration is failed. "wits -i" is required before running "wits -s"'
            );
            console.error(
                'Please check the required tools are available. (ex. sdb)'
            );
            return;
        }

        const data = userInfoHelper.getRefinedData();
        const deviceInfo = await userInfoHelper.getDeviceInfo(data.deviceIp);

        await hostAppHelper.setHostAppEnv(data, deviceInfo);

        hostAppHelper
            .buildPackage()
            .then(() => {
                console.log(
                    '============================== Start to install the package'
                );

                const hostAppId = hostAppHelper.getHostAppId(data.baseAppPath);
                const hostAppName = hostAppId.split('.')[1];
                const deviceName = deviceInfo.deviceName;

                appLaunchHelper.unInstallPackage(deviceName, hostAppName);
                appLaunchHelper.installPackage(deviceInfo, hostAppName);
                watchHelper.openSocketServer(data, deviceInfo);
                try {
                    data.isDebugMode
                        ? appLaunchHelper.launchDebugMode(
                              deviceName,
                              hostAppId,
                              data.deviceIp
                          )
                        : appLaunchHelper.launchApp(deviceName, hostAppId);
                } catch (e) {
                    console.log(e);
                    util.close();
                }
            })
            .catch(e => {
                console.error(`Failed to buildPackage: ${e}`);
                util.close();
            });
    }
};

function checkConfiguration() {
    if (
        !util.isFileExist(CONTAINER_DIRECTORY_PATH) ||
        !util.isFileExist(util.TOOLS_CRYPT_PATH) ||
        !util.isFileExist(util.TOOLS_SDB_PATH)
    ) {
        return false;
    }
    return true;
}
