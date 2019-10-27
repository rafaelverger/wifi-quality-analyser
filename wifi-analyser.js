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

const printResult = (text, result, clearBefore) => {
  if (clearBefore) clearTerminal();

  console.info(text);
  if (result.numChecks === undefined) {
    return console.info(JSON.stringify(result));
  }

  const props = [['signal', 'dBm'], ['noise', 'dBm'], ['speed', 'Mbits']];
  const attributes = ['avg', 'median', 'best', 'worst'];
  const attrPad = Math.max.apply(Math, attributes.map(a => a.length));
  props.forEach(([prop, unity]) => {
    const isSpeed = prop === 'speed';
    console.info(`# ${prop}: ${isSpeed ? 'internal network, measured in Mbits' : ''}`)
    attributes.forEach(attr => {
      const title = `${attr.toUpperCase()}${new Array(attrPad - attr.length).fill(' ').join('')}`;
      const value = result[prop][attr];
      const bar = isSpeed ? '' : `[${new Array(25).fill().map((_, i) => (value >= -1 * (100-i*4)) ? '▓' : ' ').join('')}] `;
      console.info(`  - ${title} ${bar}${value} (${unity})`);
    });
  });
  console.info(`Connected SSIDs: ${result.connectedSSID}`);
}

const printLog = setInterval(() => {
  const lastAnalysis = analysisResult.values[analysisResult.values.length - 1];
  printResult('Partial analysis result:', lastAnalysis, true);
}, 1000);

const finish = async (exitCode = 0) => {
  clearInterval(printLog);
  clearTerminal();

  console.log('Finishing program...');

  console.debug('Killing subtasks')
  await airportCheck.stop(exitCode);
  console.debug('Subtasks killed');

  printResult('Final results are here :)', analysisResult.summary);

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
