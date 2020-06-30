const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 8080
const mysql = require('mysql2');
const bodyParser = require("body-parser");
const cors = require('cors')
var session = require('express-session');
const axios = require('axios')
const httpRequest = require('request');
const Instagram = require('instagram-web-api')
const { IG_USERNAME, IG_PASSWORD } = process.env

const client = new Instagram({ IG_USERNAME, IG_PASSWORD })

require('dotenv').config();

var db_config = {
  connectionLimit: 5,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_DATABASENAME,
  password: process.env.DB_PASSWORD
}

var connection;

connection = mysql.createConnection(db_config);

// создаем парсер для данных application/x-www-form-urlencoded
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Initialize the app
const app = express();

app.set("view engine", "hbs");

//Login Page
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());
// NEW --------------

app.use(express.static(path.join(__dirname, 'public')));
// получение списка пользователей
app.get("/", function (req, res) {
  if (req.session.loggedin) {
    connection.query("SELECT * FROM givaway.mainusers", function (err, data) {
      // res.send(JSON.stringify(results))
      if (err) return console.log(err);
      res.render("list.hbs", {
        users: data
      });
    });
  } else {
    res.sendFile(path.join(__dirname + '/login.html'));
    // response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
  }
  // res
  // connection.connect();
  // connection.query('SELECT * FROM givaway.mainusers', function (error, results, fields) {
  //   if (error) throw error;
  //   res.send(JSON.stringify(results))
  //   //console.log(results);
  // });


});

// возвращаем форму для добавления данных
app.get("/create", function (req, res) {
  if (req.session.loggedin) {
    res.render("create.hbs");
  } else {
    res.sendFile(path.join(__dirname + '/login.html'));
    // response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
  }

});
// получаем отправленные данные и добавляем их в БД 
app.post("/create", urlencodedParser, function (req, res) {

  if (!req.body) return res.sendStatus(400);
  const sql = "INSERT INTO givaway.mainusers (username, link, giveinfo, avatar, userid) VALUES (?, ?, ?, ?, ?) ";
  const data = [req.body.userName, req.body.userLink, req.body.userGiveinfo, req.body.userAvatar, req.body.userID];
  // connection.connect();
  connection.query(sql, data, function (err, results) {
    if (err) console.log(err);
    req.send(JSON.stringify(results))
    res.redirect("/");
    // console.log(results);
  });
  // const name = req.body.name;
  // const age = req.body.age;
  // pool.query("INSERT INTO users (name, age) VALUES (?,?)", [name, age], function(err, data) {
  //   if(err) return console.log(err);
  //   res.redirect("/");
  // });


});

// возвращаем форму для добавления данных
app.get("/insert", function (req, res) {
  if (req.session.loggedin) {
    res.render("insert.hbs");
  } else {
    res.sendFile(path.join(__dirname + '/login.html'));
    // response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
  }

});
// получаем отправленные данные и добавляем их в БД 
app.post("/insert", urlencodedParser, function (req, res) {

  if (!req.body) return res.sendStatus(400);
  const accString = req.body.accString;
  var separator = ' ';
  var arrayOfStrings = accString.split(separator);

  var i;
  for (i = 0; i < arrayOfStrings.length; i++) {
    var nick = arrayOfStrings[i];
    const sql = "INSERT INTO givaway.Follow (usernameFollower, followedid, linkFollower) VALUES (?, ?, ?) ";
    var instalink = "https://instagram.com/";
    var link = instalink + nick;
    const data = [nick, req.body.followedID, link];
    // connection.connect();
    connection.query(sql, data, function (err, results) {
      if (err) console.log(err);
      // console.log(results);
    });
  }
  res.redirect("/");

});

// получем id редактируемого пользователя, получаем его из бд и отправлям с формой редактирования
app.get("/edit/:id", function (req, res) {
  if (req.session.loggedin) {
    const id = req.params.id;
    connection.query("SELECT * FROM givaway.mainusers WHERE id=?", [id], function (err, data) {
      if (err) return console.log(err);
      res.render("edit.hbs", {
        user: data[0]
      });
    });
  } else {
    res.sendFile(path.join(__dirname + '/login.html'));
    // response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
  }

});
// получаем отредактированные данные и отправляем их в БД
app.post("/edit", urlencodedParser, function (req, res) {

  if (!req.body) return res.sendStatus(400);
  const name = req.body.userName;
  const link = req.body.userLink;
  const info = req.body.userGiveinfo;
  const avatar = req.body.userAvatar;
  const uid = req.body.userID;
  const id = req.body.id;

  connection.query("UPDATE givaway.mainusers SET username=?, giveinfo=?, avatar=?, link=?, userid=?, WHERE id=?", [name, info, avatar, link, uid, id], function (err, data) {
    if (err) return console.log(err);
    res.redirect("/");
  });
});

// получаем id удаляемого пользователя и удаляем его из бд
app.post("/delete/:id", function (req, res) {

  const id = req.params.id;
  connection.query("DELETE FROM givaway.mainusers WHERE id=?", [id], function (err, data) {
    if (err) return console.log(err);
    res.redirect("/");
  });
});

// получаем аккаунты, на которых подписан юзер
app.post("/followed", function (req, res) {
  if (!req.body) return res.sendStatus(400);
  const uid = req.body.userID;
  const name = req.body.userName;
  // const pass = req.body.password;
  // const user = name;
  // Instagram
  // instaObj.getFollowing(user).then(res => {
  //   const userFullname = res.data;
  //   console.log(userFullname);
  //   // => Joie
  // });
  // client
  //   .login()
  //   .then(() => {
  //     const followings = client
  //       .getFollowings({ userId: uid, first: 50 }) // first - number of followings
  //       .then(console.log)
  //     // const followings = client.getFollowings({ userId: uid, first: 50 }) 
  //     res.send(followings)
  //   })
  //res.redirect("/");

});

// возвращаем форму для поиска подписанных
app.get("/followed", function (req, res) {
  // if (req.session.loggedin) {
    res.render("followed.hbs");
  // } else {
    // res.sendFile(path.join(__dirname + '/login.html'));
  // }

});
// NEW --------------


////-------OLD 

// app.get('/', function (request, response) {
//   if (request.session.loggedin) {
//   // response.sendFile(path.join(__dirname + '/login.html'));
// } else {
//   response.sendFile(path.join(__dirname + '/login.html'));
//   // response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
// }
// // response.end();
// });

app.post('/auth', function (request, response) {
  var username = request.body.username;
  var password = request.body.password;
  if (username && password) {
    connection.query('SELECT * FROM givaway.accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
      if (results.length > 0) {
        request.session.loggedin = true;
        request.session.username = username;
        response.redirect('/'); //add
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



// app.get("/add", urlencodedParser, function (request, response) {
//   if (request.session.loggedin) {
//     // response.send('Снова здравствуй, ' + request.session.username + '!');
//     response.sendFile(__dirname + "/add.html");
//   } else {
//     //response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
//      response.sendFile(path.join(__dirname + '/login.html'));
//     //response.redirect('/auth'); //add
//   }
// });

// app.post("/add", urlencodedParser, function (request, response) {
//     if (!request.body) return response.sendStatus(400);
//     console.log(request.body);
//     // response.send(`${request.body.userName} - ${request.body.userID} - ${request.body.userLink} - ${request.body.userGiveinfo}- ${request.body.userAvatar} `);
//     const sql = "INSERT INTO givaway.mainusers (username, link, giveinfo, avatar, userid) VALUES (?, ?, ?, ?, ?) ";
//     const data = [request.body.userName, request.body.userLink, request.body.userGiveinfo, request.body.userAvatar, request.body.userID];
//     // connection.connect();
//     connection.query(sql, data, function (err, results) {
//       if (err) console.log(err);
//       response.send(JSON.stringify(results))
//       console.log(results);
//     });

//     // //Parse Followed of request.body.userName 


//   // connection.query(`INSERT INTO givaway.mainusers (username, link, giveinfo, avatar, userid) VALUES ( ${request.body.userName},${request.body.userLink},${request.body.userGiveinfo},${request.body.userAvatar},${request.body.userID})`, function (error, results, fields) {
//   //   if (error) throw error;
//   //   response.send(JSON.stringify(results))
//   //   console.log(results);
//   // });
//   response.end();
// });

// app.get("/list", urlencodedParser, function (request, response) {
//   if (request.session.loggedin) {
//     // response.send('Снова здравствуй, ' + request.session.username + '!');
//     response.sendFile(__dirname + "/list.html");
//   } else {
//     //response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
//      response.sendFile(path.join(__dirname + '/login.html'));
//     //response.redirect('/auth'); //add
//   }
// });

// app.post("/list", urlencodedParser, function (request, response) {
//     if (!request.body) return response.sendStatus(400);
//     console.log(request.body);

// });

// app.get("/edit", urlencodedParser, function (request, response) {
//   response.sendFile(__dirname + "/edit.html");
// });
// app.post("/edit", urlencodedParser, function (request, response) {
//   if (!request.body) return response.sendStatus(400);

//   // pool.execute("UPDATE users SET age=age+1 WHERE name=?", ["Stan"]) // изменение объектов
//   //   .then(result =>{ 
//   //     console.log(result[0]);
//   //     return pool.execute("SELECT * FROM users"); // получение объектов
//   //   })
//   //   .then(result =>{
//   //     console.log(result[0]);
//   //     pool.end();
//   //   })
//   //   .then(()=>{
//   //     console.log("пул закрыт");
//   //   })
//   //   .catch(function(err) {
//   //     console.log(err.message);
//   //   })

//   }
// )


// https://expressjs.com/en/guide/routing.html
// module, exports = app.get('/accounts', function (req, res) {
//   
//   connection.connect();
//   connection.query('SELECT * FROM givaway.accounts', function (error, results, fields) {
//     if (error) throw error;
//     res.send(JSON.stringify(results))
//     //console.log(results);
//   });
//   //connection.end();
// });

app.get('/mainusers', function (req, res) {
  // Проверка авторизации, отправлять POST запрос сюда с данными авторизации
  connection.connect();
  connection.query('SELECT * FROM givaway.mainusers', function (error, results, fields) {
    if (error) throw error;
    res.send(JSON.stringify(results))
    //console.log(results);
  });
  //connection.end();
});

app.get('/alljoin', function (req, res) {
  // Проверка авторизации, отправлять POST запрос сюда с данными авторизации
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

// получаем данные со фронта и отправляем их в БД - в ответе возвращаем список фолловеров из бд
app.post("/getfollowers", urlencodedParser, function (req, res) {

  if (!req.body) return res.sendStatus(400);
  console.log(req.body);
  const name = req.body.username;
  // console.log(req.body.username);
  // По имени из mainusers - получить userID - затем в таблице Follow получить все записи у которых followedid совпадает с userID
  connection.query('SELECT userid FROM givaway.mainusers WHERE username=?', [name], function (err, responseID) {
    if (err) return console.log(err);
    // res.redirect("/");
    console.log(responseID);

    //// Если вдруг их много (имя одно и тоже а ID разные)
    // const users = responseID;
    // for(let i=0; i < users.length; i++){
    //   console.log(users[i].userid);

    const ID = responseID[0].userid; //один единственный!
    console.log(ID);
    connection.query('SELECT * FROM givaway.Follow WHERE followedid=?', [ID], function (err, followers) {
      if (err) return console.log(err);
      console.log(followers);
      res.send(JSON.stringify(followers));
    });
  });
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
  console.log('Go to http://localhost: ${ PORT } 5000 8080/accounts to see accounts');
});

// curl -X POST \ https://api.instagram.com/oauth/access_token \ -F client_id=296560698030895 \ -F client_secret=759f4d6c839b89130426f21518ca56d5 \ -F grant_type=authorization_code \ -F redirect_uri=https://insta-give.herokuapp.com/ \ -F code={authCode}
// Отправляем токен обратном во фронт
// Далее отобразим кнопки для прямой подписки во фронте

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', function (req, res) {
  res.sendFile('https://insta-give.herokuapp.com/index.html');
});
