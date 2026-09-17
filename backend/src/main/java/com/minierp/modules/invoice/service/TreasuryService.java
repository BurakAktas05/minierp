package com.minierp.modules.invoice.service;

import com.minierp.modules.invoice.dto.CreateTreasuryAccountRequest;
import com.minierp.modules.invoice.dto.TreasuryAccountDto;

import java.util.List;

public interface TreasuryService {

    List<TreasuryAccountDto> getAllAccounts();

    TreasuryAccountDto getAccountById(Long id);

    TreasuryAccountDto createAccount(CreateTreasuryAccountRequest request);

    TreasuryAccountDto updateAccount(Long id, CreateTreasuryAccountRequest request);

    void deleteAccount(Long id);
}
