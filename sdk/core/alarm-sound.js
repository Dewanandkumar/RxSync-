/**
 * Web Audio Alarm & Chime Synthesizer
 * Generates clear, pleasant, audible medical alarm chimes using the browser's native Web Audio API.
 * 100% offline, zero external audio files or dependencies.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AlarmSound = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  let audioCtx = null;
  let alarmInterval = null;
  let isRinging = false;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  /**
   * Plays a two-tone pleasant medical chime (A5 880Hz -> C6 1046.5Hz)
   */
  function playChime() {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: 880 Hz (A5)
    playTone(ctx, 880, now, 0.28, 0.35);

    // Tone 2: 1046.5 Hz (C6)
    playTone(ctx, 1046.5, now + 0.18, 0.38, 0.45);

    // Tone 3 (harmonics echo): 1318.5 Hz (E6)
    playTone(ctx, 1318.5, now + 0.36, 0.45, 0.3);
  }

  function playTone(ctx, freq, startTime, duration, gainLevel) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    // Smooth envelope (attack & decay)
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(gainLevel, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  /**
   * Starts a repeating alarm ring until stopped
   */
  function startAlarm(onRing) {
    if (isRinging) return;
    isRinging = true;

    playChime();
    if (onRing) onRing();

    // Repeat chime every 1.6 seconds
    alarmInterval = setInterval(() => {
      if (isRinging) {
        playChime();
        if (onRing) onRing();
      }
    }, 1600);
  }

  /**
   * Stops the ongoing alarm ring
   */
  function stopAlarm() {
    isRinging = false;
    if (alarmInterval) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
  }

  return {
    playChime,
    startAlarm,
    stopAlarm,
    isRinging: () => isRinging
  };
}));
