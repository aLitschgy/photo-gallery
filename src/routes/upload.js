import multer from "multer";
import sharp from "sharp";
import fs from "fs";

const upload = multer({ dest: "uploads/" });

export { upload };

export function uploadHandler(req, res) {
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
        .then(() => res.redirect('/admin'))
        .catch((err) => {
            console.error('Erreur lors du traitement des uploads:', err);
            res.redirect('/admin');
        });
}
