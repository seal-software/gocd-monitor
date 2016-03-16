'use strict';

import express from 'express';
import path from 'path';
import socketio from 'socket.io';
import fs from 'fs';

import * as conf from '../app-config';
import SealBuildMonitorService from './services/SealBuildMonitorService';


const routes = require('./routes/index'),
      dev = require('./routes/dev'),
      app = express(),
      io = socketio(),
      devMode = app.get('env') === 'development';

let pollingId,
    pipelines = [],
    isPolling = false;

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// Use webpack server to serve static assets in development and express.static 
// for all other stages
if (devMode) {
  app.use('/assets/js', dev);
}
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/', routes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.sendFile('error-' + err.status + '.html', { root : 'server/views' });
});

// socket.io setup
app.io = io;

io.on('connection', (socket) => {

  // Emit latest pipeline result
  socket.emit('pipelines:update', pipelines);

  // Function that refreshes all pipelines
  let refreshPipelines = () => {
    fs.readFile('/Users/matros/Development/projects/seal/seal-build-tools/buildmonitor/out/status.json', (err, data) => {
      if (err) {
        throw err;
      }
      pipelines = SealBuildMonitorService.sealPipelinesToPipelineResult(JSON.parse(data));
      socket.emit('pipelines:update', pipelines);
    });
  };

  // Fetch the pipelines and start polling pipeline history
  if (!pollingId && !isPolling) {
    isPolling = true;
    refreshPipelines();
    pollingId = setInterval(refreshPipelines, conf.goPollingInterval);
  }

});

module.exports = app;
