const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const atlasURL = process.env.ATLAS_URL;
const bcrypt = require('bcrypt');

async function getConnectedClient() {
    const client = await new MongoClient(atlasURL, { useNewUrlParser: true });
    await client.connect();
    return client;
}

module.exports = {
    getUserFromSessionKey: async function(sessionKey) {
        const client = await new MongoClient(atlasURL, { useNewUrlParser: true });
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db('your-final-grade');
        const sessionsCollection = db.collection('sessions');
        
        const sessionDocument = await sessionsCollection.findOne({ _id: ObjectId(sessionKey) });
        if (!sessionDocument) {
            throw new Error('Invalid Session Key');
        }
        
        const usersCollection = db.collection('users');
        const userDocument = await usersCollection.findOne({ _id: sessionDocument.user });
        if (!userDocument) {
            throw new Error('User Does Not Exist');
        }
        await client.close();
        return userDocument;
    },
    createUser: async function(username, password, displayName) {
        username = username.toLowerCase();
        const client = await new MongoClient(atlasURL, { useNewUrlParser: true });
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db('your-final-grade');
        const usersCollection = db.collection('users');
        // verify username is unique
        let doc = await usersCollection.findOne({ username });
        if (doc) {
            throw new Error('Username taken');
        }
        let hash = bcrypt.hashSync(password, 10);
        await usersCollection.insertOne({
            username,
            password: hash,
            displayName,
            dataStore: {},
        })
        const userDocument = await usersCollection.findOne({ username, displayName });
        await client.close();
        return userDocument;
    },
    createSession: async function(userId) {
        const client = await new MongoClient(atlasURL, { useNewUrlParser: true });
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db('your-final-grade');
        const sessionsCollection = db.collection('sessions');
        const ret = await sessionsCollection.insertOne({ user: ObjectId(userId) })
        await client.close();
        return { sessionKey: ret.insertedId.toString(), userId: userId.toString() };
    },
    verifyPassword: async function(username, password) {
        username = username.toLowerCase();
        const client = await new MongoClient(atlasURL, {useNewUrlParser: true});
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db('your-final-grade');
        const usersCollection = db.collection('users');
        const userDocument = await usersCollection.findOne({username});
        await client.close();
        if (!userDocument) {
            throw new Error('Invalid Credentials');
        }
        let ret = bcrypt.compareSync(password, userDocument.password);
        if (ret) {
            return userDocument;
        } else {
            throw new Error('Invalid Credentials');
        }
    },
    setUserDataStore: async function(userObjectId, newDataStore) {
        const client = await getConnectedClient();
        const db = client.db('your-final-grade');
        const usersCollection = db.collection('users');
        await usersCollection.updateOne(
            {
                _id: userObjectId,
            },
            {
                '$set': {
                    dataStore: newDataStore
                }
            }
        )
        await client.close();
    }
}
