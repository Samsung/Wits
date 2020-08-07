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
program.option('-V, --version', 'WITs version');
program.option('-i, --init [proxy]', 'Create a config file for running WITs');
program.option(
    '-g, --generate',
    'Generate a certification for packaging Tizen web app'
);
program.option('-s, --start', 'Start and Use WITs service');
program.option('-w, --watch', 'Watch project for live reloading');

program.parse(process.argv);

if (program.init) {
    const initCommand = require('../command/init.js');
    initCommand.run(program.init);
} else if (program.generate) {
    const generateCommand = require('../command/generate.js');
    generateCommand.run();
} else if (program.start) {
    const startCommand = require('../command/start.js');
    startCommand.run();
} else if (program.watch) {
    const watchCommand = require('../command/watch.js');
    watchCommand.run();
} else {
    program.help();
}
