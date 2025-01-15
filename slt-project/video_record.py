import cv2
import numpy as np
import os
import mediapipe as mp
import tensorflow as tf
import sys
import language_tool_python
import traceback
import pyttsx3
import threading
import tkinter as tk
import win32gui
import win32con
import time
import datetime
from moviepy.editor import ImageSequenceClip, AudioFileClip
import sounddevice as sd
from scipy.io.wavfile import write
import queue

# Configure standard output to use UTF-8 encoding
sys.stdout.reconfigure(encoding='utf-8')

# Suppress TensorFlow logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

# Initialize text-to-speech engine
engine = pyttsx3.init()
rate = engine.getProperty('rate')
engine.setProperty('rate', rate + 50)

# Initialize variables for recording
recorded_frames = []
audio_data = []
audio_queue = queue.Queue()
samplerate = 44100  # Sample rate in Hz
channels = 2        # Number of audio channels

# Function to handle speech
def speak_text(text):
    def run_speech():
        engine.say(text)
        engine.runAndWait()
    t = threading.Thread(target=run_speech)
    t.start()

# Get the directory where the script is located
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
            win32gui.ShowWindow(hwnd, win32con.SW_SHOW)
            win32gui.SetForegroundWindow(hwnd)
            win32gui.BringWindowToTop(hwnd)
    except Exception as e:
        print(f"Failed to bring window to front: {e}")

# Allow some time for the window to initialize
time.sleep(0.5)
bring_window_to_front(window_name)

# Initialize variables for gesture recognition
sequence = []
predicted_gesture = ''
last_prediction = ''
sentence = []
grammar_result = ''
threshold = 0.8  # Confidence threshold

# Video recording variables
is_recording = False
is_paused = False

# Load button icons with error handling
icon_size = (50, 50)  # Desired icon size
icon_paths = {
    'Play': os.path.join(script_dir, 'icons', 'play.png'),
    'Pause': os.path.join(script_dir, 'icons', 'pause.png'),
    'Save': os.path.join(script_dir, 'icons', 'save.png')
}

icons = {}
for label, path in icon_paths.items():
    icon = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if icon is None:
        print(f"Error: Could not load {label} icon from {path}. Please ensure the file exists.")
        # Create a placeholder icon
        placeholder = np.zeros((icon_size[1], icon_size[0], 3), dtype=np.uint8)
        cv2.putText(placeholder, label[0], (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)
        icons[label] = placeholder
    else:
        icons[label] = cv2.resize(icon, icon_size)

# Button definitions
buttons = [
    {'pos': None, 'size': icon_size, 'icon': icons['Pause'], 'label': 'Pause', 'is_active': False, 'last_clicked': 0},
    {'pos': None, 'size': icon_size, 'icon': icons['Play'], 'label': 'Play', 'is_active': False, 'last_clicked': 0},
    {'pos': None, 'size': icon_size, 'icon': icons['Save'], 'label': 'Save', 'is_active': False, 'last_clicked': 0}
]

# Calculate button positions to center them at the top
spacing = 20  # Space between buttons
total_button_width = len(buttons) * icon_size[0] + (len(buttons) - 1) * spacing
start_x = (window_width - total_button_width) // 2
for idx, button in enumerate(buttons):
    x = start_x + idx * (icon_size[0] + spacing)
    y = 10  # Top margin
    button['pos'] = (x, y)

# Duration for click effect in seconds
click_effect_duration = 0.2

def overlay_icon(frame, icon, pos, is_active=False):
    x, y = pos
    icon_h, icon_w = icon.shape[:2]

    # Ensure the icon fits within the frame
    if y + icon_h > frame.shape[0] or x + icon_w > frame.shape[1]:
        print(f"Warning: Icon at position {pos} exceeds frame dimensions.")
        return

    # If the icon has an alpha channel, use it as mask
    if icon.shape[2] == 4:
        alpha_s = icon[:, :, 3] / 255.0
        alpha_l = 1.0 - alpha_s

        for c in range(0, 3):
            frame[y:y+icon_h, x:x+icon_w, c] = (alpha_s * icon[:, :, c] +
                                                alpha_l * frame[y:y+icon_h, x:x+icon_w, c])
    else:
        frame[y:y+icon_h, x:x+icon_w] = icon

    # If the button is active, overlay a semi-transparent layer for effect
    if is_active:
        overlay = frame.copy()
        cv2.rectangle(overlay, (x, y), (x + icon_w, y + icon_h), (0, 255, 0), -1)
        alpha = 0.3  # Transparency factor
        cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

def draw_buttons(frame):
    current_time = time.time()
    for button in buttons:
        # Check if the click effect duration has passed
        if button['is_active'] and (current_time - button['last_clicked'] > click_effect_duration):
            button['is_active'] = False

        # Draw the button with effect if active
        overlay_icon(frame, button['icon'], button['pos'], is_active=button['is_active'])

def audio_callback(indata, frames, time_info, status):
    audio_queue.put(indata.copy())

def start_audio_recording():
    global audio_stream
    # Replace 'Stereo Mix' with your system's audio device name or index
    device_info = sd.query_devices()
    device_index = None
    for idx, device in enumerate(device_info):
        if 'Stereo Mix' in device['name']:
            device_index = idx
            break
    if device_index is None:
        print("Stereo Mix device not found. Please enable it or specify the correct device.")
        device_index = sd.default.device[0]  # Use default input device

    audio_stream = sd.InputStream(
        samplerate=samplerate,
        channels=channels,
        callback=audio_callback,
        dtype='float32',
        device=device_index
    )
    audio_stream.start()

def stop_audio_recording():
    audio_stream.stop()
    audio_stream.close()

def save_video_with_audio():
    # Generate a unique filename with timestamp
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    video_filename = f'output_{timestamp}.mp4'
    audio_filename = f'audio_{timestamp}.wav'

    # Save the audio data to a WAV file
    if audio_data:
        audio_np = np.concatenate(audio_data, axis=0)
        write(audio_filename, samplerate, audio_np)
    else:
        print("No audio data recorded.")
        return

    # Extract frames
    frames = [f['frame'] for f in recorded_frames]

    # Create a video clip from the frames
    fps = 20  # Adjust this to your desired frame rate
    video_clip = ImageSequenceClip(frames, fps=fps)

    # Load the audio file using moviepy
    audio_clip = AudioFileClip(audio_filename)

    # Set the audio to the video clip
    video_clip = video_clip.set_audio(audio_clip)

    # Write the final video file
    video_clip.write_videofile(video_filename, codec='libx264', audio_codec='aac')

    print(f"Video saved as '{video_filename}'")

    # Clean up temporary audio file
    audio_clip.close()
    os.remove(audio_filename)

    # Reset recorded frames and audio data
    recorded_frames.clear()
    audio_data.clear()
    audio_queue.queue.clear()

def button_clicked(event, x, y, flags, param):
    global is_recording, is_paused, recorded_frames, audio_data
    if event == cv2.EVENT_LBUTTONDOWN:
        for button in buttons:
            bx, by = button['pos']
            bw, bh = button['size']
            if bx <= x <= bx + bw and by <= y <= by + bh:
                label = button['label']
                # Activate the button for visual effect
                button['is_active'] = True
                button['last_clicked'] = time.time()

                if label == 'Play':
                    if not is_recording:
                        is_recording = True
                        is_paused = False
                        recorded_frames = []
                        audio_data = []
                        audio_queue.queue.clear()
                        start_audio_recording()
                        print("Recording started.")
                    elif is_paused:
                        is_paused = False
                        print("Recording resumed.")
                elif label == 'Pause':
                    if is_recording and not is_paused:
                        is_paused = True
                        print("Recording paused.")
                elif label == 'Save':
                    if recorded_frames:
                        is_recording = False
                        is_paused = False
                        stop_audio_recording()
                        # Proceed to save the video and audio
                        save_video_with_audio()
                    else:
                        print("No video to save.")
                break

# Set mouse callback for the window
cv2.setMouseCallback(window_name, button_clicked)

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

            # Resize frame to match window size
            frame = cv2.resize(frame, (window_width, window_height))

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
                left_hand_landmarks = hand_landmarks_dict['Left'] or [0.0] * num_landmarks_per_hand
                right_hand_landmarks = hand_landmarks_dict['Right'] or [0.0] * num_landmarks_per_hand
                combined_landmarks = left_hand_landmarks + right_hand_landmarks

                sequence.append(combined_landmarks)
                sequence = sequence[-sequence_length:]  # Keep the last 'sequence_length' frames

                # Draw hand landmarks on the image
                for hand_landmarks in results.multi_hand_landmarks:
                    mp.solutions.drawing_utils.draw_landmarks(
                        image, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                # Perform prediction if we have enough frames
                if len(sequence) == sequence_length:
                    input_data = np.expand_dims(sequence, axis=0)
                    input_data = np.array(input_data, dtype=np.float32)

                    probabilities = model.predict(input_data, verbose=0)[0]
                    prediction = np.argmax(probabilities)
                    confidence = probabilities[prediction]
                    print(f"Predicted gesture: {gestures[prediction]}, Confidence: {confidence}")

                    if confidence > threshold:
                        predicted_gesture = gestures[prediction]
                        if predicted_gesture != last_prediction:
                            sentence.append(predicted_gesture)
                            last_prediction = predicted_gesture

                            # Add text-to-speech for the predicted gesture
                            speak_text(predicted_gesture)

                    else:
                        predicted_gesture = 'Unknown'

                    # Reset sequence after prediction
                    sequence = []
            else:
                # When no hands are detected, do nothing
                pass

            # Limit the sentence length
            if len(sentence) > 7:
                sentence = sentence[-7:]

            # Check for key presses
            key = cv2.waitKey(1) & 0xFF

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
                image, text_to_display, (text_X_coord, window_height - 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)

            # Display the predicted gesture on the frame
            if predicted_gesture and predicted_gesture != 'Unknown':
                cv2.putText(
                    image, f'Gesture: {predicted_gesture}', (10, window_height - 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0),
                    2, cv2.LINE_AA)

            # Draw buttons on the image with click effects
            draw_buttons(image)

            # If recording and not paused, save the frame and collect audio
            if is_recording and not is_paused:
                # Record the frame with timestamp
                recorded_frames.append({'frame': image.copy(), 'timestamp': time.time()})

                # Collect audio data from the queue
                while not audio_queue.empty():
                    data = audio_queue.get()
                    audio_data.append(data)

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
engine.stop()
