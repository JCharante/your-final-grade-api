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
    res.set({
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
        'Access-Control-Allow-Headers': 'Content-Type',
    });
    if (req.method === 'OPTIONS') {
        res.status(200).send();
        return;
    }
    let body = req.body;
    console.log('Received request %o', body);
    
    let requestType = ""
    requestType = body.requestType || requestType;
    let userDoc;
    
    // enforce a session key for non-login, non-signup, or non-ping requests
    if (requestType !== "ping" && requestType !== "login" && requestType !== "signup") {
        const sessionKey = body.sessionKey;
        if (!sessionKey) {
            res.status(403).send('You must include a session key in your request');
            return;
        }
        // there is a session key
        // get user for session key
        try {
            userDoc = await mongoHandler.getUserFromSessionKey(sessionKey);
        } catch (err) {
            res.status(400).send(err.toString())
            return
        }
    }
    
    try {
        const username = body.username;
        const password = body.password;
        let ret;
        let sessionKey = null;
        switch (requestType) {
            case 'ping':
                res.status(200).send('pong');
                break;
            case 'userDetails':
                ret = {
                    username: userDoc.username,
                    displayName: userDoc.displayName
                };
                res.status(200).send(JSON.stringify(ret))
                break;
            case 'signup':
                const displayName = body.displayName;
                try {
                    userDoc = await mongoHandler.createUser(username, password, displayName);
                } catch (error) {
                    res.status(400).send(error.toString());
                    return;
                }
                ret = await mongoHandler.createSession(userDoc._id)
                sessionKey = ret.sessionKey;
                res.status(200).send(JSON.stringify({ sessionKey }));
                break;
            case 'login':
                try {
                    userDoc = await mongoHandler.verifyPassword(username, password);
                } catch (error) {
                    res.status(403).send(error.toString());
                    return;
                }
                ret = await mongoHandler.createSession(userDoc._id)
                sessionKey = ret.sessionKey;
                res.status(200).send(JSON.stringify({ sessionKey }));
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
app.options('/', handleRequest);

app.listen(3001)
