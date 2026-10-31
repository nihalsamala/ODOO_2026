package com.subscription.backend.auth;

import com.subscription.backend.customer.Customer;
import com.subscription.backend.customer.CustomerRepository;
import com.subscription.backend.exception.BadRequestException;
import com.subscription.backend.exception.BusinessRuleException;
import com.subscription.backend.security.JwtTokenProvider;
import com.subscription.backend.security.Role;
import com.subscription.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthDto.AuthResponse login(AuthDto.LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new BadRequestException("User not found"));

        String token = tokenProvider.generateToken(
                user.getEmail(),
                user.getRole(),
                user.getId(),
                user.getCustomerId()
        );

        return AuthDto.AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .customerId(user.getCustomerId())
                .build();
    }

    @Transactional
    public AuthDto.AuthResponse registerCustomer(AuthDto.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessRuleException("Email is already registered: " + request.getEmail());
        }

        // Create Customer record
        Customer customer = Customer.builder()
                .name(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .build();
        customer = customerRepository.save(customer);

        // Create User record
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(Role.CUSTOMER)
                .customerId(customer.getId())
                .enabled(true)
                .build();
        user = userRepository.save(user);

        customer.setUserId(user.getId());
        customerRepository.save(customer);

        String token = tokenProvider.generateToken(
                user.getEmail(),
                user.getRole(),
                user.getId(),
                user.getCustomerId()
        );

        return AuthDto.AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .customerId(user.getCustomerId())
                .build();
    }

    @Transactional
    public AuthDto.AuthResponse createStaff(AuthDto.CreateStaffRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessRuleException("Email is already registered: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(Role.STAFF)
                .enabled(true)
                .build();
        user = userRepository.save(user);

        return AuthDto.AuthResponse.builder()
                .token(null)
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .customerId(null)
                .build();
    }

    public UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
            return (UserPrincipal) auth.getPrincipal();
        }
        return null;
    }
}
