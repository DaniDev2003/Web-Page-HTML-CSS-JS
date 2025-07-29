// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCQa365zkgZjCWS6sXje3f4psV45bqa-KY",
  authDomain: "upuhdb.firebaseapp.com",
  projectId: "upuhdb",
  storageBucket: "upuhdb.appspot.com",
  messagingSenderId: "664347935119",
  appId: "1:664347935119:web:dd68d9578a8832540ecbfa",
  measurementId: "G-KFCSFRLZV1"
};

  firebase.initializeApp(firebaseConfig);
  const functions = firebase.app().functions("southamerica-east1"); // región de la function
  const crearPreference = functions.httpsCallable("crearPreference");
  const db = firebase.firestore();
  const storage = firebase.storage();
  let intervaloCarrusel = null;

  document.addEventListener("DOMContentLoaded", () => {
    const loadingScreen = document.getElementById("loading-screen");
    const mainContent = document.querySelector(".main-content");
    const container = document.getElementById("redes-container");
    const btnLeft = document.getElementById("scroll-left");
    const btnRight = document.getElementById("scroll-right");
    const btnDonar = document.getElementById("btn-donar");
    const btnConfirmar = document.querySelector("#modalDonacion .btn:not(.cancel)");
    const btnCancelar = document.querySelector("#modalDonacion .btn.cancel");

      if (btnDonar) {
    btnDonar.addEventListener("click", () => {
      document.getElementById("modalDonacion").style.display = "flex";
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
      document.getElementById("modalDonacion").style.display = "none";
    });
  }

  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", async () => {
      const nombre = document.getElementById("nombreDonador").value.trim();
      const monto = document.getElementById("montoDonacion").value.trim();

      if (!nombre || !monto) {
        alert("Por favor completá todos los campos.");
        return;
      }

      try {
        // Llamada a la Cloud Function
        const resultado = await crearPreference({ nombre, monto: parseFloat(monto) });
        const linkDePago = resultado.data.init_point;

        // Opcional: mostrar mensaje antes de redirigir
        alert(`Gracias ${nombre}, vas a ser redirigido a Mercado Pago para completar tu donación.`);

        // Cerrar modal
        document.getElementById("modalDonacion").style.display = "none";

        // Redirigir al link de Mercado Pago
        window.location.href = linkDePago;

      } catch (error) {
        console.error("Error al crear preferencia:", error);
        alert("Ocurrió un error al generar el enlace de donación. Intentá más tarde.");
      }
    });
  }


  function cargarTextos() {
    return db.collection("Informacion-web").doc("secciones").get()
      .then(doc => {
        if (!doc.exists) throw new Error("Documento no encontrado");
        const datos = doc.data();

        const secciones = ["objetivos", "quienes", "archivos", "reflexiones", "motivacional", "contacto", "donaciones"];

        secciones.forEach(seccion => {
          const contenido = datos[seccion];
          if (!contenido) return;

          const titleElem = document.querySelector(`#${seccion} .title`);
          const descElem = document.querySelector(`#${seccion} .description`);
          const rightTitleElem = document.querySelector(`#${seccion} .right-title`);
          const rightDescElem = document.querySelector(`#${seccion} .right-description`);

          if (titleElem && contenido.title) titleElem.textContent = contenido.title;
          if (descElem && contenido.description) descElem.textContent = contenido.description;
          if (rightTitleElem && contenido["right-title"]) rightTitleElem.textContent = contenido["right-title"];
          if (rightDescElem && contenido["right-description"]) rightDescElem.textContent = contenido["right-description"];
        });
      })
      .catch(error => console.error("Error al cargar textos:", error));
  }

Promise.all([
  cargarTextos(),
  cargarGaleriaDesdeStorage(),
  cargarRedes(),
  cargarDonaciones()
])
  .then(() => {
    cargarPublicaciones();
    loadingScreen.style.display = "none";
    mainContent.style.display = "block";
  })
  .catch(error => {
    console.error("Error cargando textos o galería:", error);
    loadingScreen.style.display = "none";
    mainContent.style.display = "block";
  });

    function cargarDonaciones() {
    return db.collection("Informacion-web").doc("donadores").get()
      .then(doc => {
        if (!doc.exists) return;

        const data = doc.data();
        const aprobados = data.aprobados;

        if (!Array.isArray(aprobados) || aprobados.length === 0) return;

        const tbody = document.getElementById("cuerpo-donadores");
        tbody.innerHTML = ""; // limpiar tabla si ya hay datos

        aprobados.forEach(donacion => {
          const tr = document.createElement("tr");

          const tdNombre = document.createElement("td");
          tdNombre.textContent = donacion.nombre || "Anónimo";

          const tdEtiqueta = document.createElement("td");
          tdEtiqueta.textContent = "Donó:";

          const tdMonto = document.createElement("td");
          tdMonto.textContent = `$${donacion.monto || 0}`;

          tr.appendChild(tdNombre);
          tr.appendChild(tdEtiqueta);
          tr.appendChild(tdMonto);

          tbody.appendChild(tr);
        });
      })
      .catch(err => {
        console.error("Error al cargar donaciones:", err);
      });
  }

    function cargarRedes() {
    return new Promise((resolve, reject) => {
      const contenedor = document.getElementById("redes-container");

      db.collection("Informacion-web").doc("redes").get()
        .then(doc => {
          if (!doc.exists) {
            resolve(); // No hay redes, pero no es error
            return;
          }

          const redes = doc.data();

          Object.values(redes).forEach(red => {
            const { icono, nombre, descripcion, enlace } = red;

            const div = document.createElement("div");
            div.classList.add("red-social");
            div.onclick = () => window.open(enlace, "_blank");

            div.innerHTML = `
              <img src="${icono}" alt="${nombre}" class="icon-img">
              <span class="icon-label">${nombre}</span>
              <span class="icon-descripcion">${descripcion}</span>
            `;

            contenedor.appendChild(div);
          });

          resolve();
          updateScrollIndicators(); // Actualizar después de cargar contenido
        })
        .catch(err => {
          console.error("Error cargando redes:", err);
          reject(err);
        });
    });
  }
  
  btnLeft.onclick = () => container.scrollBy({ left: -200, behavior: "smooth" });
  btnRight.onclick = () => container.scrollBy({ left: 200, behavior: "smooth" });

  container.addEventListener("scroll", updateScrollIndicators);
  window.addEventListener("resize", updateScrollIndicators);

    function updateScrollIndicators() {
    const scrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    btnLeft.style.display = scrollLeft > 0 ? "block" : "none";
    btnRight.style.display = scrollLeft < maxScrollLeft - 1 ? "block" : "none";

    if (window.innerWidth <= 550) {
      container.classList.toggle("shadow-left", scrollLeft > 0);
      container.classList.toggle("shadow-right", scrollLeft < maxScrollLeft - 1);
    } else {
      container.classList.remove("shadow-left", "shadow-right");
    }
  }

function cargarGaleriaDesdeStorage() {
  return new Promise((resolve, reject) => {
    const listaRef = storage.ref("archivos/");
    const imagenes = [];
    const collage = document.getElementById("collage-container");
    const carrusel = document.getElementById("imagen-carrusel");
    const indicatorContainer = document.querySelector(".indicator-container");

    collage.innerHTML = ""; // limpiar galería

    listaRef.listAll()
      .then(res => {
        let index = 0;
        const total = res.items.length;
        if (total === 0) return resolve();

        let cargadas = 0;

        const cargarMedia = (url) => {
          imagenes.push(url);

          const extension = url.split('.').pop().split('?')[0].toLowerCase();
          const esVideo = ['mp4', 'webm', 'ogg'].includes(extension);

          const wrapper = document.createElement("div");
          wrapper.style.position = "relative";
          wrapper.style.display = "inline-block";

          let elemento;

          if (esVideo) {
            elemento = document.createElement("video");
            elemento.src = url;
            elemento.controls = false;         // sin controles en miniatura
            elemento.autoplay = false;         // no autoplay
            elemento.muted = true;             // mute para no molestar
            elemento.loop = false;             // sin loop
            elemento.style.width = "150px";   // tamaño fijo igual que la imagen
            elemento.style.height = "100px";
            elemento.style.objectFit = "cover";
            elemento.style.cursor = "pointer";

            // Opcional: reproducir en hover
            elemento.addEventListener("mouseenter", () => elemento.play());
            elemento.addEventListener("mouseleave", () => elemento.pause());

          } else {
            elemento = document.createElement("img");
            elemento.src = url;
            elemento.alt = "Imagen galería";
            elemento.style.cursor = "pointer";
            elemento.style.width = "150px";
            elemento.style.height = "100px";
            elemento.style.objectFit = "cover";
          }

          // Al hacer click, abrir visor pasando url y tipo
          elemento.addEventListener("click", () => mostrarEnVisor(url, esVideo));

          wrapper.appendChild(elemento);
          collage.appendChild(wrapper);

          cargadas++;
          if (cargadas === total) {
            // Crear indicadores
            indicatorContainer.innerHTML = "";
            imagenes.forEach((_, i) => {
              const span = document.createElement("span");
              span.classList.add("indicator");
              if (i === 0) span.classList.add("active");
              indicatorContainer.appendChild(span);
            });

            // Iniciar carrusel solo con imágenes
            const imagenesSolamente = imagenes.filter(url => {
              const ext = url.split('.').pop().split('?')[0].toLowerCase();
              return !['mp4', 'webm', 'ogg'].includes(ext);
            });

            if (imagenesSolamente.length > 0) {
              carrusel.src = imagenesSolamente[0];
              let index = 0;

              setInterval(() => {
                index = (index + 1) % imagenesSolamente.length;
                carrusel.style.opacity = 0;

                setTimeout(() => {
                  carrusel.src = imagenesSolamente[index];
                  carrusel.style.opacity = 1;

                  const indicators = document.querySelectorAll(".indicator-container .indicator");
                  indicators.forEach((ind, i) => {
                    ind.classList.toggle("active", i === index);
                  });
                }, 300);
              }, 4000);
            }

            resolve();
          }
        };

        res.items.forEach(itemRef => {
          itemRef.getDownloadURL().then(cargarMedia).catch(reject);
        });
      })
      .catch(reject);
  });
}


  function cargarPublicaciones() {
    const contenedor = document.getElementById("contenedor-publicaciones");
    db.collection("Informacion-web").doc("publicaciones").get()
      .then(doc => {
        if (!doc.exists) return;
        const publicaciones = doc.data();

    Object.entries(publicaciones).forEach(([pubId, pub]) => {
      const { titulo, descripcion, imagen, comentarios, video } = pub;

    const div = document.createElement("div");
    div.classList.add("publicacion");
    div.dataset.id = pubId;

    div.innerHTML = `
      <h3>${titulo}</h3>
      <p class="descripcion">${descripcion}</p>
      ${video
        ? `<video controls src="${imagen}" alt="${titulo}" class="video-publicacion"></video>`
        : (imagen ? `<img src="${imagen}" alt="${titulo}">` : "")
      }
      <div class="comentario-label">Comentarios</div>
    `;

          // 🔹 Sección de comentarios existentes
          if (Array.isArray(comentarios) && comentarios.length > 0) {
            const comentariosDiv = document.createElement("div");
            comentariosDiv.classList.add("comentarios-container");

            comentarios.forEach(c => {
              const com = document.createElement("div");
              com.classList.add("comentario");
              com.innerHTML = `
                <div class="nombre">${c.nombre}</div>
                <div class="texto">${c.comentario}</div>
              `;
              comentariosDiv.appendChild(com);
            });

            div.appendChild(comentariosDiv);
          }

          // 🔹 Formulario para agregar nuevo comentario
          const form = document.createElement("div");
          form.classList.add("comentario-form");

          form.innerHTML = `
            <div class="comentario-label">Deja tu comentario</div>
            <input type="text" class="input-nombre" placeholder="Tu nombre" />
            <textarea maxlength="500" placeholder="Escribe un comentario..."></textarea>
            <button class="btn-publicar">Publicar</button>
          `;

          // 🔹 Activar botón "Publicar" solo si ambos campos tienen texto
          const inputNombre = form.querySelector(".input-nombre");
          const textarea = form.querySelector("textarea");
          const boton = form.querySelector(".btn-publicar");

          function actualizarEstadoBotonPublicar() {
            if (inputNombre.value.trim() !== "" && textarea.value.trim() !== "") {
              boton.classList.add("activa");
            } else {
              boton.classList.remove("activa");
            }
          }

          inputNombre.addEventListener("input", actualizarEstadoBotonPublicar);
          textarea.addEventListener("input", actualizarEstadoBotonPublicar);

          boton.addEventListener("click", () => {
          const nombre = inputNombre.value.trim();
          const comentario = textarea.value.trim();

          if (nombre === "" || comentario === "") return;

          const publicacionId = div.dataset.id;

          const nuevoComentario = {
            nombre,
            comentario
          };

          db.collection("Informacion-web")
            .doc("publicaciones")
            .update({
              [`${publicacionId}.comentarios`]: firebase.firestore.FieldValue.arrayUnion(nuevoComentario)
            })
            .then(() => {
              // ✅ Agregar el nuevo comentario directamente al DOM
              let comentariosDiv = div.querySelector(".comentarios-container");

              // Si no existe aún, la creamos
              if (!comentariosDiv) {
                comentariosDiv = document.createElement("div");
                comentariosDiv.classList.add("comentarios-container");
                div.insertBefore(comentariosDiv, form); // Insertamos antes del formulario
              }

              // Crear el nuevo div de comentario
              const nuevoDiv = document.createElement("div");
              nuevoDiv.classList.add("comentario");
              nuevoDiv.innerHTML = `
                <div class="nombre">${nombre}</div>
                <div class="texto">${comentario}</div>
              `;

              comentariosDiv.appendChild(nuevoDiv);

              // ✅ Limpiar campos
              inputNombre.value = "";
              textarea.value = "";
              boton.classList.remove("activa");
            })
            .catch(err => console.error("Error publicando comentario:", err));
        });



          div.appendChild(form);
          contenedor.appendChild(div);
        });
      })
      .catch(err => console.error("Error cargando publicaciones:", err));
  }

// Visor pantalla completa
function mostrarEnVisor(url, contentTypeOrIsVideo) {
  const visor = document.getElementById("visor");
  const visorImg = document.getElementById("visor-imagen");
  const visorVid = document.getElementById("visor-video");

  // Si contentTypeOrIsVideo es string MIME
  // const esVideo = typeof contentTypeOrIsVideo === "string" ? contentTypeOrIsVideo.startsWith("video/") : contentTypeOrIsVideo;
  // Si ya es booleano (esVideo), solo usarlo directamente:
  const esVideo = typeof contentTypeOrIsVideo === "boolean" ? contentTypeOrIsVideo : (contentTypeOrIsVideo.startsWith && contentTypeOrIsVideo.startsWith("video/"));

  if (esVideo) {
    visorImg.style.display = "none";
    visorVid.src = url;
    visorVid.style.display = "block";
    visorVid.load();
    visorVid.play();
  } else {
    visorVid.pause();
    visorVid.style.display = "none";
    visorVid.src = "";
    visorImg.src = url;
    visorImg.style.display = "block";
  }

  visor.style.display = "flex";
}


// Cerrar visor
document.getElementById("cerrar-visor").addEventListener("click", () => {
  const visor = document.getElementById("visor");
  const visorVid = document.getElementById("visor-video");

  visor.style.display = "none";
  visorVid.pause();
  visorVid.src = ""; // liberar memoria
});

  const buttons = document.querySelectorAll(".nav-button");
  const sections = document.querySelectorAll("section");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const targetId = btn.dataset.target;
      const section = document.getElementById(targetId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  window.addEventListener("scroll", () => {
    let scrollY = window.scrollY;

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        const id = section.getAttribute("id");
        buttons.forEach(btn => {
          btn.classList.toggle("active", btn.dataset.target === id);
        });
      }
    });
  });
});