const readline = require('readline');
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

const finish = async (exitCode = 0, partialPrintingInterval, wifiChecker, analysisResult) => {
  clearInterval(partialPrintingInterval);
  await wifiChecker.stop(exitCode);
  printResult('Final results are here :)', analysisResult.summary);
};

module.exports = (printPartial) => {
  const startOSXCheck = require('./osx');
  const analysisResult = { values: [], summary: null };
  const wifiChecker = startOSXCheck(analysisResult);
  let partialPrintingInterval;

  if (printPartial) {
    partialPrintingInterval = setInterval(() => {
      const lastAnalysis = analysisResult.values[analysisResult.values.length - 1];
      printResult('Current analysis result:', lastAnalysis, true);
    }, 1000);
  }

  return {
    stop: (exitCode) => finish(exitCode, partialPrintingInterval, wifiChecker, analysisResult)
  }
}