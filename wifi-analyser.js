#!/usr/bin/env node

const readline = require('readline');

const startOSXCheck = require('./osx');
const startTime = +new Date;

const analysisResult = { values: [], summary: null };
const airportCheck = startOSXCheck(analysisResult);

const clearTerminal = () => {
  const blank = '\n'.repeat(process.stdout.rows)
  console.log(blank)
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)
};

const printLog = setInterval(() => {
  clearTerminal();
  const lastAnalysis = analysisResult.values[analysisResult.values.length - 1];
  console.log(`Partial analysis result: ${JSON.stringify(lastAnalysis, null, 2)}`);
}, 1000);

const finish = async (exitCode = 0) => {
  clearInterval(printLog);
  clearTerminal();

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
