// /Bot/db.js

const firebase = require('firebase-admin');
const config = require("./config/db_config");
var serviceAccount = require("./config/db_config.json");

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: 'https://ig-bot-demo-5bc38.firebaseio.com/'
});
let database = firebase.database();

const following = (param = '') => database.ref(`following/${param}`);

const followHistory = (param = '') => database.ref(`follow_history/${param}`);

let addFollowing = async username =>{
    const added = new Date().getTime();
    return following(username).set({username,added});
};

let getFollowings = async () => following().once('value').then(data => data.val());

let unFollow = async username => following(username).remove().then(() => followHistory(username).set({username}));

let inHistory = async username => followHistory(username).once('value').then(data => data.val());

module.exports = {
    addFollowing,
    getFollowings,
    unFollow,
    inHistory
};