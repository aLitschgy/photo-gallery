// Gestion de l'upload de photos
document.getElementById('upload-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const files = document.getElementById('photo').files;
    if (!files.length) return;
    const formData = new FormData();
    for (const file of files) {
        formData.append('photo', file);
    }
    const token = localStorage.getItem('token');
    const res = await fetch('/upload', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        body: formData
    });
    document.getElementById('upload-error').textContent = '';
    document.getElementById('upload-success').textContent = '';
    if (res.ok) {
        window.location.reload();
    } else {
        const err = await res.json().catch(() => ({}));
        document.getElementById('upload-error').textContent = err.error || 'Erreur lors de l\'upload';
    }
});

// Gestion de la suppression de photos
(async function () {
    const images = await fetch('/gallery.json').then(r => r.json());
    const gallerySection = document.getElementById('gallery-management');
    for (const img of images) {
        const div = document.createElement('div');
        div.className = 'photo-item';
        const imageElem = document.createElement('img');
        imageElem.src = img.thumb;
        imageElem.width = 150;
        const deleteBtn = document.createElement('button');
        const deleteIcon = document.createElement('img');
        deleteIcon.src = '/assets/icons/red-trash-can-icon.svg';
        deleteIcon.alt = 'Supprimer';
        deleteIcon.width = 20;
        deleteBtn.appendChild(deleteIcon);
        const filename = img.src.split('/').pop();
        deleteBtn.addEventListener('click', async () => {
            const token = localStorage.getItem('token');
            const res = await fetch('/photo/' + filename, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            if (res.ok) {
                div.remove();
            } else {
                const err = await res.json().catch(() => ({}));
                alert(err.error || 'Erreur lors de la suppression');
            }
        });
        div.appendChild(imageElem);
        div.appendChild(deleteBtn);
        gallerySection.appendChild(div);
    }
})();


// Déconnexion
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}
