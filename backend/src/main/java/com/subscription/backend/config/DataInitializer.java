package com.subscription.backend.config;

import com.subscription.backend.auth.User;
import com.subscription.backend.auth.UserRepository;
import com.subscription.backend.security.Role;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail("admin@subscriptiq.com")) {
            User admin = User.builder()
                    .email("admin@subscriptiq.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .fullName("SubscriptIQ Admin")
                    .role(Role.ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            log.info("Initialized default admin user: admin@subscriptiq.com");
        }
    }
}
