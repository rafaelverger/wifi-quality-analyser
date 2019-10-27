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

  const attributes = ['avg', 'best', 'worst'];
  const attrPad = Math.max.apply(Math, attributes.map(a => a.length));
  const props = [
    ['signal', 'dB', [-100, 0], 'higher is better'],
    ['noise', 'dB', [-120, 0], 'lower is better'],
    ['speed', 'Mbits']
  ];
  props.forEach(([prop, unity, range, info]) => {
    console.info(`# ${prop}:${info ? ` (${info})` : ''}`);
    attributes.forEach(attr => {
      const title = `${attr.toUpperCase()}${new Array(attrPad - attr.length).fill(' ').join('')}`;
      const value = result[prop][attr];
      let bar = '';
      if (range) {
        const [min, max] = range;
        const chunks = 50;
        const rangeScale = (min-max);
        const chunkRatio = rangeScale/chunks;
        const values = new Array(chunks).fill();
        bar = `[${min}, ${values.map((_, i) => (value >= (min - i*chunkRatio)) ? '▓' : ' ').join('')}, ${max}] `;
      }
      console.info(`  - ${title} ${bar}${value} (${unity})`);
    });
  });
  console.info(`Connected SSIDs: ${result.connectedSSID}`);
  console.info(`Avergae connection Quality: ${result.signal.avg - result.noise.avg}`);
}

const printLog = setInterval(() => {
  const lastAnalysis = analysisResult.values[analysisResult.values.length - 1];
  printResult('Current analysis result:', lastAnalysis, true);
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
