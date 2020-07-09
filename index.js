const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 8080
const mysql = require('mysql2');
const bodyParser = require("body-parser");
const cors = require('cors')
var session = require('express-session');
const axios = require('axios')
const httpRequest = require('request');
var cookieSession = require('cookie-session')
// Listen to DataBase Change 


const Instagram = require('instagram-web-api')
const { IG_USERNAME, IG_PASSWORD } = process.env
const client = new Instagram({ IG_USERNAME, IG_PASSWORD })

// Для парсера
const Bot = require('./Bot'); // this directly imports the Bot/index.js file
const PUPconfig = require('./Bot/config/puppeter.json');

var instaAccs;

// const resultNick = require('./Bot/')
const run = async (userNickname) => {
    const bot = new Bot();

    const startTime = Date();

    await bot.initPuppeter().then(() => console.log("PUPPETEER INITIALIZED"));

    await bot.visitInstagram().then(() => console.log("BROWSING INSTAGRAM"));

    //await bot.visitHashtagUrl().then(() => console.log("VISITED HASH-TAG URL"));

    await bot.visitFollowedUrl(userNickname).then(() => console.log("VISITED USERNAME URL"));

    //BAD URL TIMESTAMP
    //await bot.parseAvatar(userNickname).then(() => console.log("AVATAR ADDED TO DATABASE"));


    // await bot.unFollowUsers();

    // await bot.closeBrowser().then(() => console.log("BROWSER CLOSED"));

    const endTime = Date();

    console.log(`START TIME - ${startTime} / END TIME - ${endTime}`)

    //Потенциальная утечка, нужно закрыть браузер, но после парсинга
    // await bot.closeBrowser().then(() => console.log("BROWSER CLOSED"));

    // instaAccs = bot.getAcc();
    // console.log(instaAccs);
    // return bot.instaAccString;
};


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

// var dsn = {
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD
// };

// const instance = new MySQLEvents(dsn, {
//     startAtEnd: true,
//     excludedSchemas: {
//         mysql: true,
//     },
// });

// instance.start();

// instance.addTrigger({
//     name: 'TEST',
//     expression: '*',
//     statement: MySQLEvents.STATEMENTS.ALL,
//     onEvent: (event) => { // You will receive the events here
//         console.log(event);
//     },
// });

// instance.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
// instance.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);

// Initialize the app
const app = express();

//Login Page
// app.use(session({
//   secret: '2C44-4D45-FdfpQ38S',
//   resave: true,
//   saveUninitialized: true
// }));
var expiryDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hour
app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],

    cookie: {
        secure: true,
        httpOnly: true,
        domain: 'dry-plains-18498.herokuapp.com',
        path: 'page/session',
        expires: expiryDate
    }
}));

//app.use(express.cookieDecoder());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());
// NEW --------------

app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "hbs");

// // СДЕЛАТЬ MVC и API
// const userController = require("./controllers/userController.js");
// const followersController = require("./controllers/followersController.js");
// // определяем Router
// const userRouter = express.Router();
// const followersRouter = express.Router();


// // определяем маршруты и их обработчики внутри роутера userRouter
// userRouter.use("/create", userController.addUser);
// userRouter.use("/insert", userController.insertUser);
// userRouter.use("/delete", userController.deleteUser);
// userRouter.use("/edit", userController.editUser);
// userRouter.use("/", userController.index);
// app.use("/", userRouter);

// // определяем маршруты и их обработчики внутри роутера followersRouter
// followersRouter.get("/about", followersController.about);
// followersRouter.get("/", followersController.index);
// app.use("/followers", followersRouter);

// app.set("view engine", "hbs");

// получение списка пользователей
app.get("/", function (req, res) {
    if (req.session.loggedin) {
        connection.query("SELECT * FROM givaway.mainusers", function (err, data) {
            // res.send(JSON.stringify(results))
            if (err) return console.log(err);
            res.render("index.hbs", {
                users: data
            });
        });
    } else {
        res.sendFile(path.join(__dirname + '/login.html'));
        // response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
    }

});

// //Изменение видимости раздач
// app.post("/", urlencodedParser, function (req, res) {

//   if (!req.body) return res.sendStatus(400);
//   const name = req.body.userName;
//   const link = req.body.userLink;
//   const info = req.body.userGiveinfo;
//   const avatar = req.body.userAvatar;
//   const uid = req.body.userID;
//   const id = req.body.id;
//   const show = req.body.showgive;
//   // if(show==)

//   connection.query("UPDATE givaway.mainusers SET username=?, giveinfo=?, avatar=?, link=?, userid=?, showgive=?  WHERE id=?;", [name, info, avatar, link, uid, show, id], function (err, data) {
//     if (err) return console.log(err);
//     res.redirect("/");
//   });

// });

// возвращаем форму для добавления данных
app.get("/create", function (req, res) {
    if (req.session.loggedin) {
        res.render("create.hbs");
    } else {
        res.sendFile(path.join(__dirname + '/login.html'));
        // response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
    }

});

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //Максимум и минимум включаются
}
// получаем отправленные данные и добавляем их в БД 
app.post("/create", urlencodedParser, function (req, res) {

    if (!req.body) return res.sendStatus(400);
    const sql = "INSERT INTO givaway.mainusers (username, link, giveinfo, avatar, userid) VALUES (?, ?, ?, ?, ?) ";
    //Generate Unique index 10 symbols
    //const userID = Date.now(); //1576996323453
    const userID = getRandomIntInclusive(1, 99999);
    var instalink = "https://instagram.com/";
    var link = instalink + req.body.userName;
    const data = [req.body.userName, link, req.body.userGiveinfo, req.body.userAvatar, userID];
    //const data = [req.body.userName, req.body.userLink, req.body.userGiveinfo, req.body.userAvatar, req.body.userID];
    // connection.connect();
    connection.query(sql, data, function (err, results) {
        if (err) console.log(err);
        // req.send(JSON.stringify(results))

        const username2Parse = req.body.userName;
        //Старт парсера
        run(username2Parse).catch(e => console.log(e.message));

        // // Дождаться завершения парсинга - передать строку с акками и В БД

        res.redirect("/");

        //res.redirect("/");
        // console.log(results);
    });

});

// // Получаем список ID организаторов
// app.get('/getOrgID', function (req, res) {
//   if (!req.body) return res.sendStatus(400);
//   // If it's not showing up, just use req.body to see what is actually being passed.
//   console.log(req.body.selectpicker);
//   const sql = "SELECT username, userid FROM givaway.mainusers "
//   // connection.connect();
//   connection.query(sql, data, function (err, results) {
//     if (err) console.log(err);
//     res.send(JSON.stringify(results))
//     // console.log(results);
//   });
// });


// возвращаем форму 
app.get("/getfollowers", function (req, res) {
    if (req.session.loggedin) {
        //res.render("getfollowers.hbs");
        const sql = "SELECT username FROM givaway.mainusers";
        connection.query(sql, function (err, results) {
            if (err) console.log(err);
            // Pass the DB result to the template
            // res.render('newProject', { dropdownVals: result })
            res.render("getfollowers.hbs", { dropdownVals: results });

        })
    } else {
        res.sendFile(path.join(__dirname + '/login.html'));
        //   // response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
    }

});

// получаем отправленные данные 
app.post("/getfollowers", urlencodedParser, function (req, res) {
    if (!req.body) return res.sendStatus(400);
    const username2Parse = req.body.userName;
    //console.log(req.body);
    //Получить id по нику, если ID есть - > Добавить в БД
    const sql = "SELECT username, userid FROM givaway.mainusers WHERE username = ?";
    connection.query(sql, [username2Parse], function (err, results) {
        if (err) console.log(err);
        if (results) {
            var instaID = results[0];
            console.log(instaID);
            if (instaID) { //Если есть такой юзер
                run(username2Parse).catch(e => console.log(e.message));

                // // Дождаться завершения парсинга - передать строку с акками и В БД

                res.redirect("/");
            } else { res.send(500, 'Такого юзера не существует в БД') }
        }

        //run bot at certain interval we have set in our config file
        // setInterval(run, PUPconfig.settings.run_every_x_hours * 3600000);
    });

    // console.log();
});

// // возвращаем форму для добавления данных спонсоров
// app.get("/insert", function (req, res) {
//   if (req.session.loggedin) {
//     res.render("insert.hbs");
//   } else {
//     res.sendFile(path.join(__dirname + '/login.html'));
//     // response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
//   }

// });
// // получаем отправленные данные и добавляем их в БД 
// app.post("/insert", urlencodedParser, function (req, res) {

//   if (!req.body) return res.sendStatus(400);
//   const accString = req.body.accString;
//   var separator = ' ';
//   var arrayOfStrings = accString.split(separator);
//   //Для каждого элемента строки с разделителем пробел
//   var i;
//   for (i = 0; i < arrayOfStrings.length; i++) {
//     var nick = arrayOfStrings[i];
//     // Проверка на пустое и на "Подтвержденный"
//     if (nick && nick != "Подтвержденный") { //если не пустая
//       const sql = "INSERT INTO givaway.Follow (usernameFollower, followedid, linkFollower) VALUES (?, ?, ?) ";
//       var instalink = "https://instagram.com/";
//       var link = instalink + nick;
//       const data = [nick, req.body.followedID, link];
//       // connection.connect();
//       connection.query(sql, data, function (err, results) {
//         if (err) console.log(err);
//         // console.log(results);
//       });
//     }
//   }
//   res.redirect("/");

// });

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
    const show = req.body.showgive;
    // if(show==)

    connection.query("UPDATE givaway.mainusers SET username=?, giveinfo=?, avatar=?, link=?, userid=? WHERE id=?;", [name, info, avatar, link, uid, id], function (err, data) {
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

// получаем id изменяемой раздачи и изменяем видимость
app.post("/visible/:id", function (req, res) {
    const id = req.params.id;
    const show = 1;
    connection.query("UPDATE givaway.mainusers SET showgive=? WHERE id=?", [show, id], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/");
    });
});

app.post("/hide/:id", function (req, res) {
    const id = req.params.id;
    const show = 0;
    connection.query("UPDATE givaway.mainusers SET showgive=? WHERE id=?", [show, id], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/");
    });
});
//Очищаем фолловеров
app.post("/clearfollowed/:userid", function (req, res) {
    // const id = req.params.id;
    const userid = req.params.userid;
    //Get userid
    // connection.query("SELECT userid FROM givaway.mainusers WHERE id =?", [id], function (err, results) {
    //   if (err) console.log(err);
    //   var flid = results[0].userid;
    connection.query("DELETE FROM givaway.Follow WHERE followedid=?", [userid], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/");
    });
    // });
});
// получаем аккаунты, на которых подписан юзер
app.post("/followed", function (req, res) {
    if (!req.body) return res.sendStatus(400);
    const uid = req.body.userID;
    const name = req.body.userName;

});

// возвращаем форму для поиска подписанных
app.get("/followed", function (req, res) {
    if (req.session.loggedin) {
        const sql = "SELECT id, usernameFollower, linkFollower, LEFT(avatarFollower, 256), useridFollower, followedid FROM givaway.Follow LIMIT 1000";
        connection.query(sql, function (err, results) {
            if (err) console.log(err);
            // Pass the DB result to the template
            // res.render('newProject', { dropdownVals: result })
            res.render("followed.hbs", { users: results });

        })
        // res.render("followed.hbs");

    } else {
        res.sendFile(path.join(__dirname + '/login.html'));
    }

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

app.get('/onlyshow', function (req, res) {
    // Проверка авторизации, отправлять POST запрос сюда с данными авторизации
    connection.connect();
    connection.query('SELECT * FROM givaway.mainusers WHERE showgive = 1', function (error, results, fields) {
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

    // ЭТО ключи приложения INSTAGRAM SECRET и ID
    var options = {
        url: 'https://api.instagram.com/oauth/access_token',
        method: 'POST',
        form: {
            client_id: process.env.IG_CLIENT_ID,
            client_secret: process.env.IG_CLIENT_SECRET,
            grant_type: 'authorization_code',
            redirect_uri: process.env.FRONTEND,
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
    });

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
    res.sendFile(process.env.FRONTEND + '/index.html');
});