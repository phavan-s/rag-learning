require("dotenv").config();

const express = require("express");
const cors = require("cors");

const uploadRoute =
  require("./routes/upload");

const searchRoute =
  require("./routes/search");  

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api", uploadRoute);
app.use("/api", searchRoute);

app.listen(
  process.env.PORT,
  () => {
    console.log(
      `Server running on ${process.env.PORT}`
    );
  }
);