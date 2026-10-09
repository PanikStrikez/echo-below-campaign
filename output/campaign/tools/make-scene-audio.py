"""Create original looping fantasy scene music and short table cues.

Uses only NumPy and the Python standard library. Rerunning this script makes
the same deterministic WAV files; no external recordings or samples are used.
"""
from pathlib import Path
import wave
import numpy as np

RATE = 22050
SECONDS = 24
N = RATE * SECONDS
OUT = Path(__file__).resolve().parents[1] / 'audio'
OUT.mkdir(exist_ok=True)
RNG = np.random.default_rng(1701)


def hz(note):
    return 440.0 * 2 ** ((note - 69) / 12)


def smooth_noise(length, width):
    noise = RNG.standard_normal(length)
    kernel = np.ones(width) / width
    return np.convolve(noise, kernel, mode='same')


def note_audio(note, duration, voice='lute'):
    n = max(1, round(duration * RATE))
    t = np.arange(n) / RATE
    f = hz(note)
    if voice == 'lute':
        wave_data = sum((1 / k ** 1.38) * np.sin(2 * np.pi * f * k * t + .13 * k)
                        for k in range(1, 8))
        env = (1 - np.exp(-t * 80)) * np.exp(-t * 2.6)
    elif voice == 'bell':
        wave_data = (np.sin(2*np.pi*f*t) + .36*np.sin(2*np.pi*f*2.01*t)
                     + .17*np.sin(2*np.pi*f*3.93*t))
        env = (1 - np.exp(-t * 100)) * np.exp(-t * 1.35)
    elif voice == 'horn':
        wave_data = sum((1 / k ** 2) * np.sin(2*np.pi*f*k*t)
                        for k in range(1, 6))
        env = (1 - np.exp(-t * 8)) * np.minimum(1, np.maximum(0, duration-t) * 4)
    else:  # low, slowly moving string-like pad
        wave_data = (np.sin(2*np.pi*f*t + .05*np.sin(2*np.pi*.34*t))
                     + .25*np.sin(2*np.pi*2*f*t))
        env = (1 - np.exp(-t * 4)) * np.minimum(1, np.maximum(0, duration-t) * 2)
    return wave_data * env


def add_note(track, note, at, duration, gain=.1, voice='lute', pan=0):
    sound = note_audio(note, duration, voice) * gain
    start = round(at * RATE)
    if start >= len(track):
        return
    end = min(len(track), start + len(sound))
    left, right = (.82-pan*.35), (.82+pan*.35)
    track[start:end, 0] += sound[:end-start] * left
    track[start:end, 1] += sound[:end-start] * right


def add_drum(track, at, tone=72, gain=.15, duration=.35, pan=0):
    n = round(duration * RATE)
    t = np.arange(n) / RATE
    kick = np.sin(2*np.pi*(tone*t + 32*t*np.exp(-t*28))) * np.exp(-t*15)
    air = smooth_noise(n, 8) * np.exp(-t*22)
    sound = (kick + .6*air) * gain
    start = round(at*RATE)
    end = min(len(track),start+n)
    if start < len(track):
        track[start:end,0] += sound[:end-start]*(1-pan*.25)
        track[start:end,1] += sound[:end-start]*(1+pan*.25)


def bed(track, notes, gain=.055):
    for i, pitch in enumerate(notes):
        add_note(track,pitch,i*6,6.6,gain,'pad',(-1)**i*.35)
        add_note(track,pitch+12,i*6,6.4,gain*.38,'pad',-(-1)**i*.35)


def echo(track, delay=.23, amount=.18):
    offset = round(delay*RATE)
    dry = track.copy()
    track[offset:] += dry[:-offset,::-1] * amount


def save_music(name, track):
    echo(track)
    # Bring the loop's endpoint to its start without a click.
    span = round(.6*RATE)
    slope = np.linspace(0,1,span)[:,None]
    track[-span:] += (track[0]-track[-1]) * slope
    peak = np.max(np.abs(track))
    rms = np.sqrt(np.mean(track**2))
    track = track * min(.14/max(rms,1e-9), .88/max(peak,1e-9))
    pcm = (np.clip(track,-.95,.95)*32767).astype('<i2')
    with wave.open(str(OUT/name),'wb') as file:
        file.setnchannels(2);file.setsampwidth(2);file.setframerate(RATE)
        file.writeframes(pcm.tobytes())


def music(name, chords, melody, mood):
    track = np.zeros((N,2),dtype=np.float64)
    bed(track,chords,.052 if mood not in ('battle','boss') else .067)
    for bar, root in enumerate(chords):
        at = bar*6
        add_note(track,root-12,at,5.5,.105 if mood in ('battle','boss') else .065,'horn' if mood in ('battle','boss') else 'pad')
        if mood in ('journey','village','hope'):
            for beat in range(6):
                pitch = [root,root+7,root+12,root+7,root+4,root+7][beat]
                add_note(track,pitch+12,at+beat,.62,.105 if mood!='hope' else .09,'lute',-.6 if beat%2 else .6)
        elif mood in ('tension','cave','parley'):
            for beat in (0,2,3.5,5):
                add_note(track,root+12,at+beat,1.4,.06,'bell',-.45 if beat%2 else .45)
        elif mood in ('battle','boss'):
            for beat in np.arange(0,6,.75 if mood=='boss' else 1):
                add_drum(track,at+beat,64 if mood=='boss' else 83,.17 if beat%1.5==0 else .085,.31)
                add_note(track,root+12,at+beat,.55,.048,'lute')
    for at,pitch in melody:
        add_note(track,pitch,at,1.8 if mood in ('journey','village','hope') else 1.2,
                 .105 if mood in ('journey','village','hope') else .075,
                 'horn' if mood in ('battle','boss') else 'bell',.2)
    save_music(name,track)


music('score-road-journey.wav',[48,53,50,55],[(1,72),(3,74),(7,76),(9,72),(13,69),(15,72),(19,74),(21,76)],'journey')
music('score-uneasy-road.wav',[45,44,45,41],[(3,64),(6,63),(10,64),(14,60),(18,64),(21,63)],'tension')
music('score-goblin-ambush.wav',[43,41,43,38],[(1,67),(2.5,66),(7,65),(8.5,67),(13,70),(14.5,67),(19,65),(20.5,62)],'battle')
music('score-forest-trail.wav',[50,48,45,48],[(2,69),(5,72),(8,71),(11,69),(14,67),(17,69),(20,72)],'tension')
music('score-cave-shadows.wav',[38,41,36,38],[(2,57),(5,60),(9,56),(12,57),(16,53),(20,56)],'cave')
music('score-goblin-bargain.wav',[41,43,41,36],[(1,65),(5,64),(7,62),(11,65),(13,67),(17,65),(19,64)],'parley')
music('score-klarg.wav',[36,38,34,36],[(1,60),(3,63),(7,58),(9,60),(13,63),(15,65),(19,60),(21,58)],'boss')
music('score-rescue.wav',[48,53,55,53],[(1,72),(3,76),(7,74),(9,77),(13,79),(15,76),(19,74),(21,72)],'hope')
music('score-phandalin.wav',[53,55,48,53],[(1,72),(4,74),(7,76),(10,74),(13,72),(16,69),(19,72),(22,76)],'village')


def save_effect(name, seconds, build):
    count=round(seconds*RATE)
    t=np.arange(count)/RATE
    signal=build(t,count)
    signal*=(np.minimum(1,t*60)*np.minimum(1,np.maximum(0,seconds-t)*8))[:,None]
    signal*=min(1,.84/max(np.max(np.abs(signal)),1e-9))
    pcm=(np.clip(signal,-.95,.95)*32767).astype('<i2')
    with wave.open(str(OUT/name),'wb') as file:
        file.setnchannels(2);file.setsampwidth(2);file.setframerate(RATE)
        file.writeframes(pcm.tobytes())


def sting(t,n):
    fall=np.exp(-t*2.2)
    pulse=np.sin(2*np.pi*(180*t+70*t*np.exp(-t*6)))
    noise=smooth_noise(n,10)
    return np.stack([(pulse*.42+noise*.32)*fall,(pulse*.38+noise*.36)*fall],axis=1)


def snare(t,n):
    crack=smooth_noise(n,2)*np.exp(-t*40)
    rope=np.sin(2*np.pi*(740*t-280*t*t))*np.exp(-t*7)
    return np.stack([crack*.7+rope*.22,crack*.65+rope*.25],axis=1)


def flood(t,n):
    water=smooth_noise(n,12)
    swell=np.minimum(1,t/2)*np.minimum(1,np.maximum(0,5.5-t)/1.3)
    rumble=np.sin(2*np.pi*48*t)*.15
    return np.stack([(water*.53+rumble)*swell,(np.roll(water,190)*.56+rumble)*swell],axis=1)


def wolf(t,n):
    growl=np.sin(2*np.pi*(89*t+4*np.sin(2*np.pi*6*t)))
    grit=smooth_noise(n,8)
    env=np.sin(np.pi*np.clip(t/2.5,0,1))**2
    return np.stack([(growl*.4+grit*.25)*env,(growl*.44+grit*.22)*env],axis=1)


def echo_reveal(t,n):
    shimmer=sum(np.sin(2*np.pi*hz(note)*t)*np.exp(-t*(.32+i*.08))*.23
                for i,note in enumerate([60,67,74,81]))
    return np.stack([shimmer,np.roll(shimmer,round(.07*RATE))],axis=1)


for filename,duration,fn in [
    ('fx-goblins-reveal.wav',2.5,sting),('fx-snare-snap.wav',2.2,snare),
    ('fx-flood-surge.wav',6,flood),('fx-wolf-growl.wav',3,wolf),
    ('fx-echo-discovery.wav',4,echo_reveal)]:
    save_effect(filename,duration,fn)
