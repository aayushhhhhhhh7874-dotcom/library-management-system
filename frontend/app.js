(function () {
  const safeJsonParse = (value, fallback = null) => {
    try {
      return JSON.parse(value) || fallback;
    } catch (error) {
      return fallback;
    }
  };

  const defaultApiBase = window.location.protocol !== "file:" && window.location.port === "5000"
    ? window.location.origin
    : "http://localhost:5000";

  const state = {
    apiBase: localStorage.getItem("lmsApiBase") || defaultApiBase,
    token: localStorage.getItem("lmsToken") || "",
    user: safeJsonParse(localStorage.getItem("lmsUser")),
    view: "overview",
    categories: [],
    catalog: {
      page: 1,
      limit: 24,
      pages: 1,
      total: 0
    },
    issueBookId: null,
    loadingCount: 0
  };

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const elements = {
    authScreen: $("#authScreen"),
    appShell: $("#appShell"),
    authMessage: $("#authMessage"),
    loginForm: $("#loginForm"),
    signupForm: $("#signupForm"),
    apiBaseInput: $("#apiBaseInput"),
    toast: $("#toast"),
    loadingBar: $("#loadingBar"),
    sidebar: $(".sidebar"),
    viewTitle: $("#viewTitle"),
    viewKicker: $("#viewKicker"),
    profileInitials: $("#profileInitials"),
    profileName: $("#profileName"),
    profileRole: $("#profileRole"),
    notificationBadge: $("#notificationBadge"),
    apiStatusDot: $("#apiStatusDot"),
    apiStatusText: $("#apiStatusText"),
    apiStatusDetail: $("#apiStatusDetail"),
    overviewMetrics: $("#overviewMetrics"),
    recommendedBooks: $("#recommendedBooks"),
    overviewActivity: $("#overviewActivity"),
    catalogFilterForm: $("#catalogFilterForm"),
    catalogSearchInput: $("#catalogSearchInput"),
    categoryFilter: $("#categoryFilter"),
    catalogResultText: $("#catalogResultText"),
    bookGrid: $("#bookGrid"),
    pageStatus: $("#pageStatus"),
    previousPageButton: $("#previousPageButton"),
    nextPageButton: $("#nextPageButton"),
    historyList: $("#historyList"),
    notificationsList: $("#notificationsList"),
    membersList: $("#membersList"),
    reportMetrics: $("#reportMetrics"),
    mostBorrowedReport: $("#mostBorrowedReport"),
    activeMembersReport: $("#activeMembersReport"),
    overdueReport: $("#overdueReport"),
    bookDialog: $("#bookDialog"),
    bookForm: $("#bookForm"),
    bookCategorySelect: $("#bookCategorySelect"),
    profileDialog: $("#profileDialog"),
    profileForm: $("#profileForm"),
    issueDialog: $("#issueDialog"),
    issueForm: $("#issueForm"),
    issueMemberSelect: $("#issueMemberSelect")
  };

  const viewDetails = {
    overview: { title: "Overview", kicker: "Library workspace" },
    catalog: { title: "Catalog", kicker: "BTech CSE collection" },
    activity: { title: "My books", kicker: "Borrowing activity" },
    notifications: { title: "Notifications", kicker: "Library inbox" },
    members: { title: "Members", kicker: "Library administration" },
    reports: { title: "Reports", kicker: "Collection analytics" }
  };

  const demoAccounts = {
    librarian: { email: "librarian@example.com", password: "Password@123" },
    member: { email: "member@example.com", password: "Password@123" },
    late: { email: "late@example.com", password: "Password@123" }
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
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const titleCase = (value) => String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const getInitials = (name) => String(name || "Member")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const isLibrarian = () => state.user?.role === "librarian";
  const isMember = () => state.user?.role === "member";

  const getFormData = (form) => {
    const values = {};
    const formData = new FormData(form);

    formData.forEach((value, key) => {
      if (value !== "") {
        values[key] = typeof value === "string" ? value.trim() : value;
      }
    });

    return values;
  };

  const buildQuery = (params) => {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
        query.set(key, value);
      }
    });

    return query.toString() ? `?${query.toString()}` : "";
  };

  const showToast = (message, type = "success") => {
    elements.toast.textContent = message;
    elements.toast.className = `toast is-visible ${type}`;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      elements.toast.className = "toast";
    }, 3800);
  };

  const setAuthMessage = (message = "", type = "error") => {
    elements.authMessage.textContent = message;
    elements.authMessage.className = `form-message ${type === "success" ? "success" : ""}`;
  };

  const beginLoading = () => {
    state.loadingCount += 1;
    elements.loadingBar.className = "loading-bar is-loading";
  };

  const endLoading = () => {
    state.loadingCount = Math.max(0, state.loadingCount - 1);

    if (state.loadingCount === 0) {
      elements.loadingBar.className = "loading-bar is-complete";
      window.setTimeout(() => {
        elements.loadingBar.className = "loading-bar";
      }, 220);
    }
  };

  const saveSession = (token, user) => {
    state.token = token;
    state.user = user;
    localStorage.setItem("lmsToken", token);
    localStorage.setItem("lmsUser", JSON.stringify(user));
  };

  const clearSession = () => {
    state.token = "";
    state.user = null;
    localStorage.removeItem("lmsToken");
    localStorage.removeItem("lmsUser");
  };

  const setApiBase = () => {
    state.apiBase = (elements.apiBaseInput?.value || defaultApiBase).trim().replace(/\/$/, "") || defaultApiBase;
    if (elements.apiBaseInput) {
      elements.apiBaseInput.value = state.apiBase;
    }
    localStorage.setItem("lmsApiBase", state.apiBase);
  };

  const api = async (path, options = {}) => {
    beginLoading();

    try {
      const headers = { ...(options.headers || {}) };

      if (state.token) {
        headers.Authorization = `Bearer ${state.token}`;
      }

      if (options.body !== undefined) {
        headers["Content-Type"] = "application/json";
      }

      let response;
      try {
        response = await fetch(`${state.apiBase}${path}`, {
          ...options,
          headers,
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined
        });
      } catch (error) {
        throw new Error("Library server is not running. Start the local demo and try again.");
      }

      if (response.status === 204) {
        return null;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 && state.token) {
          clearSession();
          showAuth("login");
        }

        throw new Error(payload.message || `Request failed with status ${response.status}.`);
      }

      return payload;
    } finally {
      endLoading();
    }
  };

  const emptyState = (title, detail) => `
    <div class="empty-state">
      <div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span></div>
    </div>
  `;

  const loadingState = () => "<div class=\"loading-state\"></div>";

  const showAuth = (mode = "login") => {
    elements.authScreen.classList.remove("is-hidden");
    elements.appShell.classList.add("is-hidden");
    switchAuthMode(mode);
  };

  const switchAuthMode = (mode) => {
    const loginMode = mode === "login";
    elements.loginForm.classList.toggle("is-hidden", !loginMode);
    elements.signupForm.classList.toggle("is-hidden", loginMode);
    setAuthMessage();

    $$("[data-auth-mode]").forEach((button) => {
      const active = button.dataset.authMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
  };

  const renderRoleVisibility = () => {
    $$(".librarian-only").forEach((element) => {
      element.classList.toggle("is-hidden", !isLibrarian());
    });
    $$(".member-only").forEach((element) => {
      element.classList.toggle("is-hidden", !isMember());
    });
  };

  const renderProfile = () => {
    elements.profileInitials.textContent = getInitials(state.user?.name);
    elements.profileName.textContent = state.user?.name || "Member";
    elements.profileRole.textContent = isLibrarian()
      ? "Librarian"
      : `Semester ${state.user?.semester || "-"} student`;
  };

  const enterApp = async () => {
    elements.authScreen.classList.add("is-hidden");
    elements.appShell.classList.remove("is-hidden");
    renderRoleVisibility();
    renderProfile();
    await Promise.allSettled([
      checkHealth(),
      loadCategories(),
      updateNotificationBadge()
    ]);
    await switchView("overview");
  };

  const checkHealth = async () => {
    try {
      const result = await api("/health");
      elements.apiStatusDot.className = "online";
      elements.apiStatusText.textContent = "API online";
      elements.apiStatusDetail.textContent = new Date(result.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (error) {
      elements.apiStatusDot.className = "offline";
      elements.apiStatusText.textContent = "API offline";
      elements.apiStatusDetail.textContent = state.apiBase;
    }
  };

  const switchView = async (view) => {
    if ((view === "members" || view === "reports") && !isLibrarian()) {
      view = "overview";
    }

    state.view = view;
    const details = viewDetails[view];
    elements.viewTitle.textContent = details.title;
    elements.viewKicker.textContent = details.kicker;

    $$(".view").forEach((section) => {
      section.classList.toggle("is-visible", section.id === `${view}View`);
    });
    $$(".nav-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === view);
    });

    elements.sidebar.classList.remove("is-open");
    await loadCurrentView();
  };

  const loadCurrentView = async () => {
    try {
      if (state.view === "overview") {
        await loadOverview();
      } else if (state.view === "catalog") {
        await loadCatalog();
      } else if (state.view === "activity") {
        await loadHistory();
      } else if (state.view === "notifications") {
        await loadNotifications();
      } else if (state.view === "members") {
        await loadMembers();
      } else if (state.view === "reports") {
        await loadReports();
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const loadCategories = async () => {
    const payload = await api("/api/v1/categories");
    state.categories = payload.data.categories || [];

    const options = state.categories.map((category) => (
      `<option value="${escapeHtml(category._id)}">${escapeHtml(category.name)}</option>`
    )).join("");

    elements.categoryFilter.innerHTML = `<option value="">All subjects</option>${options}`;
    elements.bookCategorySelect.innerHTML = `<option value="">Select subject</option>${options}`;
  };

  const loadOverview = async () => {
    elements.overviewMetrics.innerHTML = loadingState();
    elements.recommendedBooks.innerHTML = loadingState();
    elements.overviewActivity.innerHTML = loadingState();

    const semester = isMember() && state.user.semester ? state.user.semester : 5;
    $("#welcomeTitle").textContent = `Good to see you, ${String(state.user.name).split(" ")[0]}.`;
    $("#welcomeText").textContent = isLibrarian()
      ? "The CSE collection and member desk are ready."
      : `Your semester ${semester} reading list is ready.`;
    $("#recommendationTitle").textContent = isLibrarian() ? "Recently added" : `Semester ${semester} picks`;

    const [allBooks, availableBooks, history, recommendations] = await Promise.all([
      api("/api/v1/books?limit=1"),
      api("/api/v1/books?limit=1&availability=available"),
      api("/api/v1/borrows/history?limit=5&sort=-createdAt"),
      api(`/api/v1/books?limit=4&availability=available&sort=-publishedYear${isLibrarian() ? "" : `&semester=${semester}`}`)
    ]);

    const records = history.data.records || [];
    const activeLoans = records.filter((record) => record.status !== "returned").length;
    const overdueLoans = records.filter((record) => record.status === "overdue").length;

    renderMetrics(elements.overviewMetrics, [
      { value: allBooks.pagination.total, label: "Catalog titles", note: "BTech CSE collection" },
      { value: availableBooks.pagination.total, label: "Available titles", note: "Ready to issue" },
      { value: state.categories.length, label: "Subject areas", note: "Across 8 semesters" },
      { value: activeLoans, label: isLibrarian() ? "Recent active loans" : "Your active loans", note: `${overdueLoans} overdue` }
    ]);

    renderCompactBooks(recommendations.data.books || []);
    renderOverviewActivity(records);
  };

  const renderMetrics = (target, metrics) => {
    target.innerHTML = metrics.map((metric) => `
      <div class="metric-item">
        <strong>${escapeHtml(metric.value ?? 0)}</strong>
        <span>${escapeHtml(metric.label)}</span>
        <em>${escapeHtml(metric.note || "")}</em>
      </div>
    `).join("");
  };

  const renderCompactBooks = (books) => {
    if (!books.length) {
      elements.recommendedBooks.innerHTML = emptyState("No recommendations", "Seed the catalog to see CSE titles here.");
      return;
    }

    elements.recommendedBooks.innerHTML = books.map((book) => `
      <article class="compact-book">
        <span class="mini-cover cover-semester-${escapeHtml(book.semester || 1)}">${escapeHtml(book.subjectCode || "CSE")}</span>
        <div><h3>${escapeHtml(book.title)}</h3><p>${escapeHtml(book.author)} - ${escapeHtml(book.availableCopies)} available</p></div>
        <button class="text-button" type="button" data-action="open-book" data-id="${escapeHtml(book._id)}">View</button>
      </article>
    `).join("");
  };

  const renderOverviewActivity = (records) => {
    if (!records.length) {
      elements.overviewActivity.innerHTML = emptyState("No loan activity", "Borrowed and returned books appear here.");
      return;
    }

    elements.overviewActivity.innerHTML = records.slice(0, 5).map((record) => `
      <article class="activity-row">
        <div><h3>${escapeHtml(record.book?.title || "Unknown book")}</h3><p>Due ${escapeHtml(formatDate(record.dueDate))}</p></div>
        <span class="status-pill ${escapeHtml(record.status)}">${escapeHtml(record.status)}</span>
      </article>
    `).join("");
  };

  const getCatalogFilters = () => {
    const filters = getFormData(elements.catalogFilterForm);
    return {
      ...filters,
      page: state.catalog.page,
      limit: state.catalog.limit
    };
  };

  const loadCatalog = async () => {
    elements.bookGrid.innerHTML = loadingState();

    if (!state.categories.length) {
      await loadCategories();
    }

    const payload = await api(`/api/v1/books${buildQuery(getCatalogFilters())}`);
    state.catalog.total = payload.pagination.total;
    state.catalog.pages = Math.max(1, payload.pagination.pages);
    state.catalog.page = payload.pagination.page;

    renderBooks(payload.data.books || []);
    elements.catalogResultText.textContent = `${state.catalog.total.toLocaleString()} titles found`;
    elements.pageStatus.textContent = `Page ${state.catalog.page} of ${state.catalog.pages}`;
    elements.previousPageButton.disabled = state.catalog.page <= 1;
    elements.nextPageButton.disabled = state.catalog.page >= state.catalog.pages;
  };

  const renderBooks = (books) => {
    if (!books.length) {
      elements.bookGrid.innerHTML = emptyState("No books match", "Change the subject, semester, or search terms.");
      return;
    }

    elements.bookGrid.innerHTML = books.map((book) => {
      const available = book.availableCopies > 0;
      const memberAction = isMember()
        ? `<button class="button button-primary" type="button" data-action="borrow-book" data-id="${escapeHtml(book._id)}" ${available ? "" : "disabled"}>Borrow</button>`
        : `<button class="button button-secondary" type="button" data-action="issue-book" data-id="${escapeHtml(book._id)}" ${available ? "" : "disabled"}>Issue</button>`;
      const deleteAction = isLibrarian()
        ? `<button class="button button-danger" type="button" data-action="delete-book" data-id="${escapeHtml(book._id)}">Delete</button>`
        : "";

      return `
        <article class="book-card">
          <div class="book-cover cover-semester-${escapeHtml(book.semester || 1)}">
            <span class="cover-code">${escapeHtml(book.subjectCode || "CSE")}</span>
            <span class="cover-semester">Semester ${escapeHtml(book.semester || "-")}</span>
          </div>
          <div class="book-card-body">
            <h3 title="${escapeHtml(book.title)}">${escapeHtml(book.title)}</h3>
            <p>${escapeHtml(book.author)}</p>
            <div class="book-meta">
              <span class="chip">${escapeHtml(book.edition || "Reference")}</span>
              <span class="status-pill ${available ? "available" : "unavailable"}">${available ? `${book.availableCopies} available` : "Checked out"}</span>
            </div>
            <p>${escapeHtml(book.publisher || "Academic Press")} - ${escapeHtml(book.publishedYear || "-")}</p>
          </div>
          <div class="book-card-actions">${memberAction}${deleteAction}</div>
        </article>
      `;
    }).join("");
  };

  const borrowBook = async (bookId, memberId) => {
    const body = memberId ? { memberId } : {};
    await api(`/api/v1/borrows/${bookId}`, { method: "POST", body });
    showToast(memberId ? "Book issued to member." : "Book borrowed successfully.");
    await Promise.all([loadCatalog(), updateNotificationBadge()]);
  };

  const openIssueDialog = async (bookId) => {
    const payload = await api("/api/v1/members?limit=100&membershipStatus=active&sort=name");
    const members = payload.data.members || [];

    if (!members.length) {
      showToast("No active members are available.", "error");
      return;
    }

    state.issueBookId = bookId;
    elements.issueMemberSelect.innerHTML = `<option value="">Select member</option>${members.map((member) => (
      `<option value="${escapeHtml(member._id)}">${escapeHtml(member.name)} - ${escapeHtml(member.studentId || member.email)}</option>`
    )).join("")}`;
    elements.issueForm.reset();
    elements.issueDialog.showModal();
  };

  const submitIssue = async () => {
    const body = getFormData(elements.issueForm);
    await api(`/api/v1/borrows/${state.issueBookId}`, { method: "POST", body });
    elements.issueDialog.close();
    state.issueBookId = null;
    showToast("Book issued to member.");
    await loadCatalog();
  };

  const deleteBook = async (bookId) => {
    if (!window.confirm("Delete this book from the catalog?")) {
      return;
    }

    await api(`/api/v1/books/${bookId}`, { method: "DELETE" });
    showToast("Book deleted.");
    await loadCatalog();
  };

  const openBookInCatalog = async (bookId) => {
    await switchView("catalog");
    const payload = await api(`/api/v1/books/${bookId}`);
    elements.catalogSearchInput.value = payload.data.book.title;
    state.catalog.page = 1;
    await loadCatalog();
  };

  const loadHistory = async () => {
    elements.historyList.innerHTML = loadingState();
    const status = $("#historyStatusFilter").value;
    const payload = await api(`/api/v1/borrows/history${buildQuery({ limit: 100, sort: "-createdAt", status })}`);
    const records = payload.data.records || [];

    if (!records.length) {
      elements.historyList.innerHTML = emptyState("No loan records", "Borrowed, overdue, and returned books appear here.");
      return;
    }

    elements.historyList.innerHTML = records.map((record) => `
      <article class="table-row">
        <div><h3>${escapeHtml(record.book?.title || "Unknown book")}</h3><p>${escapeHtml(record.book?.author || "")} ${isLibrarian() ? `- ${escapeHtml(record.member?.name || "Member")}` : ""}</p></div>
        <div><p>Issued</p><h3>${escapeHtml(formatDate(record.issueDate))}</h3></div>
        <div><p>Due</p><h3>${escapeHtml(formatDate(record.dueDate))}</h3></div>
        <div class="row-actions"><span class="status-pill ${escapeHtml(record.status)}">${escapeHtml(record.status)}</span>${record.status !== "returned" ? `<button class="button button-secondary" type="button" data-action="return-book" data-id="${escapeHtml(record._id)}">Return</button>` : ""}</div>
      </article>
    `).join("");
  };

  const returnBook = async (recordId) => {
    await api(`/api/v1/borrows/return/${recordId}`, { method: "PATCH", body: {} });
    showToast("Book returned successfully.");
    await Promise.all([loadHistory(), updateNotificationBadge()]);
  };

  const updateNotificationBadge = async () => {
    if (!state.token) {
      return;
    }

    try {
      const payload = await api("/api/v1/notifications?limit=100&isRead=false");
      const count = payload.pagination.total;
      elements.notificationBadge.textContent = count > 99 ? "99+" : count;
      elements.notificationBadge.classList.toggle("is-hidden", count === 0);
    } catch (error) {
      elements.notificationBadge.classList.add("is-hidden");
    }
  };

  const loadNotifications = async () => {
    elements.notificationsList.innerHTML = loadingState();
    const isRead = $("#notificationFilter").value;
    const payload = await api(`/api/v1/notifications${buildQuery({ limit: 100, isRead })}`);
    const notifications = payload.data.notifications || [];

    if (!notifications.length) {
      elements.notificationsList.innerHTML = emptyState("No notifications", "Borrow confirmations, reminders, and overdue alerts appear here.");
      return;
    }

    elements.notificationsList.innerHTML = notifications.map((notification) => `
      <article class="notification-row ${notification.isRead ? "" : "unread"}">
        <span class="notification-dot"></span>
        <div><h3>${escapeHtml(notification.title)}</h3><p>${escapeHtml(notification.message)} - ${escapeHtml(formatDate(notification.createdAt))}</p></div>
        ${notification.isRead ? `<span class="status-pill read">Read</span>` : `<button class="button button-secondary" type="button" data-action="read-notification" data-id="${escapeHtml(notification._id)}">Mark read</button>`}
      </article>
    `).join("");
  };

  const markNotificationRead = async (notificationId) => {
    await api(`/api/v1/notifications/${notificationId}/read`, { method: "PATCH" });
    await Promise.all([loadNotifications(), updateNotificationBadge()]);
  };

  const loadMembers = async () => {
    elements.membersList.innerHTML = loadingState();
    const search = $("#memberSearchInput").value.trim();
    const membershipStatus = $("#memberStatusFilter").value;
    const payload = await api(`/api/v1/members${buildQuery({ limit: 100, search, membershipStatus, sort: "name" })}`);
    const members = payload.data.members || [];

    if (!members.length) {
      elements.membersList.innerHTML = emptyState("No members found", "Change the search or status filter.");
      return;
    }

    elements.membersList.innerHTML = members.map((member) => `
      <article class="table-row">
        <div><h3>${escapeHtml(member.name)}</h3><p>${escapeHtml(member.email)} - ${escapeHtml(member.studentId || "No student ID")}</p></div>
        <div><p>Semester</p><h3>${escapeHtml(member.semester || "-")}</h3></div>
        <div><p>Joined</p><h3>${escapeHtml(formatDate(member.createdAt))}</h3></div>
        <div class="member-controls">
          <select data-member-status="${escapeHtml(member._id)}"><option value="active" ${member.membershipStatus === "active" ? "selected" : ""}>Active</option><option value="suspended" ${member.membershipStatus === "suspended" ? "selected" : ""}>Suspended</option><option value="expired" ${member.membershipStatus === "expired" ? "selected" : ""}>Expired</option></select>
          <input data-member-limit="${escapeHtml(member._id)}" type="number" min="1" max="20" value="${escapeHtml(member.borrowLimit || 5)}" aria-label="Borrow limit">
          <button class="button button-secondary" type="button" data-action="save-member" data-id="${escapeHtml(member._id)}">Save</button>
        </div>
      </article>
    `).join("");
  };

  const saveMember = async (memberId) => {
    const membershipStatus = $(`[data-member-status="${memberId}"]`).value;
    const borrowLimit = Number($(`[data-member-limit="${memberId}"]`).value);
    await api(`/api/v1/members/${memberId}/status`, {
      method: "PATCH",
      body: { membershipStatus, borrowLimit }
    });
    showToast("Member account updated.");
    await loadMembers();
  };

  const loadReports = async () => {
    elements.reportMetrics.innerHTML = loadingState();
    elements.mostBorrowedReport.innerHTML = loadingState();
    elements.activeMembersReport.innerHTML = loadingState();
    elements.overdueReport.innerHTML = loadingState();

    const [inventory, borrowed, members, overdue] = await Promise.all([
      api("/api/v1/reports/inventory-status"),
      api("/api/v1/reports/most-borrowed-books"),
      api("/api/v1/reports/active-members"),
      api("/api/v1/reports/overdue-records")
    ]);

    const summary = inventory.data.summary;
    renderMetrics(elements.reportMetrics, [
      { value: summary.totalTitles, label: "Titles", note: "Catalog size" },
      { value: summary.totalCopies, label: "Physical copies", note: "All inventory" },
      { value: summary.availableCopies, label: "Available copies", note: "On shelf" },
      { value: summary.borrowedCopies, label: "Borrowed copies", note: `${overdue.results || 0} overdue` }
    ]);
    renderRankList(elements.mostBorrowedReport, borrowed.data.books || [], (item) => item.title, (item) => `${item.borrowCount} borrows`);
    renderRankList(elements.activeMembersReport, members.data.members || [], (item) => item.name, (item) => `${item.totalBorrows || 0} total - ${item.activeBorrows || 0} active`);
    renderOverdueReport(overdue.data.records || []);
  };

  const renderRankList = (target, rows, titleFn, detailFn) => {
    if (!rows.length) {
      target.innerHTML = emptyState("No report data", "Borrowing activity will populate this report.");
      return;
    }

    target.innerHTML = rows.slice(0, 10).map((row, index) => `
      <article class="rank-row"><span class="rank-number">${index + 1}</span><div><h3>${escapeHtml(titleFn(row))}</h3><p>${escapeHtml(detailFn(row))}</p></div></article>
    `).join("");
  };

  const renderOverdueReport = (records) => {
    if (!records.length) {
      elements.overdueReport.innerHTML = emptyState("No overdue books", "All active loans are within their due dates.");
      return;
    }

    elements.overdueReport.innerHTML = records.map((record) => `
      <article class="table-row"><div><h3>${escapeHtml(record.book?.title || "Unknown book")}</h3><p>${escapeHtml(record.member?.name || "Member")} - ${escapeHtml(record.member?.email || "")}</p></div><div><p>Due</p><h3>${escapeHtml(formatDate(record.dueDate))}</h3></div><div><span class="status-pill overdue">Overdue</span></div><div></div></article>
    `).join("");
  };

  const openBookDialog = async () => {
    if (!state.categories.length) {
      await loadCategories();
    }
    elements.bookForm.reset();
    elements.bookDialog.showModal();
  };

  const saveBook = async () => {
    const body = getFormData(elements.bookForm);
    ["semester", "publishedYear", "totalCopies"].forEach((field) => {
      if (body[field] !== undefined) {
        body[field] = Number(body[field]);
      }
    });

    await api("/api/v1/books", { method: "POST", body });
    elements.bookDialog.close();
    showToast("Book added to the catalog.");
    state.catalog.page = 1;
    await loadCatalog();
  };

  const openProfileDialog = () => {
    elements.profileForm.name.value = state.user.name || "";
    elements.profileForm.phone.value = state.user.phone || "";
    elements.profileForm.address.value = state.user.address || "";
    if (isMember()) {
      elements.profileForm.semester.value = state.user.semester || 1;
    }
    elements.profileDialog.showModal();
  };

  const saveProfile = async () => {
    const body = getFormData(elements.profileForm);
    if (body.semester !== undefined) {
      body.semester = Number(body.semester);
    }
    const payload = await api("/api/v1/auth/me", { method: "PATCH", body });
    state.user = payload.data.user;
    localStorage.setItem("lmsUser", JSON.stringify(state.user));
    elements.profileDialog.close();
    renderProfile();
    showToast("Profile updated.");
    await loadOverview();
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthMessage();

    try {
      setApiBase();
      const payload = await api("/api/v1/auth/login", {
        method: "POST",
        body: getFormData(elements.loginForm)
      });
      saveSession(payload.token, payload.data.user);
      await enterApp();
      showToast("Signed in successfully.");
    } catch (error) {
      setAuthMessage(error.message);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setAuthMessage();

    const body = getFormData(elements.signupForm);
    if (body.password !== body.confirmPassword) {
      setAuthMessage("Passwords do not match.");
      return;
    }

    delete body.confirmPassword;
    body.role = "member";
    body.semester = Number(body.semester);
    body.enrollmentYear = Number(body.enrollmentYear);

    try {
      setApiBase();
      const payload = await api("/api/v1/auth/register", { method: "POST", body });
      saveSession(payload.token, payload.data.user);
      await enterApp();
      showToast("Account created and saved to the database.");
    } catch (error) {
      setAuthMessage(error.message);
    }
  };

  const registerEvents = () => {
    $$("[data-auth-mode]").forEach((button) => {
      button.addEventListener("click", () => switchAuthMode(button.dataset.authMode));
    });

    $$("[data-demo-account]").forEach((button) => {
      button.addEventListener("click", () => {
        const account = demoAccounts[button.dataset.demoAccount];
        elements.loginForm.email.value = account.email;
        elements.loginForm.password.value = account.password;
        elements.loginForm.requestSubmit();
      });
    });

    elements.loginForm.addEventListener("submit", handleLogin);
    elements.signupForm.addEventListener("submit", handleSignup);
    elements.apiBaseInput?.addEventListener("change", setApiBase);

    $$(".nav-button").forEach((button) => {
      button.addEventListener("click", () => switchView(button.dataset.view));
    });
    $$("[data-go-view]").forEach((button) => {
      button.addEventListener("click", () => switchView(button.dataset.goView));
    });

    $("#menuButton").addEventListener("click", () => elements.sidebar.classList.toggle("is-open"));
    $("#refreshButton").addEventListener("click", loadCurrentView);
    $("#globalSearchButton").addEventListener("click", async () => {
      await switchView("catalog");
      elements.catalogSearchInput.focus();
    });
    $("#profileButton").addEventListener("click", openProfileDialog);
    $("#logoutBtn").addEventListener("click", () => {
      clearSession();
      showAuth("login");
      showToast("Signed out.");
    });

    elements.catalogFilterForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      state.catalog.page = 1;
      await loadCatalog();
    });
    $("#clearFiltersButton").addEventListener("click", async () => {
      elements.catalogFilterForm.reset();
      state.catalog.page = 1;
      await loadCatalog();
    });
    elements.previousPageButton.addEventListener("click", async () => {
      state.catalog.page = Math.max(1, state.catalog.page - 1);
      await loadCatalog();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    elements.nextPageButton.addEventListener("click", async () => {
      state.catalog.page = Math.min(state.catalog.pages, state.catalog.page + 1);
      await loadCatalog();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    $("#historyStatusFilter").addEventListener("change", loadHistory);
    $("#notificationFilter").addEventListener("change", loadNotifications);
    $("#memberStatusFilter").addEventListener("change", loadMembers);
    $("#memberSearchInput").addEventListener("change", loadMembers);
    $("#addBookButton").addEventListener("click", openBookDialog);
    elements.bookForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await saveBook();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
    elements.profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await saveProfile();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
    elements.issueForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await submitIssue();
      } catch (error) {
        showToast(error.message, "error");
      }
    });

    $$('[data-close-dialog]').forEach((button) => {
      button.addEventListener("click", () => $(`#${button.dataset.closeDialog}`).close());
    });

    document.addEventListener("keydown", async (event) => {
      if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
        event.preventDefault();
        await switchView("catalog");
        elements.catalogSearchInput.focus();
      }
    });

    document.body.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) {
        return;
      }

      try {
        const { action, id } = button.dataset;
        if (action === "borrow-book") await borrowBook(id);
        if (action === "issue-book") await openIssueDialog(id);
        if (action === "delete-book") await deleteBook(id);
        if (action === "open-book") await openBookInCatalog(id);
        if (action === "return-book") await returnBook(id);
        if (action === "read-notification") await markNotificationRead(id);
        if (action === "save-member") await saveMember(id);
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  };

  const restoreSession = async () => {
    if (!state.token || !state.user) {
      showAuth("login");
      return;
    }

    try {
      const payload = await api("/api/v1/auth/me");
      state.user = payload.data.user;
      localStorage.setItem("lmsUser", JSON.stringify(state.user));
      await enterApp();
    } catch (error) {
      clearSession();
      showAuth("login");
    }
  };

  const boot = async () => {
    if (elements.apiBaseInput) {
      elements.apiBaseInput.value = state.apiBase;
    }
    registerEvents();
    await restoreSession();
  };

  boot().catch((error) => {
    setAuthMessage(error.message);
  });
}());
