// Gestion de l'upload de photos
document
  .getElementById("upload-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const files = document.getElementById("photo").files;
    if (!files.length) return;
    const formData = new FormData();
    for (const file of files) {
      formData.append("photo", file);
    }
    const token = localStorage.getItem("token");
    const res = await fetch("/upload", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
      },
      body: formData,
    });
    document.getElementById("upload-error").textContent = "";
    document.getElementById("upload-success").textContent = "";
    if (res.ok) {
      window.location.reload();
    } else {
      const err = await res.json().catch(() => ({}));
      document.getElementById("upload-error").textContent =
        err.error || "Erreur lors de l'upload";
    }
  });

// Affichage et gestion de la galerie
(async function () {
  const images = await fetch("/gallery.json")
    .then((r) => r.json())
    .then((data) =>
      data.sort((a, b) => {
        if (a.lexoRank < b.lexoRank) return -1;
        if (a.lexoRank > b.lexoRank) return 1;
        return 0;
      })
    );
  const gallerySection = document.getElementById("gallery-management");

  for (const img of images) {
    const div = document.createElement("div");
    div.className = "photo-item";
    const filename = img.src.split("/").pop();
    div.dataset.filename = filename; // Stocke le filename dans un data attribute

    const imageElem = document.createElement("img");
    imageElem.src = img.thumb;
    imageElem.width = 150;

    const deleteBtn = document.createElement("button");
    const deleteIcon = document.createElement("img");
    deleteIcon.src = "/assets/icons/red-trash-can-icon.svg";
    deleteIcon.alt = "Supprimer";
    deleteIcon.width = 20;
    deleteBtn.appendChild(deleteIcon);

    deleteBtn.addEventListener("click", async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/photo/" + filename, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token,
        },
      });
      if (res.ok) {
        div.remove();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erreur lors de la suppression");
      }
    });

    div.appendChild(imageElem);
    div.appendChild(deleteBtn);
    gallerySection.appendChild(div);
  }

  // Initialise SortableJS pour le drag and drop
  new Sortable(gallerySection, {
    animation: 300,
    easing: "cubic-bezier(0.4, 0.0, 0.2, 1)",
    ghostClass: "sortable-ghost",
    dragClass: "sortable-drag",
    forceFallback: false,
    fallbackTolerance: 3,
    onEnd: async function (evt) {
      // Récupère les informations sur le mouvement
      const movedItem = evt.item;
      const movedFilename = movedItem.dataset.filename;

      // Trouve les éléments précédent et suivant
      const prevElement = movedItem.previousElementSibling;
      const nextElement = movedItem.nextElementSibling;

      const prevFilename = prevElement ? prevElement.dataset.filename : null;
      const nextFilename = nextElement ? nextElement.dataset.filename : null;

      // Appelle l'API pour mettre à jour l'ordre
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("/api/reorder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            filename: movedFilename,
            prevFilename: prevFilename,
            nextFilename: nextFilename,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.error || "Erreur lors du réordonnancement");
          window.location.reload();
        }
      } catch (error) {
        console.error("Erreur réordonnancement:", error);
        alert("Erreur lors du réordonnancement");
        window.location.reload();
      }
    },
  });
})();

// Déconnexion
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}
