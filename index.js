const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const mysql      = require('mysql2');
const cors = require('cors')

var db_config = {
  host: "77.51.178.66",
  user: "givawaytest",
  database: "givaway",
  password: "uINWTwfn8qUkqup8"
}

var connection;

connection = mysql.createConnection(db_config); 
// const connection = mysql.createConnection({
//   host: "77.51.178.66",
//   user: "givawaytest",
//   database: "givaway",
//   password: "uINWTwfn8qUkqup8"
// });


// express()
//   .use(express.static(path.join(__dirname, 'public')))
//   .set('views', path.join(__dirname, 'views'))
//   .set('view engine', 'ejs')
//   .get('/', (req, res) => res.render('pages/index'))
//   .listen(PORT, () => console.log(`Listening on ${ PORT }`))

  // Initialize the app
const app = express();
app.use(cors());
// https://expressjs.com/en/guide/routing.html
module,exports = app.get('/accounts', function (req, res) {
  connection.connect();
  connection.query('SELECT * FROM givaway.accounts', function (error, results, fields) {
    if (error) throw error;
    res.send(JSON.stringify(results))
    //console.log(results);
  });
  //connection.end();
});
app.get('/mainusers', function (req, res) {
  connection.connect();
  connection.query('SELECT * FROM givaway.mainusers', function (error, results, fields) {
    if (error) throw error;
    res.send(JSON.stringify(results))
    //console.log(results);
  });
  //connection.end();
});

app.get('/follow', function (req, res) {
  connection.connect();
  connection.query('SELECT * FROM givaway.Follow', function (error, results, fields) {
    if (error) throw error;
    res.send(JSON.stringify(results))
    //console.log(results);
  });
  //connection.end();
});
// Start the server
app.listen(PORT, () => {
console.log('Go to http://localhost: ${ PORT } 5000 /accounts to see accounts');
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', function(req, res) {
  res.sendFile('https://insta-give.herokuapp.com/index.html');
});

