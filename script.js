
const SUPABASE_URL = "https://gqefwgxiqwhrrtnjzkak.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_mEf7EL4FPOu3sHrbkL48fA_Q2fHCHS7";

const WHATSAPP_NUMBER = "916239750615";

// Connect Supabase
const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// HTML elements
const bookingForm = document.getElementById("bookingForm");
const bookingStatus = document.getElementById("bookingStatus");
const submitBooking = document.getElementById("submitBooking");

const loginModal = document.getElementById("loginModal");
const showAdminLogin = document.getElementById("showAdminLogin");
const closeLogin = document.getElementById("closeLogin");

const loginForm = document.getElementById("loginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const loginStatus = document.getElementById("loginStatus");

const adminDashboard = document.getElementById("adminDashboard");
const logoutButton = document.getElementById("logoutButton");

const totalRequests = document.getElementById("totalRequests");
const pendingRequests = document.getElementById("pendingRequests");
const completedRequests = document.getElementById("completedRequests");

const refreshRequests = document.getElementById("refreshRequests");
const requestsList = document.getElementById("requestsList");
const dashboardStatus = document.getElementById("dashboardStatus");


// Show messages
function showMessage(element, message, type = "success") {
  if (!element) return;

  element.textContent = message;
  element.className = "status-message " + type;
}


// Open admin login
if (showAdminLogin) {
  showAdminLogin.addEventListener("click", () => {
    loginModal.style.display = "flex";
  });
}


// Close admin login
if (closeLogin) {
  closeLogin.addEventListener("click", () => {
    loginModal.style.display = "none";
  });
}


// Close modal when clicking outside
if (loginModal) {
  loginModal.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      loginModal.style.display = "none";
    }
  });
}


// Service selection from service cards
document.querySelectorAll("[data-service]").forEach((button) => {
  button.addEventListener("click", () => {
    const serviceType = button.dataset.service;
    const serviceSelect = document.getElementById("serviceType");

    if (serviceSelect) {
      serviceSelect.value = serviceType;
    }

    bookingForm?.scrollIntoView({
      behavior: "smooth"
    });
  });
});


// Customer booking submission
if (bookingForm) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitBooking) {
      submitBooking.disabled = true;
      submitBooking.textContent = "Submitting...";
    }

    showMessage(bookingStatus, "Please wait, submitting your request...");

    const customerName =
      document.getElementById("customerName").value.trim();

    const customerPhone =
      document.getElementById("customerPhone").value.trim();

    const customerAddress =
      document.getElementById("customerAddress").value.trim();

    const serviceType =
      document.getElementById("serviceType").value;

    const customerMessage =
      document.getElementById("customerMessage").value.trim();

    if (!/^[0-9]{10}$/.test(customerPhone)) {
      showMessage(
        bookingStatus,
        "Please enter a valid 10-digit phone number.",
        "error"
      );

      if (submitBooking) {
        submitBooking.disabled = false;
        submitBooking.textContent = "Submit Request";
      }

      return;
    }

    const bookingData = {
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      service_type: serviceType,
      customer_message: customerMessage
    };

    try {
      const { data, error } = await db
        .from("service_requests")
        .insert([bookingData])
        .select();

      if (error) throw error;

      showMessage(
        bookingStatus,
        "Your booking request has been submitted successfully!"
      );

      // WhatsApp booking message
      const whatsappMessage =
        `*NEW BOOKING - CHAWLA SECURITY SYSTEM*%0A%0A` +
        `Customer: ${customerName}%0A` +
        `Phone: ${customerPhone}%0A` +
        `Address: ${customerAddress}%0A` +
        `Service: ${serviceType}%0A` +
        `Message: ${customerMessage || "No additional message"}`;

      const whatsappURL =
        `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

      window.open(whatsappURL, "_blank");

      bookingForm.reset();

    } catch (error) {
      console.error("Booking error:", error);

      showMessage(
        bookingStatus,
        "Booking failed. Please try again or contact us on WhatsApp.",
        "error"
      );

    } finally {
      if (submitBooking) {
        submitBooking.disabled = false;
        submitBooking.textContent = "Submit Request";
      }
    }
  });
}


// Admin login
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    showMessage(loginStatus, "Checking login details...");

    const email = adminEmail.value.trim();
    const password = adminPassword.value;

    try {
      const { data, error } = await db.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      showMessage(loginStatus, "Login successful!");

      loginModal.style.display = "none";
      loginForm.reset();

      await showDashboard();

    } catch (error) {
      console.error("Login error:", error);

      showMessage(
        loginStatus,
        "Invalid email or password. Please try again.",
        "error"
      );
    }
  });
}


// Show admin dashboard
async function showDashboard() {
  if (adminDashboard) {
    adminDashboard.hidden = false;
    adminDashboard.style.display = "block";
  }

  await loadRequests();

  adminDashboard?.scrollIntoView({
    behavior: "smooth"
  });
}


// Hide dashboard
function hideDashboard() {
  if (adminDashboard) {
    adminDashboard.hidden = true;
    adminDashboard.style.display = "none";
  }
}


// Load customer booking requests
async function loadRequests() {
  if (!requestsList) return;

  showMessage(dashboardStatus, "Loading customer requests...");

  requestsList.replaceChildren();

  try {
    const { data: requests, error } = await db
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const allRequests = requests || [];

    // Dashboard statistics
    if (totalRequests) {
      totalRequests.textContent = allRequests.length;
    }

    if (pendingRequests) {
      pendingRequests.textContent =
        allRequests.filter(r => r.status === "Pending").length;
    }

    if (completedRequests) {
      completedRequests.textContent =
        allRequests.filter(r => r.status === "Completed").length;
    }

    if (allRequests.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "No booking requests found yet.";
      requestsList.appendChild(emptyMessage);

      showMessage(dashboardStatus, "Dashboard is up to date.");
      return;
    }

    // Display requests
    allRequests.forEach((request) => {
      const card = document.createElement("div");
      card.className = "request-card";

      const heading = document.createElement("h3");
      heading.textContent = request.customer_name;

      const phone = document.createElement("p");
      phone.textContent = "Phone: " + request.customer_phone;

      const address = document.createElement("p");
      address.textContent = "Address: " + request.customer_address;

      const service = document.createElement("p");
      service.textContent = "Service: " + request.service_type;

      const message = document.createElement("p");
      message.textContent =
        "Message: " + (request.customer_message || "No message");

      const date = document.createElement("p");
      date.textContent =
        "Date: " + new Date(request.created_at).toLocaleString("en-IN");

      const statusLabel = document.createElement("label");
      statusLabel.textContent = "Booking Status: ";

      const statusSelect = document.createElement("select");

      ["Pending", "In Progress", "Completed"].forEach((status) => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        statusSelect.appendChild(option);
      });

      statusSelect.value = request.status;

      const updateButton = document.createElement("button");
      updateButton.type = "button";
      updateButton.textContent = "Update Status";

      updateButton.addEventListener("click", async () => {
        updateButton.disabled = true;
        updateButton.textContent = "Updating...";

        try {
          const { error } = await db
            .from("service_requests")
            .update({ status: statusSelect.value })
            .eq("id", request.id);

          if (error) throw error;

          showMessage(
            dashboardStatus,
            "Booking status updated successfully!"
          );

          await loadRequests();

        } catch (error) {
          console.error("Status update error:", error);

          showMessage(
            dashboardStatus,
            "Unable to update booking status.",
            "error"
          );

          updateButton.disabled = false;
          updateButton.textContent = "Update Status";
        }
      });

      statusLabel.appendChild(statusSelect);

      card.append(
        heading,
        phone,
        address,
        service,
        message,
        date,
        statusLabel,
        updateButton
      );

      requestsList.appendChild(card);
    });

    showMessage(dashboardStatus, "Dashboard is up to date.");

  } catch (error) {
    console.error("Dashboard error:", error);

    showMessage(
      dashboardStatus,
      "Unable to load requests. Please check your admin login.",
      "error"
    );
  }
}


// Refresh dashboard
if (refreshRequests) {
  refreshRequests.addEventListener("click", loadRequests);
}


// Admin logout
if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    const { error } = await db.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      showMessage(dashboardStatus, "Logout failed.", "error");
      return;
    }

    hideDashboard();

    showMessage(loginStatus, "You have logged out successfully.");
  });
}


// Restore admin session after page refresh
async function restoreAdminSession() {
  const { data, error } = await db.auth.getSession();

  if (error) {
    console.error("Session error:", error);
    return;
  }

  if (data.session) {
    await showDashboard();
  } else {
    hideDashboard();
  }
}


// Start website
document.addEventListener("DOMContentLoaded", () => {
  restoreAdminSession();
});


