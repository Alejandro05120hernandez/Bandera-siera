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


  /* ---------------- EXPERIENCIA DE SCROLL · CINEMÁTICA ----------------
     Mejora únicamente la sensación al desplazarse por la página.
     No cambia contenido, estructura, fondos, mapa, galería ni botones.

     La idea es que cada sección se sienta como un "capítulo":
       - entra con profundidad y un pequeño desplazamiento vertical;
       - al cruzar el centro de la pantalla recupera escala 1:1;
       - al salir mantiene una profundidad muy ligera;
       - títulos y líneas reaccionan de forma sutil al movimiento;
       - en móvil el efecto se reduce para mantener fluidez.
  ------------------------------------------------------------------- */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const scrollStages = Array.from(document.querySelectorAll("main > section"));

  scrollStages.forEach((section) => {
    section.classList.add("scroll-stage", "scroll-live-stage");
  });

  /* Entrada inicial de cada capítulo. Se conserva una vez revelado para
     que el contenido nunca vuelva a ocultarse al retroceder en la página. */
  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in-view");
        sectionObserver.unobserve(entry.target);
      });
    }, { threshold: 0.055, rootMargin: "0px 0px -4% 0px" });

    scrollStages.forEach(section => sectionObserver.observe(section));
  } else {
    scrollStages.forEach(section => section.classList.add("is-in-view"));
  }

  const panoBackgrounds = document.querySelectorAll(".pano-static-bg");
  const heroTextScroll = document.querySelector(".hero-text");
  let cinematicTicking = false;
  let previousScrollY = window.scrollY;
  let smoothedVelocity = 0;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function updateCinematicScroll() {
    cinematicTicking = false;

    const viewportH = Math.max(window.innerHeight, 1);
    const viewportCenter = viewportH / 2;
    const currentScrollY = window.scrollY;
    const rawVelocity = currentScrollY - previousScrollY;
    previousScrollY = currentScrollY;
    smoothedVelocity += (rawVelocity - smoothedVelocity) * 0.16;

    document.documentElement.style.setProperty(
      "--page-scroll-velocity",
      String(clamp(smoothedVelocity, -24, 24).toFixed(2))
    );

    /* Respeta la preferencia del sistema. */
    if (reduceMotion.matches) {
      scrollStages.forEach(section => {
        section.style.setProperty("--stage-y", "0px");
        section.style.setProperty("--stage-scale", "1");
        section.style.setProperty("--stage-opacity", "1");
        section.style.setProperty("--stage-rotate", "0deg");
        section.style.setProperty("--heading-x", "0px");
        section.style.setProperty("--stage-glow", "0");
      });
      panoBackgrounds.forEach(bg => bg.style.setProperty("--pano-shift", "0px"));
      if (heroTextScroll) {
        heroTextScroll.style.removeProperty("transform");
        heroTextScroll.style.removeProperty("opacity");
      }
      return;
    }

    const mobile = window.innerWidth <= 900;

    scrollStages.forEach((section) => {
      const rect = section.getBoundingClientRect();

      /* Solo calculamos capítulos cercanos al viewport. */
      if (rect.bottom < -viewportH * 0.35 || rect.top > viewportH * 1.35) return;

      const sectionCenter = rect.top + rect.height / 2;
      const signedDistance = clamp(
        (sectionCenter - viewportCenter) / (viewportH * 0.82),
        -1.15,
        1.15
      );
      const distance = Math.min(1, Math.abs(signedDistance));

      /* El efecto en móvil es intencionalmente menor para evitar mareo y
         conservar 60fps. En PC aumenta un poco la sensación de profundidad. */
      const maxY = mobile ? 13 : 25;
      const maxScaleLoss = mobile ? 0.010 : 0.026;
      const maxOpacityLoss = mobile ? 0.035 : 0.10;
      const maxRotate = mobile ? 0 : 0.72;

      const y = signedDistance * maxY;
      const scale = 1 - distance * maxScaleLoss;
      const opacity = 1 - distance * maxOpacityLoss;
      const rotate = signedDistance * -maxRotate;
      const headingX = mobile ? 0 : signedDistance * -10;
      const glow = 1 - distance;

      section.style.setProperty("--stage-y", `${y.toFixed(2)}px`);
      section.style.setProperty("--stage-scale", scale.toFixed(4));
      section.style.setProperty("--stage-opacity", opacity.toFixed(3));
      section.style.setProperty("--stage-rotate", `${rotate.toFixed(3)}deg`);
      section.style.setProperty("--heading-x", `${headingX.toFixed(2)}px`);
      section.style.setProperty("--stage-glow", glow.toFixed(3));

      const visibleNow = rect.bottom > viewportH * 0.14 && rect.top < viewportH * 0.86;
      section.classList.toggle("is-scroll-current", visibleNow && distance < 0.72);
    });

    /* Parallax de las imágenes de fondo ya existentes. No cambia el fondo,
       solo desplaza muy ligeramente el encuadre durante el scroll. */
    panoBackgrounds.forEach(bg => {
      if (mobile) {
        bg.style.setProperty("--pano-shift", "0px");
        return;
      }
      const section = bg.parentElement;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > viewportH) return;
      const centerOffset = (rect.top + rect.height / 2) - viewportCenter;
      const shift = clamp(centerOffset * -0.052, -42, 42);
      bg.style.setProperty("--pano-shift", `${shift.toFixed(1)}px`);
    });

    /* Portada: profundidad sutil mientras abandona el primer viewport. */
    if (heroTextScroll) {
      const hero = heroTextScroll.closest(".hero");
      if (hero) {
        const rect = hero.getBoundingClientRect();
        const progress = clamp(-rect.top / Math.max(1, rect.height), 0, 1);
        const move = mobile ? progress * 12 : progress * 28;
        heroTextScroll.style.transform = `translate3d(0, ${move.toFixed(1)}px, 0) scale(${(1 - progress * .012).toFixed(4)})`;
        heroTextScroll.style.opacity = String(Math.max(.82, 1 - progress * .18));
      }
    }
  }

  function requestCinematicUpdate() {
    if (cinematicTicking) return;
    cinematicTicking = true;
    requestAnimationFrame(updateCinematicScroll);
  }

  window.addEventListener("scroll", requestCinematicUpdate, { passive: true });
  window.addEventListener("resize", requestCinematicUpdate);
  reduceMotion.addEventListener?.("change", requestCinematicUpdate);
  updateCinematicScroll();

  /* ---------------- REVELADO ESCALONADO ----------------
     Se mantiene el mismo contenido; solo cambia la forma en que aparece.
     Los elementos entran por pequeños grupos al acercarse al viewport. */
  const scrollRevealSelector = [
    ".museum-gateway-card",
    ".historia-resumen-card",
    ".historia-resumen-bloque",
    ".juan-story-timeline article",
    ".valor-card",
    ".simbolo-defs > div",
    ".route-stat",
    ".timeline-item",
    ".agenda-feature",
    ".agenda-item",
    ".alerts-benefits li"
  ].join(",");

  const staggerItems = Array.from(document.querySelectorAll(scrollRevealSelector));

  staggerItems.forEach((item, index) => {
    item.classList.add("scroll-reveal-item");
    item.style.setProperty("--scroll-delay", `${(index % 4) * 62}ms`);
  });

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const itemObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        itemObserver.unobserve(entry.target);
      });
    }, { threshold: .10, rootMargin: "0px 0px -4% 0px" });

    staggerItems.forEach(item => itemObserver.observe(item));
  } else {
    staggerItems.forEach(item => item.classList.add("is-revealed"));
  }

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


  /* ---------------- MUSEO DIGITAL: ACORDEÓN ----------------
     La tarjeta 02 mantiene visible solo un resumen. Al tocarla se
     despliega la historia completa del origen del recorrido sin
     alterar el resto de la estructura del Museo Digital. */
  document.querySelectorAll("[data-museum-accordion]").forEach((card) => {
    const trigger = card.querySelector(".museum-accordion-trigger");
    const panel = card.querySelector(".museum-accordion-panel");
    const label = card.querySelector(".museum-accordion-label");
    if (!trigger || !panel) return;

    trigger.addEventListener("click", () => {
      const open = !card.classList.contains("is-open");
      card.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", String(open));
      panel.setAttribute("aria-hidden", String(!open));
      if (label) label.textContent = open ? "Ocultar historia ↑" : "Ver historia del recorrido ↓";
    });
  });

  /* ---------------- GALERÍA: SCROLL INMERSIVO ----------------
     En computadora, la rueda del mouse desplaza horizontalmente las
     fotografías mientras el cursor está sobre la galería. En móvil se
     conserva el gesto natural de deslizar. La tarjeta más cercana al
     centro gana profundidad y protagonismo. */
  const galeriaPanelsEl = document.querySelector(".gallery-panels");
  if (galeriaPanelsEl) {
    const track = galeriaPanelsEl.querySelector(".gallery-grid");
    const items = track ? Array.from(track.querySelectorAll(".gallery-item")) : [];

    if (track && items.length) {
      galeriaPanelsEl.classList.add("gallery-depth-experience");
      track.classList.add("gallery-depth-track");

      const hint = document.createElement("p");
      hint.className = "gallery-hint gallery-depth-hint";
      hint.textContent = window.matchMedia("(hover: hover) and (pointer: fine)").matches
        ? "Desplázate con la rueda, arrastra o usa las flechas para explorar la memoria gráfica."
        : "Desliza con el dedo para explorar la memoria gráfica.";
      galeriaPanelsEl.insertAdjacentElement("beforebegin", hint);

      const controls = document.createElement("div");
      controls.className = "gallery-carousel-controls gallery-depth-controls";
      controls.innerHTML = `
        <div class="gallery-carousel-status" aria-live="polite">
          <strong data-gallery-current>01</strong>
          <span>/</span>
          <span data-gallery-total>${String(items.length).padStart(2, "0")}</span>
        </div>
        <div class="gallery-carousel-actions">
          <button type="button" class="gallery-carousel-btn" data-gallery-prev aria-label="Fotografía anterior">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button type="button" class="gallery-carousel-btn" data-gallery-next aria-label="Fotografía siguiente">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
          </button>
        </div>`;
      galeriaPanelsEl.insertAdjacentElement("beforebegin", controls);

      const progress = document.createElement("div");
      progress.className = "gallery-carousel-progress gallery-depth-progress";
      progress.setAttribute("aria-hidden", "true");
      progress.innerHTML = "<span></span>";
      galeriaPanelsEl.insertAdjacentElement("afterend", progress);

      const currentEl = controls.querySelector("[data-gallery-current]");
      const prevBtn = controls.querySelector("[data-gallery-prev]");
      const nextBtn = controls.querySelector("[data-gallery-next]");
      const progressFill = progress.querySelector("span");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

      let activeIndex = 0;
      let rafId = 0;
      let dragging = false;
      let dragged = false;
      let dragStartX = 0;
      let dragStartScroll = 0;

      function cardStep(){
        const first = items[0];
        if (!first) return track.clientWidth;
        const styles = getComputedStyle(track);
        const gap = parseFloat(styles.columnGap || styles.gap || 0);
        return first.getBoundingClientRect().width + gap;
      }

      function updateGalleryDepth(){
        rafId = 0;
        const viewport = track.getBoundingClientRect();
        const center = viewport.left + viewport.width / 2;
        let nearest = 0;
        let nearestDistance = Infinity;

        items.forEach((item, index) => {
          const rect = item.getBoundingClientRect();
          const itemCenter = rect.left + rect.width / 2;
          const signed = (itemCenter - center) / Math.max(rect.width, 1);
          const distance = Math.min(1.5, Math.abs(signed));

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = index;
          }

          if (!reduceMotion) {
            const scale = 1 - Math.min(distance * 0.105, 0.16);
            const lift = Math.min(distance * 22, 24);
            const rotate = Math.max(-8, Math.min(8, signed * -5.5));
            const opacity = 1 - Math.min(distance * 0.28, 0.42);
            item.style.transform = `perspective(1000px) translateY(${lift}px) rotateY(${rotate}deg) scale(${scale})`;
            item.style.opacity = opacity.toFixed(3);
            item.style.zIndex = String(100 - Math.round(distance * 20));
          } else {
            item.style.transform = "";
            item.style.opacity = "";
            item.style.zIndex = "";
          }
        });

        if (nearest !== activeIndex || !items[activeIndex]?.classList.contains("is-gallery-active")) {
          activeIndex = nearest;
          items.forEach((item, index) => item.classList.toggle("is-gallery-active", index === activeIndex));
        }

        currentEl.textContent = String(activeIndex + 1).padStart(2, "0");
        const maxScroll = Math.max(1, track.scrollWidth - track.clientWidth);
        const pct = Math.max(0, Math.min(100, (track.scrollLeft / maxScroll) * 100));
        progressFill.style.width = `${Math.max(2.5, pct)}%`;
        prevBtn.disabled = track.scrollLeft <= 3;
        nextBtn.disabled = track.scrollLeft >= maxScroll - 3;
      }

      function scheduleGalleryUpdate(){
        if (!rafId) rafId = requestAnimationFrame(updateGalleryDepth);
      }

      function goToItem(index){
        const target = items[Math.max(0, Math.min(items.length - 1, index))];
        if (!target) return;
        const left = target.offsetLeft - (track.clientWidth - target.clientWidth) / 2;
        track.scrollTo({ left, behavior: reduceMotion ? "auto" : "smooth" });
      }

      prevBtn.addEventListener("click", () => goToItem(activeIndex - 1));
      nextBtn.addEventListener("click", () => goToItem(activeIndex + 1));

      /* Rueda vertical -> desplazamiento horizontal solo mientras exista
         contenido por recorrer en esa dirección. Al llegar al principio o
         al final, la página continúa su scroll normal. */
      track.addEventListener("wheel", (e) => {
        if (!finePointer.matches) return;
        const dominant = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (!dominant) return;
        const maxScroll = track.scrollWidth - track.clientWidth;
        const canMoveForward = dominant > 0 && track.scrollLeft < maxScroll - 2;
        const canMoveBack = dominant < 0 && track.scrollLeft > 2;
        if (canMoveForward || canMoveBack) {
          e.preventDefault();
          track.scrollLeft += dominant * 1.05;
          scheduleGalleryUpdate();
        }
      }, { passive:false });

      /* Arrastre con mouse en PC. En táctil dejamos el scroll nativo. */
      track.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse") return;
        dragging = true;
        dragged = false;
        dragStartX = e.clientX;
        dragStartScroll = track.scrollLeft;
        track.classList.add("is-grabbing");
        track.setPointerCapture?.(e.pointerId);
      });

      track.addEventListener("pointermove", (e) => {
        if (!dragging || e.pointerType !== "mouse") return;
        const dx = e.clientX - dragStartX;
        if (Math.abs(dx) > 4) dragged = true;
        track.scrollLeft = dragStartScroll - dx;
        scheduleGalleryUpdate();
      });

      function stopDrag(e){
        if (!dragging) return;
        dragging = false;
        track.classList.remove("is-grabbing");
        if (e?.pointerId != null) track.releasePointerCapture?.(e.pointerId);
      }
      track.addEventListener("pointerup", stopDrag);
      track.addEventListener("pointercancel", stopDrag);
      track.addEventListener("pointerleave", (e) => {
        if (dragging && e.buttons === 0) stopDrag(e);
      });

      track.addEventListener("click", (e) => {
        /* Si realmente se arrastró la galería, evitamos que el gesto se
           interprete como clic. Un clic normal sobre la fotografía sigue
           llegando al lightbox para abrirla, como en la versión anterior. */
        if (!dragged) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        dragged = false;
      }, true);

      /* Mantiene cada foto centrada cuando recibe foco con teclado. */
      items.forEach((item, index) => {
        const img = item.querySelector("img");
        if (!img) return;
        img.addEventListener("focus", () => {
          if (index !== activeIndex) goToItem(index);
        });
      });

      track.addEventListener("scroll", scheduleGalleryUpdate, { passive:true });
      window.addEventListener("resize", scheduleGalleryUpdate);

      track.setAttribute("tabindex", "0");
      track.setAttribute("role", "region");
      track.setAttribute("aria-label", "Memoria gráfica de la BANDERA SIERA");
      track.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); goToItem(activeIndex + 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); goToItem(activeIndex - 1); }
      });

      requestAnimationFrame(() => {
        goToItem(0);
        updateGalleryDepth();
      });
    }
  }



  /* ---------------- PLAYERAS: CARRUSEL INMERSIVO ----------------
     Replica la experiencia de Memoria Gráfica en un formato compacto:
     rueda horizontal en PC, arrastre, flechas, contador, progreso,
     tarjeta central con profundidad y gesto táctil en móvil. */
  const playerasShowcase = document.querySelector(".recorrido-shirts-showcase");
  if (playerasShowcase) {
    const playerasTrack = playerasShowcase.querySelector(".recorrido-shirts-track");
    const playerasItems = playerasTrack
      ? Array.from(playerasTrack.querySelectorAll(".recorrido-shirt-card"))
      : [];

    if (playerasTrack && playerasItems.length) {
      const header = playerasShowcase.querySelector(".recorrido-shirts-header");

      const hint = document.createElement("p");
      hint.className = "recorrido-shirts-hint";
      hint.textContent = window.matchMedia("(hover: hover) and (pointer: fine)").matches
        ? "Desplázate con la rueda, arrastra o usa las flechas."
        : "Desliza con el dedo para explorar.";
      header?.insertAdjacentElement("afterend", hint);

      const controls = document.createElement("div");
      controls.className = "shirts-carousel-controls";
      controls.innerHTML = `
        <div class="shirts-carousel-status" aria-live="polite">
          <strong data-shirts-current>01</strong>
          <span>/</span>
          <span data-shirts-total>${String(playerasItems.length).padStart(2, "0")}</span>
        </div>
        <div class="shirts-carousel-actions">
          <button type="button" class="shirts-carousel-btn" data-shirts-prev aria-label="Playera anterior">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button type="button" class="shirts-carousel-btn" data-shirts-next aria-label="Playera siguiente">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
          </button>
        </div>`;
      hint.insertAdjacentElement("afterend", controls);

      const progress = document.createElement("div");
      progress.className = "shirts-carousel-progress";
      progress.setAttribute("aria-hidden", "true");
      progress.innerHTML = "<span></span>";
      playerasShowcase.appendChild(progress);

      const currentEl = controls.querySelector("[data-shirts-current]");
      const prevBtn = controls.querySelector("[data-shirts-prev]");
      const nextBtn = controls.querySelector("[data-shirts-next]");
      const progressFill = progress.querySelector("span");

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

      let activeIndex = 0;
      let rafId = 0;
      let dragging = false;
      let dragged = false;
      let dragStartX = 0;
      let dragStartScroll = 0;

      function updateShirtsDepth(){
        rafId = 0;

        const viewport = playerasTrack.getBoundingClientRect();
        const center = viewport.left + viewport.width / 2;

        let nearest = 0;
        let nearestDistance = Infinity;

        playerasItems.forEach((item, index) => {
          const rect = item.getBoundingClientRect();
          const itemCenter = rect.left + rect.width / 2;
          const signed = (itemCenter - center) / Math.max(rect.width, 1);
          const distance = Math.min(1.5, Math.abs(signed));

          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = index;
          }

          if (!reduceMotion) {
            const scale = 1 - Math.min(distance * 0.085, 0.13);
            const lift = Math.min(distance * 15, 18);
            const rotate = Math.max(-6, Math.min(6, signed * -4.2));
            const opacity = 1 - Math.min(distance * 0.24, 0.36);

            item.style.transform =
              `perspective(1000px) translateY(${lift}px) rotateY(${rotate}deg) scale(${scale})`;
            item.style.opacity = opacity.toFixed(3);
            item.style.zIndex = String(100 - Math.round(distance * 20));
          } else {
            item.style.transform = "";
            item.style.opacity = "";
            item.style.zIndex = "";
          }
        });

        activeIndex = nearest;
        playerasItems.forEach((item, index) => {
          item.classList.toggle("is-shirt-active", index === activeIndex);
        });

        currentEl.textContent = String(activeIndex + 1).padStart(2, "0");

        const maxScroll = Math.max(1, playerasTrack.scrollWidth - playerasTrack.clientWidth);
        const pct = Math.max(0, Math.min(100, (playerasTrack.scrollLeft / maxScroll) * 100));
        progressFill.style.width = `${Math.max(3, pct)}%`;

        prevBtn.disabled = playerasTrack.scrollLeft <= 3;
        nextBtn.disabled = playerasTrack.scrollLeft >= maxScroll - 3;
      }

      function scheduleShirtsUpdate(){
        if (!rafId) rafId = requestAnimationFrame(updateShirtsDepth);
      }

      function goToShirt(index){
        const target = playerasItems[Math.max(0, Math.min(playerasItems.length - 1, index))];
        if (!target) return;

        const left =
          target.offsetLeft - (playerasTrack.clientWidth - target.clientWidth) / 2;

        playerasTrack.scrollTo({
          left,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      }

      prevBtn.addEventListener("click", () => goToShirt(activeIndex - 1));
      nextBtn.addEventListener("click", () => goToShirt(activeIndex + 1));

      /* Rueda vertical -> desplazamiento horizontal, igual que Memoria Gráfica. */
      playerasTrack.addEventListener("wheel", (e) => {
        if (!finePointer.matches) return;

        const dominant =
          Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

        if (!dominant) return;

        const maxScroll = playerasTrack.scrollWidth - playerasTrack.clientWidth;
        const canForward = dominant > 0 && playerasTrack.scrollLeft < maxScroll - 2;
        const canBack = dominant < 0 && playerasTrack.scrollLeft > 2;

        if (canForward || canBack) {
          e.preventDefault();
          playerasTrack.scrollLeft += dominant * 1.02;
          scheduleShirtsUpdate();
        }
      }, { passive:false });

      /* Arrastre con mouse. */
      playerasTrack.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse") return;

        dragging = true;
        dragged = false;
        dragStartX = e.clientX;
        dragStartScroll = playerasTrack.scrollLeft;

        playerasTrack.classList.add("is-grabbing");
        playerasTrack.setPointerCapture?.(e.pointerId);
      });

      playerasTrack.addEventListener("pointermove", (e) => {
        if (!dragging || e.pointerType !== "mouse") return;

        const dx = e.clientX - dragStartX;
        if (Math.abs(dx) > 4) dragged = true;

        playerasTrack.scrollLeft = dragStartScroll - dx;
        scheduleShirtsUpdate();
      });

      function stopShirtsDrag(e){
        if (!dragging) return;

        dragging = false;
        playerasTrack.classList.remove("is-grabbing");

        if (e?.pointerId != null) {
          playerasTrack.releasePointerCapture?.(e.pointerId);
        }
      }

      playerasTrack.addEventListener("pointerup", stopShirtsDrag);
      playerasTrack.addEventListener("pointercancel", stopShirtsDrag);
      playerasTrack.addEventListener("pointerleave", (e) => {
        if (dragging && e.buttons === 0) stopShirtsDrag(e);
      });

      /* Si hubo arrastre real, no lo interpretamos como clic sobre la foto. */
      playerasTrack.addEventListener("click", (e) => {
        if (!dragged) return;

        e.preventDefault();
        e.stopImmediatePropagation();
        dragged = false;
      }, true);

      playerasTrack.addEventListener("scroll", scheduleShirtsUpdate, { passive:true });
      window.addEventListener("resize", scheduleShirtsUpdate);

      playerasTrack.setAttribute("tabindex", "0");
      playerasTrack.setAttribute("role", "region");
      playerasTrack.setAttribute(
        "aria-label",
        "Carrusel de playeras conmemorativas del Recorrido de la Insurgencia"
      );

      playerasTrack.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          goToShirt(activeIndex + 1);
        }

        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goToShirt(activeIndex - 1);
        }
      });

      requestAnimationFrame(() => {
        goToShirt(0);
        updateShirtsDepth();
      });
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
      "patriotismo": "assets/images/values/foto-patriotismo.jpg",
      "solidaridad": "assets/images/values/foto-solidaridad.jpg",
      "respeto":     "assets/images/values/foto-respeto.jpg",
      "libertad":    "assets/images/values/foto-libertad.jpg",
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
  const imagenesAmpliables = document.querySelectorAll(".simbolismo-flag img, .gallery-item img, .recorrido-shirt-card img, .story-media img, .story-doc-card img, .bandera-researcher-media img, .recorrido-origin-media img, .program-shirt-card img, .valor-image img");

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
      foto: "assets/images/route/mapi-40-tehuacan.jpg",
      historia: "Punto de salida del recorrido contemporáneo de la BANDERA SIERA desde Puebla.",
      hora: null,
    },
    {
      nombre: "Acultzingo", estado: "Veracruz", lat: 18.7157218, lng: -97.3057581,
      foto: "assets/images/route/mapi-41-acultzingo.jpg",
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
      foto: "assets/images/route/bandera-siera-huiloapan.jpg",
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
      foto: "assets/images/route/bandera-siera-rio-blanco.jpg",
      historia: "Municipio participante del relevo cívico de la BANDERA SIERA.",
      hora: null,
    },
    {
      nombre: "Orizaba", estado: "Veracruz", lat: 18.8504744, lng: -97.1036396,
      foto: "assets/images/route/mapi-42-orizaba.jpg",
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
      foto: "assets/images/route/mapi-37-tequila.jpg",
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
      foto: "assets/images/route/mapi-38-zongolica.jpg",
      historia: "El compendio histórico vincula a Zongolica con la organización insurgente encabezada por Juan Moctezuma y Cortés. Es la meta del recorrido contemporáneo.",
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



  /* ---------------- MAPA INTERACTIVO FINAL ----------------
     Versión estable para PC y móvil.
     - Inicializa solo cuando la sección entra en pantalla.
     - Recalcula tamaño con ResizeObserver e IntersectionObserver.
     - OpenStreetMap como base; CARTO como respaldo.
     - 14 marcadores + ruta completa.
     - Clic en las tarjetas de municipios abre su marcador.
     - Botón "Ver recorrido" reencuadra toda la ruta.
     - La rueda normal sigue desplazando la página.
  ------------------------------------------------------------ */

  function mostrarFallbackMapa(){
    if (!mapEl) return;

    mapEl.classList.remove("is-map-loading");
    mapEl.innerHTML = `
      <div class="route-map-fallback">
        <div>
          <strong>Mapa temporalmente no disponible</strong>
          <p>La ruta sigue disponible para consultarse directamente en Google Maps.</p>
          <a
            href="https://www.google.com/maps/dir/?api=1&origin=18.4665063,-97.4003801&destination=18.6668459,-97.0001223"
            target="_blank"
            rel="noopener noreferrer">
            Abrir ruta Tehuacán → Zongolica
          </a>
        </div>
      </div>`;
  }

  function cargarLeafletSiHaceFalta(){
    return new Promise((resolve, reject) => {
      if (window.L) {
        resolve(window.L);
        return;
      }

      if (!document.querySelector('link[data-leaflet-backup]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
        link.dataset.leafletBackup = "true";
        document.head.appendChild(link);
      }

      const existente = document.querySelector('script[data-leaflet-backup]');
      if (existente) {
        if (window.L) {
          resolve(window.L);
          return;
        }

        existente.addEventListener("load", () => {
          window.L ? resolve(window.L) : reject(new Error("Leaflet no disponible"));
        }, { once:true });

        existente.addEventListener("error", reject, { once:true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
      script.async = true;
      script.dataset.leafletBackup = "true";

      script.onload = () => {
        window.L ? resolve(window.L) : reject(new Error("Leaflet no disponible"));
      };

      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  let routeMapInstance = null;
  let routeMapInitialized = false;

  function iniciarMapaInteractivo(){
    if (!mapEl || !window.L || routeMapInitialized) return;

    routeMapInitialized = true;
    mapEl.dataset.mapReady = "true";
    mapEl.classList.add("is-map-loading");
    mapEl.setAttribute("tabindex", "0");

    const map = L.map(mapEl, {
      center: [18.70, -97.17],
      zoom: 9,
      zoomControl: false,
      scrollWheelZoom: false,
      doubleClickZoom: true,
      touchZoom: true,
      dragging: true,
      keyboard: true,
      attributionControl: true,
      preferCanvas: true,
      zoomSnap: .5,
      zoomDelta: .5,
      minZoom: 6,
      maxZoom: 18
    });

    routeMapInstance = map;

    /* ---------- CAPA DE MAPA CON RESPALDO ---------- */
    let tileLayer = null;
    let usandoRespaldo = false;
    let erroresTiles = 0;

    const crearOSM = () => L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }
    );

    const crearCarto = () => L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }
    );

    function usarCapa(capa){
      if (tileLayer && map.hasLayer(tileLayer)) {
        map.removeLayer(tileLayer);
      }

      tileLayer = capa;

      tileLayer.on("tileload", () => {
        mapEl.classList.remove("is-map-loading");
        mapEl.classList.add("route-map-ready");
      });

      tileLayer.on("load", () => {
        mapEl.classList.remove("is-map-loading");
        mapEl.classList.add("route-map-ready");
      });

      tileLayer.on("tileerror", () => {
        erroresTiles += 1;

        if (!usandoRespaldo && erroresTiles >= 5) {
          usandoRespaldo = true;
          erroresTiles = 0;
          usarCapa(crearCarto());
        }
      });

      tileLayer.addTo(map);
    }

    usarCapa(crearOSM());

    /* ---------- CONTROLES ---------- */
    L.control.zoom({
      position: "bottomright"
    }).addTo(map);

    L.control.scale({
      position: "bottomleft",
      metric: true,
      imperial: false,
      maxWidth: 110
    }).addTo(map);

    const puntos = RUTA.map(parada => [parada.lat, parada.lng]);
    const bounds = L.latLngBounds(puntos);
    const marcadoresRuta = [];

    /* ---------- LÍNEA DEL RECORRIDO ---------- */
    L.polyline(puntos, {
      color: "#F7F8F8",
      weight: 8,
      opacity: .86,
      lineCap: "round",
      lineJoin: "round",
      interactive: false
    }).addTo(map);

    L.polyline(puntos, {
      color: "#03694D",
      weight: 5,
      opacity: .95,
      lineCap: "round",
      lineJoin: "round",
      interactive: false
    }).addTo(map);

    L.polyline(puntos, {
      color: "#D41F35",
      weight: 2,
      opacity: .92,
      dashArray: "3 12",
      lineCap: "round",
      lineJoin: "round",
      interactive: false
    }).addTo(map);

    function iconoNumerado(numero, tipo){
      if (tipo === "inicio" || tipo === "final") {
        const color = tipo === "inicio" ? "#D41F35" : "#03694D";

        return L.divIcon({
          className: "route-marker-wrapper",
          html: `
            <div class="route-pin-place" style="--marker-color:${color}">
              <span>${tipo === "inicio" ? "S" : "M"}</span>
            </div>`,
          iconSize: [38, 46],
          iconAnchor: [19, 43],
          popupAnchor: [0, -39]
        });
      }

      return L.divIcon({
        className: "route-marker-wrapper",
        html: `<div class="route-pin">${numero}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -16]
      });
    }

    /* ---------- MARCADORES ---------- */
    RUTA.forEach((parada, index) => {
      const esInicio = index === 0;
      const esFinal = index === RUTA.length - 1;
      const tipo = esInicio ? "inicio" : esFinal ? "final" : "parada";
      const estado = estadoParada(index);
      const estadoClase = claseEstado(estado);

      const foto = parada.foto
        ? `<img class="route-popup-photo"
                src="${escapeHTML(parada.foto)}"
                alt="${escapeHTML(parada.nombre)}"
                loading="lazy">`
        : "";

      const hora = parada.hora || "Por confirmar";
      const mapsUrl =
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parada.lat + "," + parada.lng)}`;

      const popupHTML = `
        <div class="route-popup route-popup-rich">
          ${foto}
          <div class="route-popup-head">
            <span>${escapeHTML(parada.nombre)}</span>
            <span class="route-popup-stop">
              ${esInicio ? "Salida" : esFinal ? "Meta" : `Parada ${index + 1}`}
            </span>
          </div>

          <div class="route-popup-body">
            <span class="route-popup-status ${estadoClase}">
              ${escapeHTML(estado)}
            </span>

            <p class="route-popup-info">
              ${escapeHTML(parada.historia)}
            </p>

            <div class="route-popup-meta">
              <div>
                <span>Estado</span>
                <strong>${escapeHTML(parada.estado)}</strong>
              </div>

              <div>
                <span>Llegada</span>
                <strong>${escapeHTML(hora)}</strong>
              </div>
            </div>

            <a
              class="route-popup-directions"
              href="${mapsUrl}"
              target="_blank"
              rel="noopener noreferrer">
              Cómo llegar
            </a>
          </div>
        </div>`;

      const marker = L.marker(
        [parada.lat, parada.lng],
        {
          icon: iconoNumerado(index + 1, tipo),
          riseOnHover: true,
          keyboard: true,
          title: `${index + 1}. ${parada.nombre}`,
          alt: `${index + 1}. ${parada.nombre}`
        }
      )
      .addTo(map)
      .bindPopup(popupHTML, {
        maxWidth: 320,
        minWidth: 230,
        autoPan: true,
        keepInView: true,
        closeButton: true
      });

      marcadoresRuta.push(marker);
    });

    /* ---------- ENCUADRE GENERAL ---------- */
    function ajustarRutaCompleta(animar = false){
      map.invalidateSize({
        pan: false,
        debounceMoveend: true
      });

      map.fitBounds(bounds, {
        paddingTopLeft: [44, 58],
        paddingBottomRight: [44, 58],
        maxZoom: 10.5,
        animate: animar,
        duration: animar ? .55 : 0
      });
    }

    /* ---------- CONTROL SUPERIOR IZQUIERDO ---------- */
    const InfoControl = L.Control.extend({
      options: { position: "topleft" },

      onAdd(){
        const div = L.DomUtil.create("div", "route-info-chip");

        div.innerHTML = `
          <span class="route-info-chip-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 20l-6-3V4l6 3 6-3 6 3v13l-6-3-6 3zM9 7v13M15 4v13"
                    stroke-linecap="round"
                    stroke-linejoin="round"/>
            </svg>
          </span>

          <span class="route-info-chip-text">
            <strong>SIERA 2026</strong>
            <span>Tehuacán → Zongolica</span>
          </span>`;

        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);

        return div;
      }
    });

    map.addControl(new InfoControl());

    /* ---------- BOTÓN VER RECORRIDO ---------- */
    const ResetControl = L.Control.extend({
      options: { position: "topright" },

      onAdd(){
        const button = L.DomUtil.create("button", "route-reset-btn");
        button.type = "button";

        button.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"
                  stroke-linecap="round"
                  stroke-linejoin="round"/>
          </svg>
          Ver recorrido`;

        L.DomEvent.disableClickPropagation(button);
        L.DomEvent.disableScrollPropagation(button);

        button.addEventListener("click", () => {
          map.closePopup();
          ajustarRutaCompleta(true);
        });

        return button;
      }
    });

    map.addControl(new ResetControl());

    /* ---------- RUEDA / SCROLL DE PÁGINA ---------- */
    map.scrollWheelZoom.disable();

    mapEl.addEventListener("wheel", event => {
      if (event.ctrlKey || event.metaKey) {
        map.scrollWheelZoom.enable();
      } else {
        map.scrollWheelZoom.disable();
      }
    }, {
      passive: true,
      capture: true
    });

    mapEl.addEventListener("mouseleave", () => {
      map.scrollWheelZoom.disable();
    });

    /* ---------- CLIC EN LISTA DE MUNICIPIOS ---------- */
    document.querySelectorAll("#recorrido .timeline-item").forEach((item, index) => {
      const marker = marcadoresRuta[index];
      const parada = RUTA[index];

      if (!marker || !parada) return;

      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.setAttribute(
        "aria-label",
        `Ver ${parada.nombre} en el mapa`
      );

      const abrirParada = () => {
        map.invalidateSize({ pan:false });

        map.flyTo(
          marker.getLatLng(),
          window.innerWidth <= 640 ? 11.5 : 12,
          {
            animate: true,
            duration: .65
          }
        );

        setTimeout(() => marker.openPopup(), 300);
      };

      item.addEventListener("click", abrirParada);

      item.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          abrirParada();
        }
      });
    });

    /* ---------- RECÁLCULO RESPONSIVE ---------- */
    let resizeTimer = null;

    const recalcularMapa = () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        if (!routeMapInstance) return;

        routeMapInstance.invalidateSize({
          pan: false,
          debounceMoveend: true
        });
      }, 70);
    };

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => {
        recalcularMapa();
      });

      resizeObserver.observe(mapEl);
      resizeObserver.observe(mapEl.parentElement);
    }

    const recorridoSection = document.getElementById("recorrido");

    if ("IntersectionObserver" in window && recorridoSection) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          recalcularMapa();

          setTimeout(() => {
            map.invalidateSize({ pan:false });
          }, 180);

          setTimeout(() => {
            map.invalidateSize({ pan:false });
          }, 520);
        });
      }, {
        threshold: .04,
        rootMargin: "180px 0px"
      });

      observer.observe(recorridoSection);
    }

    window.addEventListener("resize", recalcularMapa, {
      passive: true
    });

    window.addEventListener("orientationchange", () => {
      setTimeout(recalcularMapa, 260);
    });

    window.addEventListener("pageshow", () => {
      setTimeout(recalcularMapa, 120);
    });

    /* ---------- INICIO ---------- */
    map.whenReady(() => {
      requestAnimationFrame(() => {
        map.invalidateSize({ pan:false });
        ajustarRutaCompleta(false);

        setTimeout(() => {
          map.invalidateSize({ pan:false });
          ajustarRutaCompleta(false);
        }, 180);
      });
    });

    setTimeout(() => {
      mapEl.classList.remove("is-map-loading");
    }, 4500);
  }

  function prepararMapa(){
    if (!mapEl) return;

    const arrancar = () => {
      cargarLeafletSiHaceFalta()
        .then(() => iniciarMapaInteractivo())
        .catch(() => mostrarFallbackMapa());
    };

    /* Si el mapa ya está cerca del viewport, inicializa inmediatamente.
       Si no, espera a que el usuario se acerque para evitar errores de
       tamaño en secciones todavía lejanas. */
    if (!("IntersectionObserver" in window)) {
      arrancar();
      return;
    }

    let iniciado = false;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || iniciado) return;

        iniciado = true;
        observer.disconnect();
        arrancar();
      });
    }, {
      threshold: 0,
      rootMargin: "500px 0px"
    });

    observer.observe(mapEl);

    /* Respaldo: aunque el observer no dispare por alguna razón,
       lo inicializa después de unos segundos. */
    setTimeout(() => {
      if (iniciado) return;

      iniciado = true;
      observer.disconnect();
      arrancar();
    }, 3500);
  }

  prepararMapa();


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
    const nombresSeccion = {
      inicio: "Inicio",
      introduccion: "Introducción",
      preparate: "Prepárate",
      historia: "Historia",
      "juan-moctezuma": "Juan Moctezuma",
      valores: "Valores",
      museo: "Museo Digital",
      simbolismo: "Simbolismo",
      recorrido: "Recorrido",
      programa: "Programa",
      galeria: "Memoria gráfica",
      "canal-whatsapp": "WhatsApp"
    };

    const dotsNav = document.createElement("nav");
    dotsNav.className = "section-dots";
    dotsNav.setAttribute("aria-label", "Ir a sección");

    const sectionIndicator = document.createElement("div");
    sectionIndicator.className = "scroll-section-indicator";
    sectionIndicator.setAttribute("aria-hidden", "true");
    sectionIndicator.innerHTML = `<span class="scroll-section-number">01</span><span class="scroll-section-name">Inicio</span>`;

    const dots = seccionesPrincipales.map((seccion, index) => {
      const dot = document.createElement("button");
      const label = nombresSeccion[seccion.id] || seccion.id;
      dot.type = "button";
      dot.className = "section-dot";
      dot.dataset.label = label;
      dot.setAttribute("aria-label", `Ir a ${label}`);
      dot.addEventListener("click", () => {
        seccion.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      dotsNav.appendChild(dot);
      return { seccion, dot, label, index };
    });

    document.body.append(dotsNav, sectionIndicator);

    const numberEl = sectionIndicator.querySelector(".scroll-section-number");
    const nameEl = sectionIndicator.querySelector(".scroll-section-name");

    const activarSeccion = (item) => {
      dots.forEach(d => d.dot.classList.remove("is-active"));
      item.dot.classList.add("is-active");
      if (numberEl) numberEl.textContent = String(item.index + 1).padStart(2, "0");
      if (nameEl) nameEl.textContent = item.label;
    };

    const dotObserver = new IntersectionObserver((entradas) => {
      const visibles = entradas
        .filter(entrada => entrada.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visibles.length) return;
      const item = dots.find(d => d.seccion === visibles[0].target);
      if (item) activarSeccion(item);
    }, { threshold: [0.22, 0.4, 0.6], rootMargin: "-18% 0px -36% 0px" });

    seccionesPrincipales.forEach(seccion => dotObserver.observe(seccion));
    if (dots[0]) activarSeccion(dots[0]);
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
    "Historia e identidad serrana",
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
      ".intro-card, .event-promise-card, .story-context-card, .story-doc-card, .story-timeline article, .bandera-story-timeline article, .bandera-researcher-card, .recorrido-origin-story, .hymn-annex, .program-shirt-card, .feature-fact, .article-section-card, .history-card, .juan-moctezuma-banner, .valor-card, .route-stat, .timeline-item, .agenda-item, .gallery-item, .alert-card"
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