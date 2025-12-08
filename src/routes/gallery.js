// gallery.js
import fs from "fs";
import sharp from "sharp";

export async function galleryHandler(req, res) {
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
}
