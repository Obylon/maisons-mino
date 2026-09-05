package com.mino.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "convention_prestation")
@Getter
@Setter
@NoArgsConstructor
public class ConventionPrestation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "professionnel_id", nullable = false)
    private Professionnel professionnel;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal tarif = new BigDecimal("75.00");

    private String statut;

    @Column(name = "date_signature")
    private LocalDate dateSignature;
}
