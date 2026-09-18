package com.minierp.modules.manufacturing.service;

import com.minierp.modules.manufacturing.dto.*;
import com.minierp.modules.manufacturing.entity.WorkOrderStatus;

import java.util.List;

public interface ManufacturingService {

    BomDto createBom(CreateBomRequest request);

    List<BomDto> getAllBoms(String industryType);

    BomDto getBomById(Long id);

    WorkOrderDto createWorkOrder(CreateWorkOrderRequest request);

    List<WorkOrderDto> getAllWorkOrders(WorkOrderStatus status);

    WorkOrderDto getWorkOrderById(Long id);

    WorkOrderDto updateWorkOrderStatus(Long id, WorkOrderStatus status);

    List<SectorTemplateDto> getSectorTemplates();

    List<com.minierp.modules.inventory.dto.ProductVariantResponse> getManufacturableVariants();

    List<com.minierp.modules.inventory.dto.ProductVariantResponse> getComponentVariants();
}
