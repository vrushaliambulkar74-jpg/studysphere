package backend;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "http://localhost:5500")
public class HelloController {

    @GetMapping("/api/hello")
    public String hello() {
        return "StudySphere backend is working!";
    }
}