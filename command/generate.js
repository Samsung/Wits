const certificationHelper = require('../lib/certificationHelper.js');
const common = require('@tizentv/webide-common-tizentv');
const chalk = require('chalk');
const util = require('../lib/util');
const path = require('path');

module.exports = {
    run: async () => {
        console.log(chalk.cyanBright('Generate a certification............'));

        const resourceDir = path.resolve(__dirname, '../', 'resource');

        try {
            const certInfo = await certificationHelper.getAnswers();
            util.createEmptyDirectory(resourceDir);
            util.RESOURCE_PATH = resourceDir;

            const tizenCM = new common.TizenCM(resourceDir);
            await tizenCM.init();
            const authorInfo = {
                keyFileName: certInfo.keyFileName,
                authorName: certInfo.authorName,
                authorPassword: certInfo.authorPassword,
                countryInfo: certInfo.countryInfo ? certInfo.countryInfo : '',
                stateInfo: certInfo.stateInfo ? certInfo.stateInfo : '',
                cityInfo: certInfo.cityInfo ? certInfo.cityInfo : '',
                organizationInfo: certInfo.organizationInfo
                    ? certInfo.organizationInfo
                    : '',
                departmentInfo: certInfo.departmentInfo
                    ? certInfo.departmentInfo
                    : '',
                emailInfo: certInfo.emailInfo ? certInfo.emailInfo : ''
            };
            tizenCM.createCert(authorInfo);
            console.log(
                chalk.cyanBright(
                    '[Certification] Completed to generate a Tizen certification'
                )
            );

            const profileManager = new common.ProfileManager(resourceDir);
            const profileName = certInfo.profileName;
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

            await profileManager.registerProfile(
                profileName,
                authorProfile,
                distributorProfile
            );
            console.log(
                chalk.cyanBright(
                    '[Certification] Completed to register a profile'
                )
            );

            profileManager.setActivateProfile(profileName);
        } catch (e) {
            console.error(chalk.red(`[Certification] Failed to run: ${e}`));
        }
    }
};
