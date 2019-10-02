#!/usr/bin/env node

const { spawn } = require('child_process');

const startTime = +new Date;
const airportValues = [];

const summarizeAnalysis = (analysis) => {
  const signals = analysis.map(v => parseInt(v.agrCtlRSSI)).sort();
  const speeds = analysis.map(v => parseInt(v.lastTxRate)).sort();
  return {
    signal: {
      avg: (signals.reduce((a,b) => a+b)/signals.length).toFixed(2),
      best: signals[0],
      worst: signals.slice(-1)[0],
    },
    speed: {
      avg: (speeds.reduce((a,b) => a+b)/speeds.length).toFixed(2),
      best: speeds.slice(-1)[0],
      worst: speeds[0],
    },
    connectedSSID: [ ...new Set(analysis.map(v => v.SSID)) ],
    avgNoise: (analysis.reduce((a,b) => a+parseInt(b.agrCtlNoise), 0)/analysis.length).toFixed(2),
  };
};

const createSubtask = (cmd) => {
  const proc = spawn('/bin/sh', [ '-c', cmd]);
  proc.__data = [];
  proc.__prom = new Promise(res => { proc.__end = res; });
  proc.__finish = () => null;
  proc.on('close', () => { proc.__end( proc.__finish(proc.__data) ); });
  proc.stdout.on('data', (data) => { proc.__data.push(data); });

  const subtask = {
    __proc: proc,
    onData: (handler) => proc.stdout.on('data', handler),
    onError: (handler) => proc.stderr.on('data', handler),
    onEnd: (handler) => { proc.__finish = handler; },
    stop: (signal) => {
      proc.kill(signal);
      return proc.__prom;
    }
  };
  return subtask;
}

const airportCheck = createSubtask(`
  while x=1; do
    /System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I
    sleep 0.5;
  done
`);

const parseAirport = (data) => data
  .split('\n')
  .map(data => data.trim().split(': '))
  .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

airportCheck.onEnd(dataArray => summarizeAnalysis(dataArray.map(data => parseAirport(data.toString()))));

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
