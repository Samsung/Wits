const certificationHelper = require('../lib/certificationHelper.js');
const common = require('@tizentv/webide-common-tizentv');
const chalk = require('chalk');
const util = require('../lib/util');
const path = require('path');

module.exports = {
    run: async () => {
        console.log(`Generate a certification............`);

        const resourceDir = path.resolve(__dirname, '../', 'resource');

        try {
            const certInfo = await certificationHelper.askQuestion();
            util.createEmptyDirectory(resourceDir);
            util.RESOURCE_PATH = resourceDir;

            const tizenCM = new common.TizenCM(resourceDir);
            await tizenCM.init();
            const authorInfo = {
                keyFileName: certInfo.keyFileName,
                authorName: certInfo.authorName,
                authorPassword: certInfo.authorPassword,
                countryInfo: '',
                stateInfo: '',
                cityInfo: '',
                organizationInfo: '',
                departmentInfo: '',
                emailInfo: ''
            };
            tizenCM.createCert(authorInfo);
            console.log(
                chalk.blueBright(
                    '[Certification] Completed to generate a Tizen certification'
                )
            );

            const profileManager = new common.ProfileManager(resourceDir);
            const profileName = certInfo.authorName;
            const authorProfile = {
                authorCA: tizenCM.getTizenDeveloperCA(),
                authorCertPath: path.resolve(
                    resourceDir,
                    'Author',
                    `${certInfo.keyFileName}.p12`
                ),
                authorPassword: certInfo.authorPassword
            };
            const distributorProfile = tizenCM.getTizenDistributorProfile(
                certInfo.privilegeLevel
            );

            profileManager.registerProfile(
                profileName,
                authorProfile,
                distributorProfile
            );
            console.log(
                chalk.blueBright(
                    '[Certification] Completed to register a profile'
                )
            );

            profileManager.setActivateProfile(profileName);
        } catch (e) {
            console.error(chalk.red(`[Certification] Failed to run: ${e}`));
        }
    }
};
