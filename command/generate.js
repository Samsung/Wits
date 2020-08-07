const certificationHelper = require('../lib/certificationHelper.js');

module.exports = {
    run: async () => {
        console.log(`Generate a certification............`);

        try {
            await certificationHelper.askQuestion();
        } catch (e) {
            console.error(`Failed to run: ${e}`);
        }
    }
};
