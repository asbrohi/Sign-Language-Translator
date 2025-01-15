# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import tensorflow as tf
import os

app = Flask(__name__)
CORS(app)

# Load your trained model
model = tf.keras.models.load_model('gesture_recognition_model.keras', compile=False)
print("Model loaded successfully.")

DATA_PATH = r'd:\\FYP Data\\Front-end\\SLT-Web-App-main\\slt-project'
# Define gestures
gestures = np.array([
    gesture for gesture in os.listdir(DATA_PATH)
    if os.path.isdir(os.path.join(DATA_PATH, gesture))
])

sequence_length = 15  # Ensure this matches your training sequence length
num_landmarks = 21 * 3 * 2  # Number of landmarks per frame (both hands)

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
        if input_data.shape != (sequence_length, num_landmarks):
            return jsonify({'error': f'Invalid input shape. Expected ({sequence_length}, {num_landmarks}) but got {input_data.shape}'}), 400
        input_data = input_data.reshape(1, sequence_length, num_landmarks)

        # Make prediction
        probabilities = model.predict(input_data, verbose=0)[0]
        prediction_index = np.argmax(probabilities)
        confidence = float(probabilities[prediction_index])

        # Prepare the response
        response = {
            'gesture': gestures[prediction_index],
            'confidence': confidence
        }
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)
