# main.py

import cv2
import numpy as np
import os
import mediapipe as mp
import tensorflow as tf
import sys
import language_tool_python
import traceback  # For detailed exception information
import pyttsx3  # Added for text-to-speech
import threading  # Added for threading
import tkinter as tk  # For getting screen size
import win32gui  # Added for window management
import time  # Added for delays

# Configure standard output to use UTF-8 encoding
sys.stdout.reconfigure(encoding='utf-8')

# Suppress TensorFlow logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow logging

# Initialize text-to-speech engine
engine = pyttsx3.init()

# Adjust speech rate to make it faster
rate = engine.getProperty('rate')
engine.setProperty('rate', rate + 50)  # Increase rate by 50 words per minute

# Function to handle speech in a separate thread
def speak_text(text):
    def run_speech():
        engine.say(text)
        engine.runAndWait()
    t = threading.Thread(target=run_speech)
    t.start()

# Get the directory where main.py is located
script_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the absolute path to the model file
model_path = os.path.join(script_dir, 'gesture_recognition_model.keras')

# Load the trained model
try:
    model = tf.keras.models.load_model(model_path, compile=False)
    print(f"Model loaded successfully.")
    print(f"Model input shape: {model.input_shape}")
except Exception as e:
    print(f"An error occurred while loading the model: {e}")
    traceback.print_exc()
    exit()

# Construct the path to the MP_Data directory
mp_data_path = os.path.join(script_dir, 'MP_Data')

# Verify that MP_Data directory exists
if not os.path.isdir(mp_data_path):
    print(f"MP_Data directory not found at {mp_data_path}")
    exit()

# Define the gestures
gestures = np.array([
    gesture for gesture in os.listdir(mp_data_path)
    if os.path.isdir(os.path.join(mp_data_path, gesture))
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

# Create and configure the OpenCV window
window_name = 'Hand Gesture Recognition'
cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

# Get screen size using tkinter
root = tk.Tk()
screen_width = root.winfo_screenwidth()
screen_height = root.winfo_screenheight()
root.destroy()

# Set window size (optional)
window_width = 800
window_height = 600
cv2.resizeWindow(window_name, window_width, window_height)

# Calculate top-left corner to center the window
x = (screen_width // 2) - (window_width // 2)
y = (screen_height // 2) - (window_height // 2)

# Move window to center
cv2.moveWindow(window_name, x, y)

# Function to bring window to front
def bring_window_to_front(window_title):
    try:
        hwnd = win32gui.FindWindow(None, window_title)
        if hwnd:
            win32gui.SetForegroundWindow(hwnd)
    except Exception as e:
        print(f"Failed to bring window to front: {e}")

# Allow some time for the window to initialize
time.sleep(0.5)
bring_window_to_front(window_name)

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

                            # Add text-to-speech for the predicted gesture in a separate thread
                            speak_text(predicted_gesture)

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
            key = cv2.waitKey(1) & 0xFF
            if key == 13:  # Enter key
                text = ' '.join(sentence)
                grammar_result = tool.correct(text)
                print(f"Grammar corrected sentence: {grammar_result}")

                # Speak the grammar corrected sentence in a separate thread
                speak_text(grammar_result)

            # Check if 'Spacebar' is pressed to reset
            if key == ord(' '):  # Spacebar key
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

            # Display the frame in the named window
            cv2.imshow(window_name, image)

            # Break the loop if 'q' is pressed
            if key == ord('q'):
                break

        except Exception as e:
            print(f"An error occurred: {e}")
            traceback.print_exc()
            break

cap.release()
cv2.destroyAllWindows()
tool.close()
engine.stop()  # Stop the TTS engine
