'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const atlasUrl = process.env.ATLAS_URL;

const mongoHandler = require('./mongo');

const app = express();

app.use(bodyParser.json());

exports.handler = (event, context, callback) => {
    handleRequest(event, context, callback);
};

async function handleRequest(req, res, spare) {
    let body = req.body;
    console.log('Received request %o', body);
    
    let requestType = ""
    requestType = body.requestType || requestType;
    
    try {
        let userId;
        let locationId;
        switch (requestType) {
            case 'ping':
                res.status(200).send('pong');
                break;
            default:
                res.status(400).send(`Unsupported requestType "${requestType}"`);
        }
    } catch (error) {
        console.error('Error while handling request: %o', error);
        res.status(500).send(`Error while handling request: ${error}`);
    }
}

app.post('/', handleRequest);

app.listen(3000)
