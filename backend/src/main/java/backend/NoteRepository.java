package backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByOwnerId(Long ownerId);

    boolean existsByIdAndOwnerId(Long id, Long ownerId);
}
