# data_collection.py

import cv2
import os
import numpy as np
import mediapipe as mp

# Define the gestures you want to collect data for
gestures = ['5']

# Number of sequences per gesture
num_sequences = 30

# Number of frames per sequence
sequence_length = 15

# Number of landmarks per hand (21 landmarks * 3 coordinates)
num_landmarks_per_hand = 21 * 3

# Directory to save the data
DATA_PATH = os.path.join('MP_Data')

# Create the data directory if it doesn't exist
if not os.path.exists(DATA_PATH):
    os.makedirs(DATA_PATH)

# Create subdirectories for each gesture
for gesture in gestures:
    gesture_path = os.path.join(DATA_PATH, gesture)
    if not os.path.exists(gesture_path):
        os.makedirs(gesture_path)

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands

# Access the camera
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Cannot access camera.")
    exit()

with mp_hands.Hands(
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5) as hands:

    for gesture in gestures:
        print(f"Collecting data for gesture: {gesture}")
        gesture_path = os.path.join(DATA_PATH, gesture)
        
        for sequence in range(num_sequences):
            landmarks_sequence = []
            print(f"  Starting sequence {sequence+1}/{num_sequences}")
            frame_count = 0
            
            while frame_count < sequence_length:
                ret, frame = cap.read()
                if not ret:
                    print("Failed to capture image.")
                    break

                # Flip the frame horizontally for a later selfie-view display
                frame = cv2.flip(frame, 1)

                # Convert the BGR image to RGB
                image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image.flags.writeable = False  # Improve performance

                # Process the image and find hand landmarks
                results = hands.process(image)

                # Set the flag to true to draw landmarks on the image
                image.flags.writeable = True
                image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

                # Collect hand landmarks if detected
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

                    landmarks_sequence.append(combined_landmarks)
                    frame_count += 1

                    # Draw hand landmarks on the image (optional)
                    for hand_landmarks in results.multi_hand_landmarks:
                        mp.solutions.drawing_utils.draw_landmarks(
                            image, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                    # Show progress
                    cv2.putText(
                        image, f'Collecting {gesture} - Seq {sequence+1}', (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2, cv2.LINE_AA)
                else:
                    # Indicate that no hands are detected
                    cv2.putText(
                        image, 'No hands detected', (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2, cv2.LINE_AA)

                # Display the frame
                cv2.imshow('Data Collection', image)

                # Break the loop if 'q' is pressed
                if cv2.waitKey(10) & 0xFF == ord('q'):
                    cap.release()
                    cv2.destroyAllWindows()
                    exit()

            # Save the sequence of landmarks
            sequence_path = os.path.join(gesture_path, str(sequence))
            if not os.path.exists(sequence_path):
                os.makedirs(sequence_path)
            np.save(os.path.join(sequence_path, 'landmarks.npy'), landmarks_sequence)

cap.release()
cv2.destroyAllWindows()
