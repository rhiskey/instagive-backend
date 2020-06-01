const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const mysql      = require('mysql2');
const cors = require('cors')


const connection = mysql.createConnection({
  host: "77.51.178.66",
  user: "givawaytest",
  database: "givaway",
  password: "uINWTwfn8qUkqup8"
});

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
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
  connection.end();
});

// Start the server
app.listen(PORT, () => {
console.log('Go to http://localhost:3001/accounts to see accounts');
});