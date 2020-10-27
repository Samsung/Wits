const certificationHelper = require('../lib/certificationHelper.js');
const common = require('@tizentv/webide-common-tizentv');
const chalk = require('chalk');
const util = require('../lib/util');
const path = require('path');
const { logger } = require('../lib/logger');

module.exports = {
    run: async () => {
        logger.log(chalk.cyanBright('Generate a certification............\n'));

        const resourceDir = util.RESOURCE_PATH;

        try {
            const certInfo = await certificationHelper.getAnswers();
            util.createEmptyDirectory(resourceDir);
            util.RESOURCE_PATH = resourceDir;

            const tizenCertManager = new common.TizenCertManager(resourceDir);
            await tizenCertManager.init();
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
            tizenCertManager.createCert(authorInfo);
            logger.log(
                chalk.cyanBright(
                    '[Certification] Completed to generate a Tizen certification'
                )
            );

            const profileManager = new common.ProfileManager(resourceDir);
            const profileName = certInfo.profileName;
            const authorProfile = {
                authorCA: tizenCertManager.getTizenDeveloperCA(),
                authorCertPath: path.resolve(
                    resourceDir,
                    'Author',
                    `${certInfo.keyFileName}.p12`
                ),
                authorPassword: certInfo.authorPassword
            };
            const distributorProfile = tizenCertManager.getTizenDistributorProfile(
                certInfo.privilegeLevel
            );

            await profileManager.registerProfile(
                profileName,
                authorProfile,
                distributorProfile
            );
            logger.log(
                chalk.cyanBright(
                    '[Certification] Completed to register a profile'
                )
            );

            profileManager.setActivateProfile(profileName);

            logger.log(
                chalk.cyanBright(
                    `[Certification] Completed to genarate a certification. ${path.resolve(
                        path.join(resourceDir, 'profiles.xml')
                    )}. Please "wits -i" to config your profile path.`
                )
            );
        } catch (e) {
            logger.error(chalk.red(`[Certification] Failed to run: ${e}`));
        }
    }
};
