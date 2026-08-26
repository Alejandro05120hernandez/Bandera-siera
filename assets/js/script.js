/* ============================================================
   BANDERA SIERA · script.js
   Museo Digital + Recorrido de la Insurgencia
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ============================================================
     UTILIDADES
     ============================================================ */

  const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  /* ============================================================
     MENÚ MÓVIL
     ============================================================ */

  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");

  if (navToggle && mainNav) {

    function cerrarMenu() {
      mainNav.classList.remove("is-open");
      navToggle.classList.remove("is-active");
      navToggle.setAttribute("aria-expanded", "false");
    }

    navToggle.addEventListener("click", () => {
      const abierto = mainNav.classList.toggle("is-open");

      navToggle.classList.toggle("is-active", abierto);
      navToggle.setAttribute(
        "aria-expanded",
        String(abierto)
      );
    });

    mainNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", cerrarMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        mainNav.classList.contains("is-open")
      ) {
        cerrarMenu();
      }
    });
  }


  /* ============================================================
     HIMNO A LA BANDERA SIERA
     ============================================================ */

  const himno = document.getElementById("himnoBackground");
  const himnoToggle = document.getElementById("himnoToggle");

  if (himno && himnoToggle) {

    himno.volume = 0.65;

    const icon =
      himnoToggle.querySelector(".himno-symbol-icon");

    const label =
      himnoToggle.querySelector(".himno-symbol-label");

    function actualizarHimno() {

      const reproduciendo =
        !himno.paused &&
        !himno.ended;

      himnoToggle.classList.toggle(
        "is-playing",
        reproduciendo
      );

      himnoToggle.setAttribute(
        "aria-pressed",
        String(reproduciendo)
      );

      himnoToggle.setAttribute(
        "aria-label",
        reproduciendo
          ? "Pausar himno"
          : "Reproducir himno"
      );

      if (icon) {
        icon.textContent =
          reproduciendo ? "❚❚" : "▶";
      }

      if (label) {
        label.textContent =
          reproduciendo
            ? "Pausar himno"
            : "Reproducir himno a la BANDERA SIERA";
      }
    }

    himnoToggle.addEventListener(
      "click",
      async () => {

        if (himno.paused) {

          try {
            await himno.play();
          } catch (error) {
            console.warn(
              "No fue posible reproducir el himno:",
              error
            );
          }

        } else {

          himno.pause();

        }

        actualizarHimno();
      }
    );

    himno.addEventListener(
      "play",
      actualizarHimno
    );

    himno.addEventListener(
      "pause",
      actualizarHimno
    );

    himno.addEventListener(
      "ended",
      actualizarHimno
    );

    actualizarHimno();
  }


  /* ============================================================
     BARRA DE PROGRESO GENERAL
     ============================================================ */

  let progressBar =
    document.getElementById("progressBar");

  if (!progressBar) {

    progressBar =
      document.createElement("div");

    progressBar.id = "progressBar";

    document.body.appendChild(progressBar);
  }

  function actualizarProgresoPagina() {

    const max =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const porcentaje =
      max > 0
        ? (window.scrollY / max) * 100
        : 0;

    progressBar.style.width =
      `${clamp(porcentaje, 0, 100)}%`;
  }

  window.addEventListener(
    "scroll",
    actualizarProgresoPagina,
    { passive: true }
  );

  actualizarProgresoPagina();


  /* ============================================================
     SCROLL CINEMÁTICO
     ============================================================ */

  const sections =
    Array.from(
      document.querySelectorAll("main > section")
    );

  sections.forEach((section) => {
    section.classList.add(
      "scroll-stage",
      "scroll-live-stage"
    );
  });

  if (
    "IntersectionObserver" in window &&
    !reduceMotion
  ) {

    const observer =
      new IntersectionObserver(
        (entries) => {

          entries.forEach((entry) => {

            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add(
              "is-in-view"
            );

            observer.unobserve(
              entry.target
            );
          });

        },
        {
          threshold: 0.06,
          rootMargin:
            "0px 0px -4% 0px"
        }
      );

    sections.forEach((section) => {
      observer.observe(section);
    });

  } else {

    sections.forEach((section) => {
      section.classList.add(
        "is-in-view"
      );
    });
  }


  const panoBackgrounds =
    document.querySelectorAll(
      ".pano-static-bg"
    );

  const heroText =
    document.querySelector(
      ".hero-text"
    );

  let scrollRAF = 0;

  function actualizarScrollVisual() {

    scrollRAF = 0;

    if (reduceMotion) {
      return;
    }

    const viewport =
      Math.max(
        window.innerHeight,
        1
      );

    const viewportCenter =
      viewport / 2;

    const mobile =
      window.innerWidth <= 900;

    sections.forEach(
      (section) => {

        const rect =
          section.getBoundingClientRect();

        if (
          rect.bottom <
            -viewport * 0.3 ||
          rect.top >
            viewport * 1.3
        ) {
          return;
        }

        const sectionCenter =
          rect.top +
          rect.height / 2;

        const signed =
          clamp(
            (
              sectionCenter -
              viewportCenter
            ) /
              (
                viewport *
                0.9
              ),
            -1,
            1
          );

        const distance =
          Math.abs(signed);

        const y =
          signed *
          (mobile ? 8 : 18);

        const scale =
          1 -
          distance *
            (
              mobile
                ? 0.006
                : 0.018
            );

        const opacity =
          1 -
          distance *
            (
              mobile
                ? 0.02
                : 0.07
            );

        section.style.setProperty(
          "--stage-y",
          `${y.toFixed(2)}px`
        );

        section.style.setProperty(
          "--stage-scale",
          scale.toFixed(4)
        );

        section.style.setProperty(
          "--stage-opacity",
          opacity.toFixed(3)
        );
      }
    );


    panoBackgrounds.forEach(
      (background) => {

        if (mobile) {

          background.style.setProperty(
            "--pano-shift",
            "0px"
          );

          return;
        }

        const parent =
          background.parentElement;

        if (!parent) {
          return;
        }

        const rect =
          parent.getBoundingClientRect();

        if (
          rect.bottom < 0 ||
          rect.top > viewport
        ) {
          return;
        }

        const centerOffset =
          (
            rect.top +
            rect.height / 2
          ) -
          viewportCenter;

        const shift =
          clamp(
            centerOffset *
              -0.04,
            -35,
            35
          );

        background.style.setProperty(
          "--pano-shift",
          `${shift}px`
        );
      }
    );


    if (heroText) {

      const hero =
        heroText.closest(
          ".hero"
        );

      if (hero) {

        const rect =
          hero.getBoundingClientRect();

        const progress =
          clamp(
            -rect.top /
              Math.max(
                rect.height,
                1
              ),
            0,
            1
          );

        heroText.style.transform =
          `translate3d(
            0,
            ${
              progress *
              (
                mobile
                  ? 10
                  : 24
              )
            }px,
            0
          )`;

        heroText.style.opacity =
          String(
            1 -
            progress *
              0.15
          );
      }
    }
  }

  function solicitarScrollVisual() {

    if (scrollRAF) {
      return;
    }

    scrollRAF =
      requestAnimationFrame(
        actualizarScrollVisual
      );
  }

  window.addEventListener(
    "scroll",
    solicitarScrollVisual,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    solicitarScrollVisual
  );

  actualizarScrollVisual();


  /* ============================================================
     REVELADO DE ELEMENTOS
     ============================================================ */

  const elementosReveal =
    document.querySelectorAll(
      [
        ".story-context-card",
        ".story-doc-card",
        ".story-timeline article",
        ".bandera-story-timeline article",
        ".bandera-researcher-card",
        ".recorrido-origin-story",
        ".hymn-annex",
        ".route-stat",
        ".timeline-item",
        ".agenda-item",
        ".gallery-item",
        ".alert-card",
        ".program-authority-card"
      ].join(",")
    );

  if (
    "IntersectionObserver" in window &&
    !reduceMotion
  ) {

    const revealObserver =
      new IntersectionObserver(
        (entries) => {

          entries.forEach(
            (entry) => {

              if (
                !entry.isIntersecting
              ) {
                return;
              }

              entry.target.classList.add(
                "reveal-visible"
              );

              revealObserver.unobserve(
                entry.target
              );
            }
          );

        },
        {
          threshold: 0.12,
          rootMargin:
            "0px 0px -35px 0px"
        }
      );

    elementosReveal.forEach(
      (element) => {

        element.classList.add(
          "reveal"
        );

        revealObserver.observe(
          element
        );
      }
    );

  } else {

    elementosReveal.forEach(
      (element) => {

        element.classList.add(
          "reveal-visible"
        );
      }
    );
  }


  /* ============================================================
     CUENTA REGRESIVA
     ============================================================ */

  const heroCTA =
    document.querySelector(
      ".hero-cta"
    );

  if (
    heroCTA &&
    !document.querySelector(
      ".hero-countdown"
    )
  ) {

    const countdown =
      document.createElement(
        "div"
      );

    countdown.className =
      "hero-countdown";

    countdown.innerHTML = `
      <span class="hero-countdown-label">
        Faltan para el próximo recorrido
      </span>

      <div class="hero-countdown-grid">

        <div class="hero-countdown-item">
          <span class="num" data-cd="dias">
            00
          </span>
          <span class="lab">
            Días
          </span>
        </div>

        <span class="hero-countdown-sep">
          :
        </span>

        <div class="hero-countdown-item">
          <span class="num" data-cd="horas">
            00
          </span>
          <span class="lab">
            Hrs
          </span>
        </div>

        <span class="hero-countdown-sep">
          :
        </span>

        <div class="hero-countdown-item">
          <span class="num" data-cd="min">
            00
          </span>
          <span class="lab">
            Min
          </span>
        </div>

        <span class="hero-countdown-sep">
          :
        </span>

        <div class="hero-countdown-item">
          <span class="num" data-cd="seg">
            00
          </span>
          <span class="lab">
            Seg
          </span>
        </div>

      </div>
    `;

    heroCTA.insertAdjacentElement(
      "beforebegin",
      countdown
    );

    const dias =
      countdown.querySelector(
        '[data-cd="dias"]'
      );

    const horas =
      countdown.querySelector(
        '[data-cd="horas"]'
      );

    const minutos =
      countdown.querySelector(
        '[data-cd="min"]'
      );

    const segundos =
      countdown.querySelector(
        '[data-cd="seg"]'
      );

    function objetivoRecorrido() {

      const ahora =
        new Date();

      let objetivo =
        new Date(
          ahora.getFullYear(),
          8,
          15,
          0,
          0,
          0
        );

      if (ahora >= objetivo) {

        objetivo =
          new Date(
            ahora.getFullYear() + 1,
            8,
            15,
            0,
            0,
            0
          );
      }

      return objetivo;
    }

    function actualizarCuenta() {

      const diferencia =
        objetivoRecorrido() -
        new Date();

      const total =
        Math.max(
          0,
          Math.floor(
            diferencia /
              1000
          )
        );

      const d =
        Math.floor(
          total /
            86400
        );

      const h =
        Math.floor(
          (
            total %
            86400
          ) /
            3600
        );

      const m =
        Math.floor(
          (
            total %
            3600
          ) /
            60
        );

      const s =
        total %
        60;

      const pad =
        (n) =>
          String(n).padStart(
            2,
            "0"
          );

      dias.textContent =
        pad(d);

      horas.textContent =
        pad(h);

      minutos.textContent =
        pad(m);

      segundos.textContent =
        pad(s);
    }

    actualizarCuenta();

    setInterval(
      actualizarCuenta,
      1000
    );
  }


  /* ============================================================
     FRANJA / TICKER
     ============================================================ */

  const header =
    document.querySelector(
      ".site-header"
    );

  if (
    header &&
    !document.querySelector(
      ".ticker-band"
    )
  ) {

    const datos = [
      "XXXV Recorrido de la Insurgencia",
      "150 km de recorrido",
      "14 municipios",
      "15 de septiembre de 2026",
      "Historia e identidad serrana",
      "Sierra de Zongolica"
    ];

    const ticker =
      document.createElement(
        "div"
      );

    ticker.className =
      "ticker-band";

    ticker.setAttribute(
      "aria-hidden",
      "true"
    );

    const track =
      document.createElement(
        "div"
      );

    track.className =
      "ticker-track";

    for (
      let vuelta = 0;
      vuelta < 2;
      vuelta++
    ) {

      datos.forEach(
        (texto) => {

          const item =
            document.createElement(
              "span"
            );

          item.textContent =
            texto;

          const sep =
            document.createElement(
              "span"
            );

          sep.className =
            "sep";

          sep.textContent =
            "✦";

          track.append(
            item,
            sep
          );
        }
      );
    }

    ticker.appendChild(track);

    header.insertAdjacentElement(
      "afterend",
      ticker
    );
  }


  /* ============================================================
     ACORDEONES DEL MUSEO
     ============================================================ */

  document
    .querySelectorAll(
      "[data-museum-accordion]"
    )
    .forEach((card) => {

      const trigger =
        card.querySelector(
          ".museum-accordion-trigger"
        );

      const panel =
        card.querySelector(
          ".museum-accordion-panel"
        );

      const label =
        card.querySelector(
          ".museum-accordion-label"
        );

      if (
        !trigger ||
        !panel
      ) {
        return;
      }

      trigger.addEventListener(
        "click",
        () => {

          const open =
            !card.classList.contains(
              "is-open"
            );

          card.classList.toggle(
            "is-open",
            open
          );

          trigger.setAttribute(
            "aria-expanded",
            String(open)
          );

          panel.setAttribute(
            "aria-hidden",
            String(!open)
          );

          if (label) {

            label.textContent =
              open
                ? "Ocultar historia ↑"
                : "Ver historia del recorrido ↓";
          }
        }
      );
    });


  /* ============================================================
     GALERÍA MEMORIA GRÁFICA
     ============================================================ */

  function configurarGaleria() {

    const panels =
      document.querySelector(
        ".gallery-panels"
      );

    if (!panels) {
      return;
    }

    const track =
      panels.querySelector(
        ".gallery-grid"
      );

    if (!track) {
      return;
    }

    const items =
      Array.from(
        track.querySelectorAll(
          ".gallery-item"
        )
      );

    if (!items.length) {
      return;
    }

    panels.classList.add(
      "gallery-depth-experience"
    );

    track.classList.add(
      "gallery-depth-track"
    );


    if (
      !document.querySelector(
        ".gallery-depth-hint"
      )
    ) {

      const hint =
        document.createElement(
          "p"
        );

      hint.className =
        "gallery-hint gallery-depth-hint";

      hint.textContent =
        window.matchMedia(
          "(hover: hover) and (pointer: fine)"
        ).matches
          ? "Desplázate con la rueda, arrastra o usa las flechas para explorar la memoria gráfica."
          : "Desliza con el dedo para explorar la memoria gráfica.";

      panels.insertAdjacentElement(
        "beforebegin",
        hint
      );
    }


    let controls =
      document.querySelector(
        ".gallery-depth-controls"
      );

    if (!controls) {

      controls =
        document.createElement(
          "div"
        );

      controls.className =
        "gallery-carousel-controls gallery-depth-controls";

      controls.innerHTML = `
        <div
          class="gallery-carousel-status"
          aria-live="polite"
        >
          <strong data-gallery-current>
            01
          </strong>
          <span>/</span>
          <span data-gallery-total>
            ${String(
              items.length
            ).padStart(
              2,
              "0"
            )}
          </span>
        </div>

        <div
          class="gallery-carousel-actions"
        >
          <button
            type="button"
            class="gallery-carousel-btn"
            data-gallery-prev
            aria-label="Fotografía anterior"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M15 18l-6-6 6-6"
              />
            </svg>
          </button>

          <button
            type="button"
            class="gallery-carousel-btn"
            data-gallery-next
            aria-label="Fotografía siguiente"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M9 6l6 6-6 6"
              />
            </svg>
          </button>
        </div>
      `;

      panels.insertAdjacentElement(
        "beforebegin",
        controls
      );
    }


    let progress =
      document.querySelector(
        ".gallery-depth-progress"
      );

    if (!progress) {

      progress =
        document.createElement(
          "div"
        );

      progress.className =
        "gallery-carousel-progress gallery-depth-progress";

      progress.innerHTML =
        "<span></span>";

      panels.insertAdjacentElement(
        "afterend",
        progress
      );
    }


    const currentEl =
      controls.querySelector(
        "[data-gallery-current]"
      );

    const prevBtn =
      controls.querySelector(
        "[data-gallery-prev]"
      );

    const nextBtn =
      controls.querySelector(
        "[data-gallery-next]"
      );

    const progressFill =
      progress.querySelector(
        "span"
      );

    let activeIndex = 0;
    let raf = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let dragged = false;


    function actualizar() {

      raf = 0;

      const viewport =
        track.getBoundingClientRect();

      const center =
        viewport.left +
        viewport.width /
          2;

      let nearest = 0;
      let nearestDistance =
        Infinity;


      items.forEach(
        (item, index) => {

          const rect =
            item.getBoundingClientRect();

          const itemCenter =
            rect.left +
            rect.width /
              2;

          const signed =
            (
              itemCenter -
              center
            ) /
            Math.max(
              rect.width,
              1
            );

          const distance =
            Math.min(
              1.5,
              Math.abs(
                signed
              )
            );


          if (
            distance <
            nearestDistance
          ) {

            nearestDistance =
              distance;

            nearest =
              index;
          }


          if (!reduceMotion) {

            const scale =
              1 -
              Math.min(
                distance *
                  0.105,
                0.16
              );

            const lift =
              Math.min(
                distance *
                  22,
                24
              );

            const rotate =
              clamp(
                signed *
                  -5.5,
                -8,
                8
              );

            const opacity =
              1 -
              Math.min(
                distance *
                  0.28,
                0.42
              );

            item.style.transform =
              `perspective(1000px)
               translateY(${lift}px)
               rotateY(${rotate}deg)
               scale(${scale})`;

            item.style.opacity =
              opacity.toFixed(
                3
              );

          } else {

            item.style.transform =
              "";

            item.style.opacity =
              "";
          }
        }
      );


      activeIndex =
        nearest;

      items.forEach(
        (item, index) => {

          item.classList.toggle(
            "is-gallery-active",
            index ===
              activeIndex
          );
        }
      );


      if (currentEl) {

        currentEl.textContent =
          String(
            activeIndex +
              1
          ).padStart(
            2,
            "0"
          );
      }


      const maxScroll =
        Math.max(
          1,
          track.scrollWidth -
          track.clientWidth
        );

      const pct =
        clamp(
          (
            track.scrollLeft /
            maxScroll
          ) *
            100,
          0,
          100
        );


      if (progressFill) {

        progressFill.style.width =
          `${Math.max(
            2.5,
            pct
          )}%`;
      }


      if (prevBtn) {

        prevBtn.disabled =
          track.scrollLeft <=
          3;
      }


      if (nextBtn) {

        nextBtn.disabled =
          track.scrollLeft >=
          maxScroll -
          3;
      }
    }


    function schedule() {

      if (raf) {
        return;
      }

      raf =
        requestAnimationFrame(
          actualizar
        );
    }


    function goTo(index) {

      const target =
        items[
          clamp(
            index,
            0,
            items.length -
              1
          )
        ];

      if (!target) {
        return;
      }

      const left =
        target.offsetLeft -
        (
          track.clientWidth -
          target.clientWidth
        ) /
          2;

      track.scrollTo({
        left,
        behavior:
          reduceMotion
            ? "auto"
            : "smooth"
      });
    }


    if (prevBtn) {

      prevBtn.addEventListener(
        "click",
        () =>
          goTo(
            activeIndex -
            1
          )
      );
    }


    if (nextBtn) {

      nextBtn.addEventListener(
        "click",
        () =>
          goTo(
            activeIndex +
            1
          )
      );
    }


    track.addEventListener(
      "wheel",
      (event) => {

        const finePointer =
          window.matchMedia(
            "(hover: hover) and (pointer: fine)"
          ).matches;

        if (!finePointer) {
          return;
        }

        const delta =
          Math.abs(
            event.deltaY
          ) >=
          Math.abs(
            event.deltaX
          )
            ? event.deltaY
            : event.deltaX;

        if (!delta) {
          return;
        }

        const max =
          track.scrollWidth -
          track.clientWidth;

        const forward =
          delta > 0 &&
          track.scrollLeft <
            max -
              2;

        const backward =
          delta < 0 &&
          track.scrollLeft >
            2;

        if (
          forward ||
          backward
        ) {

          event.preventDefault();

          track.scrollLeft +=
            delta *
            1.05;

          schedule();
        }

      },
      {
        passive: false
      }
    );


    track.addEventListener(
      "pointerdown",
      (event) => {

        if (
          event.pointerType !==
          "mouse"
        ) {
          return;
        }

        dragging = true;
        dragged = false;

        dragStartX =
          event.clientX;

        dragStartScroll =
          track.scrollLeft;

        track.classList.add(
          "is-grabbing"
        );

        track.setPointerCapture?.(
          event.pointerId
        );
      }
    );


    track.addEventListener(
      "pointermove",
      (event) => {

        if (
          !dragging ||
          event.pointerType !==
            "mouse"
        ) {
          return;
        }

        const dx =
          event.clientX -
          dragStartX;

        if (
          Math.abs(dx) >
          4
        ) {
          dragged = true;
        }

        track.scrollLeft =
          dragStartScroll -
          dx;

        schedule();
      }
    );


    function terminarArrastre(
      event
    ) {

      if (!dragging) {
        return;
      }

      dragging = false;

      track.classList.remove(
        "is-grabbing"
      );

      if (
        event?.pointerId !=
        null
      ) {

        track.releasePointerCapture?.(
          event.pointerId
        );
      }
    }


    track.addEventListener(
      "pointerup",
      terminarArrastre
    );

    track.addEventListener(
      "pointercancel",
      terminarArrastre
    );


    track.addEventListener(
      "click",
      (event) => {

        if (!dragged) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        dragged = false;

      },
      true
    );


    track.addEventListener(
      "scroll",
      schedule,
      { passive: true }
    );


    track.setAttribute(
      "tabindex",
      "0"
    );

    track.setAttribute(
      "role",
      "region"
    );

    track.setAttribute(
      "aria-label",
      "Carrusel de Memoria Gráfica"
    );


    track.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key ===
          "ArrowRight"
        ) {

          event.preventDefault();

          goTo(
            activeIndex +
              1
          );
        }

        if (
          event.key ===
          "ArrowLeft"
        ) {

          event.preventDefault();

          goTo(
            activeIndex -
              1
          );
        }
      }
    );


    window.addEventListener(
      "resize",
      schedule
    );

    requestAnimationFrame(
      () => {

        goTo(0);
        actualizar();

      }
    );
  }

  configurarGaleria();


  /* ============================================================
     CARRUSEL DE PLAYERAS CONMEMORATIVAS
     ============================================================ */

  function configurarPlayeras() {

    const showcase =
      document.querySelector(
        ".recorrido-shirts-showcase"
      );

    if (!showcase) {
      return;
    }

    const track =
      showcase.querySelector(
        ".recorrido-shirts-track"
      );

    if (!track) {
      return;
    }

    const items =
      Array.from(
        track.querySelectorAll(
          ".recorrido-shirt-card"
        )
      );

    if (!items.length) {
      return;
    }


    const header =
      showcase.querySelector(
        ".recorrido-shirts-header"
      );


    let hint =
      showcase.querySelector(
        ".recorrido-shirts-hint"
      );

    if (!hint) {

      hint =
        document.createElement(
          "p"
        );

      hint.className =
        "recorrido-shirts-hint";

      hint.textContent =
        window.matchMedia(
          "(hover: hover) and (pointer: fine)"
        ).matches
          ? "Desplázate con la rueda, arrastra o usa las flechas."
          : "Desliza con el dedo para explorar.";

      header?.insertAdjacentElement(
        "afterend",
        hint
      );
    }


    let controls =
      showcase.querySelector(
        ".shirts-carousel-controls"
      );

    if (!controls) {

      controls =
        document.createElement(
          "div"
        );

      controls.className =
        "shirts-carousel-controls";

      controls.innerHTML = `
        <div
          class="shirts-carousel-status"
          aria-live="polite"
        >
          <strong data-shirts-current>
            01
          </strong>

          <span>/</span>

          <span data-shirts-total>
            ${String(
              items.length
            ).padStart(
              2,
              "0"
            )}
          </span>
        </div>

        <div
          class="shirts-carousel-actions"
        >
          <button
            type="button"
            class="shirts-carousel-btn"
            data-shirts-prev
            aria-label="Playera anterior"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M15 18l-6-6 6-6"
              />
            </svg>
          </button>

          <button
            type="button"
            class="shirts-carousel-btn"
            data-shirts-next
            aria-label="Playera siguiente"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M9 6l6 6-6 6"
              />
            </svg>
          </button>
        </div>
      `;

      hint.insertAdjacentElement(
        "afterend",
        controls
      );
    }


    let progress =
      showcase.querySelector(
        ".shirts-carousel-progress"
      );

    if (!progress) {

      progress =
        document.createElement(
          "div"
        );

      progress.className =
        "shirts-carousel-progress";

      progress.innerHTML =
        "<span></span>";

      showcase.appendChild(
        progress
      );
    }


    const currentEl =
      controls.querySelector(
        "[data-shirts-current]"
      );

    const prevBtn =
      controls.querySelector(
        "[data-shirts-prev]"
      );

    const nextBtn =
      controls.querySelector(
        "[data-shirts-next]"
      );

    const progressFill =
      progress.querySelector(
        "span"
      );


    let activeIndex = 0;
    let raf = 0;
    let dragging = false;
    let dragged = false;
    let startX = 0;
    let startScroll = 0;


    function actualizar() {

      raf = 0;

      const viewport =
        track.getBoundingClientRect();

      const center =
        viewport.left +
        viewport.width /
          2;

      let nearest = 0;
      let nearestDistance =
        Infinity;


      items.forEach(
        (item, index) => {

          const rect =
            item.getBoundingClientRect();

          const itemCenter =
            rect.left +
            rect.width /
              2;

          const signed =
            (
              itemCenter -
              center
            ) /
            Math.max(
              rect.width,
              1
            );

          const distance =
            Math.min(
              1.5,
              Math.abs(
                signed
              )
            );


          if (
            distance <
            nearestDistance
          ) {

            nearestDistance =
              distance;

            nearest =
              index;
          }


          if (!reduceMotion) {

            const scale =
              1 -
              Math.min(
                distance *
                  0.085,
                0.13
              );

            const lift =
              Math.min(
                distance *
                  15,
                18
              );

            const rotate =
              clamp(
                signed *
                  -4.2,
                -6,
                6
              );

            const opacity =
              1 -
              Math.min(
                distance *
                  0.24,
                0.36
              );

            item.style.transform =
              `perspective(1000px)
               translateY(${lift}px)
               rotateY(${rotate}deg)
               scale(${scale})`;

            item.style.opacity =
              opacity.toFixed(
                3
              );

          } else {

            item.style.transform =
              "";

            item.style.opacity =
              "";
          }
        }
      );


      activeIndex =
        nearest;


      items.forEach(
        (item, index) => {

          item.classList.toggle(
            "is-shirt-active",
            index ===
              activeIndex
          );
        }
      );


      if (currentEl) {

        currentEl.textContent =
          String(
            activeIndex +
              1
          ).padStart(
            2,
            "0"
          );
      }


      const max =
        Math.max(
          1,
          track.scrollWidth -
          track.clientWidth
        );

      const pct =
        clamp(
          (
            track.scrollLeft /
            max
          ) *
            100,
          0,
          100
        );


      if (progressFill) {

        progressFill.style.width =
          `${Math.max(
            3,
            pct
          )}%`;
      }


      if (prevBtn) {

        prevBtn.disabled =
          track.scrollLeft <=
          3;
      }


      if (nextBtn) {

        nextBtn.disabled =
          track.scrollLeft >=
          max -
            3;
      }
    }


    function schedule() {

      if (raf) {
        return;
      }

      raf =
        requestAnimationFrame(
          actualizar
        );
    }


    function goTo(index) {

      const target =
        items[
          clamp(
            index,
            0,
            items.length -
              1
          )
        ];

      if (!target) {
        return;
      }

      const left =
        target.offsetLeft -
        (
          track.clientWidth -
          target.clientWidth
        ) /
          2;

      track.scrollTo({
        left,
        behavior:
          reduceMotion
            ? "auto"
            : "smooth"
      });
    }


    prevBtn?.addEventListener(
      "click",
      () =>
        goTo(
          activeIndex -
          1
        )
    );


    nextBtn?.addEventListener(
      "click",
      () =>
        goTo(
          activeIndex +
          1
        )
    );


    track.addEventListener(
      "wheel",
      (event) => {

        const finePointer =
          window.matchMedia(
            "(hover: hover) and (pointer: fine)"
          ).matches;

        if (!finePointer) {
          return;
        }

        const delta =
          Math.abs(
            event.deltaY
          ) >=
          Math.abs(
            event.deltaX
          )
            ? event.deltaY
            : event.deltaX;

        if (!delta) {
          return;
        }

        const max =
          track.scrollWidth -
          track.clientWidth;

        const forward =
          delta > 0 &&
          track.scrollLeft <
            max -
              2;

        const backward =
          delta < 0 &&
          track.scrollLeft >
            2;

        if (
          forward ||
          backward
        ) {

          event.preventDefault();

          track.scrollLeft +=
            delta *
            1.02;

          schedule();
        }

      },
      {
        passive: false
      }
    );


    track.addEventListener(
      "pointerdown",
      (event) => {

        if (
          event.pointerType !==
          "mouse"
        ) {
          return;
        }

        dragging = true;
        dragged = false;

        startX =
          event.clientX;

        startScroll =
          track.scrollLeft;

        track.classList.add(
          "is-grabbing"
        );

        track.setPointerCapture?.(
          event.pointerId
        );
      }
    );


    track.addEventListener(
      "pointermove",
      (event) => {

        if (
          !dragging ||
          event.pointerType !==
            "mouse"
        ) {
          return;
        }

        const dx =
          event.clientX -
          startX;

        if (
          Math.abs(dx) >
          4
        ) {
          dragged = true;
        }

        track.scrollLeft =
          startScroll -
          dx;

        schedule();
      }
    );


    function terminar(
      event
    ) {

      if (!dragging) {
        return;
      }

      dragging = false;

      track.classList.remove(
        "is-grabbing"
      );

      if (
        event?.pointerId !=
        null
      ) {

        track.releasePointerCapture?.(
          event.pointerId
        );
      }
    }


    track.addEventListener(
      "pointerup",
      terminar
    );

    track.addEventListener(
      "pointercancel",
      terminar
    );


    track.addEventListener(
      "click",
      (event) => {

        if (!dragged) {
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        dragged = false;

      },
      true
    );


    track.addEventListener(
      "scroll",
      schedule,
      { passive: true }
    );


    window.addEventListener(
      "resize",
      schedule
    );


    track.setAttribute(
      "tabindex",
      "0"
    );

    track.setAttribute(
      "role",
      "region"
    );

    track.setAttribute(
      "aria-label",
      "Carrusel de playeras conmemorativas"
    );


    track.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key ===
          "ArrowRight"
        ) {

          event.preventDefault();

          goTo(
            activeIndex +
              1
          );
        }

        if (
          event.key ===
          "ArrowLeft"
        ) {

          event.preventDefault();

          goTo(
            activeIndex -
              1
          );
        }
      }
    );


    requestAnimationFrame(
      () => {

        goTo(0);
        actualizar();

      }
    );
  }

  configurarPlayeras();


  /* ============================================================
     LIGHTBOX
     ============================================================ */

  const lightbox =
    document.createElement(
      "div"
    );

  lightbox.className =
    "lightbox-overlay";

  lightbox.setAttribute(
    "aria-hidden",
    "true"
  );

  lightbox.innerHTML = `
    <button
      class="lightbox-close"
      type="button"
      aria-label="Cerrar imagen"
    >
      ×
    </button>

    <img
      src=""
      alt=""
    />
  `;

  document.body.appendChild(
    lightbox
  );

  const lightboxImage =
    lightbox.querySelector(
      "img"
    );

  const lightboxClose =
    lightbox.querySelector(
      ".lightbox-close"
    );


  function abrirLightbox(
    image
  ) {

    if (
      !image ||
      !image.src
    ) {
      return;
    }

    lightboxImage.src =
      image.currentSrc ||
      image.src;

    lightboxImage.alt =
      image.alt ||
      "Imagen ampliada";

    lightbox.classList.add(
      "is-open"
    );

    lightbox.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow =
      "hidden";

    lightboxClose.focus();
  }


  function cerrarLightbox() {

    lightbox.classList.remove(
      "is-open"
    );

    lightbox.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.style.overflow =
      "";

    setTimeout(
      () => {
        lightboxImage.src = "";
      },
      220
    );
  }


  document
    .querySelectorAll(
      [
        ".simbolismo-flag img",
        ".gallery-item img",
        ".recorrido-shirt-card img",
        ".story-media img",
        ".story-doc-card img",
        ".bandera-researcher-media img",
        ".recorrido-origin-media img",
        ".program-shirt-card img",
        ".valor-image img"
      ].join(",")
    )
    .forEach((image) => {

      image.style.cursor =
        "zoom-in";

      image.addEventListener(
        "click",
        () => {
          abrirLightbox(
            image
          );
        }
      );
    });


  lightboxClose.addEventListener(
    "click",
    cerrarLightbox
  );


  lightbox.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
        lightbox
      ) {
        cerrarLightbox();
      }
    }
  );


  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
          "Escape" &&
        lightbox.classList.contains(
          "is-open"
        )
      ) {

        cerrarLightbox();
      }
    }
  );


  /* ============================================================
     MAPA DEL RECORRIDO
     ============================================================ */

  const mapElement =
    document.getElementById(
      "routeMap"
    );

  if (
    mapElement &&
    typeof L !==
      "undefined"
  ) {

    const puntos = [

      {
        nombre:
          "Tehuacán",
        estado:
          "Puebla",
        lat: 18.4615,
        lng: -97.3928
      },

      {
        nombre:
          "Acultzingo",
        estado:
          "Veracruz",
        lat: 18.7186,
        lng: -97.3047
      },

      {
        nombre:
          "Maltrata",
        estado:
          "Veracruz",
        lat: 18.8107,
        lng: -97.2752
      },

      {
        nombre:
          "Ciudad Mendoza",
        estado:
          "Veracruz",
        lat: 18.8062,
        lng: -97.1802
      },

      {
        nombre:
          "Huiloapan de Cuauhtémoc",
        estado:
          "Veracruz",
        lat: 18.8174,
        lng: -97.1543
      },

      {
        nombre:
          "Nogales",
        estado:
          "Veracruz",
        lat: 18.8278,
        lng: -97.1655
      },

      {
        nombre:
          "Río Blanco",
        estado:
          "Veracruz",
        lat: 18.8302,
        lng: -97.1561
      },

      {
        nombre:
          "Orizaba",
        estado:
          "Veracruz",
        lat: 18.8498,
        lng: -97.1036
      },

      {
        nombre:
          "Rafael Delgado",
        estado:
          "Veracruz",
        lat: 18.8110,
        lng: -97.0717
      },

      {
        nombre:
          "Tlilapan",
        estado:
          "Veracruz",
        lat: 18.8055,
        lng: -97.0980
      },

      {
        nombre:
          "San Andrés Tenejapan",
        estado:
          "Veracruz",
        lat: 18.7895,
        lng: -97.0920
      },

      {
        nombre:
          "Tequila",
        estado:
          "Veracruz",
        lat: 18.7288,
        lng: -97.0695
      },

      {
        nombre:
          "Los Reyes",
        estado:
          "Veracruz",
        lat: 18.6698,
        lng: -97.0407
      },

      {
        nombre:
          "Zongolica",
        estado:
          "Veracruz",
        lat: 18.6667,
        lng: -96.9992
      }
    ];


    const map =
      L.map(
        mapElement,
        {
          scrollWheelZoom:
            false,
          zoomControl:
            true
        }
      );


    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          "&copy; OpenStreetMap"
      }
    ).addTo(map);


    const latlngs =
      puntos.map(
        (punto) => [
          punto.lat,
          punto.lng
        ]
      );


    const line =
      L.polyline(
        latlngs,
        {
          color:
            "#D41F35",
          weight: 4,
          opacity: 0.85,
          dashArray:
            "8 8",
          className:
            "route-line"
        }
      ).addTo(map);


    const markers = [];


    puntos.forEach(
      (punto, index) => {

        const primero =
          index === 0;

        const ultimo =
          index ===
          puntos.length -
            1;


        let html;

        if (primero) {

          html = `
            <div class="
              route-pin-start
              route-pin-place
            ">
              1
            </div>
          `;

        } else if (ultimo) {

          html = `
            <div class="
              route-pin-end
              route-pin-place
            ">
              14
            </div>
          `;

        } else {

          html = `
            <div class="
              route-pin
            ">
              ${index + 1}
            </div>
          `;
        }


        const icon =
          L.divIcon({
            html,
            className:
              "route-marker-shell",
            iconSize:
              [34, 34],
            iconAnchor:
              [17, 17]
          });


        const marker =
          L.marker(
            [
              punto.lat,
              punto.lng
            ],
            {
              icon
            }
          );


        const mapsURL =
          `https://www.google.com/maps/dir/?api=1&destination=${punto.lat},${punto.lng}`;


        marker.bindPopup(`
          <div class="route-popup">

            <div class="route-popup-head">
              ${index + 1}. ${escapeHTML(
                punto.nombre
              )}
            </div>

            <div class="route-popup-body">

              <span class="route-popup-badge">
                ${escapeHTML(
                  punto.estado
                )}
              </span>

              <p style="
                margin:8px 0 0
              ">
                <a
                  href="${mapsURL}"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="
                    color:#03694D;
                    font-weight:700;
                  "
                >
                  Cómo llegar ↗
                </a>
              </p>

            </div>

          </div>
        `);


        marker.addTo(map);

        markers.push(
          marker
        );
      }
    );


    map.fitBounds(
      line.getBounds(),
      {
        padding:
          [30, 30]
      }
    );


    /* Línea del tiempo → mapa */

    document
      .querySelectorAll(
        ".timeline-item"
      )
      .forEach(
        (item, index) => {

          item.addEventListener(
            "click",
            () => {

              const marker =
                markers[index];

              if (!marker) {
                return;
              }

              const punto =
                puntos[index];

              map.flyTo(
                [
                  punto.lat,
                  punto.lng
                ],
                Math.max(
                  map.getZoom(),
                  11
                ),
                {
                  duration: 0.7
                }
              );

              setTimeout(
                () => {
                  marker.openPopup();
                },
                600
              );
            }
          );
        }
      );


    /* Botón para restablecer mapa */

    const resetControl =
      L.control({
        position:
          "topright"
      });


    resetControl.onAdd =
      () => {

        const container =
          L.DomUtil.create(
            "div",
            "leaflet-bar"
          );

        const button =
          document.createElement(
            "button"
          );

        button.type =
          "button";

        button.className =
          "route-reset-btn";

        button.innerHTML =
          `
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="
                  M4 12a8 8 0 1 0 2-5.3
                  M4 4v5h5
                "
              />
            </svg>
            Ver recorrido
          `;

        button.addEventListener(
          "click",
          (event) => {

            event.preventDefault();

            map.fitBounds(
              line.getBounds(),
              {
                padding:
                  [30, 30]
              }
            );
          }
        );

        container.appendChild(
          button
        );

        L.DomEvent.disableClickPropagation(
          container
        );

        return container;
      };


    resetControl.addTo(map);


    setTimeout(
      () => {
        map.invalidateSize();
      },
      250
    );
  }


  /* ============================================================
     ANIMACIÓN DE NÚMEROS
     ============================================================ */

  const stats =
    document.querySelectorAll(
      ".route-stat-num"
    );

  if (
    stats.length &&
    "IntersectionObserver" in window &&
    !reduceMotion
  ) {

    const observer =
      new IntersectionObserver(
        (entries) => {

          entries.forEach(
            (entry) => {

              if (
                !entry.isIntersecting
              ) {
                return;
              }

              observer.unobserve(
                entry.target
              );

              const destino =
                Number(
                  entry.target.textContent
                );

              if (
                !Number.isFinite(
                  destino
                )
              ) {
                return;
              }

              const inicio =
                performance.now();

              const duracion =
                800;

              function animar(
                now
              ) {

                const avance =
                  clamp(
                    (
                      now -
                      inicio
                    ) /
                      duracion,
                    0,
                    1
                  );

                const ease =
                  1 -
                  Math.pow(
                    1 -
                    avance,
                    3
                  );

                entry.target.textContent =
                  Math.round(
                    destino *
                    ease
                  );

                if (
                  avance <
                  1
                ) {

                  requestAnimationFrame(
                    animar
                  );
                }
              }

              requestAnimationFrame(
                animar
              );
            }
          );

        },
        {
          threshold: 0.6
        }
      );

    stats.forEach(
      (stat) => {
        observer.observe(stat);
      }
    );
  }


  /* ============================================================
     NAVEGACIÓN POR PUNTOS
     ============================================================ */

  if (
    sections.length &&
    window.innerWidth >
      900
  ) {

    const nombres = {
      inicio:
        "Inicio",
      introduccion:
        "Introducción",
      preparate:
        "Prepárate",
      historia:
        "Historia",
      museo:
        "Museo Digital",
      simbolismo:
        "Simbolismo",
      recorrido:
        "Recorrido",
      programa:
        "Programa",
      galeria:
        "Memoria gráfica",
      "canal-whatsapp":
        "Canal Oficial"
    };


    const dotsNav =
      document.createElement(
        "nav"
      );

    dotsNav.className =
      "section-dots";

    dotsNav.setAttribute(
      "aria-label",
      "Navegación por secciones"
    );


    const dots = [];


    sections.forEach(
      (section, index) => {

        if (!section.id) {
          return;
        }

        const dot =
          document.createElement(
            "button"
          );

        dot.type =
          "button";

        dot.className =
          "section-dot";

        const nombre =
          nombres[
            section.id
          ] ||
          section.id;


        dot.setAttribute(
          "aria-label",
          `Ir a ${nombre}`
        );


        dot.addEventListener(
          "click",
          () => {

            section.scrollIntoView({
              behavior:
                reduceMotion
                  ? "auto"
                  : "smooth",
              block:
                "start"
            });
          }
        );


        dotsNav.appendChild(
          dot
        );


        dots.push({
          section,
          dot,
          index,
          nombre
        });
      }
    );


    document.body.appendChild(
      dotsNav
    );


    if (
      "IntersectionObserver" in window
    ) {

      const observer =
        new IntersectionObserver(
          (entries) => {

            const visibles =
              entries
                .filter(
                  (entry) =>
                    entry.isIntersecting
                )
                .sort(
                  (a, b) =>
                    b.intersectionRatio -
                    a.intersectionRatio
                );

            if (
              !visibles.length
            ) {
              return;
            }

            const current =
              dots.find(
                (item) =>
                  item.section ===
                  visibles[0]
                    .target
              );

            if (!current) {
              return;
            }

            dots.forEach(
              (item) => {

                item.dot.classList.toggle(
                  "is-active",
                  item ===
                    current
                );
              }
            );
          },
          {
            threshold:
              [
                0.2,
                0.4,
                0.6
              ],
            rootMargin:
              "-15% 0px -35% 0px"
          }
        );


      dots.forEach(
        (item) => {

          observer.observe(
            item.section
          );
        }
      );
    }
  }

});


/* ============================================================
   WHATSAPP
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const meta =
      document.querySelector(
        'meta[name="whatsapp-channel-url"]'
      );

    const url =
      meta?.content?.trim() ||
      "";

    const links =
      document.querySelectorAll(
        ".js-whatsapp-channel"
      );


    const valido =
      /^https?:\/\//i.test(
        url
      ) &&
      !url.includes(
        "REEMPLAZAR"
      );


    links.forEach(
      (link) => {

        if (valido) {

          link.href =
            url;

          link.target =
            "_blank";

          link.rel =
            "noopener noreferrer";

          link.classList.remove(
            "is-disabled"
          );

          link.removeAttribute(
            "aria-disabled"
          );

        } else {

          link.href =
            "#canal-whatsapp";

        }
      }
    );
  }
);