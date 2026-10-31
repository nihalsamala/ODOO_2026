package com.subscription.backend.config;

import com.subscription.backend.auth.User;
import com.subscription.backend.auth.UserRepository;
import com.subscription.backend.customer.Customer;
import com.subscription.backend.customer.CustomerRepository;
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
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // 1. Admin
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

        // 2. Staff
        if (!userRepository.existsByEmail("staff@subscriptiq.com")) {
            User staff = User.builder()
                    .email("staff@subscriptiq.com")
                    .password(passwordEncoder.encode("Staff@123"))
                    .fullName("SubscriptIQ Staff")
                    .role(Role.STAFF)
                    .enabled(true)
                    .build();
            userRepository.save(staff);
            log.info("Initialized default staff user: staff@subscriptiq.com");
        }

        // 3. Customer / User
        if (!userRepository.existsByEmail("user@subscriptiq.com")) {
            Customer demoCustomer = customerRepository.findByEmail("user@subscriptiq.com")
                    .orElseGet(() -> customerRepository.save(Customer.builder()
                            .name("Demo Customer")
                            .email("user@subscriptiq.com")
                            .phone("+1 555-0199")
                            .address("100 Innovation Way, Suite 400, Tech City")
                            .build()
                    ));

            User user = User.builder()
                    .email("user@subscriptiq.com")
                    .password(passwordEncoder.encode("User@123"))
                    .fullName("Demo Customer")
                    .role(Role.CUSTOMER)
                    .enabled(true)
                    .customerId(demoCustomer.getId())
                    .build();
            user = userRepository.save(user);

            demoCustomer.setUserId(user.getId());
            customerRepository.save(demoCustomer);
            log.info("Initialized default customer user: user@subscriptiq.com (linked customer ID: {})", demoCustomer.getId());
        }
    }
}
