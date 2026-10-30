// Sample notes for learning and testing.
// These are examples, not real uploaded college documents.

const sampleNotes = [
    {
        title: "Java Basics and OOP",
        college: "Raisoni College",
        branch: "CSE",
        semester: "4",
        subject: "Java Programming",
        type: "Study Notes",
        description: "Introduction to Java, classes, objects, and inheritance."
    },
    {
        title: "HTML and CSS Fundamentals",
        college: "Raisoni College",
        branch: "IT",
        semester: "3",
        subject: "Web Development",
        type: "Study Notes",
        description: "HTML structure, CSS selectors, and responsive design."
    },
    {
        title: "SQL and Normalization",
        college: "Government College",
        branch: "CSE",
        semester: "4",
        subject: "Database Management",
        type: "Study Notes",
        description: "SQL queries, keys, and database normalization."
    },
    {
        title: "Introduction to Machine Learning",
        college: "ABC Engineering College",
        branch: "AI/ML",
        semester: "5",
        subject: "Machine Learning",
        type: "Study Notes",
        description: "Machine learning concepts, datasets, and model training."
    },
    {
        title: "Java Practice Questions",
        college: "Government College",
        branch: "IT",
        semester: "4",
        subject: "Java Programming",
        type: "Practice Questions",
        description: "Beginner-friendly Java questions for exam preparation."
    },
    {
        title: "Web Development Question Bank",
        college: "ABC Engineering College",
        branch: "CSE",
        semester: "3",
        subject: "Web Development",
        type: "Question Bank",
        description: "Practice questions covering HTML, CSS, and JavaScript."
    },
    {
        title: "DBMS Exam Preparation",
        college: "Raisoni College",
        branch: "CSE",
        semester: "5",
        subject: "Database Management",
        type: "Question Bank",
        description: "Revision questions about SQL, transactions, and keys."
    },
    {
        title: "Machine Learning Revision",
        college: "Government College",
        branch: "AI/ML",
        semester: "6",
        subject: "Machine Learning",
        type: "Revision Notes",
        description: "Revision of supervised and unsupervised learning."
    }
];
// Start with sample notes until real notes load from the backend.
let notes = [...sampleNotes];

// Get the HTML elements.
const collegeFilter = document.getElementById("collegeFilter");
const branchFilter = document.getElementById("branchFilter");
const semesterFilter = document.getElementById("semesterFilter");
const subjectFilter = document.getElementById("subjectFilter");
const searchInput = document.getElementById("searchInput");

const searchButton = document.getElementById("searchButton");
const resetButton = document.getElementById("resetButton");
const notesContainer = document.getElementById("notesContainer");
const resultCount = document.getElementById("resultCount");
const emptyMessage = document.getElementById("emptyMessage");

// Display a collection of notes on the page.
function displayNotes(notesToDisplay) {
    notesContainer.replaceChildren();

    notesToDisplay.forEach(function (note) {
        const card = document.createElement("article");
        card.className = "card";

        const title = document.createElement("h3");
        title.textContent = note.title;

        const type = document.createElement("span");
        type.className = "note-type";
        type.textContent = note.type;

        const description = document.createElement("p");
        description.textContent = note.description;

        const college = document.createElement("p");
        college.className = "metadata";
        college.textContent = "College: " + note.college;

        const branch = document.createElement("p");
        branch.className = "metadata";
        branch.textContent = "Branch: " + note.branch;

        const semester = document.createElement("p");
        semester.className = "metadata";
        semester.textContent = "Semester: " + note.semester;

        const subject = document.createElement("p");
        subject.className = "metadata";
        subject.textContent = "Subject: " + note.subject;

const buttonContainer = document.createElement("div");
buttonContainer.className = "note-buttons";

// View Details button
const button = document.createElement("button");
button.textContent = "View Details";

button.addEventListener("click", function () {
    if (note.id) {
        window.open(
            "http://localhost:8080/api/notes/" + note.id + "/view",
            "_blank"
        );
    } else {
        alert("This is a sample note. The PDF is not available yet.");
    }
});

buttonContainer.appendChild(button);

// Download PDF button for uploaded notes only
if (note.id && note.fileName) {
    const downloadButton = document.createElement("button");
    downloadButton.textContent = "Download PDF";

    downloadButton.addEventListener("click", function () {
        const downloadLink = document.createElement("a");

        downloadLink.href =
            "http://localhost:8080/api/notes/" + note.id + "/file";

        downloadLink.download = note.fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    });

    buttonContainer.appendChild(downloadButton);
}
// Delete button for uploaded notes only
if (note.id && note.fileName) {
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.style.backgroundColor = "#d5d2dd";
    deleteButton.style.color = "#bc5050";
    deleteButton.style.border = "1px solid #ebe3e3";
    deleteButton.style.fontSize = "10px";
    deleteButton.style.borderRadius = "5px";

    deleteButton.addEventListener("click", async function () {
    
        const confirmed = confirm(
            'Are you sure you want to delete "' + note.title + '"?'
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:8080/api/notes/" + note.id,
                {
                    method: "DELETE"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Could not delete the note.");
            }

            alert("Note deleted successfully!");

            // Reload notes so the deleted note disappears.
            await loadNotes();

        } catch (error) {
            alert("Error deleting note: " + error.message);
        }
    });

    buttonContainer.appendChild(deleteButton);
}
     card.append(
    title,
    type,
    description,
    college,
    branch,
    semester,
    subject,
    buttonContainer
); 
        notesContainer.appendChild(card);
    });


    resultCount.textContent =
        "Showing " + notesToDisplay.length + " of " + notes.length + " resources";

    emptyMessage.hidden = notesToDisplay.length !== 0;
}

// Filter notes according to all selected options and search text.
function filterNotes() {
    const selectedCollege = collegeFilter.value.trim().toLowerCase();
    const selectedBranch = branchFilter.value;
    const selectedSemester = semesterFilter.value;
    const selectedSubject = subjectFilter.value;
    const searchText = searchInput.value.trim().toLowerCase();

    const filteredNotes = notes.filter(function (note) {
        const matchesCollege =
            selectedCollege === "" ||
             note.college.toLowerCase().includes(selectedCollege);

        const matchesBranch =
            selectedBranch === "" || note.branch === selectedBranch;

        const matchesSemester =
            selectedSemester === "" || note.semester === selectedSemester;

        const matchesSubject =
            selectedSubject === "" || note.subject === selectedSubject;

        const searchableText = (
            note.title + " " +
            note.description + " " +
            note.subject + " " +
            note.type + " " +
            note.college + " " +
            note.branch
        ).toLowerCase();

        const matchesSearch = searchableText.includes(searchText);

        return (
            matchesCollege &&
            matchesBranch &&
            matchesSemester &&
            matchesSubject &&
            matchesSearch
        );
    });

    displayNotes(filteredNotes);
}

// Fetch real uploaded notes from the Spring Boot backend.
async function loadNotes() {
    try {
        const response = await fetch("http://localhost:8080/api/notes");

        if (!response.ok) {
            throw new Error("Could not retrieve notes from the server.");
        }

        const uploadedNotes = await response.json();

        // Convert database records into the format used by the webpage.
        const formattedNotes = uploadedNotes.map(function (note) {
            return {
                id: note.id,
                title: note.title,
                college: note.college,
                branch: note.branch,
                semester: String(note.semester),
                subject: note.subject,
                type: "Uploaded PDF",
                description: "Student-uploaded PDF notes.",
                fileName: note.fileName
            };
        });

        // Keep sample notes and add real uploaded notes.
        notes = [...sampleNotes, ...formattedNotes];

        // Refresh the displayed notes and apply current filters.
        filterNotes();

        console.log("StudySphere notes loaded:", formattedNotes.length);

    } catch (error) {
        console.error("Could not load uploaded notes:", error);

        // Keep the sample notes available if the backend is unavailable.
        notes = [...sampleNotes];
        filterNotes();
    }
}

// Filter whenever the student changes a dropdown.
collegeFilter.addEventListener("change", filterNotes);
branchFilter.addEventListener("change", filterNotes);
semesterFilter.addEventListener("change", filterNotes);
subjectFilter.addEventListener("change", filterNotes);

// Search when the button is clicked or Enter is pressed.
searchButton.addEventListener("click", filterNotes);

searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        filterNotes();
    }
});

// Reset all filters and show every sample resource.
resetButton.addEventListener("click", function () {
    collegeFilter.value = "";
    branchFilter.value = "";
    semesterFilter.value = "";
    subjectFilter.value = "";
    searchInput.value = "";

    filterNotes();
});

// Load sample notes and real uploaded notes when the page opens.
loadNotes();

// Handle StudySphere note uploads.
const uploadForm = document.getElementById("uploadForm");
const uploadMessage = document.getElementById("uploadMessage");

uploadForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const title = document.getElementById("noteTitle").value.trim();
    const college = document.getElementById("collegeName").value.trim();
    const branch = document.getElementById("branchName").value.trim();
    const semester = document.getElementById("semesterNumber").value;
    const subject = document.getElementById("subjectName").value.trim();
    const file = document.getElementById("noteFile").files[0];

    // Validate the selected file before sending anything.
    if (!file) {
        uploadMessage.textContent = "Please select a PDF file.";
        return;
    }

    if (
        !file.name.toLowerCase().endsWith(".pdf") ||
        (file.type && file.type !== "application/pdf")
    ) {
        uploadMessage.textContent = "Please select a valid PDF file.";
        return;
    }

    // Keep the form filled if an upload fails.
    const formData = new FormData();
    formData.append("title", title);
    formData.append("college", college);
    formData.append("branch", branch);
    formData.append("semester", semester);
    formData.append("subject", subject);
    formData.append("file", file);

    const submitButton = uploadForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;
    uploadMessage.textContent = "Uploading your notes...";

    try {
        const response = await fetch("http://localhost:8080/api/notes/upload", {
    method: "POST",
    body: formData
});

        const responseText = await response.text();

        let result = {};

        try {
            result = responseText ? JSON.parse(responseText) : {};
        } catch {
            result = {};
        }

        if (!response.ok) {
            throw new Error(
                result.message ||
                `Upload failed. Server returned status ${response.status}.`
            );
        }

       uploadMessage.textContent =
    "✅ PDF uploaded successfully! Your notes have been saved.";

uploadMessage.style.display = "block";
uploadMessage.style.visibility = "visible";
uploadMessage.style.opacity = "1";
uploadMessage.style.color = "green";
uploadMessage.style.fontWeight = "bold";

        // Clear the form only after the server confirms success.
        uploadForm.reset();

        // Refresh the notes list to include the newly uploaded note.
        await loadNotes();
        console.log("StudySphere upload successful:", result);
    } catch (error) {
        console.error("StudySphere upload error:", error);

        uploadMessage.textContent =
            "Upload failed: " + error.message +
            " Your information is still here. Please try again.";

    } finally {
        submitButton.disabled = false;
    }
});