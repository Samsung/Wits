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

program.version(`wits v${package.version}`);
program.option('-i, --init', 'Create a config file for running WITs');
program.option(
    '-c, --certificate',
    'Generate a certification for signing Tizen web app'
);
program.option('-s, --start', 'Start and Use WITs service');
program.option('-w, --watch', 'Watch project for live reloading');

program.parse(process.argv);

if (program.init) {
    const initCommand = require('../command/init.js');
    initCommand.run(program.init);
} else if (program.certificate) {
    const certificateCommand = require('../command/certificate.js');
    certificateCommand.run();
} else if (program.start) {
    const startCommand = require('../command/start.js');
    startCommand.run();
} else if (program.watch) {
    const watchCommand = require('../command/watch.js');
    watchCommand.run();
} else {
    program.help();
}
