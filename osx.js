const { createSubtask } = require('./subtask');

// analysisResult = {
//   checks: 0,
//   signal: { avg: 0, best: 0, worst: 0 },
//   noise: { avg: 0, best: 0, worst: 0 },
//   speed: { avg: 0, best: 0, worst: 0 },
//   connectedSSID: new Set(),
// }

const parseAirport = (data) => {
  const parsed = data
    .split('\n')
    .map(data => data.trim().split(': '))
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  return {
    signal: parseInt(parsed.agrCtlRSSI),
    noise: parseInt(parsed.agrCtlNoise),
    speed: parseInt(parsed.lastTxRate),
    connectedSSID: parsed.SSID,
  };
};


module.exports = (analysisResult) => {
  const airportCheck = createSubtask(`
    while x=1; do
      /System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I
      sleep 0.5;
    done
  `);
  airportCheck.onData(data => {
    analysisResult.values.push(parseAirport(data.toString()));
  });
  airportCheck.onEnd(() => {
    analysisResult.summary = {
      ...['signal', 'noise', 'speed'].reduce((summary, prop) => {
        const propValues = analysisResult.values.map(v => v[prop]).sort();
        return {
          ...summary,
          [prop]: {
            avg: propValues.reduce((a, b) => a+b)/propValues.length,
            best: propValues[propValues.length - 1],
            worst: propValues[0]
          }
        };
      }, {}),
      connectedSSID: [ ...new Set(analysisResult.values.map(v => v.connectedSSID)) ],
      numChecks: analysisResult.values.length,
    };
  });
  return airportCheck;
}