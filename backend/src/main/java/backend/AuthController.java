package backend;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final SecurityContextRepository contextRepository = new HttpSessionSecurityContextRepository();

        public AuthController(
                        UserRepository userRepository,
                        PasswordEncoder passwordEncoder) {
                this.userRepository = userRepository;
                this.passwordEncoder = passwordEncoder;
        }

        @PostMapping("/register")
        public ResponseEntity<Map<String, String>> register(
                        @RequestBody Map<String, String> request) {

                String email = request.get("email");
                String password = request.get("password");

                if (email == null || !Pattern.matches(
                                "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$",
                                email.trim())) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("message", "Enter a valid email address."));
                }

                if (password == null || password.length() < 8) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("message",
                                                        "Password must contain at least 8 characters."));
                }

                email = email.trim().toLowerCase();

                if (userRepository.existsByEmail(email)) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                        .body(Map.of("message",
                                                        "An account with this email already exists."));
                }

                User user = new User(email, passwordEncoder.encode(password));
                userRepository.save(user);

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(Map.of("message",
                                                "Registration successful. You can now log in."));
        }

        @PostMapping("/login")
        public ResponseEntity<Map<String, String>> login(
                        @RequestBody Map<String, String> request,
                        HttpServletRequest httpRequest,
                        jakarta.servlet.http.HttpServletResponse httpResponse) {

                String email = request.get("email");
                String password = request.get("password");

                if (email == null || password == null) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("message",
                                                        "Email and password are required."));
                }

                email = email.trim().toLowerCase();

                User user = userRepository.findByEmail(email).orElse(null);

                if (user == null ||
                                !passwordEncoder.matches(password, user.getPassword())) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body(Map.of("message", "Invalid email or password."));
                }

                var authentication = new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_USER")));

                SecurityContext context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(authentication);
                SecurityContextHolder.setContext(context);

                contextRepository.saveContext(context, httpRequest, httpResponse);

                return ResponseEntity.ok(
                                Map.of("message", "Login successful.", "email", email));
        }

        @GetMapping("/me")
        public ResponseEntity<Map<String, String>> currentUser(
                        org.springframework.security.core.Authentication authentication) {

                if (authentication == null ||
                                !authentication.isAuthenticated() ||
                                "anonymousUser".equals(authentication.getPrincipal())) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body(Map.of("message", "Not logged in."));
                }

                return ResponseEntity.ok(
                                Map.of("email", authentication.getName()));
        }
}
