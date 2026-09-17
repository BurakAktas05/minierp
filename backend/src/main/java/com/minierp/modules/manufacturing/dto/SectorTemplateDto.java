package com.minierp.modules.manufacturing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SectorTemplateDto {
    private String sectorKey;
    private String name;
    private String description;
    private String icon;
    private List<String> commonUnits;
    private List<String> dynamicAttributes;
    private Map<String, Object> sampleBom;
    private String criticalTracking; // e.g., "Lot / SKT", "Seri No", "Renk / Beden"
}
