package com.subscription.backend.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByActive(boolean active);
    java.util.Optional<Product> findByName(String name);
    boolean existsByName(String name);
}
