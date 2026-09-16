package com.minierp.modules.tenant.mapper;

import com.minierp.modules.tenant.dto.CreateTenantRequest;
import com.minierp.modules.tenant.dto.TenantResponse;
import com.minierp.modules.tenant.entity.Tenant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TenantMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "active", constant = "true")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "version", ignore = true)
    Tenant toEntity(CreateTenantRequest request);

    TenantResponse toResponse(Tenant entity);

    List<TenantResponse> toResponseList(List<Tenant> entities);
}
