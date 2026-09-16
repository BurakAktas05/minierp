package com.minierp.modules.tenant.service;

import com.minierp.modules.tenant.dto.CreateTenantRequest;
import com.minierp.modules.tenant.dto.TenantResponse;

import java.util.List;

public interface TenantService {

    TenantResponse createTenant(CreateTenantRequest request);

    List<TenantResponse> getAllTenants();

    TenantResponse getTenantById(String tenantId);
}
