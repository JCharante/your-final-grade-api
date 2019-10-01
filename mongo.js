const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;
const atlasURL = process.env.ATLAS_URL;

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
        await usersCollection.insertOne({
            username,
            password,
            displayName
        })
        const userDocument = await usersCollection.findOne({ username, password, displayName });
        await client.close();
        return userDocument;
    },
    createSession: async function(userId) {
        const client = await new MongoClient(atlasURL, { useNewUrlParser: true });
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db('your-final-grade');
        const sessionsCollection = db.collection('sessions');
        const ret = await sessionsCollection.insertOne({ user: userId })
        await client.close();
        return { sessionKey: ret.insertedId.toString(), userId: userId.toString() };
    },
    verifyPassword: async function(username, password) {
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
        if (userDocument.password === password) {
            return userDocument;
        } else {
            throw new Error('Invalid Credentials');
        }
    },
}
