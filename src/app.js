const express = require('express');
const {json} = require('body-parser');

const router = require('./routes');

const app = express();

app.use(json());

app.use('/', router);

module.exports = app;
