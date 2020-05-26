#!/usr/bin/env node

const commander = require('commander');
const program = new commander.Command();

const util = require('./util.js');

process.on('SIGINT', () => {
    // ctrl + C
    const watchHelper = require('./watchHelper.js');
    watchHelper.closeSocketServer();
    util.close();
});

program.option('-i, --init', 'Create a wits config file for running Wits');
program.option('-s, --start', 'Start and Use Wits service');
program.option('-w, --watch', 'Watch project for live reloading');

program.parse(process.argv);

if (program.init) {
    const initCommand = require('../command/init.js');
    initCommand.run();
} else if (program.start) {
    const startCommand = require('../command/start.js');
    startCommand.run();
} else if (program.watch) {
    const watchCommand = require('../command/watch.js');
    watchCommand.run();
} else {
    program.help();
}
