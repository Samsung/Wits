const outputChannel = [];

const setOutputChannel = output => {
    if (typeof output !== 'function') {
        throw new Error(`output should be function`);
    }
    outputChannel.push(output);
};

function error() {
    var args = [].slice.call(arguments);
    [console.error, ...outputChannel].forEach(print => {
        print(...args);
    });
}

function warn() {
    var args = [].slice.call(arguments);
    [console.warn, ...outputChannel].forEach(print => {
        print(...args);
    });
}

function log() {
    var args = [].slice.call(arguments);
    [console.log, ...outputChannel].forEach(print => {
        print(...args);
    });
}

function debug() {
    var args = [].slice.call(arguments);
    console.debug(...args);
}

const logger = {
    error,
    warn,
    log,
    debug
};

global.logger = logger;

module.exports = {
    setOutputChannel
};
