require("dotenv").config({ path: "./config.env" });
const mongoose = require("mongoose");
const { cloudinaryConfig } = require("./utils/upload");
const cors = require('cors');
cloudinaryConfig();
const app = require("./app");
const server = require("http").createServer(app);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


const io = require("socket.io")(server, {
  cors: {
    origin: "*"
  }
});

// const DB = process.env.DB.replace("<PASSWORD>", process.env.DB_PASSWORD);

mongoose
  .connect('mongodb://localhost:27017/Crud', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log("Connected to DB"))
  .catch(err => console.log(err));

let users = [];

const addUser = (userId, socketId) => {
  !users.some(user => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = socketId => {
  users = users.filter(user => user.socketId !== socketId);
};

const getUser = userId => {
  return users.find(user => user.userId === userId);
};

io.on("connection", socket => {
  //when ceonnect
  console.log("a user connected.");

  //take userId and socketId from user
  socket.on("addUser", userId => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  //send and get message
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);
    io.to(user.socketId).emit("getMessage", {
      senderId,
      text
    });
  });

  //when disconnect
  socket.on("disconnect", () => {
    console.log("a user disconnected!");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Listening from port ${port}`);
});
