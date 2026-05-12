'use strict';

// End-to-end-ish: stage a `.witsconfig.json` on disk in a temp project
// directory, point util.CURRENT_PROJECT_PATH at it, and exercise the
// userInfoHelper config-load path. Verifies that malicious configs
// trigger util.exit() before any of the attacker-controlled paths
// reach a downstream consumer.

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const util = require('../lib/util.js');
const userInfoHelper = require('../lib/userInfoHelper.js');

const ON_POSIX = process.platform !== 'win32';

let TMP;
let APP_DIR;
let CONFIG_PATH;

let originalCwdPath;
let originalExit;
let originalLoggerError;
let exitCalls;
let errorLogs;

beforeEach(() => {
    TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'wits-configValidation-'));
    APP_DIR = path.join(TMP, 'myapp');
    fs.mkdirSync(APP_DIR);
    fs.writeFileSync(path.join(APP_DIR, 'config.xml'), '<widget/>');
    CONFIG_PATH = path.join(TMP, '.witsconfig.json');

    originalCwdPath = util.CURRENT_PROJECT_PATH;
    util.CURRENT_PROJECT_PATH = TMP;

    exitCalls = 0;
    originalExit = util.exit;
    util.exit = () => {
        exitCalls += 1;
    };

    const { logger } = require('../lib/logger');
    errorLogs = [];
    originalLoggerError = logger.error;
    logger.error = (...args) => {
        errorLogs.push(args.map(String).join(' '));
    };
});

afterEach(() => {
    util.CURRENT_PROJECT_PATH = originalCwdPath;
    util.exit = originalExit;
    const { logger } = require('../lib/logger');
    logger.error = originalLoggerError;
    fs.rmSync(TMP, { recursive: true, force: true });
});

function writeConfig(obj) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(obj), 'utf8');
}

// ---------- Positive path ----------

test('valid .witsconfig.json loads without invoking exit', () => {
    writeConfig({
        connectionInfo: {
            baseAppPath: APP_DIR,
            deviceIp: '192.168.1.20',
            hostIp: '192.168.1.5',
            width: '1920',
            socketPort: '8498',
            isDebugMode: false
        },
        profileInfo: {
            path: path.join(APP_DIR, 'profiles.xml')
        }
    });

    const result = userInfoHelper.getLatestWitsconfigInfo();
    assert.equal(exitCalls, 0, 'exit should not be called on a valid config');
    assert.equal(errorLogs.length, 0);
    assert.equal(result.connectionInfo.deviceIp, '192.168.1.20');
    assert.equal(result.connectionInfo.baseAppPath, APP_DIR);
});

// ---------- Malicious configs trigger util.exit() ----------

test('payload {baseAppPath: "../../etc"} triggers security exit, no field leakage', () => {
    writeConfig({
        connectionInfo: { baseAppPath: '../../etc' }
    });

    const result = userInfoHelper.getLatestWitsconfigInfo();

    assert.equal(exitCalls, 1, 'expected util.exit() to be called exactly once');
    assert.ok(
        errorLogs.some((l) => /\[security\]/.test(l)),
        `expected a [security] error log, got: ${JSON.stringify(errorLogs)}`
    );
    // The attacker-controlled value must NOT have been copied into the
    // returned result (which downstream consumers would otherwise use).
    assert.notEqual(
        result.connectionInfo.baseAppPath,
        '../../etc',
        'attacker-controlled baseAppPath must not leak into the result'
    );
});

test('payload {baseAppPath: "/etc"} triggers security exit', () => {
    if (!ON_POSIX) return;
    writeConfig({ connectionInfo: { baseAppPath: '/etc' } });

    userInfoHelper.getLatestWitsconfigInfo();

    assert.equal(exitCalls, 1);
    assert.ok(errorLogs.some((l) => /protected system path/.test(l)));
});

test('payload {profileInfo.path: "/etc/shadow.xml"} triggers security exit', () => {
    if (!ON_POSIX) return;
    writeConfig({ profileInfo: { path: '/etc/shadow.xml' } });

    userInfoHelper.getLatestWitsconfigInfo();

    assert.equal(exitCalls, 1);
});

test('payload {deviceIp: "1.2.3.4; rm -rf /"} triggers security exit', () => {
    writeConfig({ connectionInfo: { deviceIp: '1.2.3.4; rm -rf /' } });

    userInfoHelper.getLatestWitsconfigInfo();

    assert.equal(exitCalls, 1);
    assert.ok(errorLogs.some((l) => /not a valid IPv4/.test(l)));
});

test('payload {socketPort: 22} triggers security exit (privileged port)', () => {
    writeConfig({ connectionInfo: { socketPort: 22 } });

    userInfoHelper.getLatestWitsconfigInfo();

    assert.equal(exitCalls, 1);
});

test('payload {isDebugMode: "yes"} (wrong type) triggers security exit', () => {
    writeConfig({ connectionInfo: { isDebugMode: 'yes' } });

    userInfoHelper.getLatestWitsconfigInfo();

    assert.equal(exitCalls, 1);
});

test('getOptionalInfo also enforces validation', async () => {
    writeConfig({
        connectionInfo: { baseAppPath: '../../etc' },
        optionalInfo: { foo: 'bar' }
    });

    const result = await userInfoHelper.getOptionalInfo();

    assert.equal(exitCalls, 1, 'getOptionalInfo must reject the same payloads');
    assert.equal(result, null);
});

// ---------- No file is still benign ----------

test('absent .witsconfig.json: getOptionalInfo returns null without erroring', async () => {
    // do not write the file
    const result = await userInfoHelper.getOptionalInfo();
    assert.equal(result, null);
    assert.equal(exitCalls, 0);
});
