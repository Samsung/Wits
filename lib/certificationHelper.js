const inquirer = require('inquirer');

const CERTIFICATION_TYPE = {
    tizen: 'tizen',
    samsung: 'samsung'
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
    ask.push(getKeyfileName());
    ask.push(getAuthorName());
    ask.push(getAuthorPassword());
    ask.push(getCountryInfo());
    ask.push(getStateInfo());
    ask.push(getCityInfo());
    ask.push(getOrganizationInfo());
    ask.push(getDepartmentInfo());
    ask.push(getEmailInfo());
    return ask;
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

function getKeyfileName() {
    return {
        type: 'input',
        name: 'keyfileName',
        message: 'Input keyfileName : ',
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
        type: 'input',
        name: 'authorPassword',
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
