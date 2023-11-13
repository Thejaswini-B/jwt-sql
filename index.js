const express = require("express");
const app = express();
const PORT = 3004;
const path = require("path");
const { open } = require("sqlite");
const bcrypt = require("bcrypt");

app.use(express.json());
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken"); // token for registred user
const dbPath = path.join(__dirname, "user.db");

// *******************************************************
const Redis = require("ioredis");
const redisClient = new Redis();

// ******************************************************
let db = null;
const dbConnection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    // console.log("DB Connected");
    // app.listen(PORT, () => {
    //   console.log("Server is running at", PORT);
    // });
    if (!app.get("isListening")) {
      app.listen(PORT, () => {
        console.log("Server is running at", PORT);
      });

      // Mark that the server is now listening
      app.set("isListening", true);
    }

    console.log("DB Connected");
  } catch (err) {
    console.log("Unable to connect database");
  }
};

dbConnection();
const jwtSecret = "Secret_key";
const verifyToken = async (req, res, next) => {
  let jwtToken = await redisClient.get("authorizationToken");
  // let jwtToken;
  const authHeader = req.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    res.send("Invalid Access token");
  } else {
    jwt.verify(jwtToken, jwtSecret, async (err, payload) => {
      if (err) {
        res.send("Invalid access");
      } else {
        // console.log(payload);
        req.name = payload.name;
        next();
      }
    });
  }
};

// getting name which from which user the access token generated and using by this get call
app.get("/userprofile", verifyToken, async (req, res) => {
  let { name } = req;
  // console.log(name);
  const userQuery = `select * from user where name = '${name}' `;
  const loginUser = await db.get(userQuery);

  if (loginUser) {
    res.json(loginUser);
    console.log("verified user");
  } else {
    res.send(err);
  }
});
// *****************************************************************************************************
//  user registration (signUp)
app.post("/userpost", async (req, res) => {
  const { name, email, password, address } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  //   console.log(hashedPassword);
  const checkUserQuery = `SELECT * from user where name='${name}' ;`;

  const checkUser = await db.get(checkUserQuery);
  //   console.log(checkUser);
  if (checkUser === undefined) {
    //  if user is not in db , we proceed further in inserting user row
    const insertQuery = `INSERT into user (name , email , password , address) values('${name}','${email}' , '${hashedPassword}' , '${address}' ) ; `;
    const createdUser = await db.run(insertQuery);
    const lastID = createdUser.lastID;
    const dataToInsert = {
      id: lastID,
      name: name,
      email: email,
      password: hashedPassword,
      address: address,
    };

    res.json({ user: dataToInsert });
    console.log(dataToInsert);
  } else {
    console.log("User already exists");
    res.json({ error: "user already exists" });
  }
});
// ****************************************************************************************
//  user LOGIN  , here we generate jwt access token
app.post("/userlogin", async (req, res) => {
  const { name, password } = req.body;
  const checkQuery = `SELECT * from user where name = '${name}' ; `;

  const checkUser = await db.get(checkQuery);
  if (checkUser === undefined) {
    res.json({ Err: "User not found to login" });
    console.log("User not found to login");
  } else {
    const comparePassword = bcrypt.compare(password, checkUser.password);
    // verifying password by using bcrypt.compare
    if (comparePassword) {
      const payload = {
        name: name,
      };

      const jwtToken = jwt.sign(payload, "Secret_key");
      await redisClient.set("authorizationToken", jwtToken, "EX", 3600);
      res.send({ jwtToken });

      console.log("Login success");
    } else {
      res.send("Invalid Password");
    }
  }
});

// ***************************************************************************

app.post("/fooditem", verifyToken, async (req, res) => {
  const { itemname, category, price } = req.body;
  const selectedQuery = `SELECT * from food where itemname='${itemname}' ;`;

  const foodItem = await db.get(selectedQuery);

  if (foodItem === undefined) {
    const insertFood = `INSERT into food (itemname , category , price ) values('${itemname}' , '${category}', '${price}');`;

    const result = await db.run(insertFood);
    res.json({ message: "Food item added successfully" });
    console.log("Food item added");
  } else {
    res.json({ err: "Getting err in inserting food item" });
    console.log("Err in adding food item");
  }
});

app.get("/food", verifyToken, async (req, res) => {
  const selectedQuery = `SELECT * from food ;`;
  const food = await db.all(selectedQuery);
  console.log("Getting all food items");
  res.send(food);
});

module.exports = { app, dbConnection, verifyToken };
