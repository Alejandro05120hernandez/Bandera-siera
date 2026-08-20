/* ============================================================
   BANDERA SIERA — script.js
   Museo Digital + ruta + programa + canal de WhatsApp del XXXV Recorrido.

   La página ya no usa un login municipal ni guarda registros de
   ayuntamientos en localStorage. La suscripción ciudadana con Google
   requiere un endpoint de servidor que valide el ID token y guarde
   el consentimiento. Google Calendar funciona mediante OAuth y crea
   el evento directamente en el calendario del usuario.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------------- HIMNO MANUAL ----------------
     Los fondos son imágenes estáticas. El himno comienza únicamente
     cuando el usuario pulsa “Reproducir himno” junto a la BANDERA SIERA. */
  const himnoBackground = document.getElementById("himnoBackground");
  const himnoToggle = document.getElementById("himnoToggle");

  if (himnoBackground && himnoToggle) {
    himnoBackground.volume = 0.65;

    const icon = himnoToggle.querySelector(".himno-symbol-icon");
    const label = himnoToggle.querySelector(".himno-symbol-label");

    function actualizarBotonHimno() {
      const reproduciendo = !himnoBackground.paused && !himnoBackground.ended;
      himnoToggle.classList.toggle("is-playing", reproduciendo);
      himnoToggle.setAttribute("aria-pressed", String(reproduciendo));
      himnoToggle.setAttribute("aria-label", reproduciendo ? "Pausar himno" : "Reproducir himno");
      if (icon) icon.textContent = reproduciendo ? "❚❚" : "▶";
      if (label) label.textContent = reproduciendo ? "Pausar himno" : "Reproducir himno";
    }

    himnoToggle.addEventListener("click", async () => {
      if (himnoBackground.paused) {
        try {
          await himnoBackground.play();
        } catch (error) {
          console.warn("No fue posible reproducir el himno:", error);
        }
      } else {
        himnoBackground.pause();
      }
      actualizarBotonHimno();
    });

    himnoBackground.addEventListener("play", actualizarBotonHimno);
    himnoBackground.addEventListener("pause", actualizarBotonHimno);
    himnoBackground.addEventListener("ended", actualizarBotonHimno);
    actualizarBotonHimno();
  }


  /* ---------------- EXPERIENCIA DE SCROLL ----------------
     Entrada suave de secciones + parallax muy ligero sobre la imagen
     "pano uno". En móvil y con reducción de movimiento se desactiva. */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scrollStages = document.querySelectorAll("main > section");

  scrollStages.forEach(section => section.classList.add("scroll-stage"));

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("is-in-view");
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });

    scrollStages.forEach(section => sectionObserver.observe(section));
  } else {
    scrollStages.forEach(section => section.classList.add("is-in-view"));
  }

  const panoBackgrounds = document.querySelectorAll(".pano-static-bg");
  let panoTicking = false;

  function updatePanoScroll() {
    panoTicking = false;
    if (reduceMotion.matches || window.innerWidth <= 920) {
      panoBackgrounds.forEach(bg => bg.style.setProperty("--pano-shift", "0px"));
      return;
    }

    panoBackgrounds.forEach(bg => {
      const section = bg.parentElement;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const centerOffset = (rect.top + rect.height / 2) - window.innerHeight / 2;
      const shift = Math.max(-42, Math.min(42, centerOffset * -0.055));
      bg.style.setProperty("--pano-shift", `${shift.toFixed(1)}px`);
    });
  }

  function requestPanoUpdate() {
    if (panoTicking) return;
    panoTicking = true;
    requestAnimationFrame(updatePanoScroll);
  }

  window.addEventListener("scroll", requestPanoUpdate, { passive: true });
  window.addEventListener("resize", requestPanoUpdate);
  updatePanoScroll();

  /* ---------------- MENÚ MÓVIL ---------------- */
  const navToggle = document.getElementById("navToggle");
  const mainNav   = document.getElementById("mainNav");

  function cerrarNav(){
    mainNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.classList.remove("is-active");
  }

  navToggle.addEventListener("click", () => {
    const abierto = mainNav.classList.toggle("is-open");
    navToggle.classList.toggle("is-active", abierto);
    navToggle.setAttribute("aria-expanded", String(abierto));
  });

  // Cierra el menú al tocar un enlace (útil en una sola página con anclas).
  mainNav.querySelectorAll("a").forEach(a => a.addEventListener("click", cerrarNav));

  // Cierra el menú con Escape.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mainNav.classList.contains("is-open")) cerrarNav();
  });

  /* ---------------- UTILIDAD DE SEGURIDAD ---------------- */
  function escapeHTML(str){
    const div = document.createElement("div");
    div.textContent = String(str ?? "");
    return div.innerHTML;
  }

  /* ---------------- GALERÍA ---------------- */
  // Ya no hay pestañas por año: la galería ahora es una sola lista con
  // tus fotos reales. Solo queda la pista para el hover de las fichas.
  const galeriaPanelsEl = document.querySelector(".gallery-panels");
  if (galeriaPanelsEl) {
    const hint = document.createElement("p");
    hint.className = "gallery-hint";
    hint.textContent = window.matchMedia("(hover: hover) and (pointer: fine)").matches
      ? "Usa las flechas o desliza para recorrer la memoria gráfica."
      : "Desliza hacia los lados para recorrer la memoria gráfica.";
    galeriaPanelsEl.insertAdjacentElement("beforebegin", hint);

    const track = galeriaPanelsEl.querySelector(".gallery-grid");
    const items = track ? Array.from(track.querySelectorAll(".gallery-item")) : [];

    if (track && items.length) {
      const controls = document.createElement("div");
      controls.className = "gallery-carousel-controls";
      controls.innerHTML = `
        <div class="gallery-carousel-status" aria-live="polite">
          <strong data-gallery-current>1</strong>
          <span>de</span>
          <span data-gallery-total>${items.length}</span>
        </div>
        <div class="gallery-carousel-actions">
          <button type="button" class="gallery-carousel-btn" data-gallery-prev aria-label="Fotografías anteriores">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button type="button" class="gallery-carousel-btn" data-gallery-next aria-label="Fotografías siguientes">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
          </button>
        </div>`;
      galeriaPanelsEl.insertAdjacentElement("beforebegin", controls);

      const progress = document.createElement("div");
      progress.className = "gallery-carousel-progress";
      progress.setAttribute("aria-hidden", "true");
      progress.innerHTML = "<span></span>";
      galeriaPanelsEl.insertAdjacentElement("afterend", progress);

      const prevBtn = controls.querySelector("[data-gallery-prev]");
      const nextBtn = controls.querySelector("[data-gallery-next]");
      const currentEl = controls.querySelector("[data-gallery-current]");
      const progressFill = progress.querySelector("span");

      function cardStep(){
        const first = items[0];
        if (!first) return track.clientWidth;
        const styles = getComputedStyle(track);
        const gap = parseFloat(styles.columnGap || styles.gap || 0);
        return first.getBoundingClientRect().width + gap;
      }

      function visibleCards(){
        const step = cardStep();
        return Math.max(1, Math.round(track.clientWidth / step));
      }

      function updateGalleryControls(){
        const step = cardStep();
        const index = Math.max(0, Math.min(items.length - 1, Math.round(track.scrollLeft / step)));
        currentEl.textContent = String(index + 1);

        const maxScroll = Math.max(1, track.scrollWidth - track.clientWidth);
        const pct = Math.min(100, Math.max(0, (track.scrollLeft / maxScroll) * 100));
        progressFill.style.width = `${Math.max(5, pct)}%`;

        prevBtn.disabled = track.scrollLeft <= 4;
        nextBtn.disabled = track.scrollLeft >= maxScroll - 4;
      }

      function moveGallery(direction){
        const amount = cardStep() * visibleCards();
        track.scrollBy({ left: direction * amount, behavior: "smooth" });
      }

      prevBtn.addEventListener("click", () => moveGallery(-1));
      nextBtn.addEventListener("click", () => moveGallery(1));
      track.addEventListener("scroll", () => requestAnimationFrame(updateGalleryControls), { passive: true });
      window.addEventListener("resize", updateGalleryControls);

      track.setAttribute("tabindex", "0");
      track.setAttribute("role", "region");
      track.setAttribute("aria-label", "Carrusel de memoria gráfica de la BANDERA SIERA");
      track.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); moveGallery(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); moveGallery(-1); }
      });

      updateGalleryControls();
    }
  }

  /* ---------------- ESCUDO: SE "DIBUJA" AL APARECER ----------------
     Mide cada trazo del escudo (intro y simbolismo) y lo anima de
     invisible a completo la primera vez que entra en pantalla. Si el
     navegador no pudiera medir el trazo por algún motivo, el escudo
     se queda visible tal cual — nunca desaparece por esto. */
  function activarDibujoDeEscudo(svgEl){
    if (!svgEl) return;
    const trazos = svgEl.querySelectorAll(".st-line");
    trazos.forEach(trazo => {
      try {
        const largo = trazo.getTotalLength();
        trazo.style.strokeDasharray = largo;
        trazo.style.strokeDashoffset = largo;
      } catch {
        // Si no se puede medir (p. ej. <line>), lo dejamos visible sin animar.
      }
    });
    svgEl.classList.add("isotipo-dibujar");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      trazos.forEach(trazo => { trazo.style.strokeDashoffset = "0"; });
      return;
    }

    const dibujoObserver = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          trazos.forEach((trazo, i) => {
            setTimeout(() => { trazo.style.strokeDashoffset = "0"; }, i * 70);
          });
          dibujoObserver.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.4 });
    dibujoObserver.observe(svgEl);
  }

  activarDibujoDeEscudo(document.querySelector(".intro-card .isotipo"));
  activarDibujoDeEscudo(document.querySelector(".simbolismo-shield .isotipo"));

  /* ---------------- SIMBOLISMO: RESALTA SU PARTE DEL ESCUDO ----------------
     Al pasar el cursor sobre "Flechas", "Sable", "Carcaj" o "Arco", se
     ilumina el trazo correspondiente del escudo grande. La relación se
     arma leyendo el texto que YA está en el HTML (no depende de que el
     orden de los elementos no cambie nunca). */
  const escudoGrande = document.querySelector(".simbolismo-shield .isotipo");
  if (escudoGrande) {
    const trazosEscudo = escudoGrande.querySelectorAll(".st-line");
    // Según el orden en que se dibuja el escudo: 5 trazos forman la
    // corona de flechas, luego el contorno, la línea central, la
    // diagonal (sable) y, al final, la curva (arco).
    const gruposEscudo = {
      flechas: [0, 1, 2, 3, 4],
      carcaj:  [6],
      sable:   [7],
      arco:    [8],
    };

    document.querySelectorAll(".simbolo-defs > div").forEach(bloque => {
      const titulo = bloque.querySelector("h4");
      if (!titulo) return;
      const clave = titulo.textContent.trim().toLowerCase();
      const indices = gruposEscudo[clave];
      if (!indices) return;

      const resaltar = (activo) => {
        indices.forEach(i => {
          const trazo = trazosEscudo[i];
          if (trazo) trazo.classList.toggle("is-highlight", activo);
        });
      };
      bloque.addEventListener("mouseenter", () => resaltar(true));
      bloque.addEventListener("mouseleave", () => resaltar(false));
    });
  }

  /* ---------------- VALORES: DISEÑO ENRIQUECIDO ----------------
     Reorganiza la sección de Valores para que luzca como una tarjeta
     editorial (ícono + texto a un lado, panel ilustrativo al otro),
     con un ornamento arriba que reutiliza el propio escudo SIERA — no
     se agrega ningún ícono ajeno a la identidad del sitio. Todo esto
     se arma aquí mismo; index.html no tiene ninguno de estos elementos
     escritos, así que si esta función no corriera, la sección se vería
     en su versión simple de siempre (nunca queda rota o vacía). */
  function mejorarValores(){
    const seccionValores = document.getElementById("valores");
    if (!seccionValores) return;

    const plantillaEscudo = document.querySelector(".brand .isotipo, .intro-card .isotipo");

    function crearOrnamento(){
      const ornamento = document.createElement("div");
      ornamento.className = "valores-ornament";
      ornamento.setAttribute("aria-hidden", "true");
      const l1 = document.createElement("span"); l1.className = "rule-line";
      const l2 = document.createElement("span"); l2.className = "rule-line";
      ornamento.appendChild(l1);
      if (plantillaEscudo) ornamento.appendChild(plantillaEscudo.cloneNode(true));
      ornamento.appendChild(l2);
      return ornamento;
    }

    // Ornamento + "Nuestros" arriba del título "Valores"
    const tituloValores = seccionValores.querySelector(".eyebrow");
    if (tituloValores) {
      const ornamento = crearOrnamento();
      tituloValores.insertAdjacentElement("beforebegin", ornamento);

      const kicker = document.createElement("span");
      kicker.className = "valores-kicker";
      kicker.textContent = "Nuestros";
      tituloValores.insertAdjacentElement("beforebegin", kicker);
    }

    // Etiquetas cortas para cada valor, a partir del título de cada
    // tarjeta (mismo texto que ya está escrito en index.html).
    const etiquetasPorValor = {
      "patriotismo": "Unidos por nuestra historia",
      "solidaridad": "Juntos somos más fuertes",
      "respeto":     "Valoramos a cada persona",
      "libertad":    "Expresamos nuestra identidad",
    };
    const coloresPanel = ["var(--verde-dark)", "var(--rojo-dark)", "var(--tinta)", "var(--verde-dark)"];

    // Fotos reales para el panel de cada tarjeta. Si en el futuro agregas
    // otro valor sin foto todavía, simplemente no aparece aquí y el panel
    // usa el marcador de posición de siempre (ícono + "Espacio para
    // fotografía"), así nunca se ve roto.
    const fotosPorValor = {
      "patriotismo": "assets/foto-patriotismo.jpg",
      "solidaridad": "assets/foto-solidaridad.jpg",
      "respeto":     "assets/foto-respeto.jpg",
      "libertad":    "assets/foto-libertad.jpg",
    };

    seccionValores.querySelectorAll(".valor-card").forEach((tarjeta, i) => {
      const icono   = tarjeta.querySelector(".valor-icon");
      const h3      = tarjeta.querySelector("h3");
      const textoDiv = h3 ? h3.parentElement : null;
      if (!icono || !textoDiv) return;

      // Envuelve ícono + texto en un mismo contenedor de contenido,
      // dejando espacio a la derecha para el panel ilustrativo.
      const contenido = document.createElement("div");
      contenido.className = "valor-content";
      const cabecera = document.createElement("div");
      cabecera.className = "valor-content-head";

      tarjeta.insertBefore(contenido, icono);
      cabecera.append(icono, textoDiv);
      contenido.appendChild(cabecera);

      // Línea divisoria corta bajo el título
      const divisor = document.createElement("span");
      divisor.className = "valor-divider";
      divisor.setAttribute("aria-hidden", "true");
      h3.insertAdjacentElement("afterend", divisor);

      // Etiqueta corta al final de la tarjeta
      const clave = h3.textContent.trim().toLowerCase();
      const frase = etiquetasPorValor[clave];
      if (frase) {
        const tag = document.createElement("div");
        tag.className = "valor-tag";
        tag.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 20a4 4 0 00-10 0M12 12a4 4 0 100-8 4 4 0 000 8z"/></svg><span>${frase}</span>`;
        contenido.appendChild(tag);
      }

      // Panel ilustrativo: si hay una foto real para este valor, se usa
      // esa; si no, se deja el marcador de posición de siempre (ícono
      // en grande + "Espacio para fotografía"), para que nunca se vea
      // un hueco vacío mientras no haya foto.
      const panel = document.createElement("div");
      panel.className = "valor-image";
      panel.style.setProperty("--img-bg", coloresPanel[i % coloresPanel.length]);

      const rutaFoto = fotosPorValor[clave];
      if (rutaFoto) {
        const foto = document.createElement("img");
        foto.src = rutaFoto;
        foto.alt = `Fotografía representando el valor de ${clave}`;
        foto.loading = "lazy";
        panel.appendChild(foto);
      } else {
        panel.setAttribute("aria-hidden", "true");
        const svgOriginal = icono.querySelector("svg, img");
        if (svgOriginal) {
          const envoltorio = document.createElement("span");
          envoltorio.className = "valor-image-icon";
          envoltorio.appendChild(svgOriginal.cloneNode(true));
          panel.appendChild(envoltorio);
        }
        const nota = document.createElement("span");
        nota.className = "valor-image-note";
        nota.textContent = "Espacio para fotografía";
        panel.appendChild(nota);
      }

      tarjeta.appendChild(panel);
    });

    // Cierre de la sección: ornamento + frase, después de la cuadrícula.
    // El texto de la frase es una propuesta editable — cámbialo por la
    // tuya propia si quieres una distinta.
    const grid = seccionValores.querySelector(".valores-grid");
    if (grid) {
      const cierre = document.createElement("div");
      cierre.className = "valores-close";
      cierre.appendChild(crearOrnamento());

      const frase = document.createElement("p");
      frase.className = "valores-quote";
      frase.innerHTML = `<span class="valores-quote-mark">“</span>Nuestra fuerza está en nuestra historia y en cada municipio que la sostiene.<span class="valores-quote-mark">”</span>`;

      const atrib = document.createElement("p");
      atrib.className = "valores-attrib";
      atrib.textContent = "— Recorrido de la BANDERA SIERA";

      cierre.append(frase, atrib);
      grid.insertAdjacentElement("afterend", cierre);
    }
  }

  mejorarValores();

  /* ---------------- LIGHTBOX: AMPLIAR IMÁGENES ----------------
     Un solo overlay reutilizable para cualquier <img> "ampliable": la
     bandera de Simbolismo, las fotos de la galería y las fotos de
     Valores. Se conecta aquí, después de mejorarValores(), para que
     esas fotos ya existan en la página. */
  const imagenesAmpliables = document.querySelectorAll(".simbolismo-flag img, .gallery-item img, .valor-image img");

  if (imagenesAmpliables.length) {
    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <button type="button" class="lightbox-close" aria-label="Cerrar">&times;</button>
      <img alt="">`;
    document.body.appendChild(overlay);
    const imgGrande = overlay.querySelector("img");

    function abrirLightbox(origen){
      imgGrande.src = origen.currentSrc || origen.src;
      imgGrande.alt = origen.alt || "";
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function cerrarLightbox(){
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    imagenesAmpliables.forEach(img => {
      img.style.cursor = "zoom-in";
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      if (!img.getAttribute("aria-label")) {
        img.setAttribute("aria-label", `Ampliar imagen: ${img.alt || "fotografía"}`);
      }
      img.addEventListener("click", () => abrirLightbox(img));
      img.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrirLightbox(img); }
      });
    });

    overlay.addEventListener("click", (e) => { if (e.target === overlay) cerrarLightbox(); });
    overlay.querySelector(".lightbox-close").addEventListener("click", cerrarLightbox);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) cerrarLightbox();
    });
  }

  /* ---------------- MAPA + UBICACIÓN DEL RECORRIDO ----------------
     Esta versión mantiene la ruta existente y agrega:
       - estado por municipio: Pendiente / En camino / Llegó
       - fotografía cuando ya existe en /assets
       - horario cuando la página ya cuenta con ese dato
       - botón "Cómo llegar"
       - panel "¿Dónde está la BANDERA SIERA?"
       - marcador especial de ubicación durante el recorrido

     IMPORTANTE: no se inventan horarios. Los que todavía no están
     definidos aparecen como "Por confirmar".

     Para actualizar manualmente la ubicación el 15 de septiembre solo
     cambia RECORRIDO_EN_VIVO.activo a true y paradaActual al índice:
       0 = Tehuacán, 7 = Orizaba, 13 = Zongolica.
     Más adelante este mismo objeto puede alimentarse desde un panel
     administrativo o una API sin cambiar el mapa.
  ---------------------------------------------------------------- */
  const RECORRIDO_EN_VIVO = {
    activo: false,
    finalizado: false,
    paradaActual: 0,
    ultimaActualizacion: "",
  };

  const RUTA = [
    {
      nombre: "Tehuacán", estado: "Puebla", lat: 18.4665063, lng: -97.4003801,
      foto: "assets/mapi-40-tehuacan.jpg",
      historia: "Punto de salida del recorrido contemporáneo de la BANDERA SIERA desde Puebla.",
      hora: null,
    },
    {
      nombre: "Acultzingo", estado: "Veracruz", lat: 18.7157218, lng: -97.3057581,
      foto: "assets/mapi-41-acultzingo.jpg",
      historia: "Segunda parada del recorrido en su ingreso al estado de Veracruz.",
      hora: null,
    },
    {
      nombre: "Maltrata", estado: "Veracruz", lat: 18.8109128, lng: -97.2780102,
      foto: null,
      historia: "Municipio participante dentro de la ruta de la BANDERA SIERA rumbo a Zongolica.",
      hora: null,
    },
    {
      nombre: "Ciudad Mendoza", estado: "Veracruz", lat: 18.8042090, lng: -97.1808552,
      foto: null,
      historia: "Parada del Recorrido de la Insurgencia dentro de la región de las Altas Montañas.",
      hora: null,
    },
    {
      nombre: "Huiloapan", estado: "Veracruz", lat: 18.8175606, lng: -97.1534390,
      foto: "assets/bandera-siera-huiloapan.jpg",
      historia: "Municipio participante que recibe la BANDERA SIERA durante el recorrido regional.",
      hora: null,
    },
    {
      nombre: "Nogales", estado: "Veracruz", lat: 18.8213983, lng: -97.1624594,
      foto: null,
      historia: "Parada del recorrido que conecta a los municipios de las Altas Montañas.",
      hora: null,
    },
    {
      nombre: "Río Blanco", estado: "Veracruz", lat: 18.8382010, lng: -97.1397530,
      foto: "assets/bandera-siera-rio-blanco.jpg",
      historia: "Municipio participante del relevo cívico de la BANDERA SIERA.",
      hora: null,
    },
    {
      nombre: "Orizaba", estado: "Veracruz", lat: 18.8504744, lng: -97.1036396,
      foto: "assets/mapi-42-orizaba.jpg",
      historia: "En abril y mayo de 1812, fuerzas insurgentes vinculadas a Juan Moctezuma y Cortés participaron en operaciones en Orizaba y Córdoba.",
      hora: null,
    },
    {
      nombre: "Rafael Delgado", estado: "Veracruz", lat: 18.8106854, lng: -97.0721359,
      foto: null,
      historia: "Parada del recorrido antes de continuar hacia los municipios serranos de la ruta.",
      hora: null,
    },
    {
      nombre: "Tlilapan", estado: "Veracruz", lat: 18.8053094, lng: -97.0978119,
      foto: null,
      historia: "Municipio participante del Recorrido de la Insurgencia en dirección a la Sierra de Zongolica.",
      hora: null,
    },
    {
      nombre: "San Andrés Tenejapan", estado: "Veracruz", lat: 18.7882037, lng: -97.0930049,
      foto: null,
      historia: "Parada serrana dentro de la ruta regional de la BANDERA SIERA.",
      hora: null,
    },
    {
      nombre: "Tequila", estado: "Veracruz", lat: 18.7295682, lng: -97.0711071,
      foto: "assets/mapi-37-tequila.jpg",
      historia: "Municipio participante en el tramo serrano previo a Los Reyes y Zongolica.",
      hora: null,
    },
    {
      nombre: "Los Reyes", estado: "Veracruz", lat: 18.6730869, lng: -97.0457357,
      foto: null,
      historia: "Penúltima parada del recorrido antes de la llegada a Zongolica.",
      hora: null,
    },
    {
      nombre: "Zongolica", estado: "Veracruz", lat: 18.6668459, lng: -97.0001223,
      foto: "assets/mapi-38-zongolica.jpg",
      historia: "En 1811 el movimiento de Independencia llegó a Zongolica, donde Juan Moctezuma y Cortés se incorporó a la causa insurgente. Es la meta del recorrido contemporáneo.",
      hora: "10:30 p. m.",
    },
  ];

  const mapEl = document.getElementById("routeMap");
  const liveRoutePanel = document.getElementById("liveRoutePanel");
  const liveRouteBadge = document.getElementById("liveRouteBadge");
  const liveCurrentPlace = document.getElementById("liveCurrentPlace");
  const liveRouteDescription = document.getElementById("liveRouteDescription");
  const liveCurrentMunicipality = document.getElementById("liveCurrentMunicipality");
  const liveNextMunicipality = document.getElementById("liveNextMunicipality");
  const liveDistance = document.getElementById("liveDistance");
  const liveLastUpdate = document.getElementById("liveLastUpdate");
  const liveRouteProgressBar = document.getElementById("liveRouteProgressBar");
  const focusLiveRoute = document.getElementById("focusLiveRoute");

  // Distancia Haversine entre dos coordenadas. Se usa solo para repartir
  // proporcionalmente los 150 km oficiales de la ruta entre las paradas.
  function distanciaKm(a, b){
    const R = 6371;
    const rad = n => n * Math.PI / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const lat1 = rad(a.lat);
    const lat2 = rad(b.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  const distanciasAcumuladas = [0];
  for (let i = 1; i < RUTA.length; i++){
    distanciasAcumuladas[i] = distanciasAcumuladas[i - 1] + distanciaKm(RUTA[i - 1], RUTA[i]);
  }
  const distanciaGeodesicaTotal = distanciasAcumuladas[distanciasAcumuladas.length - 1] || 1;
  const kmEstimadosEnParada = i => Math.round((distanciasAcumuladas[i] / distanciaGeodesicaTotal) * 150);

  function estadoParada(i){
    if (RECORRIDO_EN_VIVO.finalizado) return "Llegó";
    if (!RECORRIDO_EN_VIVO.activo) return "Pendiente";
    if (i < RECORRIDO_EN_VIVO.paradaActual) return "Llegó";
    if (i === RECORRIDO_EN_VIVO.paradaActual) return "En camino";
    return "Pendiente";
  }

  function claseEstado(estado){
    if (estado === "Llegó") return "done";
    if (estado === "En camino") return "live";
    return "pending";
  }

  function fechaEventoEstado(){
    const ahora = new Date();
    const inicio = new Date(2026, 8, 15, 0, 0, 0);
    const cierre = new Date(2026, 8, 16, 1, 0, 0);
    if (ahora < inicio) return "proximo";
    if (ahora > cierre && !RECORRIDO_EN_VIVO.activo) return "finalizado";
    return "dia-evento";
  }

  function pintarPanelEnVivo(){
    if (!liveRoutePanel) return;
    const fase = fechaEventoEstado();
    const actualIndex = Math.max(0, Math.min(RECORRIDO_EN_VIVO.paradaActual, RUTA.length - 1));
    const actual = RUTA[actualIndex];
    const siguiente = RUTA[Math.min(actualIndex + 1, RUTA.length - 1)];

    liveRouteBadge.className = "live-route-badge";

    if (RECORRIDO_EN_VIVO.finalizado || fase === "finalizado") {
      liveRouteBadge.textContent = "RECORRIDO FINALIZADO";
      liveRouteBadge.classList.add("is-finished");
      liveCurrentPlace.textContent = "La BANDERA SIERA llegó a Zongolica";
      liveRouteDescription.textContent = "Consulta en el mapa la ruta completa y las paradas del recorrido.";
      liveCurrentMunicipality.textContent = "Zongolica, Veracruz";
      liveNextMunicipality.textContent = "Meta alcanzada";
      liveDistance.textContent = "150 km de 150 km";
      liveLastUpdate.textContent = RECORRIDO_EN_VIVO.ultimaActualizacion || "Recorrido concluido";
      liveRouteProgressBar.style.width = "100%";
      focusLiveRoute.textContent = "Ver llegada en el mapa";
      return;
    }

    if (!RECORRIDO_EN_VIVO.activo) {
      liveRouteBadge.textContent = fase === "dia-evento" ? "SEGUIMIENTO POR INICIAR" : "PRÓXIMO RECORRIDO";
      liveCurrentPlace.textContent = "Seguimiento disponible el 15 de septiembre";
      liveRouteDescription.textContent = "El mapa ya muestra la ruta completa. Cuando inicie el recorrido, este espacio señalará la ubicación actual de la BANDERA SIERA.";
      liveCurrentMunicipality.textContent = "Aún no inicia";
      liveNextMunicipality.textContent = "Tehuacán · Punto de salida";
      liveDistance.textContent = "0 km de 150 km";
      liveLastUpdate.textContent = "Aún no inicia";
      liveRouteProgressBar.style.width = "0%";
      focusLiveRoute.textContent = "Ver punto de salida";
      return;
    }

    const km = kmEstimadosEnParada(actualIndex);
    const porcentaje = Math.max(0, Math.min(100, (km / 150) * 100));
    liveRouteBadge.textContent = "RECORRIDO EN CURSO";
    liveRouteBadge.classList.add("is-live");
    liveCurrentPlace.textContent = `La BANDERA SIERA se encuentra en ${actual.nombre}`;
    liveRouteDescription.textContent = `Seguimiento del recorrido por ${actual.estado}. El siguiente punto se actualizará conforme avance la BANDERA SIERA.`;
    liveCurrentMunicipality.textContent = `${actual.nombre}, ${actual.estado}`;
    liveNextMunicipality.textContent = actualIndex === RUTA.length - 1 ? "Meta · Zongolica" : `${siguiente.nombre}, ${siguiente.estado}`;
    liveDistance.textContent = `${km} km de 150 km`;
    liveLastUpdate.textContent = RECORRIDO_EN_VIVO.ultimaActualizacion || "Actualización pendiente";
    liveRouteProgressBar.style.width = `${porcentaje}%`;
    focusLiveRoute.textContent = "Ver ubicación en el mapa";
  }

  pintarPanelEnVivo();

  if (mapEl && window.L) {
    const map = L.map(mapEl, {
      scrollWheelZoom: false,
      zoomControl: false,
      tap: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 18,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const puntos = RUTA.map(p => [p.lat, p.lng]);
    const bounds = L.latLngBounds(puntos);
    const marcadoresRuta = [];

    // Línea completa de la ruta.
    L.polyline(puntos, {
      color: "#1A1A18", opacity: .12, weight: 7, lineCap: "round", lineJoin: "round",
    }).addTo(map);
    L.polyline(puntos, {
      color: "#D41F35", weight: 3.5, opacity: .92, lineCap: "round", lineJoin: "round",
      dashArray: "1 11", className: "route-line",
    }).addTo(map);

    const pinSVG = color => `
      <svg width="30" height="40" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z" fill="${color}"/>
        <circle cx="12" cy="12" r="4.6" fill="#F7F8F8"/>
      </svg>`;

    RUTA.forEach((parada, i) => {
      const esInicio = i === 0;
      const esFinal = i === RUTA.length - 1;
      const estado = estadoParada(i);
      const estadoClase = claseEstado(estado);
      let icono;

      if (esInicio || esFinal) {
        const color = esInicio ? "#D41F35" : "#03694D";
        icono = L.divIcon({
          className: "",
          html: `<div class="route-pin-place ${estadoClase === "live" ? "is-live" : ""}" style="color:${color}">${pinSVG(color)}</div>`,
          iconSize: [30, 40],
          iconAnchor: [15, 40],
          popupAnchor: [0, -36],
        });
      } else {
        icono = L.divIcon({
          className: "",
          html: `<div class="route-pin ${estadoClase === "done" ? "is-done" : estadoClase === "live" ? "is-live" : ""}">${i + 1}</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
      }

      const foto = parada.foto
        ? `<img class="route-popup-photo" src="${escapeHTML(parada.foto)}" alt="${escapeHTML(parada.nombre)}" loading="lazy">`
        : "";
      const tipoParada = esInicio ? "Salida" : esFinal ? "Meta" : `Parada ${i + 1}`;
      const hora = parada.hora || "Por confirmar";
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parada.lat + "," + parada.lng)}`;

      const popup = `
        <div class="route-popup route-popup-rich">
          ${foto}
          <div class="route-popup-head">
            <span>${escapeHTML(parada.nombre)}</span>
            <span class="route-popup-stop">${escapeHTML(tipoParada)}</span>
          </div>
          <div class="route-popup-body">
            <span class="route-popup-status ${estadoClase}">${escapeHTML(estado)}</span>
            <p class="route-popup-info">${escapeHTML(parada.historia)}</p>
            <div class="route-popup-meta">
              <div><span>Estado</span><strong>${escapeHTML(parada.estado)}</strong></div>
              <div><span>Llegada</span><strong>${escapeHTML(hora)}</strong></div>
            </div>
            <a class="route-popup-directions" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">Cómo llegar</a>
          </div>
        </div>`;

      const marcador = L.marker([parada.lat, parada.lng], { icon: icono, riseOnHover: true })
        .addTo(map)
        .bindPopup(popup, { maxWidth: 310 });

      marcadoresRuta.push(marcador);
    });

    // Marcador especial de la Bandera: solo aparece durante el recorrido.
    let marcadorEnVivo = null;
    if (RECORRIDO_EN_VIVO.activo && !RECORRIDO_EN_VIVO.finalizado) {
      const actual = RUTA[Math.max(0, Math.min(RECORRIDO_EN_VIVO.paradaActual, RUTA.length - 1))];
      const liveIcon = L.divIcon({
        className: "",
        html: `<div class="live-flag-marker">BANDERA<br>SIERA</div>`,
        iconSize: [54, 54],
        iconAnchor: [27, 27],
      });
      marcadorEnVivo = L.marker([actual.lat, actual.lng], { icon: liveIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<div class="route-popup"><div class="route-popup-head">Ubicación actual</div><div class="route-popup-body"><strong>${escapeHTML(actual.nombre)}, ${escapeHTML(actual.estado)}</strong></div></div>`);
    }

    map.fitBounds(bounds, { padding: [32, 32] });

    const InfoChip = L.Control.extend({
      options: { position: "topleft" },
      onAdd: function () {
        const chip = L.DomUtil.create("div", "route-info-chip");
        chip.innerHTML = `
          <span class="route-info-chip-icon">
            <svg viewBox="0 0 24 24"><path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3zM9 7v13M15 4v13" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <span class="route-info-chip-text">
            <strong>SIERA 2026</strong><span>150&nbsp;km · 14&nbsp;municipios</span>
          </span>`;
        L.DomEvent.disableClickPropagation(chip);
        return chip;
      },
    });
    map.addControl(new InfoChip());

    const ResetControl = L.Control.extend({
      options: { position: "topright" },
      onAdd: function () {
        const btn = L.DomUtil.create("button", "route-reset-btn");
        btn.type = "button";
        btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" stroke-linecap="round" stroke-linejoin="round"/></svg> Ver ruta completa`;
        L.DomEvent.disableClickPropagation(btn);
        btn.addEventListener("click", () => map.fitBounds(bounds, { padding: [32, 32] }));
        return btn;
      },
    });
    map.addControl(new ResetControl());

    map.on("click", () => map.scrollWheelZoom.enable());
    mapEl.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());

    // Cada fila de la lista abre exactamente el mismo municipio en el mapa.
    document.querySelectorAll(".timeline-item").forEach((fila, i) => {
      const marcador = marcadoresRuta[i];
      if (!marcador) return;

      fila.setAttribute("tabindex", "0");
      fila.setAttribute("role", "button");
      fila.setAttribute("aria-label", `Ver ${RUTA[i].nombre} en el mapa`);

      const irAMunicipio = () => {
        map.flyTo(marcador.getLatLng(), 12, { duration: .8 });
        marcador.openPopup();
        mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
      };

      fila.addEventListener("click", irAMunicipio);
      fila.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          irAMunicipio();
        }
      });

      const alternarResaltado = activo => {
        const el = marcador.getElement();
        const interno = el && el.querySelector(".route-pin, .route-pin-place");
        if (interno) interno.classList.toggle("marker-highlight", activo);
      };
      fila.addEventListener("mouseenter", () => alternarResaltado(true));
      fila.addEventListener("mouseleave", () => alternarResaltado(false));
    });

    // Botón del panel superior: va a la ubicación actual o, si aún no
    // comienza, al punto de salida en Tehuacán.
    if (focusLiveRoute) {
      focusLiveRoute.addEventListener("click", () => {
        const index = RECORRIDO_EN_VIVO.activo
          ? Math.max(0, Math.min(RECORRIDO_EN_VIVO.paradaActual, RUTA.length - 1))
          : 0;
        const objetivo = RECORRIDO_EN_VIVO.finalizado ? RUTA.length - 1 : index;
        const marcador = marcadoresRuta[objetivo];
        if (!marcador) return;
        map.flyTo(marcador.getLatLng(), 12, { duration: .8 });
        if (marcadorEnVivo && RECORRIDO_EN_VIVO.activo) marcadorEnVivo.openPopup();
        else marcador.openPopup();
        mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }

  /* ---------------- BARRA DE PROGRESO DE LECTURA ----------------
     Un solo <div> creado aquí mismo (no vive en index.html). Tricolor,
     crece de izquierda a derecha según cuánto se ha bajado en la página. */
  const progressBar = document.createElement("div");
  progressBar.id = "progressBar";
  progressBar.setAttribute("aria-hidden", "true");
  document.body.appendChild(progressBar);

  function actualizarProgreso(){
    const alto = document.documentElement.scrollHeight - window.innerHeight;
    const porcentaje = alto > 0 ? (window.scrollY / alto) * 100 : 0;
    progressBar.style.width = porcentaje + "%";
  }
  window.addEventListener("scroll", actualizarProgreso, { passive: true });
  window.addEventListener("resize", actualizarProgreso);
  actualizarProgreso();

  /* ---------------- ORBES Y FOCO DE LUZ EN EL HERO ----------------
     Elementos puramente decorativos, insertados por JS dentro de
     .hero. Si algo fallara aquí, el hero se ve exactamente igual que
     antes (no dependen de esto para nada funcional). */
  const heroSection = document.querySelector(".hero");
  if (heroSection) {
    const orb1 = document.createElement("span");
    orb1.className = "hero-orb hero-orb-1";
    orb1.setAttribute("aria-hidden", "true");
    const orb2 = document.createElement("span");
    orb2.className = "hero-orb hero-orb-2";
    orb2.setAttribute("aria-hidden", "true");
    const spotlight = document.createElement("div");
    spotlight.className = "hero-spotlight";
    spotlight.setAttribute("aria-hidden", "true");
    heroSection.append(orb1, orb2, spotlight);

    heroSection.addEventListener("pointermove", (e) => {
      const rect = heroSection.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      heroSection.style.setProperty("--mx", mx + "%");
      heroSection.style.setProperty("--my", my + "%");
    });
  }

  /* ---------------- NAVEGACIÓN POR PUNTOS ----------------
     Se genera a partir de las secciones que YA existen en el HTML
     (main section[id]); no se agrega ninguna sección nueva, solo un
     indicador flotante que ayuda a ubicarse en páginas largas. */
  const seccionesPrincipales = Array.from(document.querySelectorAll("main section[id]"));

  if (seccionesPrincipales.length) {
    const dotsNav = document.createElement("nav");
    dotsNav.className = "section-dots";
    dotsNav.setAttribute("aria-label", "Ir a sección");

    const dots = seccionesPrincipales.map(seccion => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "section-dot";
      dot.setAttribute("aria-label", seccion.id);
      dot.addEventListener("click", () => {
        seccion.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      dotsNav.appendChild(dot);
      return { seccion, dot };
    });

    document.body.appendChild(dotsNav);

    const dotObserver = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        const item = dots.find(d => d.seccion === entrada.target);
        if (item && entrada.isIntersecting) {
          dots.forEach(d => d.dot.classList.remove("is-active"));
          item.dot.classList.add("is-active");
        }
      });
    }, { threshold: 0.5 });

    seccionesPrincipales.forEach(seccion => dotObserver.observe(seccion));
  }

  /* ---------------- FRANJA DE TEXTO EN MOVIMIENTO (TICKER) ----------------
     Inspirada en el sitio de la Feria Zongolica 2026. Usa datos que ya
     están en esta misma página (no se inventa nada nuevo) y se inserta
     justo debajo del encabezado. */
  const datosTicker = [
    "XXXV Recorrido de la Insurgencia",
    "150 km de recorrido",
    "14 municipios",
    "15 de septiembre de 2026",
    "Historia insurgente desde 1811",
    "Sierra de Zongolica",
  ];

  const tickerBand = document.createElement("div");
  tickerBand.className = "ticker-band";
  tickerBand.setAttribute("aria-hidden", "true");
  const tickerTrack = document.createElement("div");
  tickerTrack.className = "ticker-track";

  function llenarTicker(){
    tickerTrack.innerHTML = "";
    // Se repite dos veces la misma lista para lograr un ciclo continuo
    // sin salto visible (la animación recorre exactamente el 50%).
    for (let vuelta = 0; vuelta < 2; vuelta++){
      datosTicker.forEach(texto => {
        const item = document.createElement("span");
        item.textContent = texto;
        const separador = document.createElement("span");
        separador.className = "sep";
        separador.textContent = "✦";
        tickerTrack.append(item, separador);
      });
    }
  }
  llenarTicker();
  tickerBand.appendChild(tickerTrack);

  const headerSitio = document.querySelector(".site-header");
  if (headerSitio) {
    headerSitio.insertAdjacentElement("afterend", tickerBand);
  }

  /* ---------------- CUENTA REGRESIVA EN EL HERO ----------------
     Cuenta los días, horas, minutos y segundos que faltan para el
     próximo 15 de septiembre (fecha del recorrido). Se inserta antes
     de los botones del hero. Si algo fallara aquí, el hero se sigue
     viendo completo — esto es un añadido, no un reemplazo. */
  if (heroSection) {
    const heroCta = heroSection.querySelector(".hero-cta");

    if (heroCta) {
      const countdownEl = document.createElement("div");
      countdownEl.className = "hero-countdown";
      countdownEl.innerHTML = `
        <span class="hero-countdown-label">Faltan para el próximo recorrido</span>
        <div class="hero-countdown-grid">
          <div class="hero-countdown-item"><span class="num" data-cd="dias">00</span><span class="lab">Días</span></div>
          <span class="hero-countdown-sep">:</span>
          <div class="hero-countdown-item"><span class="num" data-cd="horas">00</span><span class="lab">Hrs</span></div>
          <span class="hero-countdown-sep">:</span>
          <div class="hero-countdown-item"><span class="num" data-cd="min">00</span><span class="lab">Min</span></div>
          <span class="hero-countdown-sep">:</span>
          <div class="hero-countdown-item"><span class="num" data-cd="seg">00</span><span class="lab">Seg</span></div>
        </div>`;
      heroCta.insertAdjacentElement("beforebegin", countdownEl);

      function proximoQuinceSeptiembre(){
        const ahora = new Date();
        let objetivo = new Date(ahora.getFullYear(), 8, 15, 0, 0, 0);
        if (ahora >= objetivo) {
          objetivo = new Date(ahora.getFullYear() + 1, 8, 15, 0, 0, 0);
        }
        return objetivo;
      }

      const dias  = countdownEl.querySelector('[data-cd="dias"]');
      const horas = countdownEl.querySelector('[data-cd="horas"]');
      const mins  = countdownEl.querySelector('[data-cd="min"]');
      const segs  = countdownEl.querySelector('[data-cd="seg"]');
      const dosDigitos = n => String(n).padStart(2, "0");

      function actualizarCuentaRegresiva(){
        const restante = proximoQuinceSeptiembre() - new Date();
        if (restante <= 0) return;
        const totalSeg = Math.floor(restante / 1000);
        dias.textContent  = dosDigitos(Math.floor(totalSeg / 86400));
        horas.textContent = dosDigitos(Math.floor((totalSeg % 86400) / 3600));
        mins.textContent  = dosDigitos(Math.floor((totalSeg % 3600) / 60));
        segs.textContent  = dosDigitos(totalSeg % 60);
      }
      actualizarCuentaRegresiva();
      setInterval(actualizarCuentaRegresiva, 1000);
    }
  }

  /* ---------------- REVELADO SUAVE AL HACER SCROLL ----------------
     Mejora puramente visual: las tarjetas y bloques principales
     aparecen con un ligero desvanecimiento al entrar en pantalla.
     La clase "reveal" se agrega aquí, por JavaScript — nunca está en
     el HTML — así que si este script no cargara, todo el contenido
     se vería normal y visible desde el inicio (no depende de esto). */
  const prefiereMenosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefiereMenosMovimiento && "IntersectionObserver" in window) {
    const elementosRevelado = document.querySelectorAll(
      ".intro-card, .event-promise-card, .feature-fact, .article-section-card, .history-card, .juan-moctezuma-banner, .valor-card, .route-stat, .timeline-item, .agenda-item, .gallery-item, .alert-card"
    );

    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("reveal-visible");
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    elementosRevelado.forEach(el => {
      el.classList.add("reveal");
      observador.observe(el);
    });
  }

  /* ---------------- NÚMEROS QUE SUMAN AL ENTRAR EN PANTALLA ----------------
     Anima "150", "14" y "1" de las estadísticas del recorrido, de 0 al
     valor real, leyendo el número que YA está escrito en el HTML (no
     requiere ningún atributo nuevo). Si algo falla, el número real
     queda escrito igual, así que nunca se ve vacío. */
  const numerosRuta = document.querySelectorAll(".route-stat-num");

  if (!prefiereMenosMovimiento && "IntersectionObserver" in window && numerosRuta.length) {
    const contadorObserver = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        if (!entrada.isIntersecting) return;
        const el = entrada.target;
        const destino = parseInt(el.textContent, 10);
        contadorObserver.unobserve(el);
        if (Number.isNaN(destino)) return;

        const duracion = 900;
        const inicio = performance.now();

        function paso(ahora){
          const avance = Math.min((ahora - inicio) / duracion, 1);
          const facilitado = 1 - Math.pow(1 - avance, 3); // ease-out cúbico
          el.textContent = Math.round(destino * facilitado);
          if (avance < 1) requestAnimationFrame(paso);
        }
        requestAnimationFrame(paso);
      });
    }, { threshold: 0.6 });

    numerosRuta.forEach(el => contadorObserver.observe(el));
  }

});

/* ============================================================
   CANAL DE WHATSAPP
   Configura el enlace una sola vez en index.html, en:
   <meta name="whatsapp-channel-url" content="...">
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const meta = document.querySelector('meta[name="whatsapp-channel-url"]');
  const url = meta?.content?.trim() || "";
  const enlaces = document.querySelectorAll(".js-whatsapp-channel");
  const configurado = Boolean(
    url &&
    !url.includes("REEMPLAZAR_CON_") &&
    /^https?:\/\//i.test(url)
  );

  enlaces.forEach((enlace) => {
    if (configurado) {
      enlace.href = url;
      enlace.target = "_blank";
      enlace.rel = "noopener noreferrer";
      enlace.removeAttribute("aria-disabled");
      enlace.classList.remove("is-disabled");
    } else {
      enlace.href = "#canal-whatsapp";
      enlace.removeAttribute("target");
      enlace.removeAttribute("rel");

      if (enlace.classList.contains("whatsapp-main-button")) {
        enlace.textContent = "Configura el enlace del canal";
        enlace.setAttribute("aria-disabled", "true");
        enlace.classList.add("is-disabled");
        enlace.title = "Pega el enlace real del canal de WhatsApp en el meta whatsapp-channel-url";
        enlace.addEventListener("click", (event) => event.preventDefault());
      }
    }
  });
});