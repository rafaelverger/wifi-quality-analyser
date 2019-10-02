const { spawn } = require('child_process');

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

module.exports = {
  createSubtask,
}