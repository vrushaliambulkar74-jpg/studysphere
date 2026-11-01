package backend;

public record NoteResponse(
        Long id,
        String title,
        String college,
        String course,
        String branch,
        String academicYear,
        String semester,
        String subject,
        String fileName,
        boolean isOwner) {
    public static NoteResponse from(Note note, boolean isOwner) {
        return new NoteResponse(
                note.getId(),
                note.getTitle(),
                note.getCollege(),
                note.getCourse(),
                note.getBranch(),
                note.getAcademicYear(),
                note.getSemester(),
                note.getSubject(),
                note.getFileName(),
                isOwner);
    }
}
