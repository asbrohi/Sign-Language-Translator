# main.py

import cv2
import numpy as np
import os
import mediapipe as mp
import tensorflow as tf
import sys
import language_tool_python
import traceback  # For detailed exception information

# Configure standard output to use UTF-8 encoding
sys.stdout.reconfigure(encoding='utf-8')

# Suppress TensorFlow logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logging

# Load the trained model
try:
    model = tf.keras.models.load_model('gesture_recognition_model.keras', compile=False)
    print(f"Model loaded successfully.")
    print(f"Model input shape: {model.input_shape}")
except Exception as e:
    print(f"An error occurred while loading the model: {e}")
    traceback.print_exc()
    exit()

# Define the gestures
gestures = np.array([
    gesture for gesture in os.listdir('MP_Data')
    if os.path.isdir(os.path.join('MP_Data', gesture))
])
print(f"Gestures: {gestures}")

# Number of frames in each sequence
sequence_length = 15

# Number of landmarks per hand (21 landmarks * 3 coordinates)
num_landmarks_per_hand = 21 * 3
num_landmarks = num_landmarks_per_hand * 2  # For both hands

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands

# Initialize the grammar correction tool
tool = language_tool_python.LanguageToolPublicAPI('en-UK')

# Access the camera
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Cannot access camera.")
    exit()

sequence = []
predicted_gesture = ''
last_prediction = ''
sentence = []
grammar_result = ''
threshold = 0.8  # Confidence threshold

with mp_hands.Hands(
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5) as hands:
    print("Press 'q' to quit.")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Failed to capture image.")
            break

        try:
            # Flip the frame horizontally for a later selfie-view display
            frame = cv2.flip(frame, 1)

            # Convert the BGR image to RGB
            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image_rgb.flags.writeable = False  # Improve performance

            # Process the image and find hand landmarks
            results = hands.process(image_rgb)

            # Set the flag to true to draw landmarks on the image
            image_rgb.flags.writeable = True
            image = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2BGR)

            if results.multi_hand_landmarks and results.multi_handedness:
                # Prepare dictionaries to hold landmarks for left and right hands
                hand_landmarks_dict = {'Left': None, 'Right': None}

                # Loop through detected hands
                for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                    # Get the handedness label
                    hand_label = results.multi_handedness[idx].classification[0].label
                    # Extract landmark coordinates
                    landmarks = []
                    for lm in hand_landmarks.landmark:
                        landmarks.extend([lm.x, lm.y, lm.z])
                    hand_landmarks_dict[hand_label] = landmarks

                # Prepare combined landmarks for both hands
                # If a hand is not present, fill with zeros
                left_hand_landmarks = hand_landmarks_dict['Left'] or [0.0] * num_landmarks_per_hand
                right_hand_landmarks = hand_landmarks_dict['Right'] or [0.0] * num_landmarks_per_hand
                combined_landmarks = left_hand_landmarks + right_hand_landmarks

                sequence.append(combined_landmarks)
                sequence = sequence[-sequence_length:]  # Keep the last 'sequence_length' frames

                # Draw hand landmarks on the image (optional)
                for hand_landmarks in results.multi_hand_landmarks:
                    mp.solutions.drawing_utils.draw_landmarks(
                        image, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                # Perform prediction if we have enough frames
                if len(sequence) == sequence_length:
                    input_data = np.expand_dims(sequence, axis=0)  # Shape: (1, sequence_length, num_landmarks)
                    input_data = np.array(input_data, dtype=np.float32)

                    # Print input data shape and type for debugging
                    # print(f"Input data shape: {input_data.shape}, dtype: {input_data.dtype}")

                    probabilities = model.predict(input_data, verbose=0)[0]
                    prediction = np.argmax(probabilities)
                    confidence = probabilities[prediction]
                    print(f"Predicted gesture: {gestures[prediction]}, Confidence: {confidence}")

                    if confidence > threshold:
                        predicted_gesture = gestures[prediction]
                        if predicted_gesture != last_prediction:
                            sentence.append(predicted_gesture)
                            last_prediction = predicted_gesture
                    else:
                        predicted_gesture = 'Unknown'

                    # Reset sequence after prediction
                    sequence = []
            else:
                # When no hands are detected, do nothing
                pass  # Removed the 'No hands detected' message

            # Limit the sentence length to a reasonable number
            if len(sentence) > 7:
                sentence = sentence[-7:]

            # Check if 'Enter' key is pressed for grammar correction
            if cv2.waitKey(1) & 0xFF == 13:  # Enter key
                text = ' '.join(sentence)
                grammar_result = tool.correct(text)
                print(f"Grammar corrected sentence: {grammar_result}")
                # Optionally, reset the sentence after correction
                # sentence = []

            # Check if 'Spacebar' is pressed to reset
            if cv2.waitKey(1) & 0xFF == ord(' '):  # Spacebar key
                sentence = []
                grammar_result = ''
                last_prediction = ''
                sequence = []

            # Display the sentence on the image
            if grammar_result:
                # Display grammar corrected sentence
                text_to_display = grammar_result
            else:
                # Display the current sentence
                text_to_display = ' '.join(sentence)

            # Calculate text size and position
            textsize = cv2.getTextSize(text_to_display, cv2.FONT_HERSHEY_SIMPLEX, 1, 2)[0]
            text_X_coord = (image.shape[1] - textsize[0]) // 2

            # Draw the sentence on the image
            cv2.putText(
                image, text_to_display, (text_X_coord, 470),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)

            # Display the predicted gesture on the frame (optional)
            if predicted_gesture and predicted_gesture != 'Unknown':
                cv2.putText(
                    image, f'Gesture: {predicted_gesture}', (10, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0),
                    2, cv2.LINE_AA)
            # If the gesture is 'Unknown' or no prediction, do not display anything

            # Display the frame
            cv2.imshow('Hand Gesture Recognition', image)

            # Break the loop if 'q' is pressed
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        except Exception as e:
            print(f"An error occurred: {e}")
            traceback.print_exc()
            break

cap.release()
cv2.destroyAllWindows()
tool.close()
