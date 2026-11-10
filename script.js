
/* =====================================
   CHAWLA SECURITY SYSTEM
   Main JavaScript
===================================== */

// 1. SUPABASE CONFIGURATION
// Replace these two values after creating your Supabase project.

const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

// WhatsApp booking destination: Manager
const WHATSAPP_NUMBER = "916239750615";

let db = null;

if (
  window.supabase &&
  SUPABASE_URL.startsWith("https://") &&
  SUPABASE_ANON_KEY !== "YOUR_SUPABASE_PUBLISHABLE_KEY"
) {
  db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}


// 2. HELPER FUNCTIONS

function showMessage(elementId, message, isError = false) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = message;
  element.style.color = isError ? "#c0392b" : "#16865a";
}

function escapeText(value) {
  return String(value ?? "");
}

function formatDate(value) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}


// 3. SERVICE CARD SHORTCUTS

document.querySelectorAll("[data-service]").forEach(link => {
  link.addEventListener("click", () => {
    const service = link.dataset.service;
    document.getElementById("serviceType").value = service;
  });
});


// 4. CUSTOMER BOOKING FORM

const bookingForm = document.getElementById("bookingForm");

bookingForm.addEventListener("submit", async event => {
  event.preventDefault();

  const submitButton = document.getElementById("submitBooking");

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const address = document.getElementById("customerAddress").value.trim();
  const service = document.getElementById("serviceType").value;
  const message = document.getElementById("customerMessage").value.trim();

  if (!/^[0-9]{10}$/.test(phone)) {
    showMessage("bookingStatus", "Please enter a valid 10-digit mobile number.", true);
    return;
  }

  if (!name || !address || !service) {
    showMessage("bookingStatus", "Please complete all required fields.", true);
    return;
  }

  if (!db) {
    showMessage(
      "bookingStatus",
      "Database is not connected yet. Please contact us directly on WhatsApp.",
      true
    );

    const fallbackMessage =
      `Hello Chawla Security System!\n\n` +
      `Name: ${name}\nPhone: ${phone}\nAddress: ${address}\n` +
      `Service: ${service}\nRequirements: ${message || "Not provided"}`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(fallbackMessage)}`,
      "_blank",
      "noopener"
    );

    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  try {
    // Save booking to Supabase database.
    const { data, error } = await db
      .from("service_requests")
      .insert([{
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        service_type: service,
        customer_message: message,
        status: "Pending"
      }])
      .select("id")
      .single();

    if (error) throw error;

    const bookingMessage =
      `Hello Chawla Security System!\n\n` +
      `My service request has been submitted.\n\n` +
      `Booking ID: ${data.id}\n` +
      `Name: ${name}\n` +
      `Phone: ${phone}\n` +
      `Address: ${address}\n` +
      `Service: ${service}\n` +
      `Requirements: ${message || "Not provided"}\n\n` +
      `Please contact me regarding my booking.`;

    showMessage(
      "bookingStatus",
      "Booking saved successfully! Opening WhatsApp..."
    );

    bookingForm.reset();

    // Customer sends the booking message through WhatsApp.
    window.location.href =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(bookingMessage)}`;

  } catch (error) {
    console.error("Booking error:", error);

    showMessage(
      "bookingStatus",
      "Booking could not be saved. Please try again or contact us directly.",
      true
    );

  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Booking ↗";
  }
});


// 5. ADMIN LOGIN MODAL

const loginModal = document.getElementById("loginModal");

document.getElementById("showAdminLogin").addEventListener("click", () => {
  loginModal.hidden = false;
});

document.getElementById("closeLogin").addEventListener("click", () => {
  loginModal.hidden = true;
});

loginModal.addEventListener("click", event => {
  if (event.target === loginModal) {
    loginModal.hidden = true;
  }
});


// 6. ADMIN LOGIN

document.getElementById("loginForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!db) {
    showMessage(
      "loginStatus",
      "Please connect Supabase first.",
      true
    );
    return;
  }

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;

  showMessage("loginStatus", "Checking login...");

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showMessage("loginStatus", "Login failed. Check your email and password.", true);
    return;
  }

  loginModal.hidden = true;
  document.getElementById("adminDashboard").hidden = false;

  await loadRequests();
  document.getElementById("adminDashboard").scrollIntoView({
    behavior: "smooth"
  });
});


// 7. LOAD CUSTOMER REQUESTS

async function loadRequests() {
  if (!db) return;

  showMessage("dashboardStatus", "Loading requests...");

  const { data, error } = await db
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showMessage(
      "dashboardStatus",
      "Could not load requests. Check your database permissions.",
      true
    );
    return;
  }

  const requests = data || [];

  document.getElementById("totalRequests").textContent = requests.length;

  document.getElementById("pendingRequests").textContent =
    requests.filter(item => item.status === "Pending").length;

  document.getElementById("completedRequests").textContent =
    requests.filter(item => item.status === "Completed").length;

  const list = document.getElementById("requestsList");
  list.replaceChildren();

  if (requests.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No customer requests yet.";
    list.appendChild(empty);
  }

  requests.forEach(request => {
    const card = document.createElement("article");
    card.className = "request-card";

    const heading = document.createElement("h4");
    heading.textContent = request.customer_name;

    const details = document.createElement("div");

    const fields = [
      ["Booking ID", request.id],
      ["Phone", request.customer_phone],
      ["Address", request.customer_address],
      ["Service", request.service_type],
      ["Requirements", request.customer_message || "Not provided"],
      ["Submitted", formatDate(request.created_at)]
    ];

    fields.forEach(([label, value]) => {
      const p = document.createElement("p");
      p.textContent = `${label}: ${escapeText(value)}`;
      details.appendChild(p);
    });

    const status = document.createElement("p");
    status.textContent = `Current Status: ${request.status}`;

    const actions = document.createElement("div");
    actions.className = "request-actions";

    const select = document.createElement("select");

    ["Pending", "In Progress", "Completed"].forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });

    select.value = request.status;

    const updateButton = document.createElement("button");
    updateButton.className = "primary-btn";
    updateButton.textContent = "Update Status";

    updateButton.addEventListener("click", async () => {
      updateButton.disabled = true;

      const { error: updateError } = await db
        .from("service_requests")
        .update({ status: select.value })
        .eq("id", request.id);

      if (updateError) {
        showMessage("dashboardStatus", "Could not update request status.", true);
      } else {
        showMessage("dashboardStatus", "Request status updated successfully.");
        await loadRequests();
      }
    });

    actions.append(select, updateButton);
    card.append(heading, details, status, actions);
    list.appendChild(card);
  });

  showMessage("dashboardStatus", `${requests.length} requests loaded.`);
}


// 8. REFRESH DASHBOARD

document.getElementById("refreshRequests").addEventListener("click", loadRequests);


// 9. LOGOUT

document.getElementById("logoutButton").addEventListener("click", async () => {
  if (!db) return;

  const { error } = await db.auth.signOut();

  if (error) {
    showMessage("dashboardStatus", "Logout failed. Please try again.", true);
    return;
  }

  document.getElementById("adminDashboard").hidden = true;
  document.getElementById("loginForm").reset();
  document.getElementById("adminPassword").value = "";
  showMessage("loginStatus", "");
  document.getElementById("admin").scrollIntoView({
    behavior: "smooth"
  });
});


// 10. RESTORE ADMIN SESSION ON PAGE RELOAD

async function restoreAdminSession() {
  if (!db) return;

  const { data } = await db.auth.getSession();

  if (data.session) {
    document.getElementById("adminDashboard").hidden = false;
    await loadRequests();
  }
}

restoreAdminSession();

console.log("Chawla Security System website loaded.");
