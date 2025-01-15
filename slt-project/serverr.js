// server.js

import express from 'express';
import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// Initialize process variables
let pythonProcess = null;             // For main.py
let dataCollectionProcess = null;     // For datacollection.py
let recordProcess = null;             // For record.py

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json());

// Ensure the videos directory exists
const videosDir = path.join(__dirname, 'videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir);
}

// Serve static files from the videos directory
app.use('/videos', express.static(videosDir));

// === Existing Endpoints for main.py and datacollection.py ===

// Endpoint to start main.py
app.post('/start-translation', (req, res) => {
  if (!pythonProcess) {
    const scriptPath = path.join(__dirname, 'main.py');
    console.log(`Starting main.py at: ${scriptPath}`);

    pythonProcess = spawn('python', [scriptPath]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`main.py output: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`main.py error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`main.py closed with code ${code}`);
      pythonProcess = null;
    });

    res.status(200).send('Translation started');
  } else {
    res.status(400).send('Translation is already running');
  }
});

// Endpoint to stop main.py
app.post('/stop-translation', (req, res) => {
  if (pythonProcess) {
    pythonProcess.kill('SIGINT');
    pythonProcess = null;
    res.status(200).send('Translation stopped');
  } else {
    res.status(400).send('Translation is not running');
  }
});

// Endpoint to start datacollection.py
app.post('/start-datacollection', (req, res) => {
  if (!dataCollectionProcess) {
    const scriptPath = path.join(__dirname, 'datacollection.py');
    console.log(`Starting datacollection.py at: ${scriptPath}`);

    dataCollectionProcess = spawn('python', [scriptPath]);

    dataCollectionProcess.stdout.on('data', (data) => {
      console.log(`datacollection.py output: ${data}`);
    });

    dataCollectionProcess.stderr.on('data', (data) => {
      console.error(`datacollection.py error: ${data}`);
    });

    dataCollectionProcess.on('close', (code) => {
      console.log(`datacollection.py closed with code ${code}`);
      dataCollectionProcess = null;
    });

    res.status(200).send('Data collection started');
  } else {
    res.status(400).send('Data collection is already running');
  }
});

// Endpoint to stop datacollection.py
app.post('/stop-datacollection', (req, res) => {
  if (dataCollectionProcess) {
    dataCollectionProcess.kill('SIGINT');
    dataCollectionProcess = null;
    res.status(200).send('Data collection stopped');
  } else {
    res.status(400).send('Data collection is not running');
  }
});

// === Added Code Below ===

// Variable to store the last recorded video path
let lastRecordedVideo = null;

// Endpoint to start record.py
app.post('/start-recording', (req, res) => {
  if (!recordProcess) {
    const scriptPath = path.join(__dirname, 'video_record.py');
    console.log(`Starting record.py at: ${scriptPath}`);

    recordProcess = spawn('python', [scriptPath]);

    // Listen to stdout to capture the video path
    recordProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`record.py output: ${output}`);

      // Check if the output contains the video path
      if (output.startsWith('Video saved at:')) {
        const videoPath = output.replace('Video saved at:', '').trim();
        lastRecordedVideo = videoPath;
        console.log(`Recorded video saved at: ${videoPath}`);
      }
    });

    recordProcess.stderr.on('data', (data) => {
      console.error(`record.py error: ${data}`);
    });

    recordProcess.on('close', (code) => {
      console.log(`record.py closed with code ${code}`);
      recordProcess = null;
    });

    res.status(200).send('Recording started');
  } else {
    res.status(400).send('Recording is already running');
  }
});

// Endpoint to stop record.py
app.post('/stop-recording', (req, res) => {
  if (recordProcess) {
    recordProcess.kill('SIGINT');
    recordProcess = null;

    // Wait a moment for record.py to handle SIGINT and save the video
    setTimeout(() => {
      if (lastRecordedVideo && fs.existsSync(lastRecordedVideo)) {
        const filename = path.basename(lastRecordedVideo);
        const videoUrl = `http://localhost:5003/videos/${filename}`;
        console.log(`Sending video URL: ${videoUrl}`);
        res.status(200).json({ message: 'Recording stopped', videoUrl });
        // Reset lastRecordedVideo for the next recording
        lastRecordedVideo = null;
      } else {
        console.error('Recording stopped but video file not found.');
        res.status(500).send('Recording stopped but video file not found.');
      }
    }, 2000); // 2 seconds delay to ensure video is saved
  } else {
    res.status(400).send('Recording is not running');
  }
});

// === End of Added Code ===

app.listen(5003, () => {
  console.log('Server listening on port 5003');
});
