
import express from "express";
import { auth, loginHandler } from "./middleware/auth.js";
import { upload, uploadHandler } from "./routes/upload.js";
import { galleryHandler } from "./routes/gallery.js";
import { deletePhotoHandler } from "./routes/deletePhoto.js";

const app = express();

app.use(express.static("public"));

app.use(express.json());


app.get("/api/check-token", auth, (req, res) => {
  res.json({ valid: true });
});
app.get("/gallery.json", galleryHandler);
app.post("/login", express.urlencoded({ extended: true }), loginHandler);
app.post("/upload", auth, upload.array("photo"), uploadHandler);
app.delete("/photo/:filename", auth, deletePhotoHandler);

app.listen(3000, () => console.log("Galery app listening on port 3000"));
