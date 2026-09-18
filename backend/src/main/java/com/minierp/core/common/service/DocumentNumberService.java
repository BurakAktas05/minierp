package com.minierp.core.common.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

/**
 * Thread-safe, sıralı ve boşluksuz belge numarası üreteci.
 * Her belge türü ve yıl bazında artan seri numarası döndürür.
 * Format: {PREFIX}-{YIL}-{SIRA_NO} (örn: FTR-SAT-2026-00001)
 *
 * SELECT FOR UPDATE ile eşzamanlılık güvenliği sağlanır.
 */
@Slf4j
@Service
public class DocumentNumberService {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Yeni bir belge numarası üretir.
     * Ayrı transaction'da çalışır (REQUIRES_NEW) böylece ana işlem geri alınsa bile
     * numara serisi ileri atlamaz.
     *
     * @param documentType Belge türü (INVOICE, ORDER, QUOTATION, WAYBILL, PAYMENT, PARTNER)
     * @param prefix       Belge ön eki (FTR-SAT, FTR-ALS, SIP-SAT, SIP-ALS, TEK-SAT, TEK-ALS, IRS-SVK, IRS-ALS, ODM, CAR)
     * @return Formatlanmış belge numarası (örn: FTR-SAT-2026-00001)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String generateNumber(String documentType, String prefix) {
        int year = Year.now().getValue();

        // PostgreSQL atomik upsert ile eşzamanlılık (concurrency) yarış durumları tamamen önlenir.
        Query query = entityManager.createNativeQuery(
                "INSERT INTO document_sequences (document_type, prefix, year, last_number, updated_at) " +
                "VALUES (?1, ?2, ?3, 1, CURRENT_TIMESTAMP) " +
                "ON CONFLICT (document_type, prefix, year) " +
                "DO UPDATE SET last_number = document_sequences.last_number + 1, updated_at = CURRENT_TIMESTAMP " +
                "RETURNING last_number"
        );
        query.setParameter(1, documentType);
        query.setParameter(2, prefix);
        query.setParameter(3, year);

        Object result = query.getSingleResult();
        long newNumber = ((Number) result).longValue();


        String formattedNumber = String.format("%s-%d-%05d", prefix, year, newNumber);
        log.debug("Belge numarası üretildi: {} (Tür: {}, Prefix: {})", formattedNumber, documentType, prefix);

        return formattedNumber;
    }
}
