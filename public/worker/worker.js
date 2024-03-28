importScripts("./bundle.js");

onmessage = (e) => {
  AtomBuilder.buildTransaction(e.data, postMessage);
};
