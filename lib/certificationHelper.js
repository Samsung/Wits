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
    askQuestion: async () => {
        const preAnswer = await inquirer.prompt([
            getCertificationTypeQuestion()
        ]);

        let ask = [];
        switch (preAnswer.type) {
            case CERTIFICATION_TYPE.tizen:
                ask = getTizenCertificationData();
                break;
            case CERTIFICATION_TYPE.samsung:
                ask = getSamsungCertificationData();
            default:
                break;
        }
        return await inquirer.prompt(ask);
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

function getTizenCertificationData() {
    let ask = [];
    ask.push(getKeyFileName());
    ask.push(getAuthorName());
    ask.push(getAuthorPassword());
    // ask.push(getCountryInfo());
    // ask.push(getStateInfo());
    // ask.push(getCityInfo());
    // ask.push(getOrganizationInfo());
    // ask.push(getDepartmentInfo());
    // ask.push(getEmailInfo());
    // ask.push(getPrivilegeLevel());
    return ask;
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
            const MIN_LENGTH = 8;
            return input.length >= 8 ? true : 'Input over 8 characters';
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
