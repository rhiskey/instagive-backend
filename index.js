const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const mysql      = require('mysql2');
const bodyParser = require("body-parser");
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

// создаем парсер для данных application/x-www-form-urlencoded
const urlencodedParser = bodyParser.urlencoded({extended: false});
 
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

app.get('/alljoin', function (req, res) {
  connection.connect();
  connection.query('SELECT Follow.id, Follow.linkFollower, Follow.avatarFollower, Follow.usernameFollower, mainusers.giveinfo, mainusers.username, mainusers.avatar, mainusers.link FROM Follow INNER JOIN mainusers ON Follow.followedid=mainusers.userid;', function (error, results, fields) {
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

// Получить с фронта запросом responseInstagram -> отправляет сюда {authCode} на страницу /oauth

// // Parse URL-encoded bodies (as sent by HTML forms)
// app.use(express.urlencoded());

// // Parse JSON bodies (as sent by API clients)
// app.use(express.json());

// // Access the parse results as request.body
// app.post('/oauth', function(request, response){
//     console.log(request.body.user.authCode);
//     //console.log(request.body.user.email);
// });

app.post("/oath", urlencodedParser, function (request, response) {
  if(!request.body) return response.sendStatus(400);
  console.log(request.body);
  response.send(`${request.body.authCode}`);
});

// Start the server
app.listen(PORT, () => {
console.log('Go to http://localhost: ${ PORT } 5000 /accounts to see accounts');
});

// curl -X POST \ https://api.instagram.com/oauth/access_token \ -F client_id=296560698030895 \ -F client_secret=759f4d6c839b89130426f21518ca56d5 \ -F grant_type=authorization_code \ -F redirect_uri=https://insta-give.herokuapp.com/ \ -F code={authCode}
// Отправляем токен обратном во фронт
// Далее отобразим кнопки для прямой подписки во фронте

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', function(req, res) {
  res.sendFile('https://insta-give.herokuapp.com/index.html');
});
