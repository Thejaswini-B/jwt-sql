const chai = require("chai");
const chaiHttp = require("chai-http");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const jwt = require("jsonwebtoken");
const Redis = require("ioredis");
const { app, dbConnection, verifyToken } = require("../index");

chai.use(chaiHttp);
const expect = chai.expect;

describe("API Tests", () => {
  let db;
  let redisClient;

  before(async () => {
    db = await open({
      filename: ":memory:",
      driver: sqlite3.Database,
    });

    await dbConnection();
  });

  after(async () => {
    await db.close();
    console.log("DB Closed");
  });

  // Test user registration (signUp)
  describe("POST / Registering a new user", () => {
    it("should register a new user", (done) => {
      chai
        .request(app)
        .post("/userpost")
        .send({
          name: "Teja 32 ",
          email: "teja@gmail.com",
          password: "12345",
          address: "Hdp",
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("user");
          done();
        });
    });
  });

  // Test user login
  describe("POST / Existing User Login ", () => {
    it("should log in a user and return a JWT token", (done) => {
      chai
        .request(app)
        .post("/userlogin")
        .send({
          name: "Teja18",
          password: "12345",
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("jwtToken");
          // console.log(res.body);

          done();
        });
    });
  });

  // Test adding a food item
  describe("Adding food item to the table", () => {
    it("should add a new food item", (done) => {
      chai
        .request(app)
        .post("/fooditem")

        .send({
          itemname: "Biryani 14",
          category: "Non-veg",
          price: "500",
        })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property(
            "message",
            "Food item added successfully"
          );
          done();
        });
    });
  });

  // Test getting all food items
  describe("GET / Getting all food items array", () => {
    it("should get all food items with a valid JWT token", (done) => {
      chai
        .request(app)
        .get("/food")

        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("array");
          done();
        });
    });
  });
});

// ***********************************************************************************************888
