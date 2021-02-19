const express = require("express");
const userController = require("../controllers/userController.js");
const userRouter = express.Router();
 
userRouter.use("/create", userController.addUser);
userRouter.use("/insert", userController.insertUser);
userRouter.use("/delete", userController.deleteUser);
userRouter.use("/edit", userController.editUser);
userRouter.use("/", userController.getUsers);
 
module.exports = userRouter;