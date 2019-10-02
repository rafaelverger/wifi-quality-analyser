#!/usr/bin/env node

const startOSXCheck = require('./osx');
const startTime = +new Date;

const airportCheck = startOSXCheck();
const finish = async (exitCode = 0) => {
  console.log('Finishing program...');

  console.debug('Killing subtasks')
  const airportSummary = await airportCheck.stop();
  console.debug('Subtasks killed');

  console.info(`Results are here :)\n ${JSON.stringify(airportSummary, null, 2)}`);

  console.log(`Program ended ${exitCode === 0 ? 'sucessfully' : 'prematurely'} within ${(+new Date - startTime)/(60 * 1000)} minutes`);
  process.exit(exitCode);
}

process.on('SIGINT', () => {
  console.log("Caught interrupt signal");
  finish(1);
});

console.log('Will analyse wifi connection for 1 hour... ');
new Promise(r => setTimeout(r, 1 * 60 * 60 * 1000)).then(() => {
  console.log('It has been a while since we met, right? hehe');
  finish();
});
