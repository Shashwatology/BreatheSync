import librosa
import numpy as np
import io

class AudioProcessor:
    """Service to process audio files and extract features used for model inference"""
    
    @staticmethod
    def extract_features(audio_bytes: bytes) -> dict:
        """
        Extract features from audio file bytes
        Required features: MFCCs (n_mfcc=36, n_fft=400, hop_length=160, sr=16000), 
        jitter, shimmer, HNR, spectral centroid, zero-crossing rate
        """
        try:
            # Load the audio from bytes
            y, sr = librosa.load(io.BytesIO(audio_bytes), sr=16000)
            
            # Validate input length and silence to improve prediction accuracy
            duration = librosa.get_duration(y=y, sr=sr)
            if duration < 1.5:
                raise ValueError(f"Audio is too short ({duration:.1f}s). Please record for at least 3 seconds.")
                
            # Check if there's actual signal (not just silence)
            rms = librosa.feature.rms(y=y)[0]
            if np.max(rms) < 0.01:
                raise ValueError("Audio is too quiet. Please speak up or check your microphone.")
            
            # 1. MFCCs
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=36, n_fft=400, hop_length=160)
            mfcc_mean = np.mean(mfccs.T, axis=0).tolist()
            
            # 2. Spectral Centroid
            cent = librosa.feature.spectral_centroid(y=y, sr=sr, n_fft=400, hop_length=160)
            cent_mean = np.mean(cent)
            
            # 3. Zero-crossing rate
            zcr = librosa.feature.zero_crossing_rate(y, frame_length=400, hop_length=160)
            zcr_mean = np.mean(zcr)
            
            # Note: Exact Jitter, Shimmer, and HNR calculation usually require Parselmouth/Praat.
            # We will approximate or provide placeholders if librosa doesn't have direct functions
            # for standard voice perturbation metrics without external libraries like parselmouth.
            # For demonstration, we provide mock calculations or basic approximations based on pitch.
            
            piptrack_pitches, piptrack_magnitudes = librosa.piptrack(y=y, sr=sr, n_fft=400, hop_length=160)
            # Find the max magnitude in each frame to get the pitch
            pitches = []
            for t in range(piptrack_magnitudes.shape[1]):
                index = piptrack_magnitudes[:, t].argmax()
                pitch = piptrack_pitches[index, t]
                if pitch > 0:
                    pitches.append(pitch)
            
            # Approximation of jitter (period perturbation) using pitch
            jitter = 0.0
            if len(pitches) > 1:
                periods = 1.0 / np.array(pitches)
                period_diffs = np.abs(np.diff(periods))
                jitter = float(np.mean(period_diffs) / np.mean(periods)) * 100 # percentage

            # Approximation for Shimmer (amplitude perturbation)
            rmses = librosa.feature.rms(y=y, frame_length=400, hop_length=160)[0]
            shimmer = 0.0
            if len(rmses) > 1 and np.mean(rmses) > 0:
                amp_diffs = np.abs(np.diff(rmses))
                shimmer = float(np.mean(amp_diffs) / np.mean(rmses)) * 100 # percentage
                
            # HNR (Harmonics-to-Noise Ratio)
            hnr = librosa.effects.harmonic(y) 
            hnr_val = float(np.mean(np.abs(hnr)) / (np.mean(np.abs(y - hnr)) + 1e-6)) * 10 # dB-ish approx

            return {
                "mfcc_mean": mfcc_mean,  # list of 36 floats
                "spectral_centroid_mean": float(cent_mean),
                "zero_crossing_rate_mean": float(zcr_mean),
                "jitter_percent": jitter,
                "shimmer_percent": shimmer,
                "hnr_approx": hnr_val
            }
            
        except Exception as e:
            raise Exception(f"Failed to process audio: {str(e)}")

audio_processor = AudioProcessor()
