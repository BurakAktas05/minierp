package com.minierp.core.security.entity;

/**
 * Kullanıcı yetki rolleri.
 * Spring Security GrantedAuthority standardına uygun olarak "ROLE_" ön eki kullanılır.
 */
public enum UserRole {
    ROLE_ADMIN,
    ROLE_MANAGER,
    ROLE_USER
}
