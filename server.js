import express from "express";
import session from "express-session";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));

app.use(session({
  secret: "supersecret",
  resave: false,
  saveUninitialized: false
}));

const PASSWORD = "mypassword";

function auth(req, res, next) {
  if (req.session.logged) return next();
  res.redirect("/login");
}

app.get("/login", (req, res) => {
  res.send(`
     <h2>Connexion</h2>
     <form method="POST">
       <input type="password" name="password" />
       <button>Entrer</button>
     </form>
  `);
});

app.post("/login", express.urlencoded({ extended: true }), (req, res) => {
  if (req.body.password === PASSWORD) {
    req.session.logged = true;
    return res.redirect("/admin.html");
  }
  res.send("Mot de passe incorrect");
});

// Upload + extraction des dimensions (gestion des fichiers multiples)
app.post("/upload", auth, upload.array("photo"), async (req, res) => {
  const files = req.files || [];
  for (const file of files) {
    const originalName = file.originalname;
    const newPath = `public/photos/${originalName}`;
    fs.renameSync(file.path, newPath);

    try {
      const extIndex = originalName.lastIndexOf('.');
      const base = extIndex !== -1 ? originalName.slice(0, extIndex) : originalName;
      const ext = extIndex !== -1 ? originalName.slice(extIndex) : '';
      const thumbName = `${base}-minia${ext}`;
      const thumbPath = `public/photos/minias/${thumbName}`;

      await sharp(newPath)
        .resize({ height: 1000 })
        .toFile(thumbPath);
    } catch (err) {
      console.error('Échec génération miniature:', err);
    }
  }
  res.redirect("/admin.html");
});

app.get("/gallery.json", async (req, res) => {
  const files = fs.readdirSync("public/photos");

  const images = await Promise.all(
    files
      .filter(f => fs.statSync(`public/photos/${f}`).isFile())
      .map(async (f) => {
        const path = `public/photos/${f}`;
        const m = await sharp(path).metadata();
        return {
          src: `/photos/${f}`,
          thumb: `/photos/minias/${f.replace(/(\.[^.]*)$/, '-minia$1')}`,
          width: m.width,
          height: m.height
        };
      })
  );

  res.json(images);
});

app.listen(3000, () => console.log("🖼️  Galerie disponible sur http://localhost:3000"));
