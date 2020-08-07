const fs = require('fs');
const path = require('path');
const request = require('request');
const progress = require('request-progress');
const certificationHelper = require('../lib/certificationHelper.js');

module.exports = {
    run: async () => {
        console.log(`Generate a certification............`);

        try {
            const answer = await certificationHelper.askQuestion();
            console.log(answer);
        } catch (e) {
            console.error(`Failed to run: ${e}`);
        }
    }
};
