const { createSubtask } = require('./subtask');

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

const parseAirport = (data) => data
  .split('\n')
  .map(data => data.trim().split(': '))
  .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});


module.exports = () => {
  const airportCheck = createSubtask(`
    while x=1; do
      /System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I
      sleep 0.5;
    done
  `);
  airportCheck.onEnd(dataArray => summarizeAnalysis(dataArray.map(data => parseAirport(data.toString()))));

  return airportCheck;
}