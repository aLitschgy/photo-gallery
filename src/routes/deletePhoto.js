import fs from "fs";

export function deletePhotoHandler(req, res) {
    const filename = req.params.filename;
    console.log('Deleting photo:', filename);
    const extIndex = filename.lastIndexOf('.');
    const base = extIndex !== -1 ? filename.slice(0, extIndex) : filename;
    const ext = extIndex !== -1 ? filename.slice(extIndex) : '';
    const thumbName = `${base}-minia${ext}`;

    const photoPath = `public/photos/${filename}`;
    const thumbnailPath = `public/photos/minias/${thumbName}`;

    fs.unlink(photoPath, (err) => {
        if (err) {
            console.error('Échec suppression photo:', err);
            return res.status(404).json({ error: 'Photo not found.' });
        }
        fs.unlink(thumbnailPath, (thumbErr) => {
            if (thumbErr) {
                return res.status(200).json({ message: 'Photo deleted, thumbnail not found.' });
            }
            res.status(200).json({ message: 'Photo and thumbnail deleted.' });
        });
    });
}