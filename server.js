import express from "express";
import session from "express-session";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET || "supersecret",
  resave: false,
  saveUninitialized: false
}));

const PASSWORD = process.env.PASSWORD || "mypassword";
if (!process.env.SESSION_SECRET) {
  console.warn('Warning: environment variable SESSION_SECRET is not set — falling back to insecure default.');
}
if (!process.env.PASSWORD) {
  console.warn('Warning: environment variable PASSWORD is not set — falling back to insecure default.');
}

function auth(req, res, next) {
  if (req.session.logged) return next();
  res.redirect("/login");
}

app.post("/login", express.urlencoded({ extended: true }), (req, res) => {
  if (req.body.password === PASSWORD) {
    req.session.logged = true;
    return res.redirect("/admin.html");
  }
  res.send("Mot de passe incorrect");
});

app.post("/upload", auth, upload.array("photo"), (req, res) => {
  const files = req.files || [];

  const promises = files.map((file) => {
    const originalName = file.originalname;
    const newPath = `public/photos/${originalName}`;

    return fs.promises.mkdir('public/photos', { recursive: true })
      .then(() => fs.promises.copyFile(file.path, newPath))
      .then(() => fs.promises.unlink(file.path))
      .then(() => {
        const extIndex = originalName.lastIndexOf('.');
        const base = extIndex !== -1 ? originalName.slice(0, extIndex) : originalName;
        const ext = extIndex !== -1 ? originalName.slice(extIndex) : '';
        const thumbName = `${base}-minia${ext}`;
        const thumbPath = `public/photos/minias/${thumbName}`;

        return fs.promises.mkdir('public/photos/minias', { recursive: true })
          .then(() => sharp(newPath).rotate().resize({ height: 1000 }).toFile(thumbPath))
          .catch((err) => {
            console.error('Échec génération miniature:', err);
          });
      })
      .catch((err) => {
        console.error('Échec copie/suppression du fichier uploadé:', err);
      });
  });

  Promise.all(promises)
    .then(() => res.redirect('/admin.html'))
    .catch((err) => {
      console.error('Erreur lors du traitement des uploads:', err);
      res.redirect('/admin.html');
    });
});

app.get("/gallery.json", async (req, res) => {
  const files = fs.readdirSync("public/photos");

  const images = (await Promise.all(
    files
      .filter(f => fs.statSync(`public/photos/${f}`).isFile())
      .map(async (f) => {
        const path = `public/photos/${f}`;
        try {
          const m = await sharp(path).metadata();
          let width = m.width;
          let height = m.height;
          // Exif Orientation handling
          // 5 => Rotation 270° + Symétrie horizontale
          // 6 => Rotation 270°
          // 7 => Rotation 90° + Symétrie horizontale
          // 8 => Rotation 90°
          if (m.orientation && [5, 6, 7, 8].includes(m.orientation)) {
            [width, height] = [height, width];
          }

          return {
            src: `/photos/${f}`,
            thumb: `/photos/minias/${f.replace(/(\.[^.]*)$/, '-minia$1')}`,
            width,
            height
          };
        } catch (err) {
          console.error(`Skipping file ${f}:`, err.message || err);
          return null;
        }
      })
  )).filter(p => p !== null);

  res.json(images);
});

app.listen(3000, () => console.log("App listening on port 3000"));
