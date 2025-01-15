// server.js
const express = require('express');
const { spawn } = require('child_process');
const app = express();
let pythonProcess = null;

app.use(express.json());

// Endpoint to start main.py
app.post('/start-translation', (req, res) => {
  if (!pythonProcess) {
    pythonProcess = spawn('python', ['main.py']);
    
    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python output: ${data}`);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`Python script closed with code ${code}`);
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

app.listen(5001, () => {
  console.log('Server listening on port 5001');
});
