SynthDef(\tone, { |freq=440| Out.ar(0, SinOsc.ar(freq, 0, 0.3).dup) }).add;

Score([
    [0.0, [\s_new, \tone, 1000, 0, 0]],
    [3.0, [\n_free, 1000]]
]).recordNRT(
    outputFilePath: "output.wav",
    sampleRate: 44100,
    headerFormat: "wav",
    sampleFormat: "int16",
    duration: 3.0
);
