package com.minierp.modules.invoice.repository;

import com.minierp.modules.invoice.entity.TreasuryAccount;
import com.minierp.modules.invoice.entity.TreasuryAccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TreasuryAccountRepository extends JpaRepository<TreasuryAccount, Long> {

    Optional<TreasuryAccount> findByAccountCode(String accountCode);

    List<TreasuryAccount> findByActiveTrue();

    List<TreasuryAccount> findByAccountTypeAndActiveTrue(TreasuryAccountType accountType);

    boolean existsByAccountCode(String accountCode);
}
