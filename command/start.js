const util = require('../lib/util.js');
const userInfoHelper = require('../lib/userInfoHelper.js');
const hostAppHelper = require('../lib/hostAppHelper.js');
const appLaunchHelper = require('../lib/appLaunchHelper.js');
const watchHelper = require('../lib/watchHelper.js');

module.exports = {
    run: async () => {
        console.log(`Start running Wits............`);

        await module.exports.prepareRun();

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
                    util.exit();
                }
            })
            .catch(e => {
                console.error(`Failed to buildPackage: ${e}`);
                util.exit();
            });
    },
    prepareRun: async () => {
        try {
            await util.initTools();
            return;
        } catch (e) {
            console.log(`Failed to prepareRun : ${e}`);
        }
    }
};
