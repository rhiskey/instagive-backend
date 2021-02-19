exports.addUser = function (request, response){
    response.send("Добавление пользователя");
};
exports.insertUser = function(request, response){
    response.send("Список пользователей");
};

exports.deleteUser = function (request, response){
    response.send("Добавление пользователя");
};
exports.editUser = function(request, response){
    response.send("Список пользователей");
};

exports.index = function (request, response) {
  if (request.session.loggedin) {
    connection.query("SELECT * FROM givaway.mainusers", function (err, data) {
      // res.send(JSON.stringify(results))
      if (err) return console.log(err);
      response.render("list.hbs", {
        users: data
      });
    });
  } else {
    response.sendFile(path.join(__dirname + '/login.html'));
    // response.send('Пожалуйста авторизируйтесь для просмотра данной страницы!');
  }
};