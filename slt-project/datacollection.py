# datacollection.py

import cv2
import os
import numpy as np
import mediapipe as mp
import tkinter as tk  # For getting screen size
from tkinter import simpledialog, messagebox
import subprocess
import sys
import win32gui  # For window management
import time  # For delays

# Constants
GESTURES_FILE = 'gestures.txt'  # File to keep track of existing gestures
DATA_PATH = 'MP_Data'
NUM_SEQUENCES = 30
SEQUENCE_LENGTH = 15
NUM_LANDMARKS_PER_HAND = 21 * 3  # 21 landmarks * 3 coordinates

# Function to get gesture labels from the user via a GUI dialog
def get_gesture_labels_gui(existing_gestures):
    # Initialize Tkinter root
    root = tk.Tk()
    root.withdraw()  # Hide the root window

    while True:
        # Prompt the user to enter gesture labels
        labels = simpledialog.askstring(
            title="Gesture Labels",
            prompt="Enter gesture labels separated by commas (e.g., fist, thumbs_up, okay):"
        )

        if labels is None:
            # User closed the dialog or pressed cancel
            if messagebox.askyesno("Exit", "No labels entered. Do you want to exit?"):
                root.destroy()
                exit()

        # Process the input
        gesture_labels = [label.strip() for label in labels.split(',') if label.strip()]
        if gesture_labels:
            # Check for duplicate gestures
            duplicate_gestures = set(gesture_labels) & set(existing_gestures)
            if duplicate_gestures:
                messagebox.showerror(
                    "Duplicate Gestures",
                    f"The following gestures already exist: {', '.join(duplicate_gestures)}. Please enter new gestures."
                )
            else:
                root.destroy()
                return gesture_labels
        else:
            messagebox.showerror("Invalid Input", "Please enter at least one valid gesture label.")

# Function to load existing gestures from gestures.txt
def load_existing_gestures():
    if os.path.exists(GESTURES_FILE):
        with open(GESTURES_FILE, 'r') as f:
            gestures = [line.strip() for line in f.readlines() if line.strip()]
        return gestures
    else:
        return []

# Function to update gestures.txt with new gestures
def update_gestures_file(new_gestures):
    with open(GESTURES_FILE, 'a') as f:
        for gesture in new_gestures:
            f.write(f"{gesture}\n")

# Function to call model.py for retraining
def retrain_model():
    try:
        print("Retraining the model with the updated dataset...")
        # Ensure model.py is in the same directory
        subprocess.check_call([sys.executable, 'model.py'])
        print("Model retraining completed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while retraining the model: {e}")
        messagebox.showerror("Model Retraining Error", f"An error occurred while retraining the model:\n{e}")

def main():
    # Load existing gestures
    existing_gestures = load_existing_gestures()

    # Get gesture labels from the user via GUI
    gestures = get_gesture_labels_gui(existing_gestures)

    # Number of sequences per gesture
    num_sequences = NUM_SEQUENCES

    # Number of frames per sequence
    sequence_length = SEQUENCE_LENGTH

    # Directory to save the data
    DATA_PATH_FULL = os.path.join(DATA_PATH)

    # Create the data directory if it doesn't exist
    if not os.path.exists(DATA_PATH_FULL):
        os.makedirs(DATA_PATH_FULL)

    # Create subdirectories for each gesture
    for gesture in gestures:
        gesture_path = os.path.join(DATA_PATH_FULL, gesture)
        if not os.path.exists(gesture_path):
            os.makedirs(gesture_path)

    # Initialize MediaPipe Hands
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils

    # Access the camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        messagebox.showerror("Camera Error", "Cannot access the camera.")
        exit()

    # =======================
    # === Window Configuration
    # =======================

    # Create and configure the OpenCV window
    window_name = 'Data Collection'
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

    # Get screen size using tkinter
    root = tk.Tk()
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()
    root.destroy()

    # Set window size
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

    # =======================
    # === End Window Configuration
    # =======================

    with mp_hands.Hands(
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5) as hands:

        for gesture in gestures:
            print(f"\nCollecting data for gesture: '{gesture}'")
            gesture_path = os.path.join(DATA_PATH_FULL, gesture)

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
                        left_hand_landmarks = hand_landmarks_dict['Left'] or [0.0] * NUM_LANDMARKS_PER_HAND
                        right_hand_landmarks = hand_landmarks_dict['Right'] or [0.0] * NUM_LANDMARKS_PER_HAND
                        combined_landmarks = left_hand_landmarks + right_hand_landmarks

                        landmarks_sequence.append(combined_landmarks)
                        frame_count += 1

                        # Draw hand landmarks on the image (optional)
                        for hand_landmarks in results.multi_hand_landmarks:
                            mp_drawing.draw_landmarks(
                                image, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                        # Show progress on the image
                        cv2.putText(
                            image, f'Collecting "{gesture}" - Seq {sequence+1}/{num_sequences}', (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2, cv2.LINE_AA)
                    else:
                        # Indicate that no hands are detected
                        cv2.putText(
                            image, 'No hands detected', (10, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2, cv2.LINE_AA)

                    # Display the frame
                    cv2.imshow(window_name, image)

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
                print(f"  Sequence {sequence+1} saved.")

    print("\nData collection complete.")
    cap.release()
    cv2.destroyAllWindows()

    # Update gestures.txt with new gestures
    update_gestures_file(gestures)

    # Retrain the model if new gestures were added
    if gestures:
        retrain_model()
    
    # ================================
    # === Add Tkinter MessageBox Here ===
    # ================================

    # Initialize a new Tkinter root window
        root = tk.Tk()
        root.withdraw()  # Hide the root window

    # Display the success message
        messagebox.showinfo("Model Training", "Model has been retrained successfully!")

    # Destroy the root window after the message box is closed
        root.destroy()
        

if __name__ == "__main__":
    main()
