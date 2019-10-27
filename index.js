#!/usr/bin/env node

const startAnalysis = require('./wifi-analyser');
const startTime = +new Date;
let analyser;

const finish = async (exitCode = 0) => {
  console.log('Finishing program...');

  console.debug('Killing subtasks')
  await analyser.stop(exitCode);
  console.debug('Subtasks killed');

  console.log(`Program ended ${exitCode === 0 ? 'sucessfully' : 'prematurely'} within ${(+new Date - startTime)/(60 * 1000)} minutes`);
  process.exit(exitCode);
};

process.on('SIGINT', () => {
  console.log("Caught interrupt signal");
  finish(1);
});

console.log('Will analyse wifi connection for 10 minutes... ');
analyser = startAnalysis(true);

new Promise(r => setTimeout(r, 10 * 60 * 1000)).then(() => {
  console.log('It has been a while since we met, right? hehe');
  finish();
});
