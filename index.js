const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
const mysql = require('mysql2');
const bodyParser = require("body-parser");
const cors = require('cors')
var session = require('express-session');

const axios = require('axios')
const httpRequest = require('request');

var db_config = {
  connectionLimit: 5,
  host: "77.51.178.66",
  user: "givawaytest",
  database: "givaway",
  password: "uINWTwfn8qUkqup8"
}

var connection;

connection = mysql.createConnection(db_config);

// создаем парсер для данных application/x-www-form-urlencoded
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Initialize the app
const app = express();

//Login Page
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', function (request, response) {
  response.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/auth', function (request, response) {
  var username = request.body.username;
  var password = request.body.password;
  if (username && password) {
    connection.query('SELECT * FROM givaway.accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
      if (results.length > 0) {
        request.session.loggedin = true;
        request.session.username = username;
        response.redirect('/add'); //add
      } else {
        response.send('Неправильные Username или Password!');
      }
      response.end();
    });
  } else {
    response.send('Введите логин и пароль!');
    response.end();
  }
});

app.get('/home', function (request, response) {
  if (request.session.loggedin) {
    response.send('Снова здравствуй, ' + request.session.username + '!');
  } else {
    response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
  }
  response.end();
});

app.use(cors());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

app.get("/add", urlencodedParser, function (request, response) {
  if (request.session.loggedin) {
    // response.send('Снова здравствуй, ' + request.session.username + '!');
    response.sendFile(__dirname + "/add.html");
  } else {
    //response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
     response.sendFile(path.join(__dirname + '/login.html'));
    //response.redirect('/auth'); //add
  }
});

app.post("/add", urlencodedParser, function (request, response) {
    if (!request.body) return response.sendStatus(400);
    console.log(request.body);
    // response.send(`${request.body.userName} - ${request.body.userID} - ${request.body.userLink} - ${request.body.userGiveinfo}- ${request.body.userAvatar} `);
    const sql = "INSERT INTO givaway.mainusers (username, link, giveinfo, avatar, userid) VALUES (?, ?, ?, ?, ?) ";
    const data = [request.body.userName, request.body.userLink, request.body.userGiveinfo, request.body.userAvatar, request.body.userID];
    // connection.connect();
    connection.query(sql, data, function (err, results) {
      if (err) console.log(err);
      response.send(JSON.stringify(results))
      console.log(results);
    });

  // connection.query(`INSERT INTO givaway.mainusers (username, link, giveinfo, avatar, userid) VALUES ( ${request.body.userName},${request.body.userLink},${request.body.userGiveinfo},${request.body.userAvatar},${request.body.userID})`, function (error, results, fields) {
  //   if (error) throw error;
  //   response.send(JSON.stringify(results))
  //   console.log(results);
  // });
  response.end();
});

app.get("/edit", urlencodedParser, function (request, response) {
  response.sendFile(__dirname + "/edit.html");
});
app.post("/edit", urlencodedParser, function (request, response) {
  if (!request.body) return response.sendStatus(400);

  // pool.execute("UPDATE users SET age=age+1 WHERE name=?", ["Stan"]) // изменение объектов
  //   .then(result =>{ 
  //     console.log(result[0]);
  //     return pool.execute("SELECT * FROM users"); // получение объектов
  //   })
  //   .then(result =>{
  //     console.log(result[0]);
  //     pool.end();
  //   })
  //   .then(()=>{
  //     console.log("пул закрыт");
  //   })
  //   .catch(function(err) {
  //     console.log(err.message);
  //   })

}
)


// https://expressjs.com/en/guide/routing.html
module, exports = app.get('/accounts', function (req, res) {
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
app.post("/oauth", urlencodedParser, function (request, responseAuth) {
  if (!request.body) return responseAuth.sendStatus(400);
  console.log(request.body);
  var inBoundResp = responseAuth;

  var options = {
    url: 'https://api.instagram.com/oauth/access_token',
    method: 'POST',
    form: {
      client_id: '296560698030895',
      client_secret: '759f4d6c839b89130426f21518ca56d5',
      grant_type: 'authorization_code',
      redirect_uri: 'https://insta-give.herokuapp.com/',
      code: request.body.authCode
    }
  };
  //Отправка в  апи инсты
  httpRequest(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var user = JSON.parse(body);
      console.log(user)
      //Шлем обратно на фронт токен, можно ещё в БД 
      inBoundResp.send(`${user.access_token}`);
      console.log(user.access_token)

    } else { inBoundResp.send(`${response.statusCode}`); } //Если ошибка отправляем статус во фроннт
    //res.redirect('/');
  }, (error, res, body) => {
    if (error) {
      console.error(error)
      return
    }
  }
  );

});



// // Get AuthCode
// app.post('/oauth', (req, res) => {
//   if (!req.body) return res.sendStatus(400);
//   console.log(req.body, "body");
//   res.send('welcome, ' + req.body.authCode)
// });

// Start the server
app.listen(PORT, () => {
  console.log('Go to http://localhost: ${ PORT } 5000 /accounts to see accounts');
});

// curl -X POST \ https://api.instagram.com/oauth/access_token \ -F client_id=296560698030895 \ -F client_secret=759f4d6c839b89130426f21518ca56d5 \ -F grant_type=authorization_code \ -F redirect_uri=https://insta-give.herokuapp.com/ \ -F code={authCode}
// Отправляем токен обратном во фронт
// Далее отобразим кнопки для прямой подписки во фронте

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', function (req, res) {
  res.sendFile('https://insta-give.herokuapp.com/index.html');
});
