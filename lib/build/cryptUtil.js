const platform = require('os').platform();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const forge = require('node-forge');

// const cryptToolExec = platform == 'win32' ? 'wincrypt.exe' : (platform == 'linux' ? 'secret-tool' : 'security');
// const cryptTool = path.resolve(__dirname, '..', 'tools', 'certificate-encryptor', `${cryptToolExec}`);
const cryptTool = 'wincrypt';

function encryptPassword(password, pwdFile) {
    if (platform == 'win32') {
        try {
            execSync(`${cryptTool} --encrypt "${password}" ${pwdFile}`);
        } catch(err) {
            if (err.stderr && err.stderr.toString()) {
                console.log(err.stderr.toString());
            }
        }
    } else if (platform == 'linux') {
        execSync(`${cryptTool} store --label="tizen-studio" -p "${password}" keyfile ${pwdFile} tool certificate-manager`);
    } else if (platform == 'darwin') {
        execSync(`security add-generic-password -a ${pwdFile} -s certificate-manager -w "${password}" -U`);
    }
}

function decryptPassword(pwdFile) {
    let password = '';
    if (platform == 'win32') {
        try {
            let out = execSync(`${cryptTool} --decrypt ${pwdFile}`);
            if (out.includes('PASSWORD:')){
                out.trim();
                password = out.substring(9).replace(/[\r\n]/g,"");
            }
            console.log('@@@@@@@@@@@@@@@@@@ password: ' + password);
        } catch(err) {
            let stderr = err.stderr.toString();
            let stdout = err.stdout.toString();

            if (stderr) {
                console.log(stderr);
            } else if (stdout.includes('PASSWORD:')){
                stdout.trim();
                password = stdout.substring(9).replace(/[\r\n]/g,"");
            }
        }
    } else if (platform == 'linux') {
        let out = execSync(`${cryptTool} lookup --label="tizen-studio" keyfile ${pwdFile} tool certificate-manager`);
        out = out.toString();
        if (out) {
            console.log(`out: ${out}, length: ${out.length}`);
            out.trim();
            password = out.replace(/[\r\n]/g,"");
        }
    } else if (platform == 'darwin') {
        let out = execSync(`security find-generic-password -wa ${pwdFile} -s certificate-manager`);
        out = out.toString();
        if (out) {
            console.log(`out: ${out}, length: ${out.length}`);
            out.trim();
            password = out.replace(/[\r\n]/g,"");
        }
    }

    return password;
}

function checkP12Password(file, password) {
    try {
        let p12Der = fs.readFileSync(file).toString('binary');
        let p12Asn1 = forge.asn1.fromDer(p12Der);
        forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    } catch(err) {
        console.log(err.message);
        return false;
    }

    return true;
}

function parseP12File(p12File, password) {
    let p12 = null;
    try {
        let p12Der = fs.readFileSync(p12File).toString('binary');
        let p12Asn1 = forge.asn1.fromDer(p12Der);
        p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    } catch(err) {
        console.log(err.message);
    }

    return p12;
}

module.exports = {
    encryptPassword,
    decryptPassword,
    checkP12Password,
    parseP12File
}