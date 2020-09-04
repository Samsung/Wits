const inquirer = require('inquirer');
// const expand = require('@inquirer/expand');

const CERTIFICATION_TYPE = {
    tizen: 'tizen',
    samsung: 'samsung'
};

const PRIVILEGE_LEVEL = {
    public: 'public',
    partner: 'partner'
};

module.exports = {
    CERTIFICATION_DATA: {},
    getAnswers: async () => {
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
    },
    displaySelectedInfo: data => {
        console.log(``);
        console.log(`      > [ Stored Information ]`);
        console.log(``);
        console.log(`      > baseAppPath  : ${data.baseAppPath}`);
        console.log(`      > width        : ${data.width}`);
        console.log(`      > deviceIp     : ${data.deviceIp}`);
        console.log(`      > socketPort   : ${data.socketPort}`);
        console.log(`      > isDebugMode  : ${data.isDebugMode}`);
        console.log(``);
        console.log(`      > profile path : ${data.profilePath}`);
        console.log(`      > hostIp       : ${data.hostIp}`);
        console.log(``);
    }
};

async function getTizenCertificationData() {
    const keyFileName = await inquirer.prompt(getKeyFileName());
    const authorName = await inquirer.prompt(getAuthorName());
    const authorPassword = await inquirer.prompt(getAuthorPassword());

    let answer = Object.assign(keyFileName, authorName, authorPassword);
    // ask.push(getCountryInfo());
    // ask.push(getStateInfo());
    // ask.push(getCityInfo());
    // ask.push(getOrganizationInfo());
    // ask.push(getDepartmentInfo());
    // ask.push(getEmailInfo());
    // ask.push(getPrivilegeLevel());
    return answer;
}

async function getTizenCertificationDetails() {
    let ask = [];

    return await inquirer.prompt(ask);
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
        choices: [CERTIFICATION_TYPE.tizen, CERTIFICATION_TYPE.samsung],
        default: CERTIFICATION_TYPE.tizen
    };
}

function getKeyFileName() {
    return {
        type: 'input',
        name: 'keyFileName',
        message: 'Input keyFileName : ',
        validate: input => {
            return input !== '' ? true : 'Invalid value';
        }
    };
}

function getAuthorName() {
    return {
        type: 'input',
        name: 'authorName',
        message: 'Input authorName : ',
        validate: input => {
            return input !== '' ? true : 'Invalid value';
        }
    };
}

function getAuthorPassword() {
    return {
        type: 'password',
        name: 'authorPassword',
        mask: true,
        message: 'Input authorPassword : ',
        validate: input => {
            return input !== '' ? true : 'Invalid value';
        }
    };
}

function getCountryInfo() {
    return {
        type: 'input',
        name: 'countryInfo',
        message: 'Input countryInfo : ',
        validate: input => {
            return input !== '' ? true : 'Invalid value';
        }
    };
}

function getStateInfo() {
    return {
        type: 'input',
        name: 'stateInfo',
        message: 'Input stateInfo : ',
        validate: input => {
            return input !== '' ? true : 'Invalid value';
        }
    };
}

function getCityInfo() {
    return {
        type: 'input',
        name: 'cityInfo',
        message: 'Input cityInfo : ',
        validate: input => {
            return input !== '' ? true : 'Invalid value';
        }
    };
}

function getOrganizationInfo() {
    return {
        type: 'input',
        name: 'organizationInfo',
        message: 'Input organizationInfo : ',
        validate: input => {
            return input !== '' ? true : 'Invalid value';
        }
    };
}

function getDepartmentInfo() {
    return {
        type: 'input',
        name: 'departmentInfo',
        message: 'Input departmentInfo : ',
        validate: input => {
            return input !== '' ? true : 'Invalid value';
        }
    };
}

function getEmailInfo() {
    return {
        type: 'input',
        name: 'emailInfo',
        message: 'Input emailInfo : ',
        validate: input => {
            return input !== '' ? true : 'Invalid value';
        }
    };
}

function getPrivilegeLevel() {
    return {
        type: 'list',
        name: 'privilegeLevel',
        message: 'Select privilege Level : ',
        choices: [PRIVILEGE_LEVEL.public, PRIVILEGE_LEVEL.partner],
        default: PRIVILEGE_LEVEL.partner
    };
}
