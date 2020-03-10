#!/usr/bin/env node

// const init = require("../command/init.js");
// const start = require("../command/start.js");
// const watch = require("../command/watch.js");

const commander = require("commander");
const program = new commander.Command();

program.option("-i, --init", "Create a wits config file for running Wits");
program.option("-s, --start", "Start and Use Wits service");
program.option("-w, --watch", "Watch project for live reloading");

program.parse(process.argv);

if (process.argv.length < 3) {
    program.help();
}

if (program.init) {
    require("../command/init.js");
}

if (program.start) {
    require("../command/start.js");
}

if (program.watch) {
    require("../command/watch.js");
}
