'use strict';
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const socketIO = require('socket.io');
const io = socketIO(server);
const request = require('request');

app.set('trust proxy', true);

const helmet = require('helmet');
//app.use(helmet.frameguard());

app.use(express.static('public'));

app.get('/runtime-config.js', (request, response) => {
	const runtimeConfig = {
		vmAssetBaseUrl: process.env.VM_ASSET_BASE_URL || ''
	};

	response.type('application/javascript');
	response.set('Cache-Control', 'no-store');
	response.send(`window.CLOUDVM_RUNTIME_CONFIG = ${JSON.stringify(runtimeConfig)};\n`);
});

app.get('/', (request, response) => {
	response.status(200).sendFile(__dirname + '/public/main.html');
});

app.get('/launch', (request, response) => {
	response.status(200).sendFile(__dirname + '/public/launch.html');
});

app.get('/get', (req, res) => {
  var url = req.query.url;
  var content;
  try {
    content = request.get({
      url: url,
      headers: {
        'Content-Range': req.get('Range')
      }
    });
  }
  catch (error) {
    content = 'Please enter a FULL valid url. For example, "youtube.com" should be "https://www.youtube.com/"';
  }
  content.pipe(res);
});

io.on('connection', function(Socket) {
  var sessionID = Socket.id;
});

server.listen(8080);
