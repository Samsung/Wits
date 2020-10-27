const outputChannel = [];

const setOutputChannel = output => {
    if (typeof output !== 'function') {
        throw new Error(`output should be function`);
    }
    const id = generateId();
    outputChannel.push({ id, output });
    return id;
};

function generateId() {
    const min = Math.ceil(1000);
    const max = Math.floor(9999);
    return Math.floor(Math.random() * (max - min)) + min;
}

const unsetOutputChannel = requestId => {
    const removedId = outputChannel.findIndex(({ id }) => requestId === id);
    if (removedId < 0) {
        console.error(`The request id(${requestId}) is not exist`);
        return;
    }
    outputChannel.splice(removedId, 1);
};

function error() {
    const args = [].slice.call(arguments);
    const outputCallback = outputChannel.map(({ output }) => output);
    [console.error, ...outputCallback].forEach(print => {
        print(...args);
    });
}

function warn() {
    const args = [].slice.call(arguments);
    const outputCallback = outputChannel.map(({ output }) => output);
    [console.warn, ...outputCallback].forEach(print => {
        print(...args);
    });
}

function log() {
    const args = [].slice.call(arguments);
    const outputCallback = outputChannel.map(({ output }) => output);
    [console.log, ...outputCallback].forEach(print => {
        print(...args);
    });
}

function debug() {
    const args = [].slice.call(arguments);
    console.debug(...args);
}

const logger = {
    error,
    warn,
    log,
    debug
};

module.exports = {
    setOutputChannel,
    unsetOutputChannel,
    logger
};
