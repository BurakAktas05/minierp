package com.minierp.modules.invoice.mapper;

import com.minierp.modules.invoice.dto.InvoiceResponse;
import com.minierp.modules.invoice.entity.Invoice;
import com.minierp.modules.partner.mapper.BusinessPartnerMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING,
        uses = {BusinessPartnerMapper.class, InvoiceItemMapper.class, PaymentMapper.class})
public interface InvoiceMapper {

    @Mapping(target = "partner", source = "partner")
    @Mapping(target = "items", source = "items")
    @Mapping(target = "payments", source = "payments")
    InvoiceResponse toResponse(Invoice entity);

    List<InvoiceResponse> toResponseList(List<Invoice> entities);
}
