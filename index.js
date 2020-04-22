const initCommand = require('./command/init.js');
const watchCommand = require('./command/watch.js');
const startCommand = require('./command/start.js');

module.exports = {
    setWitsconfigInfo: (data) => {
        console.log('wits::setWitsconfigInfo');
    },
    start: () => {
        console.log('wits::start');
        startCommand.run();
    },
    watch: () => {
        console.log('wits::watch');
        watchCommand.run();
    },
};
