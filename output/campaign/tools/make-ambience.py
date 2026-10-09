"""Generate original, audible 16-second ambient loops for the local campaign table."""
from pathlib import Path
import wave
import numpy as np

RATE = 16000
SECONDS = 16
N = RATE * SECONDS
t = np.arange(N, dtype=np.float64) / RATE
out = Path(__file__).resolve().parents[1] / 'audio'
out.mkdir(exist_ok=True)
rng = np.random.default_rng(20260923)


def smooth_noise(width):
    samples = rng.standard_normal(N)
    pad = np.concatenate((samples[-width:], samples, samples[:width]))
    kernel = np.ones(width) / width
    result = np.convolve(pad, kernel, mode='same')[width:width + N]
    return result / max(1e-9, np.max(np.abs(result)))


def tone(hz, phase=0):
    return np.sin(2 * np.pi * hz * t + phase)


def pulse(at, length, frequency):
    elapsed = (t - at) % SECONDS
    env = np.exp(-elapsed / length) * (elapsed < length * 7)
    return env * tone(frequency)


def save(name, signal):
    signal = np.asarray(signal, dtype=np.float64)
    # Match the first and last second so the ambience can repeat at the table.
    seam = RATE
    blend = np.linspace(0, 1, seam)
    signal[-seam:] += (signal[0] - signal[-1]) * blend
    rms = np.sqrt(np.mean(signal**2))
    peak = np.max(np.abs(signal))
    signal = np.clip(signal * min(.17/max(rms,1e-9), .88/max(peak,1e-9)), -0.95, 0.95)
    data = (signal * 32767).astype('<i2')
    with wave.open(str(out / name), 'wb') as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(RATE)
        stream.writeframes(data.tobytes())


wind = smooth_noise(700) * (0.35 + 0.1 * tone(0.125))
stream = smooth_noise(15) * 0.24 + smooth_noise(190) * 0.20
save('road-wind.wav', wind + 0.055 * pulse(5, .15, 920) + 0.04 * pulse(11, .12, 1030))
save('cragmaw-stream.wav', stream + wind * .18 + .12 * pulse(3, .20, 620) + .09 * pulse(9, .17, 740))
save('phandalin-evening.wav', wind * .42 + .07 * smooth_noise(70) + .10 * pulse(7, 1.4, 392))
crowd = smooth_noise(420) * .16 + tone(93) * .018 + tone(139) * .015
save('yawning-portal-room.wav', crowd + .12 * pulse(4, .12, 1170) + .08 * pulse(11, .16, 880))
echo = .18 * tone(55) * (1 + .22 * tone(.125)) + .10 * tone(82.5) + .09 * pulse(8, 2, 220)
save('echo-pressure-spoiler.wav', echo)
nine = .055 * tone(110) + sum(.035 * pulse(i * 1.6, .35, 350 + 28 * i) for i in range(9))
save('nine-resonances-spoiler.wav', nine)
