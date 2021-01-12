#!/usr/bin/env node

const commander = require('commander');
const program = new commander.Command();
const package = require('../package.json');

const util = require('./util.js');

process.on('SIGINT', () => {
    // ctrl + C
    const watchHelper = require('./watchHelper.js');
    watchHelper.closeSocketServer();
    util.exit();
});

util.displayBanner();

program.version(`wits v${package.version}`, '-v, --version', 'WITs version');
program.allowUnknownOption();
program.option('-i, --init', 'Set configuration for running WITs.');
program.option(
    '-c, --certificate',
    'Generate a certification for signing Tizen web app. You can set a log level for debugging. ex) wits -c --verbose'
);
program.option(
    '-s, --start [deviceIp]',
    'Install, launch app and enable live reload feature in a sequence. ex) wits -s / wits -s deviceIp=192.168.250.250 / wits -s --verbose'
);
program.option(
    '-w, --watch [deviceIp]',
    'Launch app and enable live reload feature without reinstalling. ex) wits -w / wits -w deviceIp=192.168.250.250 / wits -w --verbose'
);
program.parse(process.argv);
const isVerbose = checkVerbose(process.argv);
if (isVerbose) {
    util.ISSILENT = false;
}
console.log(isVerbose, util.ISSILENT);

if (program.init) {
    const initCommand = require('../command/init.js');
    initCommand.run();
} else if (program.certificate) {
    const certificateCommand = require('../command/certificate.js');
    certificateCommand.run(program.certificate);
} else if (program.start) {
    const startCommand = require('../command/start.js');
    startCommand.run(program.start);
} else if (program.watch) {
    const watchCommand = require('../command/watch.js');
    watchCommand.run(program.watch);
} else {
    program.help();
}

function checkVerbose(arguments) {
    const lastIndex = arguments.length - 1;
    if (arguments[lastIndex] === '--verbose') {
        return true;
    }
    return false;
}
