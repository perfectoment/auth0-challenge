const express = require("express");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const { join } = require("path");
const jwtAuthz = require('express-jwt-authz');

const authConfig = require("./auth_config.json");

var PORT = process.env.PORT || 3000;
const app = express();


// Serve assets from the /public folder
app.use(express.static(join(__dirname, "public")));
//replacement for currently depreciated body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Create the JWT validation middleware
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"]
});

// Create an endpoint that uses the above middleware to
// protect this route from unauthorized requests




app.get("/api/external", checkJwt, (req, res) => {
  res.send({
    msg: "Your access token was successfully validated!"
  });
});

app.patch("/api/v2/users/:id", checkJwt, (req, res) => {
    res.send({
        msg: "Order Saved!"
    })
});


// Serve the auth configuration file
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

// Serve the index page to everything else
app.get("/*", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// Error handler
app.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});

app.listen(PORT, function() {
  console.log("App now listening at localhost:" + PORT);
});


