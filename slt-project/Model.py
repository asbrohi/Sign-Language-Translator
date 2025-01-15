# model.py
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model
from tensorflow.keras.layers import (
    Input, Dense, Dropout, LayerNormalization, MultiHeadAttention, Add, TimeDistributed
)
from sklearn.model_selection import train_test_split
import sys

# Configure standard output to use UTF-8 encoding
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Set the path where the dataset is stored
DATA_PATH = os.path.join('MP_Data')

# Get the list of gestures (classes)
gestures = np.array([
    gesture for gesture in os.listdir(DATA_PATH)
    if os.path.isdir(os.path.join(DATA_PATH, gesture))
])
num_classes = len(gestures)

# Define the number of frames per sequence
sequence_length = 15

# Number of landmarks per hand (21 landmarks * 3 coordinates)
num_landmarks_per_hand = 21 * 3
num_landmarks = num_landmarks_per_hand * 2  # For both hands

# Load the dataset
def load_data():
    X, y = [], []
    for idx, gesture in enumerate(gestures):
        gesture_path = os.path.join(DATA_PATH, gesture)
        for sequence in os.listdir(gesture_path):
            sequence_path = os.path.join(gesture_path, sequence, 'landmarks.npy')
            if os.path.exists(sequence_path):
                # Load and preprocess the landmark sequence
                landmarks_sequence = np.load(sequence_path)
                # Ensure the sequence has the correct length
                if landmarks_sequence.shape[0] == sequence_length:
                    X.append(landmarks_sequence)
                    y.append(idx)
                else:
                    print(f"Sequence length mismatch in {sequence_path}")
            else:
                print(f"File not found: {sequence_path}")
    return np.array(X), np.array(y)

# Load the data
X, y = load_data()
print(f"Data loaded: {X.shape[0]} sequences with {sequence_length} frames each.")

# Reshape data
X = X.reshape(-1, sequence_length, num_landmarks)

# Split the data into training and validation sets
X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.1, random_state=42, stratify=y
)

# Build the Transformer model with spatial feature extraction
def build_transformer_model():
    # Input layer
    input_shape = (sequence_length, num_landmarks)
    model_input = Input(shape=input_shape)

    # Spatial feature extraction per frame using TimeDistributed Dense layers
    x = TimeDistributed(Dense(512, activation='relu'))(model_input)
    x = TimeDistributed(Dense(256, activation='relu'))(x)
    x = TimeDistributed(Dense(128, activation='relu'))(x)

    # Transformer Encoder Layer
    def transformer_encoder(inputs, num_heads, key_dim, ff_dim, dropout_rate):
        # Multi-head Self-Attention
        attn_output = MultiHeadAttention(num_heads=num_heads, key_dim=key_dim)(inputs, inputs)
        attn_output = Dropout(dropout_rate)(attn_output)
        attn_output = Add()([inputs, attn_output])  # Residual connection
        attn_output = LayerNormalization(epsilon=1e-6)(attn_output)

        # Feed-Forward Network
        ffn_output = Dense(ff_dim, activation='relu')(attn_output)
        ffn_output = Dense(inputs.shape[-1], activation='linear')(ffn_output)
        ffn_output = Dropout(dropout_rate)(ffn_output)
        ffn_output = Add()([attn_output, ffn_output])  # Residual connection
        ffn_output = LayerNormalization(epsilon=1e-6)(ffn_output)
        return ffn_output

    # Apply Transformer Encoder
    transformer_output = transformer_encoder(
        x, num_heads=4, key_dim=128, ff_dim=256, dropout_rate=0.1
    )

    # Global Average Pooling over the sequence length dimension
    sequence_output = tf.keras.layers.GlobalAveragePooling1D()(transformer_output)

    # Final Dense Layers
    dropout_layer = Dropout(0.5)(sequence_output)
    dense_layer = Dense(128, activation='relu')(dropout_layer)
    output_layer = Dense(num_classes, activation='softmax')(dense_layer)

    model = Model(inputs=model_input, outputs=output_layer)
    return model

# Instantiate the model
model = build_transformer_model()

# Compile the model
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
              loss='sparse_categorical_crossentropy', metrics=['accuracy'])

# Print the model summary
model.summary()

# Define callbacks (optional)
callbacks = [
    tf.keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6, verbose=1),
    tf.keras.callbacks.EarlyStopping(
        monitor='val_loss', patience=5, restore_best_weights=True, verbose=1)
]

# Train the model with adjusted verbosity
history = model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=50,
    batch_size=16,
    callbacks=callbacks,
    verbose=2
)

# Save the trained model
model.save('gesture_recognition_model.keras')  # Saves in Keras format
print("Model saved as 'gesture_recognition_model.keras'")
