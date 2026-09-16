package com.minierp.core.security.entity;

import com.minierp.core.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * Kiracı şemasında saklanan kullanıcı entity'si.
 * Her kiracının kendi bağımsız kullanıcı havuzu vardır.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private UserRole role = UserRole.ROLE_USER;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
