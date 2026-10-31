package com.subscription.backend.auth;

import com.subscription.backend.customer.Customer;
import com.subscription.backend.customer.CustomerRepository;
import com.subscription.backend.exception.BusinessRuleException;
import com.subscription.backend.security.JwtTokenProvider;
import com.subscription.backend.security.Role;
import com.subscription.backend.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthService authService;

    @Test
    void testRegisterCustomer_CreatesUserAndCustomerLinked() {
        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest(
                "customer@test.com", "Secret@123", "John Doe", "1234567890", "123 Main St"
        );

        when(userRepository.existsByEmail("customer@test.com")).thenReturn(false);
        when(passwordEncoder.encode("Secret@123")).thenReturn("encodedSecret");

        Customer savedCustomer = Customer.builder().id(5L).name("John Doe").email("customer@test.com").build();
        when(customerRepository.save(any(Customer.class))).thenReturn(savedCustomer);

        User savedUser = User.builder().id(10L).email("customer@test.com").role(Role.CUSTOMER).customerId(5L).build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        when(tokenProvider.generateToken("customer@test.com", Role.CUSTOMER, 10L, 5L)).thenReturn("mock.jwt.token");

        AuthDto.AuthResponse response = authService.registerCustomer(request);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
        assertEquals(Role.CUSTOMER, response.getRole());
        assertEquals(5L, response.getCustomerId());
        assertEquals(10L, response.getUserId());
    }

    @Test
    void testRegisterCustomer_DuplicateEmail_ThrowsException() {
        AuthDto.RegisterRequest request = new AuthDto.RegisterRequest(
                "existing@test.com", "Secret@123", "Jane Doe", null, null
        );

        when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);

        assertThrows(BusinessRuleException.class, () -> authService.registerCustomer(request));
        verify(customerRepository, never()).save(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void testCreateStaff_CreatesStaffUser() {
        AuthDto.CreateStaffRequest request = new AuthDto.CreateStaffRequest(
                "staff@subscriptiq.com", "Staff@123", "Staff Member"
        );

        when(userRepository.existsByEmail("staff@subscriptiq.com")).thenReturn(false);
        when(passwordEncoder.encode("Staff@123")).thenReturn("encodedStaff");

        User savedStaff = User.builder().id(20L).email("staff@subscriptiq.com").role(Role.STAFF).build();
        when(userRepository.save(any(User.class))).thenReturn(savedStaff);

        AuthDto.AuthResponse response = authService.createStaff(request);

        assertNotNull(response);
        assertEquals(Role.STAFF, response.getRole());
        assertEquals(20L, response.getUserId());
    }
}
