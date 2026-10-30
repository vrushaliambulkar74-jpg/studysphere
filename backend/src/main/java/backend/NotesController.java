package backend;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.DeleteMapping;

import backend.Note;
import backend.NoteRepository;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.net.MalformedURLException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@CrossOrigin(origins = {
                "http://localhost:5500",
                "http://127.0.0.1:5500"
})
public class NotesController {

        private final Path uploadDirectory = Paths.get("uploads").toAbsolutePath().normalize();

        private final NoteRepository noteRepository;

        public NotesController(NoteRepository noteRepository) {
                this.noteRepository = noteRepository;
        }

        @PostMapping("/api/notes/upload")
        public ResponseEntity<Map<String, String>> uploadNote(
                        @RequestParam("title") String title,
                        @RequestParam("college") String college,
                        @RequestParam("course") String course,
                        @RequestParam("branch") String branch,
                        @RequestParam("academicYear") String academicYear,
                        @RequestParam("semester") String semester,
                        @RequestParam("subject") String subject,
                        @RequestParam("file") MultipartFile file) {

                if (title.isBlank() || college.isBlank() || course.isBlank()
                                || branch.isBlank() || academicYear.isBlank() || semester.isBlank()
                                || subject.isBlank() || file.isEmpty()) {

                        return ResponseEntity.badRequest().body(
                                        Map.of("message",
                                                        "Please complete all fields and select a PDF."));
                }

                String originalFilename = StringUtils.cleanPath(
                                file.getOriginalFilename() == null
                                                ? ""
                                                : file.getOriginalFilename());

                if (!originalFilename.toLowerCase().endsWith(".pdf")
                                || !"application/pdf".equalsIgnoreCase(file.getContentType())) {

                        return ResponseEntity.badRequest().body(
                                        Map.of("message", "Only PDF files are accepted."));
                }

                // Limit uploads to 10 MB.
                if (file.getSize() > 10 * 1024 * 1024) {
                        return ResponseEntity.badRequest().body(
                                        Map.of("message",
                                                        "The PDF must be smaller than 10 MB."));
                }

                String savedFilename = UUID.randomUUID() + ".pdf";
                Path destination = uploadDirectory.resolve(savedFilename).normalize();

                if (!destination.startsWith(uploadDirectory)) {
                        return ResponseEntity.badRequest().body(
                                        Map.of("message", "Invalid filename."));
                }

                try {
                        Files.createDirectories(uploadDirectory);

                        Files.copy(
                                        file.getInputStream(),
                                        destination,
                                        StandardCopyOption.REPLACE_EXISTING);

                        Note note = new Note();
                        note.setTitle(title);
                        note.setCollege(college);
                        note.setCourse(course);
                        note.setBranch(branch);
                        note.setAcademicYear(academicYear);
                        note.setSemester(semester);
                        note.setSubject(subject);
                        note.setFileName(savedFilename);
                        note.setFilePath(destination.toString());

                        Note savedNote = noteRepository.save(note);

                        return ResponseEntity.ok(Map.of(
                                        "message", "PDF uploaded and saved successfully!",
                                        "id", savedNote.getId().toString(),
                                        "title", savedNote.getTitle(),
                                        "college", savedNote.getCollege(),
                                        "course", savedNote.getCourse(),
                                        "branch", savedNote.getBranch(),
                                        "academicYear", savedNote.getAcademicYear(),
                                        "semester", savedNote.getSemester(),
                                        "subject", savedNote.getSubject(),
                                        "filename", savedNote.getFileName()));

                } catch (IOException exception) {
                        return ResponseEntity.status(
                                        HttpStatus.INTERNAL_SERVER_ERROR).body(
                                                        Map.of("message", "Could not save the PDF."));
                } catch (RuntimeException exception) {
                        // Avoid leaving an orphaned PDF if database saving fails.
                        try {
                                Files.deleteIfExists(destination);
                        } catch (IOException ignored) {
                                // The original database error is the important one.
                        }

                        return ResponseEntity.status(
                                        HttpStatus.INTERNAL_SERVER_ERROR).body(
                                                        Map.of("message",
                                                                        "The PDF could not be registered in the database."));
                }
        }

        @GetMapping("/api/notes")
        public ResponseEntity<List<Note>> getAllNotes() {
                return ResponseEntity.ok(noteRepository.findAll());
        }

        @GetMapping("/api/notes/{id}/file")
        public ResponseEntity<Resource> downloadNote(@PathVariable Long id) {

                return noteRepository.findById(id)
                                .map(note -> {
                                        try {
                                                Path filePath = Paths.get(note.getFilePath())
                                                                .toAbsolutePath()
                                                                .normalize();

                                                Resource resource = new UrlResource(filePath.toUri());

                                                if (!resource.exists() || !resource.isReadable()) {
                                                        return ResponseEntity.notFound().<Resource>build();
                                                }

                                                return ResponseEntity.ok()
                                                                .contentType(MediaType.APPLICATION_PDF)
                                                                .header(
                                                                                org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                                                                                "attachment; filename=\""
                                                                                                + note.getFileName()
                                                                                                + "\"")
                                                                .body(resource);

                                        } catch (MalformedURLException exception) {
                                                return ResponseEntity.notFound().<Resource>build();
                                        }
                                })
                                .orElseGet(() -> ResponseEntity.notFound().build());
        }

        @GetMapping("/api/notes/{id}/view")
        public ResponseEntity<Resource> viewNote(@PathVariable Long id) throws IOException {

                Note note = noteRepository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Note not found"));

                Path path = Paths.get(note.getFilePath());
                Resource resource = new UrlResource(path.toUri());

                if (!resource.exists() || !resource.isReadable()) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "PDF file not found");
                }

                return ResponseEntity.ok()
                                .contentType(MediaType.APPLICATION_PDF)
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                "inline; filename=\"" + note.getFileName() + "\"")
                                .body(resource);
        }

        @DeleteMapping("/api/notes/{id}")
        public ResponseEntity<Map<String, String>> deleteNote(@PathVariable Long id) {

                return noteRepository.findById(id)
                                .map(note -> {
                                        try {
                                                Path filePath = Paths.get(note.getFilePath())
                                                                .toAbsolutePath()
                                                                .normalize();

                                                // Delete the PDF file if it exists.
                                                Files.deleteIfExists(filePath);

                                                // Delete the note from the database.
                                                noteRepository.delete(note);

                                                return ResponseEntity.ok(
                                                                Map.of("message", "Note deleted successfully!"));

                                        } catch (IOException exception) {
                                                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                                                .body(Map.of("message",
                                                                                "Could not delete the PDF file."));
                                        }
                                })
                                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(Map.of("message", "Note not found.")));
        }
}
