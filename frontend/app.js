(function () {
  const state = {
    apiBase: localStorage.getItem("lmsApiBase") || "http://localhost:5000",
    token: localStorage.getItem("lmsToken") || "",
    user: JSON.parse(localStorage.getItem("lmsUser") || "null"),
    view: "books",
    categories: [],
    books: []
  };

  const els = {
    apiBaseInput: document.getElementById("apiBaseInput"),
    authPanel: document.getElementById("authPanel"),
    loginForm: document.getElementById("loginForm"),
    logoutBtn: document.getElementById("logoutBtn"),
    refreshBtn: document.getElementById("refreshBtn"),
    sessionName: document.getElementById("sessionName"),
    sessionRole: document.getElementById("sessionRole"),
    toast: document.getElementById("toast"),
    viewTitle: document.getElementById("viewTitle"),
    booksList: document.getElementById("booksList"),
    booksCount: document.getElementById("booksCount"),
    bookSearchForm: document.getElementById("bookSearchForm"),
    categoryForm: document.getElementById("categoryForm"),
    bookForm: document.getElementById("bookForm"),
    bookCategorySelect: document.getElementById("bookCategorySelect"),
    historyList: document.getElementById("historyList"),
    overdueList: document.getElementById("overdueList"),
    membersList: document.getElementById("membersList"),
    notificationsList: document.getElementById("notificationsList"),
    inventoryReport: document.getElementById("inventoryReport"),
    borrowedReport: document.getElementById("borrowedReport"),
    activeMembersReport: document.getElementById("activeMembersReport"),
    overdueReport: document.getElementById("overdueReport")
  };

  const viewTitles = {
    books: "Books",
    borrow: "Borrow",
    members: "Members",
    notifications: "Notifications",
    reports: "Reports"
  };

  const demoAccounts = {
    librarian: {
      email: "librarian@example.com",
      password: "Password@123"
    },
    member: {
      email: "member@example.com",
      password: "Password@123"
    },
    late: {
      email: "late@example.com",
      password: "Password@123"
    }
  };

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const formatDate = (value) => {
    if (!value) {
      return "Not set";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Not set";
    }

    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatRole = (role) => {
    if (!role) {
      return "Guest";
    }

    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const isLibrarian = () => state.user && state.user.role === "librarian";
  const isMember = () => state.user && state.user.role === "member";

  const showToast = (message) => {
    els.toast.textContent = message;
    els.toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      els.toast.classList.remove("is-visible");
    }, 3500);
  };

  const setLoading = (target, message) => {
    target.innerHTML = `<div class="empty">${escapeHtml(message)}</div>`;
  };

  const setEmpty = (target, message) => {
    target.innerHTML = `<div class="empty">${escapeHtml(message)}</div>`;
  };

  const getFormValues = (form) => {
    const data = {};
    const formData = new FormData(form);

    for (const [key, value] of formData.entries()) {
      if (value === "") {
        continue;
      }

      data[key] = value;
    }

    return data;
  };

  const saveSession = ({ token, user }) => {
    state.token = token;
    state.user = user;
    localStorage.setItem("lmsToken", token);
    localStorage.setItem("lmsUser", JSON.stringify(user));
    renderSession();
  };

  const clearSession = () => {
    state.token = "";
    state.user = null;
    localStorage.removeItem("lmsToken");
    localStorage.removeItem("lmsUser");
    renderSession();
  };

  const normalizeApiBase = () => {
    state.apiBase = els.apiBaseInput.value.trim().replace(/\/$/, "");
    localStorage.setItem("lmsApiBase", state.apiBase);
    return state.apiBase;
  };

  const api = async (path, options = {}) => {
    const headers = {
      ...(options.headers || {})
    };

    if (state.token) {
      headers.Authorization = `Bearer ${state.token}`;
    }

    if (options.body && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${normalizeApiBase()}${path}`, {
      ...options,
      headers,
      body: options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body
    });

    if (response.status === 204) {
      return null;
    }

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(json.message || `Request failed with status ${response.status}`);
    }

    return json;
  };

  const renderSession = () => {
    els.sessionName.textContent = state.user ? state.user.name : "Not logged in";
    els.sessionRole.textContent = state.user
      ? `${formatRole(state.user.role)} - ${state.user.email}`
      : "Use demo credentials";
    els.authPanel.classList.toggle("is-hidden", Boolean(state.user));
    els.logoutBtn.style.display = state.user ? "inline-flex" : "none";

    document.querySelectorAll(".librarian-only").forEach((node) => {
      node.classList.toggle("is-hidden", !isLibrarian());
    });

    document.querySelectorAll("[data-view='members'], [data-view='reports']").forEach((node) => {
      node.style.display = isLibrarian() ? "block" : "none";
    });

    if (!isLibrarian() && (state.view === "members" || state.view === "reports")) {
      switchView("books");
    }
  };

  const switchView = (view) => {
    state.view = view;
    els.viewTitle.textContent = viewTitles[view] || "Dashboard";

    document.querySelectorAll(".view").forEach((node) => {
      node.classList.toggle("is-visible", node.id === `${view}View`);
    });

    document.querySelectorAll(".nav-item").forEach((node) => {
      node.classList.toggle("is-active", node.dataset.view === view);
    });

    refreshCurrentView();
  };

  const buildQuery = (params) => {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, value);
      }
    });

    const query = search.toString();
    return query ? `?${query}` : "";
  };

  const loadCategories = async () => {
    const json = await api("/api/v1/categories");
    state.categories = json.data.categories || [];
    renderCategorySelect();
  };

  const renderCategorySelect = () => {
    if (!state.categories.length) {
      els.bookCategorySelect.innerHTML = "<option value=\"\">Create a category first</option>";
      return;
    }

    els.bookCategorySelect.innerHTML = state.categories.map((category) => (
      `<option value="${escapeHtml(category._id)}">${escapeHtml(category.name)}</option>`
    )).join("");
  };

  const loadBooks = async (params = {}) => {
    setLoading(els.booksList, "Loading books...");
    await loadCategories();
    const json = await api(`/api/v1/books${buildQuery(params)}`);
    state.books = json.data.books || [];
    renderBooks(state.books);
  };

  const renderBooks = (books) => {
    els.booksCount.textContent = books.length;

    if (!books.length) {
      setEmpty(els.booksList, "No books found.");
      return;
    }

    els.booksList.innerHTML = books.map((book) => {
      const availabilityClass = book.availableCopies > 0 ? "ok" : "danger";
      const availabilityText = book.availableCopies > 0 ? "Available" : "Unavailable";
      const categoryName = book.category && book.category.name ? book.category.name : "Uncategorized";
      const borrowButton = state.user && book.availableCopies > 0
        ? `<button class="secondary-button" type="button" data-action="borrow-book" data-id="${escapeHtml(book._id)}">Borrow</button>`
        : "";
      const deleteButton = isLibrarian()
        ? `<button class="danger-button" type="button" data-action="delete-book" data-id="${escapeHtml(book._id)}">Delete</button>`
        : "";

      return `
        <article class="data-item">
          <div class="data-item-header">
            <div>
              <h4>${escapeHtml(book.title)}</h4>
              <p>${escapeHtml(book.author)} - ISBN ${escapeHtml(book.isbn)}</p>
            </div>
            <span class="pill ${availabilityClass}">${availabilityText}</span>
          </div>
          <div class="meta-row">
            <span class="pill">${escapeHtml(categoryName)}</span>
            <span class="pill">${escapeHtml(book.availableCopies)} of ${escapeHtml(book.totalCopies)} copies</span>
            <span class="pill">Shelf ${escapeHtml(book.shelfLocation || "N/A")}</span>
          </div>
          <div class="item-actions">
            ${borrowButton}
            ${deleteButton}
          </div>
        </article>
      `;
    }).join("");
  };

  const borrowBook = async (bookId) => {
    if (!state.user) {
      showToast("Login before borrowing a book.");
      return;
    }

    const body = {};

    if (isLibrarian()) {
      const memberId = window.prompt("Enter member ID for this issue:");

      if (!memberId) {
        return;
      }

      body.memberId = memberId.trim();
    }

    await api(`/api/v1/borrows/${bookId}`, {
      method: "POST",
      body
    });

    showToast("Book borrowed successfully.");
    await loadBooks(getFormValues(els.bookSearchForm));
  };

  const deleteBook = async (bookId) => {
    if (!window.confirm("Delete this book from catalog?")) {
      return;
    }

    await api(`/api/v1/books/${bookId}`, {
      method: "DELETE"
    });

    showToast("Book deleted.");
    await loadBooks(getFormValues(els.bookSearchForm));
  };

  const loadHistory = async () => {
    if (!state.user) {
      setEmpty(els.historyList, "Login to view borrowing history.");
      return;
    }

    setLoading(els.historyList, "Loading history...");
    const json = await api("/api/v1/borrows/history");
    renderHistory(json.data.records || []);
  };

  const renderHistory = (records) => {
    if (!records.length) {
      setEmpty(els.historyList, "No borrowing records yet.");
      return;
    }

    els.historyList.innerHTML = records.map((record) => {
      const statusClass = record.status === "returned"
        ? "ok"
        : record.status === "overdue"
          ? "danger"
          : "warn";
      const bookTitle = record.book && record.book.title ? record.book.title : "Unknown book";
      const memberName = record.member && record.member.name ? record.member.name : "Member";
      const returnButton = record.status !== "returned"
        ? `<button class="secondary-button" type="button" data-action="return-book" data-id="${escapeHtml(record._id)}">Return</button>`
        : "";

      return `
        <article class="data-item">
          <div class="data-item-header">
            <div>
              <h4>${escapeHtml(bookTitle)}</h4>
              <p>${escapeHtml(memberName)}</p>
            </div>
            <span class="pill ${statusClass}">${escapeHtml(record.status)}</span>
          </div>
          <div class="meta-row">
            <span class="pill">Due ${escapeHtml(formatDate(record.dueDate))}</span>
            <span class="pill">Returned ${escapeHtml(formatDate(record.returnDate))}</span>
            <span class="pill">Fine ${escapeHtml(record.fine || 0)}</span>
          </div>
          <div class="item-actions">${returnButton}</div>
        </article>
      `;
    }).join("");
  };

  const returnBook = async (recordId) => {
    await api(`/api/v1/borrows/return/${recordId}`, {
      method: "PATCH",
      body: {}
    });

    showToast("Book returned successfully.");
    await loadHistory();

    if (isLibrarian()) {
      await loadOverdue();
    }
  };

  const loadOverdue = async () => {
    if (!isLibrarian()) {
      setEmpty(els.overdueList, "Overdue records are available to librarians.");
      return;
    }

    setLoading(els.overdueList, "Loading overdue records...");
    const json = await api("/api/v1/borrows/overdue");
    const records = json.data.records || [];

    if (!records.length) {
      setEmpty(els.overdueList, "No overdue records.");
      return;
    }

    els.overdueList.innerHTML = records.map((record) => {
      const bookTitle = record.book && record.book.title ? record.book.title : "Unknown book";
      const memberName = record.member && record.member.name ? record.member.name : "Member";

      return `
        <article class="data-item">
          <div class="data-item-header">
            <div>
              <h4>${escapeHtml(bookTitle)}</h4>
              <p>${escapeHtml(memberName)} - ${escapeHtml(record.member.email || "")}</p>
            </div>
            <span class="pill danger">Overdue</span>
          </div>
          <div class="meta-row">
            <span class="pill">Due ${escapeHtml(formatDate(record.dueDate))}</span>
            <span class="pill">Fine ${escapeHtml(record.fine || 0)}</span>
          </div>
        </article>
      `;
    }).join("");
  };

  const loadMembers = async () => {
    if (!isLibrarian()) {
      setEmpty(els.membersList, "Members are available to librarians.");
      return;
    }

    setLoading(els.membersList, "Loading members...");
    const json = await api("/api/v1/members");
    const members = json.data.members || [];

    if (!members.length) {
      setEmpty(els.membersList, "No members found.");
      return;
    }

    els.membersList.innerHTML = members.map((member) => `
      <article class="data-item">
        <div class="data-item-header">
          <div>
            <h4>${escapeHtml(member.name)}</h4>
            <p>${escapeHtml(member.email)} - ${escapeHtml(member.phone || "No phone")}</p>
          </div>
          <span class="pill ${member.membershipStatus === "active" ? "ok" : "warn"}">${escapeHtml(member.membershipStatus)}</span>
        </div>
        <div class="form-row">
          <label>
            <span>Status</span>
            <select data-member-status="${escapeHtml(member._id)}">
              <option value="active" ${member.membershipStatus === "active" ? "selected" : ""}>active</option>
              <option value="suspended" ${member.membershipStatus === "suspended" ? "selected" : ""}>suspended</option>
              <option value="expired" ${member.membershipStatus === "expired" ? "selected" : ""}>expired</option>
            </select>
          </label>
          <label>
            <span>Borrow Limit</span>
            <input data-member-limit="${escapeHtml(member._id)}" type="number" min="1" max="20" value="${escapeHtml(member.borrowLimit || 5)}">
          </label>
          <button class="secondary-button" type="button" data-action="save-member" data-id="${escapeHtml(member._id)}">Save</button>
        </div>
      </article>
    `).join("");
  };

  const saveMember = async (memberId) => {
    const status = document.querySelector(`[data-member-status="${memberId}"]`).value;
    const limit = Number(document.querySelector(`[data-member-limit="${memberId}"]`).value);

    await api(`/api/v1/members/${memberId}/status`, {
      method: "PATCH",
      body: {
        membershipStatus: status,
        borrowLimit: limit
      }
    });

    showToast("Member updated.");
    await loadMembers();
  };

  const loadNotifications = async () => {
    if (!state.user) {
      setEmpty(els.notificationsList, "Login to view notifications.");
      return;
    }

    setLoading(els.notificationsList, "Loading notifications...");
    const json = await api("/api/v1/notifications");
    const notifications = json.data.notifications || [];

    if (!notifications.length) {
      setEmpty(els.notificationsList, "No notifications.");
      return;
    }

    els.notificationsList.innerHTML = notifications.map((notification) => `
      <article class="data-item">
        <div class="data-item-header">
          <div>
            <h4>${escapeHtml(notification.title)}</h4>
            <p>${escapeHtml(notification.message)}</p>
          </div>
          <span class="pill ${notification.isRead ? "ok" : "warn"}">${notification.isRead ? "Read" : "Unread"}</span>
        </div>
        <div class="meta-row">
          <span class="pill">${escapeHtml(notification.type)}</span>
          <span class="pill">${escapeHtml(formatDate(notification.createdAt))}</span>
        </div>
        <div class="item-actions">
          ${notification.isRead ? "" : `<button class="secondary-button" type="button" data-action="read-notification" data-id="${escapeHtml(notification._id)}">Mark Read</button>`}
        </div>
      </article>
    `).join("");
  };

  const markNotificationRead = async (notificationId) => {
    await api(`/api/v1/notifications/${notificationId}/read`, {
      method: "PATCH"
    });
    showToast("Notification marked read.");
    await loadNotifications();
  };

  const loadReports = async () => {
    if (!isLibrarian()) {
      setEmpty(els.inventoryReport, "Reports are available to librarians.");
      setEmpty(els.borrowedReport, "Reports are available to librarians.");
      setEmpty(els.activeMembersReport, "Reports are available to librarians.");
      setEmpty(els.overdueReport, "Reports are available to librarians.");
      return;
    }

    setLoading(els.inventoryReport, "Loading inventory...");
    setLoading(els.borrowedReport, "Loading borrowed books...");
    setLoading(els.activeMembersReport, "Loading active members...");
    setLoading(els.overdueReport, "Loading overdue report...");

    const [inventory, mostBorrowed, activeMembers, overdue] = await Promise.all([
      api("/api/v1/reports/inventory-status"),
      api("/api/v1/reports/most-borrowed-books"),
      api("/api/v1/reports/active-members"),
      api("/api/v1/reports/overdue-records")
    ]);

    renderInventoryReport(inventory.data.summary);
    renderSimpleReport(
      els.borrowedReport,
      mostBorrowed.data.books || [],
      (book) => `${book.title} - ${book.author}`,
      (book) => `${book.borrowCount} borrows`
    );
    renderSimpleReport(
      els.activeMembersReport,
      activeMembers.data.members || [],
      (member) => `${member.name} - ${member.email}`,
      (member) => `${member.totalBorrows || 0} total, ${member.activeBorrows || 0} active`
    );
    renderSimpleReport(
      els.overdueReport,
      overdue.data.records || [],
      (record) => record.book && record.book.title ? record.book.title : "Unknown book",
      (record) => `${record.member && record.member.name ? record.member.name : "Member"} - due ${formatDate(record.dueDate)}`
    );
  };

  const renderInventoryReport = (summary) => {
    const safeSummary = summary || {
      totalTitles: 0,
      totalCopies: 0,
      availableCopies: 0,
      borrowedCopies: 0
    };

    els.inventoryReport.innerHTML = `
      <div class="metric"><strong>${escapeHtml(safeSummary.totalTitles)}</strong><span>Titles</span></div>
      <div class="metric"><strong>${escapeHtml(safeSummary.totalCopies)}</strong><span>Total copies</span></div>
      <div class="metric"><strong>${escapeHtml(safeSummary.availableCopies)}</strong><span>Available</span></div>
      <div class="metric"><strong>${escapeHtml(safeSummary.borrowedCopies)}</strong><span>Borrowed</span></div>
    `;
  };

  const renderSimpleReport = (target, rows, titleFn, metaFn) => {
    if (!rows.length) {
      setEmpty(target, "No report data yet.");
      return;
    }

    target.innerHTML = rows.map((row) => `
      <article class="data-item">
        <div>
          <h4>${escapeHtml(titleFn(row))}</h4>
          <p>${escapeHtml(metaFn(row))}</p>
        </div>
      </article>
    `).join("");
  };

  const refreshCurrentView = async () => {
    try {
      if (state.view === "books") {
        await loadBooks(getFormValues(els.bookSearchForm));
      } else if (state.view === "borrow") {
        await loadHistory();
        await loadOverdue();
      } else if (state.view === "members") {
        await loadMembers();
      } else if (state.view === "notifications") {
        await loadNotifications();
      } else if (state.view === "reports") {
        await loadReports();
      }
    } catch (error) {
      showToast(error.message);
    }
  };

  const registerEvents = () => {
    document.querySelectorAll(".nav-item").forEach((button) => {
      button.addEventListener("click", () => switchView(button.dataset.view));
    });

    els.apiBaseInput.addEventListener("change", () => {
      normalizeApiBase();
      refreshCurrentView();
    });

    els.refreshBtn.addEventListener("click", refreshCurrentView);
    document.getElementById("loadHistoryBtn").addEventListener("click", loadHistory);
    document.getElementById("loadOverdueBtn").addEventListener("click", loadOverdue);
    document.getElementById("loadMembersBtn").addEventListener("click", loadMembers);
    document.getElementById("loadNotificationsBtn").addEventListener("click", loadNotifications);

    els.loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const json = await api("/api/v1/auth/login", {
          method: "POST",
          body: getFormValues(els.loginForm)
        });

        saveSession({
          token: json.token,
          user: json.data.user
        });
        showToast("Login successful.");
        await refreshCurrentView();
      } catch (error) {
        showToast(error.message);
      }
    });

    document.querySelectorAll("[data-demo-login]").forEach((button) => {
      button.addEventListener("click", () => {
        const account = demoAccounts[button.dataset.demoLogin];
        els.loginForm.email.value = account.email;
        els.loginForm.password.value = account.password;
      });
    });

    els.logoutBtn.addEventListener("click", () => {
      clearSession();
      showToast("Signed out.");
      refreshCurrentView();
    });

    els.bookSearchForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await loadBooks(getFormValues(els.bookSearchForm));
    });

    els.categoryForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        await api("/api/v1/categories", {
          method: "POST",
          body: getFormValues(els.categoryForm)
        });
        els.categoryForm.reset();
        showToast("Category saved.");
        await loadCategories();
      } catch (error) {
        showToast(error.message);
      }
    });

    els.bookForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        const body = getFormValues(els.bookForm);
        body.totalCopies = Number(body.totalCopies);

        await api("/api/v1/books", {
          method: "POST",
          body
        });
        els.bookForm.reset();
        showToast("Book saved.");
        await loadBooks(getFormValues(els.bookSearchForm));
      } catch (error) {
        showToast(error.message);
      }
    });

    document.body.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-action]");

      if (!button) {
        return;
      }

      try {
        const id = button.dataset.id;
        const action = button.dataset.action;

        if (action === "borrow-book") {
          await borrowBook(id);
        } else if (action === "delete-book") {
          await deleteBook(id);
        } else if (action === "return-book") {
          await returnBook(id);
        } else if (action === "save-member") {
          await saveMember(id);
        } else if (action === "read-notification") {
          await markNotificationRead(id);
        }
      } catch (error) {
        showToast(error.message);
      }
    });
  };

  const boot = async () => {
    if (window.location.protocol !== "file:" && !localStorage.getItem("lmsApiBase")) {
      state.apiBase = window.location.port === "5000"
        ? window.location.origin
        : "http://localhost:5000";
    }

    els.apiBaseInput.value = state.apiBase;
    renderSession();
    registerEvents();
    await refreshCurrentView();
  };

  boot().catch((error) => {
    showToast(error.message);
  });
}());
