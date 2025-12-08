
import express from "express";
import session from "express-session";
import { SESSION_SECRET } from "./config/config.js";
import { auth, loginHandler } from "./middleware/auth.js";
import { upload, uploadHandler } from "./routes/upload.js";
import { galleryHandler } from "./routes/gallery.js";

const app = express();

app.use(express.static("public"));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.post("/login", express.urlencoded({ extended: true }), loginHandler);
app.post("/upload", auth, upload.array("photo"), uploadHandler);
app.get("/gallery.json", galleryHandler);

app.listen(3000, () => console.log("App listening on port 3000"));
