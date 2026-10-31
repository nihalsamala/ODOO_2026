package com.subscription.backend.customer;

import com.subscription.backend.auth.AuthService;
import com.subscription.backend.exception.BusinessRuleException;
import com.subscription.backend.exception.ResourceNotFoundException;
import com.subscription.backend.security.Role;
import com.subscription.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final AuthService authService;

    @Transactional
    public CustomerDto.CustomerResponse createCustomer(CustomerDto.CustomerRequest request) {
        if (customerRepository.existsByEmail(request.getEmail())) {
            throw new BusinessRuleException("A customer with email " + request.getEmail() + " already exists");
        }

        Customer customer = Customer.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phone(request.getPhone())
                .address(request.getAddress())
                .build();

        Customer saved = customerRepository.save(customer);
        return toCustomerResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CustomerDto.CustomerResponse> getAllCustomers() {
        UserPrincipal currentUser = authService.getCurrentUser();
        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            Long customerId = currentUser.getCustomerId();
            if (customerId == null) {
                return Collections.emptyList();
            }
            return customerRepository.findById(customerId)
                    .map(c -> List.of(toCustomerResponse(c)))
                    .orElse(Collections.emptyList());
        }

        return customerRepository.findAll().stream()
                .map(this::toCustomerResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerDto.CustomerResponse getCustomerById(Long id) {
        enforceCustomerAccess(id);
        Customer customer = findCustomerEntityById(id);
        return toCustomerResponse(customer);
    }

    @Transactional
    public CustomerDto.CustomerResponse updateCustomer(Long id, CustomerDto.CustomerRequest request) {
        enforceCustomerAccess(id);
        Customer customer = findCustomerEntityById(id);

        if (!customer.getEmail().equalsIgnoreCase(request.getEmail().trim()) &&
                customerRepository.existsByEmail(request.getEmail().trim())) {
            throw new BusinessRuleException("Email " + request.getEmail() + " is already in use by another customer");
        }

        customer.setName(request.getName().trim());
        customer.setEmail(request.getEmail().trim().toLowerCase());
        customer.setPhone(request.getPhone());
        customer.setAddress(request.getAddress());

        Customer updated = customerRepository.save(customer);
        return toCustomerResponse(updated);
    }

    @Transactional(readOnly = true)
    public Customer findCustomerEntityById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
    }

    public void enforceCustomerAccess(Long targetCustomerId) {
        UserPrincipal currentUser = authService.getCurrentUser();
        if (currentUser != null && currentUser.getRole() == Role.CUSTOMER) {
            Long customerId = currentUser.getCustomerId();
            if (customerId == null || !customerId.equals(targetCustomerId)) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Customers can only access their own customer profile");
            }
        }
    }

    public CustomerDto.CustomerResponse toCustomerResponse(Customer customer) {
        return CustomerDto.CustomerResponse.builder()
                .id(customer.getId())
                .name(customer.getName())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .userId(customer.getUserId())
                .createdAt(customer.getCreatedAt())
                .build();
    }
}
