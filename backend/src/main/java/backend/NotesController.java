package backend;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@CrossOrigin(origins = {
                "http://localhost:5500",
                "http://127.0.0.1:5500",
                "https://studysphere-vrushali.netlify.app"
}, allowCredentials = "true")
public class NotesController {

        private final Path uploadDirectory = Paths.get("uploads").toAbsolutePath().normalize();

        private final NoteRepository noteRepository;
        private final SupabaseStorageService storageService;
        private final UserRepository userRepository;

        public NotesController(
                        NoteRepository noteRepository,
                        SupabaseStorageService storageService,
                        UserRepository userRepository) {
                this.noteRepository = noteRepository;
                this.storageService = storageService;
                this.userRepository = userRepository;
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
                                || branch.isBlank() || academicYear.isBlank()
                                || semester.isBlank() || subject.isBlank()
                                || file.isEmpty()) {

                        return ResponseEntity.badRequest().body(
                                        Map.of("message",
                                                        "Complete all fields and select a PDF."));
                }

                String original = StringUtils.cleanPath(
                                file.getOriginalFilename() == null
                                                ? ""
                                                : file.getOriginalFilename());

                if (!original.toLowerCase().endsWith(".pdf")
                                || file.getSize() > 10L * 1024 * 1024) {

                        return ResponseEntity.badRequest().body(
                                        Map.of("message",
                                                        "Only PDF files up to 10 MB are accepted."));
                }

                String savedFilename = UUID.randomUUID() + ".pdf";
                Path destination = uploadDirectory.resolve(savedFilename).normalize();

                if (!destination.startsWith(uploadDirectory)) {
                        return ResponseEntity.badRequest().body(
                                        Map.of("message", "Invalid filename."));
                }
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

                if (authentication == null || !authentication.isAuthenticated()
                                || "anonymousUser".equals(authentication.getPrincipal())) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body(Map.of("message", "Please log in to upload notes."));
                }

                User owner = userRepository.findByEmail(authentication.getName())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.UNAUTHORIZED, "User account not found."));

                try {
                        byte[] content = file.getBytes();

                        if (storageService.isConfigured()) {
                                storageService.upload(savedFilename, content);
                        } else {
                                Files.createDirectories(uploadDirectory);
                                Files.copy(
                                                file.getInputStream(),
                                                destination,
                                                StandardCopyOption.REPLACE_EXISTING);
                        }

                        Note note = new Note();
                        note.setOwner(owner);
                        note.setTitle(title.trim());
                        note.setCollege(college.trim());
                        note.setCourse(course.trim());
                        note.setBranch(branch.trim());
                        note.setAcademicYear(academicYear.trim());
                        note.setSemester(semester.trim());
                        note.setSubject(subject.trim());
                        note.setFileName(savedFilename);

                        if (storageService.isConfigured()) {
                                note.setFilePath(savedFilename);
                        } else {
                                note.setFilePath(destination.toString());
                        }

                        Note saved = noteRepository.save(note);

                        return ResponseEntity.ok(Map.of(
                                        "message", "PDF uploaded successfully.",
                                        "id", saved.getId().toString()));

                } catch (IOException | RuntimeException ex) {

                        try {
                                if (storageService.isConfigured()) {
                                        storageService.delete(savedFilename);
                                } else {
                                        Files.deleteIfExists(destination);
                                }
                        } catch (IOException ignored) {
                        }

                        return ResponseEntity.status(
                                        HttpStatus.INTERNAL_SERVER_ERROR).body(
                                                        Map.of("message",
                                                                        "Could not save the PDF and note record."));
                }
        }

        @GetMapping("/api/notes")
        public List<NoteResponse> getAllNotes(
                        Authentication authentication) {

                boolean loggedIn = authentication != null
                                && authentication.isAuthenticated()
                                && !"anonymousUser".equals(authentication.getPrincipal());

                Long currentUserId = null;

                if (loggedIn) {
                        currentUserId = userRepository.findByEmail(authentication.getName())
                                        .map(User::getId)
                                        .orElse(null);
                }

                final Long userId = currentUserId;

                return noteRepository.findAll().stream()
                                .map(note -> NoteResponse.from(
                                                note,
                                                userId != null
                                                                && note.getOwner() != null
                                                                && note.getOwner().getId().equals(userId)))
                                .toList();
        }

        @GetMapping("/api/notes/{id}/file")
        public ResponseEntity<Resource> downloadNote(
                        @PathVariable Long id) {

                Note note = noteRepository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Note not found"));

                Resource resource = loadResource(note);

                return ResponseEntity.ok()
                                .contentType(MediaType.APPLICATION_PDF)
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=\""
                                                                + safeFilename(note.getFileName()) + "\"")
                                .body(resource);
        }

        @GetMapping("/api/notes/sample/{fileName}/download")
        public ResponseEntity<Resource> downloadSamplePdf(
                        @PathVariable String fileName) {

                List<String> allowedFiles = List.of(
                                "01_Java_Basics_and_OOP.pdf",
                                "02_HTML_and_CSS_Fundamentals.pdf",
                                "03_SQL_and_Normalization.pdf",
                                "04_Introduction_to_Machine_Learning.pdf",
                                "05_Java_Practice_Questions.pdf",
                                "06_Web_Development_Question_Bank.pdf",
                                "07_DBMS_Exam_Preparation.pdf",
                                "08_Machine_Learning_Revision.pdf");

                if (!allowedFiles.contains(fileName)) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "Sample PDF not found");
                }

                try {
                        byte[] pdf = storageService.download(fileName);

                        Resource resource = new ByteArrayResource(pdf);

                        return ResponseEntity.ok()
                                        .contentType(MediaType.APPLICATION_PDF)
                                        .header(
                                                        HttpHeaders.CONTENT_DISPOSITION,
                                                        "attachment; filename=\"" + safeFilename(fileName) + "\"")
                                        .body(resource);

                } catch (IOException ex) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND, "Sample PDF could not be loaded");
                }
        }

        @GetMapping("/api/notes/{id}/view")
        public ResponseEntity<Resource> viewNote(
                        @PathVariable Long id) {

                Note note = noteRepository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Note not found"));

                Resource resource = loadResource(note);

                return ResponseEntity.ok()
                                .contentType(MediaType.APPLICATION_PDF)
                                .header(
                                                HttpHeaders.CONTENT_DISPOSITION,
                                                "inline; filename=\""
                                                                + safeFilename(note.getFileName()) + "\"")
                                .body(resource);
        }

        @DeleteMapping("/api/notes/{id}")
        public ResponseEntity<Map<String, String>> deleteNote(
                        @PathVariable Long id) {

                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

                if (authentication == null || !authentication.isAuthenticated()
                                || "anonymousUser".equals(authentication.getPrincipal())) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body(Map.of("message", "Please log in first."));
                }

                User owner = userRepository.findByEmail(authentication.getName())
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.UNAUTHORIZED, "User account not found."));

                Note note = noteRepository.findById(id)
                                .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Note not found."));

                if (note.getOwner() == null
                                || !note.getOwner().getId().equals(owner.getId())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                        .body(Map.of("message", "You can only delete your own notes."));
                }

                try {
                        if (storageService.isConfigured()) {
                                storageService.delete(note.getFileName());
                        } else {
                                Files.deleteIfExists(Paths.get(note.getFilePath()));
                        }

                        noteRepository.delete(note);

                        return ResponseEntity.ok(
                                        Map.of("message", "Note deleted successfully."));

                } catch (IOException ex) {
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(Map.of("message", "Could not delete the PDF."));
                }
        }

        private Resource loadResource(Note note) {

                try {
                        if (storageService.isConfigured()) {
                                byte[] pdf = storageService.download(note.getFileName());

                                return new ByteArrayResource(pdf) {
                                        @Override
                                        public String getFilename() {
                                                return note.getFileName();
                                        }
                                };
                        }

                        Path path = Paths.get(note.getFilePath())
                                        .toAbsolutePath().normalize();

                        Resource resource = new org.springframework.core.io.UrlResource(
                                        path.toUri());

                        if (!resource.exists() || !resource.isReadable()) {
                                throw new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "PDF file not found");
                        }

                        return resource;

                } catch (IOException ex) {
                        throw new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "PDF could not be loaded from storage");
                }
        }

        private String safeFilename(String filename) {
                String cleaned = StringUtils.cleanPath(
                                filename == null ? "notes.pdf" : filename)
                                .replace("\"", "");

                return cleaned.isBlank() ? "notes.pdf" : cleaned;
        }
}