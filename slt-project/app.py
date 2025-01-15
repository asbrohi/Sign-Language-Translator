# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import os
import sys

app = Flask(__name__)
CORS(app)

# ============================
# === Dynamic Path Configuration
# ============================

# Get the absolute path of the directory where app.py is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Define the path to the trained model (assuming it's in the same directory)
model_path = os.path.join(script_dir, 'gesture_recognition_model.keras')

# Define the path to the gestures dataset (assuming it's a subdirectory named 'MP_Data')
data_path = os.path.join(script_dir, 'MP_Data')

# ============================
# === Model Loading with Error Handling
# ============================

# Verify that the model file exists
if not os.path.exists(model_path):
    print(f"Error: Trained model file not found at {model_path}")
    sys.exit(1)

# Load the trained model
try:
    model = tf.keras.models.load_model(model_path, compile=False)
    print("Model loaded successfully.")
except Exception as e:
    print(f"An error occurred while loading the model: {e}")
    sys.exit(1)

# ============================
# === Gestures Loading with Error Handling
# ============================

# Verify that the MP_Data directory exists
if not os.path.isdir(data_path):
    print(f"Error: Gestures data directory not found at {data_path}")
    sys.exit(1)

# Define gestures by listing subdirectories in MP_Data
gestures = np.array([
    gesture for gesture in os.listdir(data_path)
    if os.path.isdir(os.path.join(data_path, gesture))
])

# Check if gestures are found
if len(gestures) == 0:
    print(f"Error: No gesture directories found in {data_path}")
    sys.exit(1)

print(f"Gestures loaded: {gestures}")

# ============================
# === Prediction Configuration
# ============================

sequence_length = 15  # Ensure this matches your training sequence length
num_landmarks_per_hand = 21 * 3  # 21 landmarks * 3 coordinates
num_landmarks = num_landmarks_per_hand * 2  # For both hands

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True)
        sequence = data.get('sequence', None)

        if sequence is None:
            return jsonify({'error': 'No sequence data provided.'}), 400

        # Convert the sequence to a numpy array
        input_data = np.array(sequence, dtype=np.float32)

        # Ensure the input has the correct shape
        expected_shape = (sequence_length, num_landmarks)
        if input_data.shape != expected_shape:
            return jsonify({
                'error': f'Invalid input shape. Expected {expected_shape} but got {input_data.shape}'
            }), 400

        # Reshape the input for the model: (1, sequence_length, num_landmarks)
        input_data = input_data.reshape(1, sequence_length, num_landmarks)

        # Make prediction
        probabilities = model.predict(input_data, verbose=0)[0]
        prediction_index = np.argmax(probabilities)
        confidence = float(probabilities[prediction_index])

        # Retrieve the gesture label
        gesture_label = gestures[prediction_index]

        # Prepare the response
        response = {
            'gesture': gesture_label,
            'confidence': confidence
        }

        return jsonify(response)

    except Exception as e:
        # Log the exception details
        print(f"Exception during prediction: {e}")
        return jsonify({'error': str(e)}), 500

# ============================
# === Flask App Runner
# ============================

if __name__ == '__main__':
    # Define host and port
    host = '0.0.0.0'  # Makes the server externally visible
    port = 5002  # Ensure this matches your configuration

    # Run the Flask app
    app.run(debug=True, host=host, port=port)
