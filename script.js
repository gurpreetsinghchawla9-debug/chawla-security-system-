
// ==========================================
// CHAWLA SECURITY SYSTEM
// Supabase Configuration
// ==========================================

const SUPABASE_URL = "https://gqefwgxiqwhrrtnjzkak.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_mEf7EL4FPOu3sHrbkL48fA_Q2fHCHS7";

const WHATSAPP_NUMBERS = [
  "917889153159", // Papa
  "916239750615"  // Gurpreet
];


// ==========================================
// CONNECT SUPABASE
// ==========================================

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ==========================================
// HTML ELEMENTS
// ==========================================

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


// ==========================================
// MESSAGE FUNCTION
// ==========================================

function showMessage(element, message, type = "success") {
  if (!element) return;

  element.textContent = message;
  element.className = "status-message " + type;
}


// ==========================================
// ADMIN LOGIN MODAL
// ==========================================

if (showAdminLogin && loginModal) {
  showAdminLogin.addEventListener("click", () => {
    loginModal.style.display = "flex";
  });
}

if (closeLogin && loginModal) {
  closeLogin.addEventListener("click", () => {
    loginModal.style.display = "none";
  });
}

if (loginModal) {
  loginModal.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      loginModal.style.display = "none";
    }
  });
}


// ==========================================
// SERVICE SELECTION
// ==========================================

document.querySelectorAll("[data-service]").forEach((button) => {
  button.addEventListener("click", () => {
    const serviceSelect = document.getElementById("serviceType");

    if (serviceSelect) {
      serviceSelect.value = button.dataset.service;
    }

    bookingForm?.scrollIntoView({
      behavior: "smooth"
    });
  });
});


// ==========================================
// CUSTOMER BOOKING SYSTEM
// ==========================================

if (bookingForm) {
  bookingForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (submitBooking) {
      submitBooking.disabled = true;
      submitBooking.textContent = "Submitting...";
    }

    showMessage(
      bookingStatus,
      "Submitting your booking request..."
    );

    const customerName =
      document.getElementById("customerName")?.value.trim();

    const customerPhone =
      document.getElementById("customerPhone")?.value.trim();

    const customerAddress =
      document.getElementById("customerAddress")?.value.trim();

    const serviceType =
      document.getElementById("serviceType")?.value;

    const customerMessage =
      document.getElementById("customerMessage")?.value.trim() || "";

    if (
      !customerName ||
      !customerPhone ||
      !customerAddress ||
      !serviceType
    ) {
      showMessage(
        bookingStatus,
        "Please fill all required fields.",
        "error"
      );

      if (submitBooking) {
        submitBooking.disabled = false;
        submitBooking.textContent = "Submit Request";
      }

      return;
    }

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
      // FIXED: INSERT ONLY - NO SELECT
      const { error } = await db
        .from("service_requests")
        .insert([bookingData]);

      if (error) {
        throw error;
      }

      showMessage(
        bookingStatus,
        "Booking submitted successfully! Opening WhatsApp..."
      );

      // WhatsApp message
      const whatsappMessage =
  `*NEW BOOKING - CHAWLA SECURITY SYSTEM*\n\n` +
  `Customer: ${customerName}\n` +
  `Phone: ${customerPhone}\n` +
  `Address: ${customerAddress}\n` +
  `Service: ${serviceType}\n` +
  `Message: ${customerMessage || "No additional message"}`;

const encodedMessage = encodeURIComponent(whatsappMessage);

window.open(
  `https://wa.me/917889153159?text=${encodedMessage}`,
  "_blank"
);

window.open(
  `https://wa.me/916239750615?text=${encodedMessage}`,
  "_blank"
);

      bookingForm.reset();

    } catch (error) {
      console.error("Booking submission error:", error);

      showMessage(
        bookingStatus,
        "Booking failed: " + (error.message || "Please try again."),
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


// ==========================================
// ADMIN LOGIN
// ==========================================

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    showMessage(loginStatus, "Checking login details...");

    const email = adminEmail.value.trim();
    const password = adminPassword.value;

    try {
      const { error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      loginModal.style.display = "none";
      loginForm.reset();

      showMessage(loginStatus, "Login successful!");

      await showDashboard();

    } catch (error) {
      console.error("Admin login error:", error);

      showMessage(
        loginStatus,
        "Invalid email or password. Please try again.",
        "error"
      );
    }
  });
}


// ==========================================
// ADMIN DASHBOARD
// ==========================================

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


function hideDashboard() {
  if (adminDashboard) {
    adminDashboard.hidden = true;
    adminDashboard.style.display = "none";
  }
}


// ==========================================
// LOAD CUSTOMER BOOKINGS
// ==========================================

async function loadRequests() {
  if (!requestsList) return;

  showMessage(dashboardStatus, "Loading requests...");

  requestsList.replaceChildren();

  try {
    const { data: requests, error } = await db
      .from("service_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const allRequests = requests || [];

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

      showMessage(dashboardStatus, "No bookings found.");
      return;
    }

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
            "Unable to update status: " + error.message,
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
    console.error("Dashboard loading error:", error);

    showMessage(
      dashboardStatus,
      "Unable to load bookings: " + error.message,
      "error"
    );
  }
}


// ==========================================
// REFRESH BOOKINGS
// ==========================================

if (refreshRequests) {
  refreshRequests.addEventListener("click", loadRequests);
}


// ==========================================
// ADMIN LOGOUT
// ==========================================

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    const { error } = await db.auth.signOut();

    if (error) {
      showMessage(
        dashboardStatus,
        "Logout failed: " + error.message,
        "error"
      );
      return;
    }

    hideDashboard();

    showMessage(
      loginStatus,
      "You have logged out successfully."
    );
  });
}


// ==========================================
// RESTORE ADMIN SESSION
// ==========================================

async function restoreAdminSession() {
  try {
    const { data, error } = await db.auth.getSession();

    if (error) throw error;

    if (data.session) {
      await showDashboard();
    } else {
      hideDashboard();
    }

  } catch (error) {
    console.error("Session error:", error);
  }
}


// ==========================================
// INITIALIZE WEBSITE
// ==========================================

restoreAdminSession();



