(function () {
  const data = window.GRADES_DATA;
  if (!data || !Array.isArray(data.grupos)) {
    document.getElementById("errorBox").textContent =
      "No se encontraron los datos de calificaciones (grades-data.js).";
    document.getElementById("errorBox").classList.remove("hidden");
    return;
  }

  const groupSelect = document.getElementById("groupSelect");
  const codeInput = document.getElementById("codeInput");
  const lookupForm = document.getElementById("lookupForm");
  const errorBox = document.getElementById("errorBox");
  const resultSection = document.getElementById("resultSection");

  // Encabezado
  document.getElementById("updatedPill").textContent = `Actualizado: ${data.actualizadoEn}`;
  document.getElementById("headerSubtitle").textContent =
    `${data.institucion} · Docente: ${data.docente}`;

  // Poblar selector de grupos agrupados por asignatura
  const porAsignatura = new Map();
  for (const g of data.grupos) {
    if (!porAsignatura.has(g.asignatura)) {
      porAsignatura.set(g.asignatura, []);
    }
    porAsignatura.get(g.asignatura).push(g);
  }

  for (const [asignatura, grupos] of porAsignatura.entries()) {
    const optgroup = document.createElement("optgroup");
    optgroup.label = asignatura;
    for (const g of grupos) {
      const opt = document.createElement("option");
      opt.value = g.id;
      opt.textContent = `${g.id} (${g.totalEstudiantes} estudiantes)`;
      optgroup.appendChild(opt);
    }
    groupSelect.appendChild(optgroup);
  }

  function fmt(num) {
    if (num === null || num === undefined || Number.isNaN(num)) return "—";
    return Number(num).toFixed(2).replace(/\.00$/, "");
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
    resultSection.classList.add("hidden");
  }

  function clearError() {
    errorBox.classList.add("hidden");
    errorBox.textContent = "";
  }

  function renderStudent(grupo, est) {
    clearError();
    const minPass = data.notaMinimaAprobacion || 60;

    document.getElementById("resGroupTag").textContent = `Grupo ${grupo.id}`;
    document.getElementById("resName").textContent = est.nombre;
    document.getElementById("resSubject").textContent = grupo.asignatura;
    document.getElementById("resEmail").textContent = est.correo || "Sin correo";
    document.getElementById("resCode").textContent = est.codigo;

    // Estado general y felicitación
    const badge = document.getElementById("resStatusBadge");
    const congratsBanner = document.getElementById("congratsBanner");
    badge.className = "status-badge";
    congratsBanner.classList.add("hidden");
    const tieneConv = est.notaConvocatoria !== null && est.notaConvocatoria !== undefined;

    if (est.notaFinal >= minPass) {
      badge.textContent = "Aprobado";
      badge.classList.add("status-pass");
      congratsBanner.textContent = `¡Felicidades, ${est.nombre}! Has aprobado la asignatura con ${fmt(est.notaFinal)} puntos.`;
      congratsBanner.classList.remove("hidden");
    } else if (est.notaFinal < 30) {
      badge.textContent = "Reprobado";
      badge.classList.add("status-fail");
    } else if (tieneConv) {
      if (est.notaConvocatoria >= minPass) {
        badge.textContent = "Aprobado en Convocatoria";
        badge.classList.add("status-pass");
        congratsBanner.textContent = `¡Felicidades, ${est.nombre}! Has aprobado la asignatura en convocatoria con ${fmt(est.notaConvocatoria)} puntos.`;
        congratsBanner.classList.remove("hidden");
      } else {
        badge.textContent = "Reprobado";
        badge.classList.add("status-fail");
      }
    } else {
      badge.textContent = "Pendiente de Convocatoria";
      badge.classList.add("status-pending");
    }

    // KPI Acumulado
    document.getElementById("kpiAcumulado").textContent = fmt(est.acumulado);
    document.getElementById("kpiAcumuladoMax").textContent =
      est.acumuladoMax ? `/ ${fmt(est.acumuladoMax)}` : "pts";

    // KPI Nota Final
    document.getElementById("kpiFinal").textContent = fmt(est.notaFinal);
    const pct = Math.max(0, Math.min(100, est.notaFinal));
    const bar = document.getElementById("finalProgressBar");
    bar.style.width = `${pct}%`;
    bar.className = "progress-fill " + (est.notaFinal >= minPass ? "pass" : "low");
    document.getElementById("kpiFinalHint").textContent =
      `Mínimo para aprobar: ${minPass} pts`;

    // KPI Convocatoria
    const convVal = document.getElementById("kpiConvocatoria");
    const convMax = document.getElementById("kpiConvocatoriaMax");
    const convHint = document.getElementById("kpiConvocatoriaHint");

    convVal.classList.remove("is-pending", "is-na", "is-fail");
    if (est.notaFinal >= minPass) {
      convVal.textContent = "No aplica";
      convVal.classList.add("is-na");
      convMax.textContent = "";
      convHint.textContent = `Aprobado con ${fmt(est.notaFinal)} pts (≥ ${minPass})`;
    } else if (est.notaFinal < 30) {
      convVal.textContent = "No aplica";
      convVal.classList.add("is-fail");
      convMax.textContent = "";
      convHint.textContent = "Nota menor a 30 pts (sin derecho a convocatoria)";
    } else if (tieneConv) {
      convVal.textContent = fmt(est.notaConvocatoria);
      convMax.textContent = "/ 100";
      convHint.textContent =
        est.notaConvocatoria >= minPass
          ? "Convocatoria aprobada"
          : "Convocatoria registrada";
    } else {
      convVal.textContent = "Pendiente";
      convVal.classList.add("is-pending");
      convMax.textContent = "";
      convHint.textContent = "Aún no registrada por el docente";
    }

    // Bloques de resumen
    const blocksCard = document.getElementById("summaryBlocksCard");
    const blocksGrid = document.getElementById("summaryBlocksGrid");
    blocksGrid.innerHTML = "";
    if (Array.isArray(est.desgloseResumen) && est.desgloseResumen.length > 0) {
      blocksCard.classList.remove("hidden");
      for (const b of est.desgloseResumen) {
        const div = document.createElement("div");
        div.className = "block-item";
        div.innerHTML = `
          <div class="block-label">${b.label}</div>
          <div class="block-score">${fmt(b.puntos)} ${b.max ? `<span>/ ${fmt(b.max)}</span>` : "<span>pts</span>"}</div>
        `;
        blocksGrid.appendChild(div);
      }
    } else {
      blocksCard.classList.add("hidden");
    }

    // Tabla de evaluaciones agrupada por categoría en orden de parciales
    const tbody = document.getElementById("evalTableBody");
    tbody.innerHTML = "";
    document.getElementById("evalCountLabel").textContent = `${est.evaluaciones.length} evaluaciones`;

    const ordenCategorias = [
      "Acumulado Primer Parcial",
      "Examen Primer Parcial",
      "Acumulado Segundo Parcial",
      "Examen Segundo Parcial",
    ];

    const gruposCat = new Map();
    for (const ev of est.evaluaciones) {
      const cat = ev.categoria || "Otros";
      if (!gruposCat.has(cat)) gruposCat.set(cat, []);
      gruposCat.get(cat).push(ev);
    }

    const categoriasOrdenadas = Array.from(gruposCat.keys()).sort((a, b) => {
      const idxA = ordenCategorias.findIndex((p) => a.startsWith(p));
      const idxB = ordenCategorias.findIndex((p) => b.startsWith(p));
      const rankA = idxA === -1 ? 99 : idxA;
      const rankB = idxB === -1 ? 99 : idxB;
      if (rankA !== rankB) return rankA - rankB;
      return a.localeCompare(b);
    });

    for (const cat of categoriasOrdenadas) {
      const items = gruposCat.get(cat);
      const subPts = items.reduce((acc, it) => acc + (it.puntos || 0), 0);
      const subMax = items.reduce((acc, it) => acc + (it.maxPuntos || 0), 0);
      const subRatio = subMax > 0 ? Math.min(100, Math.max(0, (subPts / subMax) * 100)) : 0;

      const trCat = document.createElement("tr");
      trCat.className = "cat-group-row";
      trCat.innerHTML = `
        <td><strong>${cat}</strong></td>
        <td class="num-col"><strong>${fmt(subPts)}</strong></td>
        <td class="num-col"><strong>${subMax > 0 ? fmt(subMax) : "—"}</strong></td>
        <td class="bar-col">
          <div class="mini-bar" title="${subRatio.toFixed(0)}%">
            <div class="mini-bar-fill" style="width: ${subRatio}%"></div>
          </div>
        </td>
      `;
      tbody.appendChild(trCat);

      for (const ev of items) {
        const tr = document.createElement("tr");
        const maxP = ev.maxPuntos || 0;
        const ratio = maxP > 0 ? Math.min(100, Math.max(0, (ev.puntos / maxP) * 100)) : 0;

        const commentHtml = ev.comentario
          ? `<div class="eval-comment">Obs: ${ev.comentario}</div>`
          : "";

        tr.innerHTML = `
          <td class="eval-indent">
            <div class="eval-name">${ev.nombre}</div>
            ${commentHtml}
          </td>
          <td class="num-col"><strong>${fmt(ev.puntos)}</strong></td>
          <td class="num-col">${maxP > 0 ? fmt(maxP) : "—"}</td>
          <td class="bar-col">
            <div class="mini-bar" title="${ratio.toFixed(0)}%">
              <div class="mini-bar-fill" style="width: ${ratio}%"></div>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      }
    }

    resultSection.classList.remove("hidden");
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function b64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function bytesToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function buscarYDescifrarEstudiante(grupoId, codigo) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error(
        "Tu navegador bloqueó Web Crypto en este contexto. Abre la página desde GitHub Pages (HTTPS) o un servidor local (localhost)."
      );
    }

    const enc = new TextEncoder();
    const secret = `${grupoId}:${codigo}`;
    const secretBytes = enc.encode(secret);

    const lookupInput = enc.encode(`LOOKUP:${secret}`);
    const hashBuf = await window.crypto.subtle.digest("SHA-256", lookupInput);
    const lookupId = bytesToHex(hashBuf);

    const registro = data.registros && data.registros[lookupId];
    if (!registro) {
      return null;
    }

    const salt = b64ToBytes(registro.s);
    const iv = b64ToBytes(registro.i);
    const ciphertext = b64ToBytes(registro.d);

    const baseKey = await window.crypto.subtle.importKey(
      "raw",
      secretBytes,
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const plainBuf = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      ciphertext
    );

    return JSON.parse(new TextDecoder().decode(plainBuf));
  }

  lookupForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const grupoId = groupSelect.value.trim();
    const codigo = codeInput.value.trim().toUpperCase();

    if (!grupoId) {
      showError("Por favor selecciona tu grupo.");
      groupSelect.focus();
      return;
    }
    if (!codigo) {
      showError("Por favor ingresa tu código único.");
      codeInput.focus();
      return;
    }

    const grupo = data.grupos.find((g) => g.id === grupoId);
    if (!grupo) {
      showError("Grupo no encontrado.");
      return;
    }

    try {
      const est = await buscarYDescifrarEstudiante(grupoId, codigo);
      if (!est) {
        showError(
          `No se encontró ningún estudiante con el código "${codigo}" en el grupo ${grupoId}. Verifica que el grupo y el código sean correctos.`
        );
        return;
      }
      renderStudent(grupo, est);
    } catch (err) {
      showError(err.message || "Error al verificar el código.");
    }
  });

  document.getElementById("printBtn").addEventListener("click", () => window.print());

  document.getElementById("resetBtn").addEventListener("click", () => {
    resultSection.classList.add("hidden");
    codeInput.value = "";
    clearError();
    codeInput.focus();
  });
})();
