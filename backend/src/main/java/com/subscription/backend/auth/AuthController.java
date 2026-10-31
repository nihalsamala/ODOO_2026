package com.subscription.backend.auth;

import com.subscription.backend.exception.ResourceNotFoundException;
import com.subscription.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthDto.AuthResponse> register(@Valid @RequestBody AuthDto.RegisterRequest request) {
        return new ResponseEntity<>(authService.registerCustomer(request), HttpStatus.CREATED);
    }

    @PostMapping("/create-staff")
    public ResponseEntity<AuthDto.AuthResponse> createStaff(@Valid @RequestBody AuthDto.CreateStaffRequest request) {
        return new ResponseEntity<>(authService.createStaff(request), HttpStatus.CREATED);
    }

    @GetMapping("/me")
    public ResponseEntity<AuthDto.AuthResponse> getCurrentUser() {
        UserPrincipal principal = authService.getCurrentUser();
        if (principal == null) {
            throw new ResourceNotFoundException("Not authenticated");
        }
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        AuthDto.AuthResponse response = AuthDto.AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .customerId(user.getCustomerId())
                .build();
        return ResponseEntity.ok(response);
    }
}
