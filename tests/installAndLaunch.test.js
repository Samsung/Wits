'use strict';

const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { setup, teardown, FAKE_SDB } = require('./helpers/loadHelper');

const DEVICE = {
    deviceName: 'tv-device',
    appInstallPath: '/opt/usr/apps/install/'
};
const HOST_APP_NAME = 'MyHost';
const HOST_APP_ID = 'abcd1234.MyHost';

let ctx = null;
afterEach(() => {
    teardown();
    ctx = null;
});

// ---------- installPackage ----------

test('installPackage: success runs push then install in order', () => {
    ctx = setup({
        execSync: (cmd) => {
            if (cmd.includes(' push ')) return 'pushed: ok';
            if (cmd.includes(' vd_appinstall ')) return 'install ok';
            return '';
        }
    });

    ctx.helper.installPackage(DEVICE, HOST_APP_NAME);

    assert.equal(ctx.calls.execSync.length, 2);
    assert.match(ctx.calls.execSync[0].cmd, / push /);
    assert.ok(ctx.calls.execSync[0].cmd.includes(DEVICE.deviceName));
    assert.ok(ctx.calls.execSync[0].cmd.includes('WITs.wgt'));
    assert.ok(ctx.calls.execSync[0].cmd.includes(DEVICE.appInstallPath));

    assert.match(ctx.calls.execSync[1].cmd, / vd_appinstall /);
    assert.ok(ctx.calls.execSync[1].cmd.includes(HOST_APP_NAME));

    assert.equal(ctx.calls.exit, 0);
});

test('installPackage: "failed[" in install output calls util.exit', () => {
    ctx = setup({
        execSync: (cmd) => {
            if (cmd.includes(' push ')) return 'pushed: ok';
            return 'install failed[120000]';
        }
    });

    ctx.helper.installPackage(DEVICE, HOST_APP_NAME);

    assert.equal(ctx.calls.exit, 1, 'expected util.exit() to be invoked on failure');
});

test('installPackage: push command quotes wgt path so spaces work', () => {
    ctx = setup({
        execSync: () => 'ok'
    });
    ctx.helper.installPackage(DEVICE, HOST_APP_NAME);

    const pushCmd = ctx.calls.execSync[0].cmd;
    // The wgt source path should be wrapped in double quotes, as should the install dest.
    const quoted = pushCmd.match(/"[^"]+"/g) || [];
    assert.equal(quoted.length, 2, `expected two quoted paths in push command, got: ${pushCmd}`);
});

// ---------- unInstallPackage ----------

test('unInstallPackage: success runs the uninstall command with the right device + app', () => {
    ctx = setup({
        execSync: () => 'uninstall ok'
    });

    ctx.helper.unInstallPackage(DEVICE.deviceName, HOST_APP_NAME);

    assert.equal(ctx.calls.execSync.length, 1);
    assert.equal(
        ctx.calls.execSync[0].cmd,
        `${FAKE_SDB} -s ${DEVICE.deviceName} shell 0 vd_appuninstall ${HOST_APP_NAME}`
    );
});

test('unInstallPackage: "failed[" output is non-fatal (warns only)', () => {
    ctx = setup({
        execSync: () => 'uninstall failed[110011]'
    });

    // The helper should NOT throw and NOT call util.exit; it just logs a warning.
    assert.doesNotThrow(() =>
        ctx.helper.unInstallPackage(DEVICE.deviceName, HOST_APP_NAME)
    );
    assert.equal(ctx.calls.exit, 0);
});

// ---------- launchApp ----------

test('launchApp: success returns without throwing', () => {
    ctx = setup({
        execSync: () => 'launch ok'
    });

    assert.doesNotThrow(() =>
        ctx.helper.launchApp(DEVICE.deviceName, HOST_APP_ID)
    );

    assert.equal(ctx.calls.execSync.length, 1);
    assert.equal(
        ctx.calls.execSync[0].cmd,
        `${FAKE_SDB} -s ${DEVICE.deviceName} shell 0 was_execute ${HOST_APP_ID}`
    );
});

test('launchApp: "failed[" in output throws a descriptive error', () => {
    ctx = setup({
        execSync: () => 'launch failed[someReason]'
    });

    assert.throws(
        () => ctx.helper.launchApp(DEVICE.deviceName, HOST_APP_ID),
        /Failed to launchApp/
    );
});

// ---------- terminateApp ----------

test('terminateApp: runs was_kill and displays output', () => {
    ctx = setup({
        execSync: () => 'killed'
    });

    ctx.helper.terminateApp(DEVICE.deviceName, HOST_APP_ID);

    assert.equal(ctx.calls.execSync.length, 1);
    assert.equal(
        ctx.calls.execSync[0].cmd,
        `${FAKE_SDB} -s ${DEVICE.deviceName} shell 0 was_kill ${HOST_APP_ID}`
    );
    assert.deepEqual(ctx.calls.displayOutput, ['killed']);
});

// ---------- Module surface guard ----------

test('module exports the expected public surface', () => {
    ctx = setup();
    const exported = Object.keys(ctx.helper).sort();
    assert.deepEqual(exported, [
        'installPackage',
        'launchApp',
        'launchDebugMode',
        'terminateApp',
        'unInstallPackage'
    ]);
});
