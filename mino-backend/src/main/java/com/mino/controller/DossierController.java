package com.mino.controller;

import com.mino.dossier.DossierService;
import com.mino.dto.DossierDtos.DossierDetail;
import com.mino.dto.DossierDtos.DossierResume;
import com.mino.model.Dossier;
import com.mino.model.Utilisateur;
import com.mino.repository.DossierRepository;
import com.mino.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;

/**
 * Dossiers archives - un par personne, tous roles confondus. Persiste meme
 * apres suppression du compte d'origine (voir InscriptionController.supprimerDefinitivement).
 * Reserve a la COORDINATRICE - c'est une trace administrative/historique.
 */
@RestController
@RequestMapping("/api/dossiers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('COORDINATRICE')")
public class DossierController {

    private final DossierRepository dossierRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final DossierService dossierService;

    @GetMapping
    public ResponseEntity<Page<DossierResume>> lister(@PageableDefault(size = 20) Pageable pageable) {
        Page<DossierResume> dossiers = dossierRepository.findAll(pageable)
                .map(d -> new DossierResume(d.getId(), d.getNom(), d.getPrenom(), d.getEmail(),
                        d.getRole(), d.isCompteSupprime(), d.getDateDerniereMaj()));
        return ResponseEntity.ok(dossiers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DossierDetail> obtenir(@PathVariable String id) {
        Dossier d = dossierRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Dossier introuvable : " + id));
        return ResponseEntity.ok(toDetail(d));
    }

    /**
     * Genere ou actualise le dossier d'un compte encore ACTIF (bouton "Actualiser
     * le dossier" cote coordinatrice) - independant de la suppression du compte,
     * qui genere elle aussi automatiquement une derniere version (voir
     * InscriptionController.supprimerDefinitivement).
     */
    @PostMapping("/utilisateur/{utilisateurId}/generer")
    public ResponseEntity<DossierDetail> genererPourUtilisateurActif(@PathVariable String utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new NoSuchElementException("Utilisateur introuvable : " + utilisateurId));

        Dossier dossier = dossierRepository.findByUtilisateurIdOrigine(utilisateurId)
                .orElseGet(() -> {
                    Dossier nouveau = new Dossier();
                    nouveau.setUtilisateurIdOrigine(utilisateurId);
                    nouveau.setDateCreation(LocalDateTime.now());
                    return nouveau;
                });

        dossier.setNom(utilisateur.getNom());
        dossier.setPrenom(utilisateur.getPrenom());
        dossier.setEmail(utilisateur.getEmail());
        dossier.setRole(utilisateur.getRole().name());
        dossier.setCompteSupprime(false);
        dossier.setDateDerniereMaj(LocalDateTime.now());
        dossier.setContenu(dossierService.genererResume(utilisateur));

        dossier = dossierRepository.save(dossier);
        return ResponseEntity.ok(toDetail(dossier));
    }

    private DossierDetail toDetail(Dossier d) {
        return new DossierDetail(d.getId(), d.getNom(), d.getPrenom(), d.getEmail(), d.getRole(),
                d.isCompteSupprime(), d.getDateCreation(), d.getDateDerniereMaj(), d.getContenu());
    }
}