const inquirer = require('inquirer');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const util = require('./util');
const regExp = require('./regexp.js');

const CERTIFICATION_TYPE = {
    tizen: 'tizen',
    samsung: 'samsung'
};

const PRIVILEGE_LEVEL = {
    public: 'public',
    partner: 'partner'
};

let profileNames = [];

module.exports = {
    CERTIFICATION_DATA: {},

    getAnswers: async () => {
        profiles = await getProfileNames();
        const preAnswer = await inquirer.prompt([
            getCertificationTypeQuestion()
        ]);

        let answer = {};
        switch (preAnswer.type) {
            case CERTIFICATION_TYPE.tizen:
                answer = await getTizenCertificationData();
                break;
            case CERTIFICATION_TYPE.samsung:
                answer = await getSamsungCertificationData();
            default:
                break;
        }
        return answer;
    }
};

async function getProfileNames() {
    try {
        const profilePath = path.join(
            util.WITS_BASE_PATH,
            '../',
            'resource',
            'profiles.xml'
        );
        util.isFileExist(profilePath);
        const profileFile = fs.readFileSync(profilePath, 'utf8');
        const xmlParser = new xml2js.Parser();
        const parsedProfiles = await xmlParser.parseStringPromise(profileFile);
        if (parsedProfiles.profiles && parsedProfiles.profiles.profile) {
            const profiles = parsedProfiles.profiles.profile;
            profiles.forEach(item => {
                profileNames.push(item.$.name);
            });
        }
    } catch (error) {
        profileNames = [];
    }
}

async function getTizenCertificationData() {
    const privilegeInfo = [];
    privilegeInfo.push(getPrivilegeLevel());
    const privilegeAnswer = await inquirer.prompt(privilegeInfo);

    const profileInfo = [];
    profileInfo.push(getProfileName());
    const profileAnswer = await inquirer.prompt(profileInfo);

    const authorInfo = [];
    authorInfo.push(getKeyFileName());
    authorInfo.push(getAuthorName());
    authorInfo.push(getAuthorPassword());
    const authorAnswer = await inquirer.prompt(authorInfo);

    const detailConfirm = await inquirer.prompt(getDetailOptionalQuestion());
    const detailInfo = [];
    if (detailConfirm.details === true) {
        detailInfo.push(getCountryInfo());
        detailInfo.push(getStateInfo());
        detailInfo.push(getCityInfo());
        detailInfo.push(getOrganizationInfo());
        detailInfo.push(getDepartmentInfo());
        detailInfo.push(getEmailInfo());
    }
    const detailAnswer = await inquirer.prompt(detailInfo);

    return Object.assign(
        privilegeAnswer,
        profileAnswer,
        authorAnswer,
        detailAnswer
    );
}

function getSamsungCertificationData() {
    let ask = [];
    ask.push();
    return ask;
}

function getCertificationTypeQuestion() {
    return {
        type: 'list',
        name: 'type',
        message: 'Select certification type : ',
        choices: [CERTIFICATION_TYPE.tizen],
        // choices: [CERTIFICATION_TYPE.tizen, CERTIFICATION_TYPE.samsung],
        default: CERTIFICATION_TYPE.tizen
    };
}

function getDetailOptionalQuestion() {
    return {
        type: 'confirm',
        name: 'details',
        message: 'Do you want to fill in more details? (Optional)',
        default: false
    };
}

function getProfileName() {
    return {
        type: 'input',
        name: 'profileName',
        message: 'Input an unique "profileName" : ',
        validate: input => {
            return input !== ''
                ? (profileNames && profileNames.indexOf(input)) === -1
                    ? true
                    : 'The name is alreaday in use.'
                : 'Input an unique name';
        }
    };
}

function getKeyFileName() {
    return {
        type: 'input',
        name: 'keyFileName',
        message: 'Input keyFileName : ',
        validate: input => {
            return input !== ''
                ? !input.match(regExp.CONTAIN_WHITESPACE)
                    ? true
                    : 'Input without whitespace'
                : 'Invalid value';
        }
    };
}

function getAuthorName() {
    return {
        type: 'input',
        name: 'authorName',
        message: 'Input an authorName : ',
        validate: input => {
            return input !== ''
                ? !input.match(regExp.CONTAIN_WHITESPACE)
                    ? true
                    : 'Input without whitespace'
                : 'Invalid value';
        }
    };
}

function getAuthorPassword() {
    return {
        type: 'password',
        name: 'authorPassword',
        mask: true,
        message: 'Input a password for author certification : ',
        validate: input => {
            const MIN_LEN = 8;
            return input.length >= MIN_LEN ? true : 'Input over 8 characters';
        }
    };
}

function getCountryInfo() {
    return {
        type: 'input',
        name: 'countryInfo',
        message: 'Input countryInfo : '
    };
}

function getStateInfo() {
    return {
        type: 'input',
        name: 'stateInfo',
        message: 'Input stateInfo : '
    };
}

function getCityInfo() {
    return {
        type: 'input',
        name: 'cityInfo',
        message: 'Input cityInfo : '
    };
}

function getOrganizationInfo() {
    return {
        type: 'input',
        name: 'organizationInfo',
        message: 'Input organizationInfo : '
    };
}

function getDepartmentInfo() {
    return {
        type: 'input',
        name: 'departmentInfo',
        message: 'Input departmentInfo : '
    };
}

function getEmailInfo() {
    return {
        type: 'input',
        name: 'emailInfo',
        message: 'Input emailInfo : '
    };
}

function getPrivilegeLevel() {
    return {
        type: 'list',
        name: 'privilegeLevel',
        message: 'Select privilege Level : ',
        // choices: [PRIVILEGE_LEVEL.public, PRIVILEGE_LEVEL.partner],
        choices: [PRIVILEGE_LEVEL.public],
        default: PRIVILEGE_LEVEL.public
    };
}
