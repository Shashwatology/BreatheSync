import os
import pickle
import numpy as np
from typing import Dict, Any

class LungSoundModel:
    """Model loader for lung sound classification (Normal, Crackle, Wheeze, Both)"""
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), 'respiratory_rf_model.pkl')
        self.model = None
        self.model_loaded = False
        self._load_model()
        
    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                self.model_loaded = True
            except Exception as e:
                print(f"Error loading lung sound model: {e}")
                self.model_loaded = False
        else:
            self.model_loaded = False
            
    def predict(self, features) -> Dict[str, Any]:
        """
        Predict lung sound classification
        """
        if not self.model_loaded:
            return {
                "status": "model_not_loaded",
                "message": "Train and place respiratory_rf_model.pkl in models/ directory"
            }
            
        try:
            # Assumes features are passed in the correct format for the model
            # For sklearn models, usually requires a 2D array: [features_array]
            prediction = self.model.predict([features])[0]
            
            # Map back to classes based on the notebook definitions
            classes = ['Normal', 'Crackle', 'Wheeze', 'Both']
            predicted_class = classes[prediction] if isinstance(prediction, (int, np.integer)) else str(prediction)
            
            # Get probabilities if available
            confidence = 0.0
            if hasattr(self.model, "predict_proba"):
                proba = self.model.predict_proba([features])[0]
                confidence = float(max(proba))
                
            return {
                "sound_classification": predicted_class,
                "confidence": round(confidence, 2),
                "requires_attention": predicted_class != "Normal"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Prediction failed: {e}"
            }

# Singleton instance
lung_classifier = LungSoundModel()
