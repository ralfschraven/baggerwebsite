const loginForm = document.querySelector("[data-login-form]");
const loginStatus = document.querySelector("[data-login-status]");
const privateAdminPage = document.querySelector("[data-admin-private]");
const logoutButtons = document.querySelectorAll("[data-admin-logout]");
const tabButtons = document.querySelectorAll("[data-admin-tab]");
const tabPanels = document.querySelectorAll("[data-admin-panel]");
const contentForms = document.querySelectorAll("[data-content-form]");
const teamForm = document.querySelector("[data-team-form]");
const teamList = document.querySelector("[data-team-list]");
const openApplicationToggle = document.querySelector("[data-open-application-toggle]");
const openApplicationStatus = document.querySelector("[data-open-application-status]");

function adminSlugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function setStatus(element, message, isError = false) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

function initOpenApplicationSetting() {
  if (!openApplicationToggle) {
    return;
  }

  fetchJson("/api/jobs-settings")
    .then((settings) => {
      openApplicationToggle.checked = Boolean(settings?.showOpenApplication);
    })
    .catch((error) => setStatus(openApplicationStatus, error.message, true));

  openApplicationToggle.addEventListener("change", async () => {
    const previousValue = !openApplicationToggle.checked;
    openApplicationToggle.disabled = true;
    setStatus(openApplicationStatus, "Instelling opslaan...");

    try {
      const settings = await fetchJson("/api/jobs-settings", {
        method: "PUT",
        body: JSON.stringify({ showOpenApplication: openApplicationToggle.checked }),
      });

      openApplicationToggle.checked = Boolean(settings?.showOpenApplication);
      setStatus(
        openApplicationStatus,
        openApplicationToggle.checked ? "Open sollicitatie staat aan." : "Open sollicitatie staat uit.",
      );
    } catch (error) {
      openApplicationToggle.checked = previousValue;
      setStatus(openApplicationStatus, error.message, true);
    } finally {
      openApplicationToggle.disabled = false;
    }
  });
}

function escapeAdminHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Verzoek mislukt.");
  }

  return payload;
}

async function requireAdminSession() {
  if (!privateAdminPage) {
    return;
  }

  try {
    const session = await fetchJson("/api/auth/session");

    if (!session.authenticated) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
  } catch {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
}

function initLogin() {
  if (!loginForm) {
    return;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    setStatus(loginStatus, "Inloggen...");

    try {
      await fetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password"),
        }),
      });
      const next = new URLSearchParams(window.location.search).get("next") || "/projecten-beheer";
      window.location.href = next;
    } catch (error) {
      setStatus(loginStatus, error.message, true);
    }
  });
}

function initLogout() {
  logoutButtons.forEach((button) => button.addEventListener("click", async () => {
    await fetchJson("/api/auth/logout", { method: "POST", body: "{}" }).catch(() => null);
    window.location.href = "/login";
  }));
}

function initTabs() {
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.getAttribute("data-admin-tab");

      tabButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      tabPanels.forEach((panel) => {
        const isActive = panel.getAttribute("data-admin-panel") === target;
        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);
      });
    });
  });
}

function contentEditorValue(editor) {
  if (!editor) {
    return "";
  }

  const blocks = Array.from(editor.childNodes)
    .map((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || "";
      }

      return node.innerText ?? node.textContent ?? "";
    })
    .map((value) => value.replace(/\u00a0/g, " ").trim())
    .filter(Boolean);

  return blocks.join("\n\n");
}

function syncContentEditor(form) {
  const editor = form?.querySelector("[data-content-editor]");
  const valueField = form?.elements.namedItem("body");

  if (editor && valueField) {
    valueField.value = contentEditorValue(editor);
  }
}

function setContentEditorValue(form, value) {
  const editor = form?.querySelector("[data-content-editor]");

  if (!editor) {
    return;
  }

  const paragraphs = (Array.isArray(value) ? value : String(value || "").split(/\n\s*\n/g))
    .map((paragraph) => String(paragraph).trim())
    .filter(Boolean);

  editor.replaceChildren(
    ...paragraphs.map((paragraph) => {
      const element = document.createElement("p");
      element.textContent = paragraph;
      return element;
    }),
  );
}

function renderVacancyPreview(form) {
  const preview = form?.closest(".vacancy-editor-layout")?.querySelector("[data-vacancy-preview]");

  if (!preview) {
    return;
  }

  syncContentEditor(form);

  const readField = (name, fallback = "") => form.elements.namedItem(name)?.value?.trim() || fallback;
  const title = readField("title", "Nieuwe vacature");
  const category = readField("category", "Open sollicitatie");
  const excerpt = readField("excerpt", "De korte omschrijving verschijnt hier.");
  const workload = readField("workload", "Fulltime");
  const status = readField("status", "Open");
  const body = String(form.elements.namedItem("body")?.value || "")
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  preview.querySelector("[data-vacancy-preview-title]").textContent = title;
  preview.querySelector("[data-vacancy-preview-category]").textContent = category;
  preview.querySelector("[data-vacancy-preview-excerpt]").textContent = excerpt;
  preview.querySelector("[data-vacancy-preview-workload]").textContent = workload;
  preview.querySelector("[data-vacancy-preview-status]").textContent = status;

  const bodyElement = preview.querySelector("[data-vacancy-preview-body]");
  bodyElement.replaceChildren(
    ...(body.length ? body : ["De volledige vacaturetekst verschijnt hier zodra je begint te typen."])
      .map((paragraph) => {
        const element = document.createElement("p");
        element.textContent = paragraph;
        return element;
      }),
  );
}

function vacancyPreviewText(element) {
  return String(element?.innerText ?? element?.textContent ?? "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function syncVacancyPreviewField(form, element, commitSelect = false) {
  const fieldName = element?.getAttribute("data-vacancy-preview-field");
  const field = fieldName ? form.elements.namedItem(fieldName) : null;

  if (!field) {
    return;
  }

  const value = vacancyPreviewText(element);

  if (field instanceof HTMLSelectElement) {
    const option = Array.from(field.options).find(
      (item) => item.textContent.trim().toLowerCase() === value.toLowerCase(),
    );

    if (!option) {
      if (commitSelect) {
        element.textContent = field.options[field.selectedIndex]?.textContent || "";
      }
      return;
    }

    field.value = option.value;
  } else {
    field.value = value;
  }

  if (fieldName === "title" && form.dataset.slugManual !== "true") {
    const slugField = form.elements.namedItem("slug");

    if (slugField) {
      slugField.value = adminSlugify(value);
    }
  }
}

function setVacancyPreviewFullscreen(shell, isFullscreen) {
  const toggle = shell?.querySelector("[data-vacancy-preview-toggle]");

  if (!shell || !toggle) {
    return;
  }

  shell.classList.toggle("is-fullscreen", isFullscreen);
  document.body.classList.toggle("has-vacancy-preview-fullscreen", isFullscreen);
  toggle.setAttribute("aria-expanded", String(isFullscreen));
  toggle.textContent = isFullscreen ? "Sluiten" : "Volledig scherm";
}

function initVacancyPreview(form) {
  const layout = form.closest(".vacancy-editor-layout");
  const shell = layout?.querySelector(".vacancy-editor-preview-shell");
  const preview = shell?.querySelector("[data-vacancy-preview]");
  const toggle = shell?.querySelector("[data-vacancy-preview-toggle]");

  if (!shell || !preview || !toggle) {
    return;
  }

  toggle.addEventListener("click", () => {
    setVacancyPreviewFullscreen(shell, !shell.classList.contains("is-fullscreen"));
  });

  preview.addEventListener("keydown", (event) => {
    const editableField = event.target.closest("[data-vacancy-preview-field]");

    if (editableField && event.key === "Enter") {
      event.preventDefault();
      editableField.blur();
    }
  });

  preview.addEventListener("input", (event) => {
    const editableField = event.target.closest("[data-vacancy-preview-field]");

    if (editableField) {
      syncVacancyPreviewField(form, editableField);
      return;
    }

    const bodyElement = event.target.closest("[data-vacancy-preview-body]");

    if (!bodyElement) {
      return;
    }

    const valueField = form.elements.namedItem("body");
    const value = contentEditorValue(bodyElement);

    if (valueField) {
      valueField.value = value;
    }

    setContentEditorValue(form, value);
  });

  preview.addEventListener(
    "blur",
    (event) => {
      const editableField = event.target.closest("[data-vacancy-preview-field]");

      if (editableField) {
        syncVacancyPreviewField(form, editableField, true);
        return;
      }

      const bodyElement = event.target.closest("[data-vacancy-preview-body]");

      if (bodyElement) {
        syncContentEditor(form);
      }
    },
    true,
  );

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && shell.classList.contains("is-fullscreen")) {
      setVacancyPreviewFullscreen(shell, false);
    }
  });
}

function itemToForm(form, item) {
  form.dataset.editingSlug = item.slug || "";
  form.dataset.slugManual = "true";

  ["title", "slug", "date", "category", "workload", "status", "excerpt"].forEach((key) => {
    const field = form.elements.namedItem(key);

    if (field) {
      field.value = item[key] || "";
    }
  });

  const bodyField = form.elements.namedItem("body");

  if (bodyField) {
    bodyField.value = Array.isArray(item.body) ? item.body.join("\n\n") : String(item.body || "");
  }

  setContentEditorValue(form, item.body || "");
  renderVacancyPreview(form);
}

function resetContentForm(form) {
  form.reset();
  form.dataset.editingSlug = "";
  form.dataset.slugManual = "";
  setContentEditorValue(form, "");

  const dateField = form.elements.namedItem("date");

  if (dateField) {
    dateField.value = new Date().toISOString().slice(0, 10);
  }

  renderVacancyPreview(form);
}

function renderContentList(type, label, items, form) {
  const list = document.querySelector(`[data-content-list="${type}"]`);

  if (!list) {
    return;
  }

  if (!items.length) {
    list.innerHTML = `<div class="empty-state">Nog geen ${label.toLowerCase()} opgeslagen.</div>`;
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
        <article class="admin-project-item">
          <div class="blog-meta">
            <span class="pill">${escapeAdminHtml(item.category || label)}</span>
            <span class="pill">${escapeAdminHtml(item.status || "Concept")}</span>
          </div>
          <h3>${escapeAdminHtml(item.title)}</h3>
          <p>${escapeAdminHtml(item.excerpt || "Geen omschrijving.")}</p>
          <div class="admin-project-actions">
            <button class="button-ghost" type="button" data-content-edit="${escapeAdminHtml(item.slug)}">Bewerk</button>
            <button class="button-ghost button-danger" type="button" data-content-delete="${escapeAdminHtml(item.slug)}">Verwijder</button>
          </div>
        </article>
      `,
    )
    .join("");

  list.onclick = async (event) => {
    const editButton = event.target.closest("[data-content-edit]");
    const deleteButton = event.target.closest("[data-content-delete]");

    if (editButton) {
      const item = items.find((entry) => entry.slug === editButton.getAttribute("data-content-edit"));

      if (item) {
        itemToForm(form, item);
        setStatus(form.querySelector("[data-content-status]"), `Je bewerkt nu "${item.title}".`);
        const editor = form.querySelector("[data-content-editor]");
        const focusTarget = editor || form;
        window.scrollTo({ top: focusTarget.getBoundingClientRect().top + window.scrollY - 140, behavior: "smooth" });
        editor?.focus({ preventScroll: true });
      }
    }

    if (deleteButton) {
      const slug = deleteButton.getAttribute("data-content-delete");
      const confirmed = window.confirm(`Weet je zeker dat je deze ${label.toLowerCase()} wilt verwijderen?`);

      if (!confirmed) {
        return;
      }

      await fetchJson(`/api/${type}/${encodeURIComponent(slug)}`, { method: "DELETE" });
      await refreshContent(type, label, form);
    }
  };
}

async function refreshContent(type, label, form) {
  const items = await fetchJson(`/api/${type}`);
  renderContentList(type, label, items, form);
}

function initContentForms() {
  contentForms.forEach((form) => {
    const type = form.getAttribute("data-content-type");
    const label = form.getAttribute("data-content-label") || "Item";
    const status = form.querySelector("[data-content-status]");
    const titleField = form.elements.namedItem("title");
    const slugField = form.elements.namedItem("slug");
    const contentEditor = form.querySelector("[data-content-editor]");

    resetContentForm(form);
    refreshContent(type, label, form).catch((error) => setStatus(status, error.message, true));

    contentEditor?.addEventListener("input", () => syncContentEditor(form));

    if (form.matches("[data-vacancy-editor-form]")) {
      const updatePreview = () => renderVacancyPreview(form);
      form.addEventListener("input", updatePreview);
      form.addEventListener("change", updatePreview);
      initVacancyPreview(form);
    }

    titleField?.addEventListener("input", () => {
      if (form.dataset.slugManual === "true") {
        return;
      }

      slugField.value = adminSlugify(titleField.value);
    });

    slugField?.addEventListener("input", () => {
      form.dataset.slugManual = slugField.value.trim() ? "true" : "";
    });

    form.querySelector("[data-content-reset]")?.addEventListener("click", () => {
      resetContentForm(form);
      setStatus(status, `Klaar voor een nieuw ${label.toLowerCase()}.`);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      syncContentEditor(form);
      const formData = new FormData(form);
      const editingSlug = form.dataset.editingSlug;
      const method = editingSlug ? "PUT" : "POST";
      const url = editingSlug ? `/api/${type}/${encodeURIComponent(editingSlug)}` : `/api/${type}`;

      setStatus(status, "Bezig met opslaan...");

      try {
        await fetchJson(url, {
          method,
          body: JSON.stringify({
            title: formData.get("title"),
            slug: formData.get("slug"),
            date: formData.get("date"),
            category: formData.get("category"),
            workload: formData.get("workload"),
            status: formData.get("status"),
            excerpt: formData.get("excerpt"),
            body: formData.get("body"),
          }),
        });

        resetContentForm(form);
        setStatus(status, editingSlug ? `${label} bijgewerkt.` : `${label} toegevoegd.`);
        await refreshContent(type, label, form);
      } catch (error) {
        setStatus(status, error.message, true);
      }
    });
  });
}

function resetTeamForm() {
  if (!teamForm) {
    return;
  }

  teamForm.reset();
  teamForm.dataset.editingSlug = "";

  const imageField = teamForm.elements.namedItem("image");
  const preview = teamForm.querySelector("[data-team-photo-preview]");

  if (imageField) {
    imageField.value = "";
  }

  if (preview) {
    preview.hidden = true;
    preview.removeAttribute("src");
    preview.alt = "";
  }
}

function renderTeamList(items) {
  if (!teamList) {
    return;
  }

  if (!items.length) {
    teamList.innerHTML = '<div class="empty-state">Nog geen teamleden opgeslagen.</div>';
    return;
  }

  teamList.innerHTML = items
    .map(
      (item) => `
        <article class="admin-project-item team-admin-item">
          <img src="${escapeAdminHtml(item.image)}" alt="" loading="lazy" />
          <h3>${escapeAdminHtml(item.name)}</h3>
          <p>${escapeAdminHtml(item.role)}</p>
          <div class="admin-project-actions">
            <button class="button-ghost" type="button" data-team-edit="${escapeAdminHtml(item.slug)}">Bewerk</button>
            <button class="button-ghost button-danger" type="button" data-team-delete="${escapeAdminHtml(item.slug)}">Verwijder</button>
          </div>
        </article>
      `,
    )
    .join("");
}

async function refreshTeamList() {
  const items = await fetchJson("/api/team");
  renderTeamList(Array.isArray(items) ? items : []);
  return Array.isArray(items) ? items : [];
}

function teamItemToForm(item) {
  if (!teamForm) {
    return;
  }

  teamForm.dataset.editingSlug = item.slug || "";
  teamForm.elements.namedItem("name").value = item.name || "";
  teamForm.elements.namedItem("role").value = item.role || "";
  teamForm.elements.namedItem("linkedin").value = item.linkedin || "";
  teamForm.elements.namedItem("image").value = item.image || "";

  const preview = teamForm.querySelector("[data-team-photo-preview]");

  if (preview && item.image) {
    preview.src = item.image;
    preview.alt = item.name || "Teamfoto";
    preview.hidden = false;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("De foto kon niet worden gelezen.")));
    reader.readAsDataURL(file);
  });
}

async function uploadTeamImage(file) {
  if (typeof uploadImageFile === "function") {
    return uploadImageFile(file);
  }

  const data = await readFileAsDataUrl(file);
  const payload = await fetchJson("/api/uploads", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, type: file.type, data }),
  });

  return payload.url || payload.path;
}

function initTeamAdmin() {
  if (!teamForm || !teamList) {
    return;
  }

  const status = teamForm.querySelector("[data-team-status]");
  const photoUpload = teamForm.querySelector("[data-team-photo-upload]");
  const imageField = teamForm.elements.namedItem("image");
  const preview = teamForm.querySelector("[data-team-photo-preview]");

  resetTeamForm();
  refreshTeamList().catch((error) => setStatus(status, error.message, true));

  photoUpload?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setStatus(status, "Foto uploaden...");

    try {
      const imageUrl = await uploadTeamImage(file);
      imageField.value = imageUrl;
      preview.src = imageUrl;
      preview.alt = teamForm.elements.namedItem("name").value || "Teamfoto";
      preview.hidden = false;
      setStatus(status, "Foto toegevoegd. Je kunt het teamlid nu opslaan.");
    } catch (error) {
      setStatus(status, error.message, true);
    }
  });

  teamForm.querySelector("[data-team-reset]")?.addEventListener("click", () => {
    resetTeamForm();
    setStatus(status, "Klaar voor een nieuw teamlid.");
  });

  teamForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(teamForm);
    const editingSlug = teamForm.dataset.editingSlug;
    const method = editingSlug ? "PUT" : "POST";
    const url = editingSlug ? `/api/team/${encodeURIComponent(editingSlug)}` : "/api/team";

    setStatus(status, "Bezig met opslaan...");

    try {
      await fetchJson(url, {
        method,
        body: JSON.stringify({
          name: formData.get("name"),
          role: formData.get("role"),
          linkedin: formData.get("linkedin"),
          image: formData.get("image"),
        }),
      });

      resetTeamForm();
      setStatus(status, editingSlug ? "Teamlid bijgewerkt." : "Teamlid toegevoegd.");
      await refreshTeamList();
    } catch (error) {
      setStatus(status, error.message, true);
    }
  });

  teamList.addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-team-edit]");
    const deleteButton = event.target.closest("[data-team-delete]");

    if (editButton) {
      const items = await fetchJson("/api/team");
      const item = items.find((entry) => entry.slug === editButton.getAttribute("data-team-edit"));

      if (item) {
        teamItemToForm(item);
        setStatus(status, `Je bewerkt nu "${item.name}".`);
        window.scrollTo({ top: teamForm.getBoundingClientRect().top + window.scrollY - 140, behavior: "smooth" });
      }
    }

    if (deleteButton) {
      const slug = deleteButton.getAttribute("data-team-delete");

      if (!window.confirm("Weet je zeker dat je dit teamlid wilt verwijderen?")) {
        return;
      }

      try {
        await fetchJson(`/api/team/${encodeURIComponent(slug)}`, { method: "DELETE" });
        await refreshTeamList();
        setStatus(status, "Teamlid verwijderd.");
      } catch (error) {
        setStatus(status, error.message, true);
      }
    }
  });
}

requireAdminSession();
initLogin();
initLogout();
initTabs();
initContentForms();
initTeamAdmin();
initOpenApplicationSetting();
