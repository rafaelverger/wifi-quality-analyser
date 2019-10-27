#!/usr/bin/env node

const startOSXCheck = require('./osx');
const startTime = +new Date;

const analysisResult = { values: [], summary: null };
const airportCheck = startOSXCheck(analysisResult);
const printLog = setInterval(() => {
  console.log(analysisResult.values[analysisResult.values.length - 1]);
}, 1000);

const finish = async (exitCode = 0) => {
  clearInterval(printLog);

  console.log('Finishing program...');

  console.debug('Killing subtasks')
  await airportCheck.stop(exitCode);
  console.debug('Subtasks killed');

  console.info(`Final results are here :)\n ${JSON.stringify(analysisResult.summary, null, 2)}`);

  console.log(`Program ended ${exitCode === 0 ? 'sucessfully' : 'prematurely'} within ${(+new Date - startTime)/(60 * 1000)} minutes`);
  process.exit(exitCode);
};

process.on('SIGINT', () => {
  console.log("Caught interrupt signal");
  finish(1);
});

console.log('Will analyse wifi connection for 1 hour... ');
new Promise(r => setTimeout(r, 1 * 60 * 60 * 1000)).then(() => {
  console.log('It has been a while since we met, right? hehe');
  finish();
});
