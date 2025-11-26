import justifiedLayout from "https://cdn.jsdelivr.net/npm/justified-layout@3.0.0/+esm";
import PhotoSwipeLightbox from "https://unpkg.com/photoswipe/dist/photoswipe-lightbox.esm.js";

// Debounce helper
function debounce(fn, wait) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

async function loadGallery() {
    const images = await fetch('/gallery.json').then(r => r.json());
    const container = document.getElementById('gallery');

    // Format for justifiedLayout: array of aspect ratios
    const aspectRatios = images.map(img => img.width / img.height);

    let lightbox = null;

    // render function (can be called on resize)
    function render() {
        const layout = justifiedLayout(aspectRatios, {
            containerWidth: container.clientWidth,
            targetRowHeight: 300,
            boxSpacing: 10
        });

        // Ensure the container reserves space for absolutely-positioned boxes
        if (layout && typeof layout.containerHeight === 'number') {
            container.style.height = layout.containerHeight + 'px';
        }

        // Clear previous items
        container.innerHTML = '';

        layout.boxes.forEach((box, i) => {
            const img = images[i];

            const link = document.createElement("a");
            link.href = img.src;
            link.setAttribute("data-pswp-width", img.width);
            link.setAttribute("data-pswp-height", img.height);
            link.className = "item";

            const image = document.createElement("img");
            // prefer thumb if present, fall back to src
            image.src = img.thumb || img.src;
            image.style.width = box.width + "px";
            image.style.height = box.height + "px";
            image.style.position = "absolute";
            image.style.left = box.left + "px";
            image.style.top = box.top + "px";

            link.appendChild(image);
            container.appendChild(link);
        });

        // Reinitialize PhotoSwipeLightbox safely
        if (lightbox && typeof lightbox.destroy === 'function') {
            try { lightbox.destroy(); } catch (e) { /* ignore */ }
            lightbox = null;
        }

        lightbox = new PhotoSwipeLightbox({
            gallery: "#gallery",
            children: ".item",
            pswpModule: () => import("https://unpkg.com/photoswipe/dist/photoswipe.esm.js")
        });
        lightbox.init();
    }

    // initial render
    render();

    // Recompute layout on resize (debounced)
    const onResize = debounce(() => {
        render();
    }, 150);

    window.addEventListener('resize', onResize);
}

window.addEventListener("load", loadGallery);
