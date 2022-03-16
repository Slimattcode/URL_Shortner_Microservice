require('dotenv').config({ path: 'sample.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const dns = require("dns")
const http = require("http").createServer();
const mongoose = require("mongoose");

// connecting to server
mongoose.connect(process.env.MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

// default connection
const db = mongoose.connection;

// notification of connectioin errors
db.on("error", console.error.bind(console, "mongoBD connection error:"));


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// create a schema for the urls
const urlShortner = new mongoose.Schema({
  original_url: String,
  short_url: Number
})

// validation options for the schema, here url must not be empty;
urlShortner.set("validateBeforeSave", false);
urlShortner.path("original_url").validate(function(value) { return value != null })

// a model;
let Url = mongoose.model("Url", urlShortner);

// a post with url validator
let number = 0;
const incrementer = () => number += 1;
app.use(bodyParser.urlencoded({ extended: false }));
app.post("/api/shorturl", (req, res) => {
    try {
    let url = new URL(req.body.url);
      if (url.origin === null) {
        return res.json({ error: "invalid url" })
      }
  dns.lookup(url.hostname, (err, address, family) => {
    console.log(url.hostname)
    if (err) {return res.json({ error: "invalid url" })};
    Url.findOne({ original_url: url }, function(err, data) {
      if (err) { return "error" }
      console.log(data);
      if (data === null) {
        url = new Url({ original_url: url, short_url: incrementer() });
        url.save(function(err, data) {
          if (err) { return "error" };
          res.json({ original_url: data.original_url, short_url: data.short_url })
        })
      } else {
        res.json({ original_url: data.original_url, short_url: data.short_url })
      }
    })
  })
    } catch (e) {
    return res.json({ error: "invalid url" })
  }
})

// get width input from user redirecting to orginal url
app.get("/api/shorturl/:number", (req, res) => {
  Url.findOne({ short_url: req.params.number }, function(err, data) {
      if (err) { return "error" }
      console.log(data.original_url);
      if (data === null) {
        res.json({ error: "No short URL found for the given input" })
      } else {
        res.redirect(301, data.original_url)
      }
    })
})

/*Url.deleteMany({short_url: 5}, (err, data) => {
  if (err) return "error"
  console.log(data)
})*/


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
