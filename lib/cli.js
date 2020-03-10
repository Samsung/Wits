#!/usr/bin/env node

const watchHelper = require("./watchHelper.js");
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
    // TODO
}

if (program.start) {
    require("../app.js");
}

if (program.watch) {
    // TODO
}
