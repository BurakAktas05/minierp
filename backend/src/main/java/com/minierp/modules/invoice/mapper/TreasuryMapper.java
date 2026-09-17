package com.minierp.modules.invoice.mapper;

import com.minierp.modules.invoice.dto.TreasuryAccountDto;
import com.minierp.modules.invoice.entity.TreasuryAccount;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface TreasuryMapper {

    TreasuryAccountDto toDto(TreasuryAccount entity);

    List<TreasuryAccountDto> toDtoList(List<TreasuryAccount> entities);
}
