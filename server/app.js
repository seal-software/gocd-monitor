'use strict';

import express from 'express';
import path from 'path';
import Logger from './utils/Logger';
import socketio from 'socket.io';
import { parseString } from 'xml2js';

import * as conf from '../app-config';
import SealBuildMonitorService from './services/SealBuildMonitorService';


const routes = require('./routes/index'),
      dev = require('./routes/dev'),
      app = express(),
      io = socketio(),
      devMode = app.get('env') === 'development',
      sealMonitorService = new SealBuildMonitorService();

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
  let status = err.status || 500;
  res.status(status);
  res.sendFile('error-' + status + '.html', { root : 'server/views' });
});

// Start polling seal build monitor server
sealMonitorService.startPolling();

// socket.io setup
app.io = io;

io.on('connection', (socket) => {
  Logger.debug('Client connected');
  sealMonitorService.registerClient(socket);

  socket.on('disconnect', () => {
    Logger.debug('Client disconnected');
    sealMonitorService.unregisterClient(socket);
  });
});

module.exports = app;
