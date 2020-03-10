#!/usr/bin/env node

const optionInit = require("../command/init.js");
const optionStart = require("../command/start.js");
const optionWatch = require("../command/watch.js");

const commander = require("commander");
const program = new commander.Command();

program.option("-i, --init", "Create a wits config file for running Wits");
program.option("-s, --start", "Start and Use Wits service");
program.option("-w, --watch", "Watch project for live reloading");

program.parse(process.argv);

if (program.init) {
    optionInit.start();
} else if (program.start) {
    optionStart.startWits();
} else if (program.watch) {
    optionWatch.start();
} else {
    program.help();
}
