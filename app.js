// -------------------- FIREBASE SETUP --------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Your Firebase configuration (from your Firebase console)
const firebaseConfig = {
    apiKey: "AIzaSyC5LnMmP7ZuO4dHP-vJVL-G0E_zb6cY-54",
    authDomain: "cbitracker-fff31.firebaseapp.com",
    projectId: "cbitracker-fff31",
    storageBucket: "cbitracker-fff31.firebasestorage.app",
    messagingSenderId: "864316481569",
    appId: "1:864316481569:web:ac2022ed33d860332e8360",
    measurementId: "G-KVDZ670GFF"
};

// -------------------- FIRESTORE FUNCTIONS --------------------

// Save to Firestore
async function saveEntry(entry) {
    await addDoc(collection(db, "entries"), entry);
    console.log("✅ Entry saved to Firestore!");
  }
  
  // Load all entries
  async function loadEntries() {
    const querySnapshot = await getDocs(collection(db, "entries"));
    const entries = [];
    querySnapshot.forEach((doc) => entries.push({ id: doc.id, ...doc.data() }));
    return entries;
  }
  
  // Update Firestore document
  async function updateEntry(id, updatedData) {
    const ref = doc(db, "entries", id);
    await updateDoc(ref, updatedData);
    console.log("✏️ Entry updated!");
  }
  
  // Delete Firestore document
  async function deleteEntry(id) {
    await deleteDoc(doc(db, "entries", id));
    console.log("🗑️ Entry deleted!");
  }
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ========== Initialization ==========
const form = document.getElementById("check-form");
const tableBody = document.querySelector("#entries-table tbody");
const searchInput = document.getElementById("search");
const filterStatus = document.getElementById("filter-status");
const sortBy = document.getElementById("sort-by");
const sumTotal = document.getElementById("sum-total");
const sumActual = document.getElementById("sum-actual");
const countEntries = document.getElementById("count-entries");

const clearAllBtn = document.getElementById("clear-all");
const importCSVInput = document.getElementById("import-csv");
const exportCSVBtn = document.getElementById("export-csv");

let entries = [];

async function initializeData() {
  const querySnapshot = await getDocs(collection(db, "entries"));
  querySnapshot.forEach((doc) => {
    entries.push({ id: doc.id, ...doc.data() });
  });
  renderTable();
}

initializeData();

// ========== Utility Functions ==========
async function saveEntries() {
    // Clear all documents and reupload everything
    const entriesRef = collection(db, "entries");
  
    // You can delete all old docs first if needed (optional)
    const snapshot = await getDocs(entriesRef);
    snapshot.forEach(async (docSnap) => {
      await deleteDoc(doc(db, "entries", docSnap.id));
    });
  
    // Add all new entries
    for (const entry of entries) {
      await addDoc(entriesRef, entry);
    }

    // Save locally as backup
    localStorage.setItem("checkbookEntries", JSON.stringify(entries));
  
    console.log("✅ All entries saved to Firestore!");
  }
  

function formatCurrency(num) {
  return parseFloat(num || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function formatDateLong(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// ========== Render Table ==========
function renderTable() {
  tableBody.innerHTML = "";

  let filtered = entries.filter(entry => {
    const term = searchInput.value.toLowerCase();
    const matchSearch =
      entry.checkNumber.toLowerCase().includes(term) ||
      entry.checkName.toLowerCase().includes(term) ||
      entry.clientPO.toLowerCase().includes(term) ||
      entry.remarks.toLowerCase().includes(term);
    const matchStatus = filterStatus.value === "all" || entry.status === filterStatus.value;
    return matchSearch && matchStatus;
  });

  // Sorting
  const [key, order] = sortBy.value.split("-");
  filtered.sort((a, b) => {
    if (key.includes("Date")) {
      return order === "asc"
        ? new Date(a[key]) - new Date(b[key])
        : new Date(b[key]) - new Date(a[key]);
    } else {
      return order === "asc" ? a[key] - b[key] : b[key] - a[key];
    }
  });

  // Render rows
  filtered.forEach((entry, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatDateLong(entry.clearingDate)}</td>
      <td>${formatDateLong(entry.checkDate)}</td>
      <td>${entry.checkNumber}</td>
      <td>${entry.checkName || "-"}</td>
      <td>${entry.category || ""} / ${entry.subcategory || ""}</td>
      <td>${entry.totalAmount ? formatCurrency(entry.totalAmount) : "-"}</td>
      <td>${entry.actualAmount ? formatCurrency(entry.actualAmount) : "-"}</td>
      <td>${entry.clientPO || "-"}</td>
      <td><span class="badge ${entry.status.replace(" ", "")}">${entry.status}</span></td>
      <td>${entry.remarks || "-"}</td>
      <td class="actions">
        <button class="small-btn" onclick="editEntry(${index})">Edit</button>
        <button class="small-btn danger" onclick="deleteEntry(${index})">Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Calculate totals
  const releasingChecks = entries.filter(e => e.status === "for releasing");
  const clearedChecks = entries.filter(e => e.status === "cleared");

  const releasingTotal = releasingChecks.reduce((sum, e) => sum + parseFloat(e.totalAmount || 0), 0);
  const clearedTotal = clearedChecks.reduce((sum, e) => sum + parseFloat(e.totalAmount || 0), 0);

  // Update displayed totals
  document.querySelector(".totals").innerHTML = `
    <strong>For Releasing Total:</strong> ₱${formatCurrency(releasingTotal)}
    &nbsp; | &nbsp;
    <strong>Cleared Total:</strong> ₱${formatCurrency(clearedTotal)}
    &nbsp; | &nbsp;
    <strong>Entries Displayed:</strong> <span id="count-entries">${filtered.length}</span>
  `;
}

// ========== Form Handling ==========
form.addEventListener("submit", e => {
  e.preventDefault();
  const entryId = document.getElementById("entry-id").value;
  const status = document.getElementById("status").value;

  // Validation: only check number required if status = "cancelled"
  const checkNumber = document.getElementById("check-number").value.trim();
  if (status === "cancelled" && !checkNumber) {
    alert("Please enter a Check Number for cancelled status.");
    return;
  }

  if (status !== "cancelled") {
    const requiredFields = [
      "check-date", "check-name",
      "total-amount", "actual-amount", "client-po", "category", "subcategory"
    ];
    for (const id of requiredFields) {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        alert("Please fill in all required fields before submitting.");
        return;
      }
    }
  }

  const newEntry = {
    clearingDate: document.getElementById("clearing-date").value,
    checkDate: document.getElementById("check-date").value,
    checkNumber,
    checkName: document.getElementById("check-name").value.trim(),
    totalAmount: parseFloat(document.getElementById("total-amount").value || 0),
    actualAmount: parseFloat(document.getElementById("actual-amount").value || 0),
    clientPO: document.getElementById("client-po").value.trim(),
    category: document.getElementById("category").value.trim(),
    subcategory: document.getElementById("subcategory").value.trim(),
    status,
    remarks: document.getElementById("remarks").value.trim()
  };

  if (entryId) {
    entries[entryId] = newEntry;
  } else {
    entries.push(newEntry);
  }

  await saveEntries();
  renderTable();
  form.reset();
  document.getElementById("entry-id").value = "";
  document.getElementById("form-title").textContent = "Add New Check";
});

// ========== Cancelled Status Field Behavior ==========
document.getElementById("status").addEventListener("change", function () {
  const status = this.value;
  const fields = [
    "clearing-date", "check-date", "check-name", "total-amount",
    "actual-amount", "client-po", "category", "subcategory", "remarks"
  ];
  if (status === "cancelled") {
    fields.forEach(id => {
      const el = document.getElementById(id);
      el.disabled = true;
      el.required = false;
      el.value = "";
    });
  } else {
    fields.forEach(id => {
      const el = document.getElementById(id);
      el.disabled = false;
    });
  }
});

document.getElementById("clear-form").addEventListener("click", () => {
  form.reset();
  document.getElementById("entry-id").value = "";
  document.getElementById("form-title").textContent = "Add New Check";
  const allFields = form.querySelectorAll("input, select, textarea");
  allFields.forEach(f => f.disabled = false);
});

function editEntry(index) {
  const e = entries[index];
  document.getElementById("entry-id").value = index;
  document.getElementById("clearing-date").value = e.clearingDate;
  document.getElementById("check-date").value = e.checkDate;
  document.getElementById("check-number").value = e.checkNumber;
  document.getElementById("check-name").value = e.checkName;
  document.getElementById("total-amount").value = e.totalAmount;
  document.getElementById("actual-amount").value = e.actualAmount;
  document.getElementById("client-po").value = e.clientPO;
  document.getElementById("category").value = e.category;
  document.getElementById("subcategory").value = e.subcategory;
  document.getElementById("status").value = e.status;
  document.getElementById("remarks").value = e.remarks;
  document.getElementById("form-title").textContent = "Edit Check Entry";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteEntry(index) {
  if (confirm("Delete this entry?")) {
    entries.splice(index, 1);
    await saveEntries();
    renderTable();
  }
}


// ========== Search, Filter, Sort ==========
searchInput.addEventListener("input", renderTable);
filterStatus.addEventListener("change", renderTable);
sortBy.addEventListener("change", renderTable);

// ========== Clear All ==========
clearAllBtn.addEventListener("click", () => {
  if (confirm("This will clear ALL stored data. Continue?")) {
    entries = [];
    saveEntries();
    renderTable();
  }
});

// ========== CSV Export ==========
exportCSVBtn.addEventListener("click", () => {
  const csvRows = [
    ["Clearing Date", "Check Date", "Check Number", "Check Name", "Total Amount", "Actual Amount", "Client PO", "Category", "Subcategory", "Status", "Remarks"],
    ...entries.map(e => [
      e.clearingDate, e.checkDate, e.checkNumber, e.checkName, e.totalAmount, e.actualAmount,
      e.clientPO, e.category, e.subcategory, e.status, e.remarks
    ])
  ];

  const csvContent = csvRows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "checkbook_data.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// ========== CSV Import ==========
importCSVInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = event => {
    const lines = event.target.result.split("\n").slice(1);
    lines.forEach(line => {
      const [clearingDate, checkDate, checkNumber, checkName, totalAmount, actualAmount, clientPO, category, subcategory, status, remarks] = line.split(",");
      if (checkNumber) {
        entries.push({
          clearingDate, checkDate, checkNumber, checkName,
          totalAmount: parseFloat(totalAmount || 0),
          actualAmount: parseFloat(actualAmount || 0),
          clientPO, category, subcategory, status, remarks
        });
      }
    });
    saveEntries();
    renderTable();
    importCSVInput.value = "";
  };
  reader.readAsText(file);
});

// ========== Initialize ==========
renderTable();


// ============================
// BACKUP & RESTORE FEATURE
// ============================
document.getElementById("backup-data").addEventListener("click", function () {
  const data = entries;
  if (data.length === 0) {
    alert("⚠️ No data to back up.");
    return;
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `CheckbookBackup_${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  alert("✅ Backup downloaded successfully!");
});

document.getElementById("restore-data").addEventListener("click", function () {
  document.getElementById("backup-file-input").click();
});

document.getElementById("backup-file-input").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const restoredData = JSON.parse(e.target.result);
      if (Array.isArray(restoredData)) {
        localStorage.setItem("checkbookEntries", JSON.stringify(restoredData));
        alert("✅ Data restored successfully! The page will reload.");
        location.reload();
      } else {
        alert("❌ Invalid file format. Make sure this is a valid backup file.");
      }
    } catch (err) {
      alert("❌ Error with the backup file.");
    }
  };
  reader.readAsText(file);
});
