# model_incremental.py

import numpy as np
from tensorflow.keras.models import load_model, Model
from tensorflow.keras.layers import Dense
from sklearn.model_selection import train_test_split

# Load existing model
model = load_model('gesture_recognition_model.keras')

# Freeze existing layers except the output layer
for layer in model.layers[:-1]:
    layer.trainable = False

# Modify the output layer
original_num_classes = len(gestures)  # Number of old gestures
n_new_gestures = 1  # Number of new gestures
new_num_classes = original_num_classes + n_new_gestures

# Remove the old output layer and add a new one
model.layers.pop()
x = model.layers[-1].output
new_output = Dense(new_num_classes, activation='softmax', name='output_layer')(x)
model = Model(inputs=model.input, outputs=new_output)

# Compile the model
model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

# Load and combine data
# (Assuming X_combined and y_combined are prepared as shown earlier)

# Train the model
model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=10,
    batch_size=16,
    verbose=2
)

# Save the updated model
model.save('updated_gesture_recognition_model.keras')
