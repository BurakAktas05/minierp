package com.minierp.modules.invoice.service.impl;

import com.minierp.core.common.exception.BusinessException;
import com.minierp.core.common.exception.ResourceNotFoundException;
import com.minierp.modules.invoice.dto.CreateTreasuryAccountRequest;
import com.minierp.modules.invoice.dto.TreasuryAccountDto;
import com.minierp.modules.invoice.entity.TreasuryAccount;
import com.minierp.modules.invoice.entity.TreasuryAccountType;
import com.minierp.modules.invoice.mapper.TreasuryMapper;
import com.minierp.modules.invoice.repository.TreasuryAccountRepository;
import com.minierp.modules.invoice.service.TreasuryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TreasuryServiceImpl implements TreasuryService {

    private final TreasuryAccountRepository treasuryAccountRepository;
    private final TreasuryMapper treasuryMapper;

    @Override
    @Transactional(readOnly = true)
    public List<TreasuryAccountDto> getAllAccounts() {
        List<TreasuryAccount> accounts = treasuryAccountRepository.findByActiveTrue();
        return treasuryMapper.toDtoList(accounts);
    }

    @Override
    @Transactional(readOnly = true)
    public TreasuryAccountDto getAccountById(Long id) {
        TreasuryAccount account = treasuryAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kasa/Banka Hesabı", "id", id));
        return treasuryMapper.toDto(account);
    }

    @Override
    @Transactional
    public TreasuryAccountDto createAccount(CreateTreasuryAccountRequest request) {
        String code = request.getAccountCode();
        if (code == null || code.isBlank()) {
            String prefix = request.getAccountType() == TreasuryAccountType.CASH ? "KASA-" : "BNK-";
            code = prefix + System.currentTimeMillis() % 100000;
        }

        if (treasuryAccountRepository.existsByAccountCode(code)) {
            throw new BusinessException("Bu hesap kodu zaten kullanımda: " + code);
        }

        TreasuryAccount account = TreasuryAccount.builder()
                .accountCode(code)
                .accountName(request.getAccountName())
                .accountType(request.getAccountType())
                .currency(request.getCurrency() != null ? request.getCurrency() : "TRY")
                .currentBalance(request.getInitialBalance() != null ? request.getInitialBalance() : BigDecimal.ZERO)
                .bankName(request.getBankName())
                .branchCode(request.getBranchCode())
                .iban(request.getIban())
                .active(true)
                .notes(request.getNotes())
                .metadata(request.getMetadata() != null ? request.getMetadata() : new HashMap<>())
                .build();

        TreasuryAccount saved = treasuryAccountRepository.save(account);
        log.info("Yeni Kasa/Banka hesabı açıldı: Kod={}, Ad={}, Tür={}, Açılış Bakiyesi={}",
                saved.getAccountCode(), saved.getAccountName(), saved.getAccountType(), saved.getCurrentBalance());

        return treasuryMapper.toDto(saved);
    }

    @Override
    @Transactional
    public TreasuryAccountDto updateAccount(Long id, CreateTreasuryAccountRequest request) {
        TreasuryAccount account = treasuryAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kasa/Banka Hesabı", "id", id));

        account.setAccountName(request.getAccountName());
        account.setAccountType(request.getAccountType());
        if (request.getCurrency() != null) account.setCurrency(request.getCurrency());
        if (request.getBankName() != null) account.setBankName(request.getBankName());
        if (request.getBranchCode() != null) account.setBranchCode(request.getBranchCode());
        if (request.getIban() != null) account.setIban(request.getIban());
        if (request.getNotes() != null) account.setNotes(request.getNotes());
        if (request.getMetadata() != null) account.setMetadata(request.getMetadata());

        TreasuryAccount updated = treasuryAccountRepository.save(account);
        log.info("Kasa/Banka hesabı güncellendi: Kod={}, Ad={}", updated.getAccountCode(), updated.getAccountName());

        return treasuryMapper.toDto(updated);
    }

    @Override
    @Transactional
    public void deleteAccount(Long id) {
        TreasuryAccount account = treasuryAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Kasa/Banka Hesabı", "id", id));

        if (account.getCurrentBalance().compareTo(BigDecimal.ZERO) != 0) {
            throw new BusinessException(String.format("Bakiyesi sıfır olmayan hesap silinemez! Mevcut Bakiye: %.2f %s",
                    account.getCurrentBalance(), account.getCurrency()));
        }

        account.setActive(false);
        treasuryAccountRepository.save(account);
        log.info("Kasa/Banka hesabı pasife alındı: Kod={}", account.getAccountCode());
    }
}
