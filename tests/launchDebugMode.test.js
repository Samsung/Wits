'use strict';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const { setup, teardown, FAKE_SDB } = require('./helpers/loadHelper');

const DEVICE = 'test-device';
const APP_ID = 'abcd1234.HostApp';
const DEVICE_IP = '192.168.10.20';
const EMULATOR_IP = '0.0.0.0';

// Sample sdb stdout the helper parses. The DEBUG_PORT regex matches
// the literal substring `port: NUMBER`, and NUMBER_WORD then extracts
// the digits.
const VALID_DEBUG_OUTPUT = 'launch_app: ok\nport: 34567\n';

function debugCmd() {
    return `${FAKE_SDB} -s ${DEVICE} shell 0 debug ${APP_ID}`;
}

let ctx = null;
afterEach(() => {
    teardown();
    ctx = null;
});

test('launchDebugMode: non-emulator happy path -> single Chrome launch at deviceIp', () => {
    ctx = setup({
        execSync: () => VALID_DEBUG_OUTPUT
    });

    ctx.helper.launchDebugMode(DEVICE, APP_ID, DEVICE_IP);

    assert.equal(ctx.calls.execSync.length, 1, 'only the no-timeout debug command should run');
    assert.equal(ctx.calls.execSync[0].cmd, debugCmd());
    assert.equal(ctx.calls.launch.length, 1, 'Chrome should be launched exactly once');
    assert.equal(ctx.calls.launch[0].startingUrl, `${DEVICE_IP}:34567`);
});

test('launchDebugMode: empty first result falls back to timeout-suffixed command', () => {
    let invocation = 0;
    ctx = setup({
        execSync: (cmd) => {
            invocation += 1;
            if (invocation === 1) return ''; // mimic empty stdout on first try
            return VALID_DEBUG_OUTPUT;
        }
    });

    ctx.helper.launchDebugMode(DEVICE, APP_ID, DEVICE_IP);

    assert.equal(ctx.calls.execSync.length, 2);
    assert.equal(ctx.calls.execSync[0].cmd, debugCmd());
    assert.equal(ctx.calls.execSync[1].cmd, `${debugCmd()} 300`);
    assert.equal(ctx.calls.launch.length, 1);
});

test('launchDebugMode: first execSync throwing falls back to timeout variant (#112 Tizen 3.0)', () => {
    let invocation = 0;
    ctx = setup({
        execSync: (cmd) => {
            invocation += 1;
            if (invocation === 1) {
                const err = new Error('Command failed');
                err.stderr = 'closed\n';
                throw err;
            }
            return VALID_DEBUG_OUTPUT;
        }
    });

    ctx.helper.launchDebugMode(DEVICE, APP_ID, DEVICE_IP);

    assert.equal(ctx.calls.execSync.length, 2, 'helper should retry with timeout variant after throw');
    assert.equal(ctx.calls.execSync[1].cmd, `${debugCmd()} 300`);
    assert.equal(ctx.calls.launch.length, 1);
    assert.equal(ctx.calls.launch[0].startingUrl, `${DEVICE_IP}:34567`);
});

test('launchDebugMode: both no-timeout and timeout variants throwing propagates the error', () => {
    ctx = setup({
        execSync: () => {
            const err = new Error('Command failed');
            err.stderr = 'closed\n';
            throw err;
        }
    });

    assert.throws(
        () => ctx.helper.launchDebugMode(DEVICE, APP_ID, DEVICE_IP),
        /Command failed/
    );
    assert.equal(ctx.calls.execSync.length, 2, 'both variants should be attempted before propagation');
    assert.equal(ctx.calls.launch.length, 0, 'Chrome must not launch when debug command fails');
});

test('launchDebugMode: result containing "failed" raises a helpful error', () => {
    ctx = setup({
        execSync: () => 'failed[some-reason]'
    });

    assert.throws(
        () => ctx.helper.launchDebugMode(DEVICE, APP_ID, DEVICE_IP),
        /Failed to launchDebugMode/
    );
    assert.equal(ctx.calls.launch.length, 0);
});

test('launchDebugMode: emulator IP sets up port forward and launches Chrome ONCE at 127.0.0.1 (#110)', () => {
    ctx = setup({
        execSync: () => VALID_DEBUG_OUTPUT
    });

    ctx.helper.launchDebugMode(DEVICE, APP_ID, EMULATOR_IP);

    const commands = ctx.calls.execSync.map((c) => c.cmd);

    assert.equal(commands.length, 3, 'debug + forward --remove + forward tcp');
    assert.equal(commands[0], debugCmd());
    assert.ok(
        commands.includes(`${FAKE_SDB} -s ${DEVICE} forward --remove tcp:34567`),
        'expected forward --remove to be executed'
    );
    assert.ok(
        commands.includes(`${FAKE_SDB} -s ${DEVICE} forward tcp:34567 tcp:34567`),
        'expected forward tcp:port to be executed'
    );

    assert.equal(
        ctx.calls.launch.length,
        1,
        'regression for #110: Chrome must be launched exactly once on emulator debug'
    );
    assert.equal(ctx.calls.launch[0].startingUrl, '127.0.0.1:34567');
});

test('launchDebugMode: non-emulator path does NOT issue forward commands', () => {
    ctx = setup({
        execSync: () => VALID_DEBUG_OUTPUT
    });

    ctx.helper.launchDebugMode(DEVICE, APP_ID, DEVICE_IP);

    const forwardCalls = ctx.calls.execSync.filter((c) => c.cmd.includes(' forward '));
    assert.equal(forwardCalls.length, 0, 'real device path should not touch sdb forward');
});

test('launchDebugMode: Chrome launch failure is swallowed and does not break the flow', async () => {
    ctx = setup({
        execSync: () => VALID_DEBUG_OUTPUT,
        launch: () => Promise.reject(new Error('chrome missing'))
    });

    // Should not throw synchronously; rejection is logged but not propagated.
    assert.doesNotThrow(() => ctx.helper.launchDebugMode(DEVICE, APP_ID, DEVICE_IP));

    // Give the rejected promise a tick to settle so it doesn't leak into other tests.
    await new Promise((r) => setImmediate(r));
});
