require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const hbs = require("express-handlebars");
const { Client, Config, CheckoutAPI } = require("@adyen/api-library");
const uuid = require("uuid");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const { response } = require("express");

var app = express();

const config = new Config();
config.apiKey = process.env.CHECKOUT_API_KEY;
config.merchantAccount = "AdyenRecruitmentCOM" ;
config.clientKey = "test_7ZCG2HRVQ5DYDG54CTVFVXKYFIKWXTBF" ;
const client = new Client({ config });
client.setEnvironment("TEST");
const checkout = new CheckoutAPI(client);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);
// app.use('/payment', indexRouter);

const paymentDataStore = {};

app.get("/", async (req, res) => {
  try {
    const response = await checkout.paymentMethods({
      channel: "web",
      merchantAccount: process.env.MERCHANT_ACCOUNT,
    });
    res.render("payment", {
      clientKey: process.env.CLIENT_KEY,
      response: JSON.stringify(response),
    });
  } catch (error) {
    console.error(error);
  }
});

app.post("/api/initiatePayment", async function (req, res) {
  try {
    const orderRef = uuid();
    const response = await checkout.payments({
      amount: { currency: "EUR", value: 300 },
      referebce: orderRef,
      merchantAccount: process.env.MERCHANT_ACCOUNT,
      channel: "web",
      additionalData: {
        allow3DS2: true,
      },
      returnUrl: `http://localhost:3000/api/handleShopperRedirect?orderRef=${orderRef}`,
      brouwserInfo: req.body.browserInfo,
      paymentMethod: req.body.paymentMethod,
    });
    let resultCode = response.resultCode;
    let action = null;
    if (response.action) {
      action = response.action;
      paymentDataStore[orderRef] = action.paymentData;
    }
    res.json({ resultCode, action });
  } catch (error) {
    console.error(error);
  }
});

app.all("/api/handleShopperRedidect", async (req, res) => {
  const payload = {};
  payload["details"] = req.method === "GET" ? req.query : req.body;
  const orderRef = req.query.orderRef;
  payload["paymentData"] = paymentDataStore[orderRef];
  delete paymentDataStore[orderRef];

  try {
    const response = await checkout.paymentsDetails(payload);

    switch (response.resultCode) {
      case "Authorised":
        res.redirect("/succes");
        break;
      case "Pending":
      case "Recieved":
        res.redirect("/pending");
        break;
      case "Refused":
        res.redirect("/failed");
        break;
      default:
        res.redirect("/error");
        break;
    }
  } catch (error) {
    console.error(error);
  }
});

app.get("/succes", (req, res) => {
  res.render("succes");
});
app.get("/pending", (req, res) => {
  res.render("pending");
});
app.get("/error", (req, res) => {
  res.render("error");
});
app.get("/failed", (req, res) => {
  res.render("failed");
});

app.post("/api/submitAdditionalDetails", async (req, res) => {
  let payload = {};

  payload["details"] = req.body.details;
  payload["paymentData"] = req.body.paymentData;

  try {
    const response = await checkout.paymentsDetails(payload);

    let resultCode = response.resultCode;
    let action = response.action || null;

    res.json({ action, resultCode });
  } catch (error) {
    console.error(error);
  }
});

app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
