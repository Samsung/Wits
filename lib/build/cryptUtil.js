/**
 * Code from SRC-Nanjing
 */

const fs = require('fs');
const { execSync } = require('child_process');
const forge = require('node-forge');

const util = require('../util.js');

function encryptPassword(password, pwdFile) {
    if (util.PLATFORM === 'win32') {
        try {
            execSync(
                `${util.TOOLS_CRYPT_PATH} --encrypt "${password}" ${pwdFile}`
            );
        } catch (err) {
            if (err.stderr && err.stderr.toString()) {
                console.log(err.stderr.toString());
                throw err;
            }
        }
    } else if (util.PLATFORM === 'linux') {
        execSync(
            `${util.TOOLS_CRYPT_PATH} store --label="tizen-studio" -p "${password}" keyfile ${pwdFile} tool certificate-manager`
        );
    } else if (util.PLATFORM === 'darwin') {
        execSync(
            `security add-generic-password -a ${pwdFile} -s certificate-manager -w "${password}" -U`
        );
    }
}

function decryptPassword(pwdFile) {
    let password = '';
    if (util.PLATFORM === 'win32') {
        try {
            const out = execSync(
                `${util.TOOLS_CRYPT_PATH} --decrypt ${pwdFile}`
            );
            if (out.includes('PASSWORD:')) {
                out.trim();
                password = out.substring(9).replace(/[\r\n]/g, '');
            }
        } catch (err) {
            const stderr = err.stderr.toString();
            const stdout = err.stdout.toString();

            if (stderr) {
                throw stderr;
            } else if (stdout.includes('PASSWORD:')) {
                stdout.trim();
                password = stdout.substring(9).replace(/[\r\n]/g, '');
            }
        }
    } else if (util.PLATFORM === 'linux') {
        const out = execSync(
            `${util.TOOLS_CRYPT_PATH} lookup --label="tizen-studio" keyfile ${pwdFile} tool certificate-manager`
        ).toString();
        if (out) {
            console.log(`out: ${out}, length: ${out.length}`);
            out.trim();
            password = out.replace(/[\r\n]/g, '');
        }
    } else if (util.PLATFORM === 'darwin') {
        const out = execSync(
            `security find-generic-password -wa ${pwdFile} -s certificate-manager`
        ).toString();
        if (out) {
            console.log(`out: ${out}, length: ${out.length}`);
            out.trim();
            password = out.replace(/[\r\n]/g, '');
        }
    }
    return password;
}

function checkP12Password(file, password) {
    try {
        const p12Der = fs.readFileSync(file).toString('binary');
        const p12Asn1 = forge.asn1.fromDer(p12Der);
        forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    } catch (err) {
        console.log(err.message);
        return false;
    }
    return true;
}

function parseP12File(p12File, password) {
    let p12 = null;
    try {
        const p12Der = fs.readFileSync(p12File).toString('binary');
        const p12Asn1 = forge.asn1.fromDer(p12Der);
        p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
    } catch (err) {
        console.log(err.message);
    }
    return p12;
}

module.exports = {
    encryptPassword,
    decryptPassword,
    checkP12Password,
    parseP12File
};
