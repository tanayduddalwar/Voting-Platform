const express = require("express");
const app = express();
const db=require("./db");
// body parser object
const body_parser = require("body-parser");
app.use(body_parser.json()); // Corrected this line by adding parentheses to invoke the function

const userroutes = require("./routes/userroutes");
const candidateroutes=require("./routes/candidatesroutes")
app.use("/user", userroutes);
app.use("/candidates",candidateroutes);
const PORT = process.env.PORT || 3000; // Corrected the order of PORT declaration

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
