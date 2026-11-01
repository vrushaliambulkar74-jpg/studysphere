// StudySphere frontend: college-based discovery and PDF sharing.
const API_BASE ="https://studysphere-1iz2.onrender.com/api/notes";
const SUPABASE_URL = "https://ssmqyimlaysseoyqkokx.supabase.co";
const STORAGE_BUCKET = "StudySphere-pdfs";

const sampleNotes = [
  { title:"Java Basics and OOP", college:"Others", course:"BTech", branch:"CSE", academicYear:"Second Year", semester:"4", subject:"Java Programming", type:"Sample Notes", description:"Introduction to Java, classes, objects, and inheritance.", fileName:"01_Java_Basics_and_OOP.pdf"},
  { title:"HTML and CSS Fundamentals", college:"Raisoni College", course:"BTech", branch:"IT", academicYear:"Third Year", semester:"5", subject:"Web Development", type:"Sample Notes", description:"HTML structure, CSS selectors, and responsive design.", fileName:"02_HTML_and_CSS_Fundamentals.pdf"},
  { title:"SQL and Normalization", college:"Government College", course:"BTech", branch:"Computer Science", academicYear:"Third Year", semester:"4", subject:"Database Management", type:"Sample Notes", description:"SQL queries, keys, and database normalization.", fileName:"03_SQL_and_Normalization.pdf"},
  { title:"Introduction to Machine Learning", college:"Raisoni Engineering College", course:"BTech", branch:"AI/ML", academicYear:"Fourth Year", semester:"7", subject:"Machine Learning", type:"Sample Notes", description:"Machine learning concepts, datasets, and model training.", fileName:"04_Introduction_to_Machine_Learning.pdf"},
  { title:"Java Practice Questions", college:"Government College", course:"BTech", branch:"IT", academicYear:"Second Year", semester:"4", subject:"Java Programming", type:"Sample Notes", description:"Beginner-friendly Java questions for exam preparation.", fileName:"05_Java_Practice_Questions.pdf"},
  { title:"Web Development Question Bank", college:"ABC Engineering College", course:"BTech", branch:"CSE", academicYear:"Second Year", semester:"3", subject:"Web Development", type:"Sample Notes", description:"Practice questions covering HTML, CSS, and JavaScript.", fileName:"06_Web_Development_Question_Bank.pdf"},
  { title:"DBMS Exam Preparation", college:"XYZ College", course:"BTech", branch:"CSE", academicYear:"Third Year", semester:"5", subject:"Database Management", type:"Sample Notes", description:"Revision questions about SQL, transactions, and keys.", fileName:"07_DBMS_Exam_Preparation.pdf"},
  { title:"Machine Learning Revision", college:"Government College", course:"BTech", branch:"AI/ML", academicYear:"Third Year", semester:"6", subject:"Machine Learning", type:"Sample Notes", description:"Revision of supervised and unsupervised learning.", fileName:"08_Machine_Learning_Revision.pdf" }
];
let notes = [...sampleNotes];
const $ = id => document.getElementById(id);
const collegeFilter = $("collegeFilter"), branchFilter = $("branchFilter"), semesterFilter = $("semesterFilter");
const subjectFilter = $("subjectFilter"), searchInput = $("searchInput"), notesContainer = $("notesContainer");
const resultCount = $("resultCount"), emptyMessage = $("emptyMessage");

function text(value) { return value == null || value === "" ? "Not specified" : String(value); }
function addMeta(card, label, value) {
  const p = document.createElement("p"); p.className = "metadata";
  const strong = document.createElement("strong"); strong.textContent = label + ": ";
  p.append(strong, document.createTextNode(text(value))); card.appendChild(p);
}
function makeButton(label, className, handler) {
  const button = document.createElement("button"); button.type = "button";
  button.textContent = label; button.className = className; button.addEventListener("click", handler); return button;
}
function displayNotes(items) {
  notesContainer.replaceChildren();
  items.forEach(note => {
    const card = document.createElement("article"); card.className = "card note-card";
    const title = document.createElement("h3"); title.textContent = text(note.title); card.appendChild(title);
    const badge = document.createElement("span"); badge.className = "note-type"; badge.textContent = note.type || (note.id ? "Uploaded PDF" : "Sample Notes"); card.appendChild(badge);
    const desc = document.createElement("p"); desc.textContent = note.description || "Student-shared study material."; card.appendChild(desc);
    addMeta(card, "College", note.college); addMeta(card, "Course", note.course);
    addMeta(card, "Branch", note.branch); addMeta(card, "Academic year", note.academicYear);
    addMeta(card, "Semester", note.semester); addMeta(card, "Subject", note.subject);
    const actions = document.createElement("div"); actions.className = "note-buttons";
    actions.appendChild(makeButton("View Details", "view-button", () => {
    if (!note.id && note.fileName) {
    const pdfUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${encodeURIComponent(note.fileName)}`;
    window.open(pdfUrl, "_blank", "noopener");
    return;
}

if (!note.id) {
    alert("PDF not available.");
    return;
}

window.open(
    `${API_BASE}/${encodeURIComponent(note.id)}/view`,
    "_blank",
    "noopener"
);
}));

if (note.fileName) {
    actions.appendChild(makeButton("Download PDF", "download-button", () => {
        const link = document.createElement("a");

        link.href = note.id
            ? `${API_BASE}/${encodeURIComponent(note.id)}/file`
            : `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${encodeURIComponent(note.fileName)}`;

        link.download = note.fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        link.remove();
    }));
}

// DELETE BUTTON FOR OWN NOTES ONLY
if (note.id && note.isOwner === true) {
    actions.appendChild(makeButton("Delete", "delete-button", async () => {
        if (!confirm("Are you sure you want to delete this note?")) return;

        try {
            const csrf = await getCsrfToken();

            const response = await fetch(`${API_BASE}/${encodeURIComponent(note.id)}`, {
                method: "DELETE",
                headers: {
                    [csrf.headerName]: csrf.token
                },
                credentials: "include"
            });

            const result = await response.json();

            if (response.ok) {
                alert("Note deleted successfully!");
                loadNotes();
            } else {
                alert(result.message || "Could not delete note.");
            }
        } catch (error) {
            alert("Could not connect to the server.");
        }
    }));
}
    card.appendChild(actions); notesContainer.appendChild(card);
  });
  resultCount.textContent = `Showing ${items.length} of ${notes.length} resources`;
  emptyMessage.hidden = items.length !== 0;
}
function filterNotes() {
  const college = collegeFilter.value.trim().toLowerCase();
  const branch = branchFilter.value, semester = semesterFilter.value, subject = subjectFilter.value;
  const query = searchInput.value.trim().toLowerCase();
  const filtered = notes.filter(n => {
    const all = [n.title,n.description,n.subject,n.type,n.college,n.course,n.branch,n.academicYear,n.semester].map(text).join(" ").toLowerCase();
    return (!college || text(n.college).toLowerCase().includes(college)) &&
      (!branch || text(n.branch) === branch) && (!semester || text(n.semester) === semester) &&
      (!subject || text(n.subject) === subject) && (!query || all.includes(query));
  });
  displayNotes(filtered);
}
async function loadNotes() {
  try {
    const response = await fetch(API_BASE, {
    credentials: "include"
});
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    const uploaded = await response.json();
    const mapped = uploaded.map(n => ({ ...n, semester:text(n.semester), type:"Uploaded PDF", description:"Student-uploaded PDF notes." }));
    notes = [...sampleNotes, ...mapped];
  } catch (err) {
    console.warn("Could not load backend notes; showing sample notes.", err);
    notes = [...sampleNotes];
  }
  filterNotes();
}
[ collegeFilter, branchFilter, semesterFilter, subjectFilter ].forEach(el => el.addEventListener("change", filterNotes));
$("searchButton").addEventListener("click", filterNotes);
searchInput.addEventListener("input", filterNotes);
searchInput.addEventListener("keydown", e => { if (e.key === "Enter") filterNotes(); });
$("resetButton").addEventListener("click", () => {
  collegeFilter.value = ""; branchFilter.value = ""; semesterFilter.value = ""; subjectFilter.value = ""; searchInput.value = ""; filterNotes();
});

const uploadForm = $("uploadForm"), uploadMessage = $("uploadMessage");
uploadForm.addEventListener("submit", async event => {
  event.preventDefault();
  const title = $("noteTitle").value.trim(), college = $("collegeName").value.trim();
  const course = $("courseName").value.trim(), branch = $("branchName").value.trim();
  const academicYear = $("academicYear").value, semester = $("semesterNumber").value;
  const subject = $("subjectName").value.trim(), file = $("noteFile").files[0];
  if (!file) { uploadMessage.textContent = "Please select a PDF file."; return; }
  if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) {
    uploadMessage.textContent = "Please select a valid PDF file."; return;
  }
  if (file.size > 10 * 1024 * 1024) { uploadMessage.textContent = "PDF must be 10 MB or smaller."; return; }
  const data = new FormData();
  Object.entries({ title, college, course, branch, academicYear, semester, subject }).forEach(([k,v]) => data.append(k,v));
  data.append("file", file);
  const submit = uploadForm.querySelector('button[type="submit"]'); submit.disabled = true;
  uploadMessage.style.color = "#5146c8"; uploadMessage.textContent = "Uploading your notes...";
  try {
    
     const csrf = await getCsrfToken();

const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: {
        [csrf.headerName]: csrf.token
    },
    body: data,
    credentials: "include"
});

const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || `Upload failed (${response.status})`);
    uploadMessage.style.color = "green"; uploadMessage.textContent = "PDF uploaded successfully! Your notes are now in the library.";
    uploadForm.reset(); await loadNotes();
  } catch (err) {
    uploadMessage.style.color = "#bc5050"; uploadMessage.textContent = "Upload failed: " + err.message + ". Check that the Spring Boot backend is running.";
  } finally { submit.disabled = false; }
});
loadNotes();

async function getCsrfToken() {
    const response = await fetch(
       "https://studysphere-1iz2.onrender.com/api/auth/csrf",
        { credentials: "include" }
    );

    if (!response.ok) {
        throw new Error("Could not obtain security token.");
    }

    const data = await response.json();

    return {
        token: data.token,
        headerName: data.headerName
    };
}

// REGISTER
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;
    const message = document.getElementById("registerMessage");

    try {
        const csrf = await getCsrfToken();

const response = await fetch(
    "https://studysphere-1iz2.onrender.com/api/auth/register",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            [csrf.headerName]: csrf.token
        },
        body: JSON.stringify({ email, password }),
        credentials: "include"
    }
);

        const result = await response.json();
        message.textContent = result.message || (response.ok ? "Account created!" : "Registration failed.");
    } catch {
        message.textContent = "Could not connect to the server.";
    }
});

// LOGIN
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const message = document.getElementById("loginMessage");

    try {
       const csrf = await getCsrfToken();

const response = await fetch(
    "https://studysphere-1iz2.onrender.com/api/auth/login",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            [csrf.headerName]: csrf.token
        },
        body: JSON.stringify({ email, password }),
        credentials: "include"
    }
);
        const result = await response.json();

        if (response.ok) {
    await getCsrfToken();
    message.textContent = "Login successful!";
    await checkLogin();
}else {
            message.textContent = result.message || "Login failed.";
        }
    } catch {
        message.textContent = "Could not connect to the server.";
    }
});

// CHECK LOGIN
async function checkLogin() {
    try {
        const response = await fetch("https://studysphere-1iz2.onrender.com/api/auth/me", {
            credentials: "include"
        });

        if (!response.ok) return;

        const user = await response.json();

        document.getElementById("authForms").hidden = true;
        document.getElementById("userAccount").hidden = false;
        document.getElementById("loggedInUser").textContent =
            "Logged in as " + user.email;
    } catch (error) {
        console.error("Login check failed:", error);
    }
}

// LOGOUT
document.getElementById("logoutButton")?.addEventListener("click", async () => {
    try {
        const csrf = await getCsrfToken();

        const response = await fetch(
            "https://studysphere-1iz2.onrender.com/api/auth/logout",
            {
                method: "POST",
                headers: {
                    [csrf.headerName]: csrf.token
                },
                credentials: "include"
            }
        );

        if (!response.ok) {
            throw new Error("Logout failed.");
        }

        document.getElementById("authForms").hidden = false;
        document.getElementById("userAccount").hidden = true;

        document.getElementById("loggedInUser").textContent = "";
        document.getElementById("loginMessage").textContent = "You have logged out.";

    } catch (error) {
        alert("Could not log out. Please try again.");
    }
});
checkLogin();
