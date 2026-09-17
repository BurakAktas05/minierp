package com.minierp.modules.partner.repository;

import com.minierp.modules.partner.entity.BusinessPartner;
import com.minierp.modules.partner.entity.PartnerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BusinessPartnerRepository extends JpaRepository<BusinessPartner, Long> {

    List<BusinessPartner> findByPartnerType(PartnerType partnerType);

    Optional<BusinessPartner> findByTaxNumber(String taxNumber);

    boolean existsByTaxNumber(String taxNumber);

    Optional<BusinessPartner> findByCode(String code);

    boolean existsByCode(String code);
}
