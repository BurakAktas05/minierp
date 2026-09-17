package com.minierp.modules.partner.service.impl;

import com.minierp.core.common.exception.ResourceNotFoundException;
import com.minierp.modules.invoice.entity.Invoice;
import com.minierp.modules.invoice.entity.InvoiceStatus;
import com.minierp.modules.invoice.entity.InvoiceType;
import com.minierp.modules.invoice.entity.Payment;
import com.minierp.modules.invoice.entity.PaymentStatus;
import com.minierp.modules.invoice.entity.PaymentType;
import com.minierp.modules.invoice.repository.InvoiceRepository;
import com.minierp.modules.invoice.repository.PaymentRepository;
import com.minierp.modules.partner.dto.BusinessPartnerDto;
import com.minierp.modules.partner.dto.PartnerStatementResponse;
import com.minierp.modules.partner.entity.BusinessPartner;
import com.minierp.modules.partner.repository.BusinessPartnerRepository;
import com.minierp.modules.partner.service.PartnerFinancialService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartnerFinancialServiceImpl implements PartnerFinancialService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final BusinessPartnerRepository businessPartnerRepository;

    private static final List<InvoiceStatus> OFFICIAL_STATUSES = List.of(
            InvoiceStatus.APPROVED,
            InvoiceStatus.SENT,
            InvoiceStatus.PARTIALLY_PAID,
            InvoiceStatus.PAID
    );

    @Override
    @Transactional(readOnly = true)
    public void calculateAndSetBalances(List<BusinessPartnerDto> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return;
        }

        Map<Long, BigDecimal> debitMap = new HashMap<>();
        Map<Long, BigDecimal> creditMap = new HashMap<>();

        // 1. Satış Faturaları -> Borç (Debit)
        List<Object[]> salesTotals = invoiceRepository.sumTotalAmountByInvoiceTypeGroupedByPartner(
                InvoiceType.SALES_INVOICE, OFFICIAL_STATUSES);
        for (Object[] row : salesTotals) {
            if (row[0] != null && row[1] != null) {
                Long partnerId = ((Number) row[0]).longValue();
                BigDecimal amount = (BigDecimal) row[1];
                debitMap.merge(partnerId, amount, BigDecimal::add);
            }
        }

        // 2. Alış Faturaları -> Alacak (Credit)
        List<Object[]> purchaseTotals = invoiceRepository.sumTotalAmountByInvoiceTypeGroupedByPartner(
                InvoiceType.PURCHASE_INVOICE, OFFICIAL_STATUSES);
        for (Object[] row : purchaseTotals) {
            if (row[0] != null && row[1] != null) {
                Long partnerId = ((Number) row[0]).longValue();
                BigDecimal amount = (BigDecimal) row[1];
                creditMap.merge(partnerId, amount, BigDecimal::add);
            }
        }

        // 3. Tediye (Giden) Ödemeler -> Borç (Debit)
        List<Object[]> outgoingTotals = paymentRepository.sumAmountByPaymentTypeGroupedByPartner(
                PaymentType.OUTGOING, PaymentStatus.COMPLETED);
        for (Object[] row : outgoingTotals) {
            if (row[0] != null && row[1] != null) {
                Long partnerId = ((Number) row[0]).longValue();
                BigDecimal amount = (BigDecimal) row[1];
                debitMap.merge(partnerId, amount, BigDecimal::add);
            }
        }

        // 4. Tahsilat (Gelen) Ödemeler -> Alacak (Credit)
        List<Object[]> incomingTotals = paymentRepository.sumAmountByPaymentTypeGroupedByPartner(
                PaymentType.INCOMING, PaymentStatus.COMPLETED);
        for (Object[] row : incomingTotals) {
            if (row[0] != null && row[1] != null) {
                Long partnerId = ((Number) row[0]).longValue();
                BigDecimal amount = (BigDecimal) row[1];
                creditMap.merge(partnerId, amount, BigDecimal::add);
            }
        }

        for (BusinessPartnerDto dto : dtos) {
            BigDecimal debit = debitMap.getOrDefault(dto.getId(), BigDecimal.ZERO);
            BigDecimal credit = creditMap.getOrDefault(dto.getId(), BigDecimal.ZERO);
            dto.setTotalDebit(debit);
            dto.setTotalCredit(credit);
            dto.setBalance(debit.subtract(credit));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public void calculateAndSetBalance(BusinessPartnerDto dto) {
        if (dto == null || dto.getId() == null) {
            return;
        }

        BigDecimal salesTotal = invoiceRepository.sumTotalAmountByPartnerAndInvoiceType(
                dto.getId(), InvoiceType.SALES_INVOICE, OFFICIAL_STATUSES);
        BigDecimal purchaseTotal = invoiceRepository.sumTotalAmountByPartnerAndInvoiceType(
                dto.getId(), InvoiceType.PURCHASE_INVOICE, OFFICIAL_STATUSES);
        BigDecimal outgoingTotal = paymentRepository.sumAmountByPartnerAndPaymentType(
                dto.getId(), PaymentType.OUTGOING, PaymentStatus.COMPLETED);
        BigDecimal incomingTotal = paymentRepository.sumAmountByPartnerAndPaymentType(
                dto.getId(), PaymentType.INCOMING, PaymentStatus.COMPLETED);

        BigDecimal debit = salesTotal.add(outgoingTotal);
        BigDecimal credit = purchaseTotal.add(incomingTotal);

        dto.setTotalDebit(debit);
        dto.setTotalCredit(credit);
        dto.setBalance(debit.subtract(credit));
    }

    @Override
    @Transactional(readOnly = true)
    public PartnerStatementResponse getPartnerStatement(Long partnerId) {
        BusinessPartner partner = businessPartnerRepository.findById(partnerId)
                .orElseThrow(() -> new ResourceNotFoundException("Cari Hesap", "id", partnerId));

        List<Invoice> invoices = invoiceRepository.findByPartnerId(partnerId);
        List<Payment> payments = paymentRepository.findByPartnerId(partnerId);

        List<PartnerStatementResponse.StatementLine> lines = new ArrayList<>();

        // 1. Resmi Faturaları ekstre satırlarına dönüştür (DRAFT ve CANCELLED hariç)
        for (Invoice inv : invoices) {
            if (!isOfficialInvoice(inv)) {
                continue;
            }

            BigDecimal debit = BigDecimal.ZERO;
            BigDecimal credit = BigDecimal.ZERO;
            String desc = (inv.getInvoiceType() == InvoiceType.SALES_INVOICE) ? "Satış Faturası" : "Alış Faturası";
            if (inv.getNotes() != null && !inv.getNotes().isBlank()) {
                desc += " (" + inv.getNotes() + ")";
            }

            BigDecimal amount = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;
            if (inv.getInvoiceType() == InvoiceType.SALES_INVOICE) {
                debit = amount;
            } else {
                credit = amount;
            }

            lines.add(PartnerStatementResponse.StatementLine.builder()
                    .id(inv.getId())
                    .date(inv.getInvoiceDate())
                    .documentType(inv.getInvoiceType().name())
                    .documentNumber(inv.getInvoiceNumber())
                    .description(desc)
                    .debit(debit)
                    .credit(credit)
                    .status(inv.getStatus().name())
                    .currency(inv.getCurrency() != null ? inv.getCurrency() : "TRY")
                    .build());
        }

        // 2. Ödemeleri ekstre satırlarına dönüştür
        for (Payment pay : payments) {
            if (pay.getStatus() != PaymentStatus.COMPLETED) {
                continue;
            }

            BigDecimal debit = BigDecimal.ZERO;
            BigDecimal credit = BigDecimal.ZERO;
            String methodStr = pay.getPaymentMethod() != null ? pay.getPaymentMethod().name() : "";
            String desc = (pay.getPaymentType() == PaymentType.INCOMING) ? "Tahsilat" : "Ödeme";
            desc += " [" + methodStr + "]";
            if (pay.getReferenceNumber() != null && !pay.getReferenceNumber().isBlank()) {
                desc += " Ref: " + pay.getReferenceNumber();
            }

            BigDecimal amount = pay.getAmount() != null ? pay.getAmount() : BigDecimal.ZERO;
            if (pay.getPaymentType() == PaymentType.OUTGOING) {
                debit = amount;
            } else {
                credit = amount;
            }

            lines.add(PartnerStatementResponse.StatementLine.builder()
                    .id(pay.getId())
                    .date(pay.getPaymentDate())
                    .documentType(pay.getPaymentType().name())
                    .documentNumber(pay.getPaymentNumber())
                    .description(desc)
                    .debit(debit)
                    .credit(credit)
                    .status(pay.getStatus().name())
                    .currency(pay.getCurrency() != null ? pay.getCurrency() : "TRY")
                    .build());
        }

        // 3. Kronolojik sıralama (Eskiden yeniye)
        lines.sort(Comparator.comparing(
                PartnerStatementResponse.StatementLine::getDate,
                Comparator.nullsLast(Comparator.naturalOrder())
        ));

        // 4. Kümülatif bakiye hesaplama (Running Balance)
        BigDecimal runningBalance = BigDecimal.ZERO;
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        for (PartnerStatementResponse.StatementLine line : lines) {
            BigDecimal d = line.getDebit() != null ? line.getDebit() : BigDecimal.ZERO;
            BigDecimal c = line.getCredit() != null ? line.getCredit() : BigDecimal.ZERO;
            totalDebit = totalDebit.add(d);
            totalCredit = totalCredit.add(c);
            runningBalance = runningBalance.add(d).subtract(c);
            line.setRunningBalance(runningBalance);
        }

        return PartnerStatementResponse.builder()
                .partnerId(partner.getId())
                .partnerName(partner.getName())
                .partnerCode("CAR-" + String.format("%04d", partner.getId()))
                .partnerType(partner.getPartnerType().name())
                .totalDebit(totalDebit)
                .totalCredit(totalCredit)
                .balance(runningBalance)
                .lines(lines)
                .build();
    }

    private boolean isOfficialInvoice(Invoice inv) {
        if (inv == null || inv.getStatus() == null) {
            return false;
        }
        InvoiceStatus s = inv.getStatus();
        return s == InvoiceStatus.APPROVED
                || s == InvoiceStatus.SENT
                || s == InvoiceStatus.PARTIALLY_PAID
                || s == InvoiceStatus.PAID;
    }
}
