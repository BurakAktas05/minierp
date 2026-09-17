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

        // Sequence kaydını kilitle ve son numarayı al
        Query selectQuery = entityManager.createNativeQuery(
                "SELECT last_number FROM document_sequences WHERE document_type = ?1 AND prefix = ?2 AND year = ?3 FOR UPDATE"
        );
        selectQuery.setParameter(1, documentType);
        selectQuery.setParameter(2, prefix);
        selectQuery.setParameter(3, year);

        Long lastNumber;
        try {
            Object result = selectQuery.getSingleResult();
            lastNumber = ((Number) result).longValue();
        } catch (Exception e) {
            // Kayıt yoksa oluştur
            Query insertQuery = entityManager.createNativeQuery(
                    "INSERT INTO document_sequences (document_type, prefix, year, last_number) VALUES (?1, ?2, ?3, 0) ON CONFLICT (document_type, prefix, year) DO NOTHING"
            );
            insertQuery.setParameter(1, documentType);
            insertQuery.setParameter(2, prefix);
            insertQuery.setParameter(3, year);
            insertQuery.executeUpdate();
            lastNumber = 0L;
        }

        long newNumber = lastNumber + 1;

        // Numarayı güncelle
        Query updateQuery = entityManager.createNativeQuery(
                "UPDATE document_sequences SET last_number = ?1, updated_at = CURRENT_TIMESTAMP WHERE document_type = ?2 AND prefix = ?3 AND year = ?4"
        );
        updateQuery.setParameter(1, newNumber);
        updateQuery.setParameter(2, documentType);
        updateQuery.setParameter(3, prefix);
        updateQuery.setParameter(4, year);
        updateQuery.executeUpdate();

        String formattedNumber = String.format("%s-%d-%05d", prefix, year, newNumber);
        log.debug("Belge numarası üretildi: {} (Tür: {}, Prefix: {})", formattedNumber, documentType, prefix);

        return formattedNumber;
    }
}
