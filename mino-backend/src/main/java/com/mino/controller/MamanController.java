package com.mino.controller;

import com.mino.dto.ParcoursDtos.ParcoursResponse;
import com.mino.dto.ParcoursDtos.ParcoursUpdateRequest;
import com.mino.model.Maman;
import com.mino.model.Utilisateur;
import com.mino.repository.MamanRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * Parcours personnel d'une maman (14 mois, de M-4 a 10 mois du bebe - voir slide 3
 * du deck). Calcule la semaine de grossesse OU l'age du bebe selon si la naissance
 * a deja eu lieu, a partir des dates deja stockees sur Maman.
 */
@RestController
@RequestMapping("/api/maman")
@RequiredArgsConstructor
public class MamanController {

    private final MamanRepository mamanRepository;

    @GetMapping("/parcours")
    @PreAuthorize("hasRole('MAMAN')")
    public ResponseEntity<ParcoursResponse> monParcours(@AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Maman maman = mamanRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil maman associe a ce compte"));

        LocalDate aujourdHui = LocalDate.now();
        Integer semaineGrossesse = null;
        Integer ageBebeJours = null;

        if (maman.getDateNaissanceBebe() != null && !maman.getDateNaissanceBebe().isAfter(aujourdHui)) {
            ageBebeJours = (int) ChronoUnit.DAYS.between(maman.getDateNaissanceBebe(), aujourdHui);
        } else if (maman.getDateTermeGrossesse() != null) {
            long semainesRestantes = ChronoUnit.WEEKS.between(aujourdHui, maman.getDateTermeGrossesse());
            long semaine = 40 - semainesRestantes;
            semaineGrossesse = (int) Math.max(0, Math.min(42, semaine));
        }

        ParcoursResponse response = new ParcoursResponse(
                maman.getDateEntreeParcours(),
                maman.getDateSortiePrevue(),
                maman.getDateTermeGrossesse(),
                maman.getDateNaissanceBebe(),
                semaineGrossesse,
                ageBebeJours
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Permet a une maman de corriger elle-meme son terme de grossesse ou la date
     * de naissance du bebe - utile si une erreur de saisie s'est glissee a la
     * creation du compte, ou si l'info n'etait pas encore connue a l'epoque.
     */
    @PutMapping("/parcours")
    @PreAuthorize("hasRole('MAMAN')")
    public ResponseEntity<Void> mettreAJourParcours(@RequestBody ParcoursUpdateRequest request,
                                                    @AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Maman maman = mamanRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil maman associe a ce compte"));

        maman.setDateTermeGrossesse(request.dateTermeGrossesse());
        maman.setDateNaissanceBebe(request.dateNaissanceBebe());
        mamanRepository.save(maman);

        return ResponseEntity.noContent().build();
    }
}