# StudySphere 📚

**StudySphere** is a student notes-sharing platform that helps students browse, search, filter, upload, view, and download study materials in PDF format.

The project is built to make academic resources easier to organize and access through a simple web interface.

## ✨ Features

- **Browse Study Materials:** Explore available notes and resources.
- **Search Notes:** Find resources using the search bar.
- **Filter Resources:** Filter notes by college, branch, semester, and subject.
- **Upload PDFs:** Upload study materials with academic details.
- **View PDFs:** Open uploaded PDFs directly in the browser.
- **Download PDFs:** Download uploaded study materials.
- **Delete Notes:** Remove uploaded notes and their associated PDF files.
- **Responsive Interface:** Use a clean interface across different screen sizes.

## 🛠️ Technologies Used

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Java 21
- Spring Boot
- Spring Web
- Spring Data JPA
- Maven

### Database and Storage

- H2 Database
- Local file storage for uploaded PDFs

## 📁 Project Structure

```text
studysphere/
├── index.html
├── style.css
├── script.js
├── README.md
└── backend/
    ├── src/
    ├── uploads/
    ├── data/
    ├── pom.xml
    └── mvnw.cmd
```

_Note: The backend's exact internal structure and generated files may vary._

## 🚀 How to Run the Project

### Prerequisites

Install the following:

- Java 21
- Visual Studio Code
- A modern web browser

### 1. Start the Backend

Open a terminal in the backend folder:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The backend runs at:

```text
http://localhost:8080
```

### 2. Start the Frontend

Open the project in Visual Studio Code.

Use the **Live Server** extension to open `index.html`.

The frontend will typically run at:

```text
http://localhost:5500/index.html
```

### 3. Use StudySphere

- Browse the available resources.
- Search for notes or apply filters.
- Upload a PDF with its academic details.
- View or download uploaded PDFs.
- Delete uploaded notes when they are no longer needed.

## 🔌 API Endpoints

| Method | Endpoint               | Description                          |
| ------ | ---------------------- | ------------------------------------ |
| GET    | `/api/notes`           | Retrieve available notes             |
| POST   | `/api/notes/upload`    | Upload a PDF and save its details    |
| GET    | `/api/notes/{id}/view` | View a PDF in the browser            |
| GET    | `/api/notes/{id}/file` | Download a PDF                       |
| DELETE | `/api/notes/{id}`      | Delete a note and its associated PDF |

## 🎯 Project Goal

StudySphere aims to provide a straightforward platform for students to share and access academic study materials, with a focus on usability and organized resource discovery.

## 👩‍💻 Author

Developed as a student portfolio project.
