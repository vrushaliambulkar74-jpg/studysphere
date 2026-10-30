// StudySphere frontend: college-based discovery and PDF sharing.
const API_BASE = "http://localhost:8080/api/notes";

const sampleNotes = [
  { title:"Java Basics and OOP", college:"Raisoni College", course:"BTech", branch:"CSE", academicYear:"Second Year", semester:"4", subject:"Java Programming", type:"Sample Notes", description:"Introduction to Java, classes, objects, and inheritance." },
  { title:"HTML and CSS Fundamentals", college:"Raisoni College", course:"BTech", branch:"IT", academicYear:"Second Year", semester:"3", subject:"Web Development", type:"Sample Notes", description:"HTML structure, CSS selectors, and responsive design." },
  { title:"SQL and Normalization", college:"Government College", course:"BSc", branch:"Computer Science", academicYear:"Second Year", semester:"4", subject:"Database Management", type:"Sample Notes", description:"SQL queries, keys, and database normalization." },
  { title:"Introduction to Machine Learning", college:"ABC Engineering College", course:"BTech", branch:"AI/ML", academicYear:"Third Year", semester:"5", subject:"Machine Learning", type:"Sample Notes", description:"Machine learning concepts, datasets, and model training." },
  { title:"Java Practice Questions", college:"Government College", course:"BTech", branch:"IT", academicYear:"Second Year", semester:"4", subject:"Java Programming", type:"Sample Notes", description:"Beginner-friendly Java questions for exam preparation." },
  { title:"Web Development Question Bank", college:"ABC Engineering College", course:"BTech", branch:"CSE", academicYear:"Second Year", semester:"3", subject:"Web Development", type:"Sample Notes", description:"Practice questions covering HTML, CSS, and JavaScript." },
  { title:"DBMS Exam Preparation", college:"Raisoni College", course:"BTech", branch:"CSE", academicYear:"Third Year", semester:"5", subject:"Database Management", type:"Sample Notes", description:"Revision questions about SQL, transactions, and keys." },
  { title:"Machine Learning Revision", college:"Government College", course:"BTech", branch:"AI/ML", academicYear:"Third Year", semester:"6", subject:"Machine Learning", type:"Sample Notes", description:"Revision of supervised and unsupervised learning." }
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
      if (!note.id) { alert("This is a sample note. Upload a PDF to enable viewing and downloading."); return; }
      window.open(`${API_BASE}/${encodeURIComponent(note.id)}/view`, "_blank", "noopener");
    }));
    if (note.id && note.fileName) {
      actions.appendChild(makeButton("Download PDF", "download-button", () => {
        const link = document.createElement("a"); link.href = `${API_BASE}/${encodeURIComponent(note.id)}/file`;
        link.download = note.fileName; document.body.appendChild(link); link.click(); link.remove();
      }));
      actions.appendChild(makeButton("Delete", "delete-button", async event => {
        const button = event.currentTarget;
        if (!confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
        button.disabled = true;
        try {
          const response = await fetch(`${API_BASE}/${encodeURIComponent(note.id)}`, { method:"DELETE" });
          const body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body.message || `Server error (${response.status})`);
          await loadNotes();
        } catch (err) { alert("Could not delete note: " + err.message); button.disabled = false; }
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
    const response = await fetch(API_BASE);
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
    const response = await fetch(`${API_BASE}/upload`, { method:"POST", body:data });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || `Upload failed (${response.status})`);
    uploadMessage.style.color = "green"; uploadMessage.textContent = "PDF uploaded successfully! Your notes are now in the library.";
    uploadForm.reset(); await loadNotes();
  } catch (err) {
    uploadMessage.style.color = "#bc5050"; uploadMessage.textContent = "Upload failed: " + err.message + ". Check that the Spring Boot backend is running.";
  } finally { submit.disabled = false; }
});
loadNotes();
