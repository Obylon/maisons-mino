package com.mino.controller;

import com.mino.dossier.DossierService;
import com.mino.dto.InscriptionDtos.InscriptionRequest;
import com.mino.dto.InscriptionDtos.InscriptionResponse;
import com.mino.dto.InscriptionDtos.MamanResume;
import com.mino.dto.InscriptionDtos.ProfessionnelResume;
import com.mino.dto.InscriptionDtos.UtilisateurResume;
import com.mino.email.EmailService;
import com.mino.model.*;
import com.mino.repository.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.SecureRandom;
import java.util.List;

/**
 * Creation de compte par la coordinatrice - seul moyen prevu de creer un utilisateur
 * (pas d'auto-inscription publique, voir README backend : "Endpoint d'inscription /
 * creation de compte par la coordinatrice").
 *
 * Route couverte par SecurityConfig ("/api/admin/**" -> ROLE_COORDINATRICE) ; le
 * @PreAuthorize ci-dessous est une securite redondante volontaire (defense en profondeur),
 * dans le meme esprit que le filtrage explicite deja en place dans AtelierController.
 */
@RestController
@RequestMapping("/api/admin/utilisateurs")
@RequiredArgsConstructor
public class InscriptionController {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UtilisateurRepository utilisateurRepository;
    private final MamanRepository mamanRepository;
    private final PartenaireRepository partenaireRepository;
    private final ProfessionnelRepository professionnelRepository;
    private final CohorteRepository cohorteRepository;
    private final GroupeRepository groupeRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final DossierService dossierService;
    private final DossierRepository dossierRepository;
    private final InscriptionAtelierRepository inscriptionAtelierRepository;
    private final QuestionnairePromPremRepository questionnaireRepository;
    private final MessageRepository messageRepository;
    private final LectureRepository lectureRepository;
    private final CompteRenduRepository compteRenduRepository;
    private final ConventionPrestationRepository conventionRepository;
    private final AtelierRepository atelierRepository;

    @PostMapping
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<?> creerCompte(@Valid @RequestBody InscriptionRequest request) {

        if (utilisateurRepository.existsByEmail(request.email())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Un compte existe deja avec cet email.");
        }

        // --- Validation des champs specifiques au role, avant toute ecriture en base ---
        Cohorte cohorte = null;
        Groupe groupe = null;
        if (request.role() == Role.MAMAN) {
            if (request.cohorteId() == null) {
                return ResponseEntity.badRequest()
                        .body("cohorteId est requis pour une inscription MAMAN.");
            }
            cohorte = cohorteRepository.findById(request.cohorteId())
                    .orElse(null);
            if (cohorte == null) {
                return ResponseEntity.badRequest().body("Cohorte introuvable : " + request.cohorteId());
            }
            // groupeId est volontairement optionnel ici : une maman est d'abord creee "en
            // attente" (sans groupe), puis affectee plus tard par la coordinatrice via
            // POST /api/groupes/constituer (voir GroupeController). Imposer un groupe des
            // la creation du compte creerait un probleme d'oeuf et de poule : il faut deja
            // des mamans "en attente" pour pouvoir en constituer un groupe.
            if (request.groupeId() != null) {
                groupe = groupeRepository.findById(request.groupeId())
                        .orElse(null);
                if (groupe == null) {
                    return ResponseEntity.badRequest().body("Groupe introuvable : " + request.groupeId());
                }
            }
        }
        if (request.role() == Role.PROFESSIONNEL && request.specialite() == null) {
            return ResponseEntity.badRequest()
                    .body("specialite est requise pour une inscription PROFESSIONNEL.");
        }

        // --- Generation du mot de passe temporaire (jamais choisi par la coordinatrice) ---
        String motDePasseTemporaire = genererMotDePasseTemporaire();

        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail(request.email());
        utilisateur.setNom(request.nom());
        utilisateur.setPrenom(request.prenom());
        utilisateur.setTelephone(request.telephone());
        utilisateur.setRole(request.role());
        utilisateur.setMotDePasseHash(passwordEncoder.encode(motDePasseTemporaire));
        utilisateur.setActif(true);
        utilisateur = utilisateurRepository.save(utilisateur);

        // --- Creation de l'extension de role (voir Utilisateur.java : la Coordinatrice
        //     n'a pas de table d'extension, son role seul lui donne l'acces admin) ---
        switch (request.role()) {
            case MAMAN -> {
                Maman maman = new Maman();
                maman.setUtilisateur(utilisateur);
                maman.setCohorte(cohorte);
                maman.setGroupe(groupe);
                maman.setDateTermeGrossesse(request.dateTermeGrossesse());
                maman.setDateNaissanceBebe(request.dateNaissanceBebe());
                maman.setDateEntreeParcours(request.dateEntreeParcours());
                maman.setDateSortiePrevue(request.dateSortiePrevue());
                mamanRepository.save(maman);
            }
            case PARTENAIRE -> {
                Partenaire partenaire = new Partenaire();
                partenaire.setUtilisateur(utilisateur);
                partenaire.setMamanId(request.mamanId());
                partenaire.setLienAdministratifUniquement(true);
                partenaireRepository.save(partenaire);
            }
            case PROFESSIONNEL -> {
                Professionnel professionnel = new Professionnel();
                professionnel.setUtilisateur(utilisateur);
                professionnel.setSpecialite(request.specialite());
                professionnel.setStatutConventionnement(request.statutConventionnement());
                professionnelRepository.save(professionnel);
            }
            case COORDINATRICE -> {
                // Pas d'extension - le role seul suffit (voir commentaire Utilisateur.java).
            }
        }

        InscriptionResponse response = new InscriptionResponse(
                utilisateur.getId(),
                utilisateur.getEmail(),
                utilisateur.getRole(),
                motDePasseTemporaire
        );

        emailService.envoyer(
                utilisateur.getEmail(),
                "Votre compte Maisons MINO",
                "Bonjour " + utilisateur.getPrenom() + ",\n\n"
                        + "Votre compte Maisons MINO a ete cree.\n"
                        + "Email : " + utilisateur.getEmail() + "\n"
                        + "Mot de passe temporaire : " + motDePasseTemporaire + "\n\n"
                        + "Connectez-vous puis pensez a le changer des que possible.\n\n"
                        + "L'equipe Maisons MINO"
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<Page<UtilisateurResume>> lister(@PageableDefault(size = 20) Pageable pageable) {
        Page<UtilisateurResume> utilisateurs = utilisateurRepository.findAll(pageable)
                .map(u -> new UtilisateurResume(u.getId(), u.getEmail(), u.getRole(), u.getNom(), u.getPrenom(), u.isActif()));
        return ResponseEntity.ok(utilisateurs);
    }

    /** Liste des mamans (nom/prenom + id Maman) - utilisee pour lier un compte PARTENAIRE. */
    @GetMapping("/mamans")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<List<MamanResume>> listerMamans() {
        List<MamanResume> mamans = mamanRepository.findAll().stream()
                .filter(m -> m.getUtilisateur().isActif())
                .map(m -> new MamanResume(m.getId(), m.getUtilisateur().getNom(), m.getUtilisateur().getPrenom()))
                .toList();
        return ResponseEntity.ok(mamans);
    }

    /** Liste des professionnels (nom/prenom/specialite + id Professionnel) - pour creer une convention ou un atelier. */
    @GetMapping("/professionnels")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<List<ProfessionnelResume>> listerProfessionnels() {
        List<ProfessionnelResume> professionnels = professionnelRepository.findAll().stream()
                .filter(p -> p.getUtilisateur().isActif())
                .map(p -> new ProfessionnelResume(
                        p.getId(), p.getUtilisateur().getNom(), p.getUtilisateur().getPrenom(),
                        p.getSpecialite() != null ? p.getSpecialite().name() : null
                ))
                .toList();
        return ResponseEntity.ok(professionnels);
    }

    /**
     * Desactivation plutot que suppression physique : un compte (surtout MAMAN) peut
     * avoir des messages, questionnaires PROM/PREM, inscriptions a des ateliers lies -
     * les supprimer casserait ces donnees. Desactiver coupe l'acces (le login refusera
     * ce compte via CustomUserDetailsService) sans perdre l'historique.
     */
    @PostMapping("/{id}/desactiver")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<UtilisateurResume> desactiver(@PathVariable String id) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Utilisateur introuvable : " + id));
        utilisateur.setActif(false);
        utilisateur = utilisateurRepository.save(utilisateur);
        return ResponseEntity.ok(new UtilisateurResume(
                utilisateur.getId(), utilisateur.getEmail(), utilisateur.getRole(),
                utilisateur.getNom(), utilisateur.getPrenom(), utilisateur.isActif()));
    }

    /**
     * Reinitialise le mot de passe d'un compte - resout le probleme du mot de
     * passe temporaire perdu avant la premiere connexion, sans avoir a recreer
     * le compte (ce qui casserait tout l'historique lie a cet utilisateur).
     */
    @PostMapping("/{id}/reinitialiser-mot-de-passe")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<InscriptionResponse> reinitialiserMotDePasse(@PathVariable String id) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Utilisateur introuvable : " + id));

        String nouveauMotDePasse = genererMotDePasseTemporaire();
        utilisateur.setMotDePasseHash(passwordEncoder.encode(nouveauMotDePasse));
        utilisateur = utilisateurRepository.save(utilisateur);

        InscriptionResponse response = new InscriptionResponse(
                utilisateur.getId(), utilisateur.getEmail(), utilisateur.getRole(), nouveauMotDePasse
        );

        emailService.envoyer(
                utilisateur.getEmail(),
                "Votre mot de passe Maisons MINO a ete reinitialise",
                "Bonjour " + utilisateur.getPrenom() + ",\n\n"
                        + "Votre mot de passe a ete reinitialise par la coordination.\n"
                        + "Nouveau mot de passe temporaire : " + nouveauMotDePasse + "\n\n"
                        + "Connectez-vous puis pensez a le changer des que possible.\n\n"
                        + "L'equipe Maisons MINO"
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/activer")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<UtilisateurResume> activer(@PathVariable String id) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Utilisateur introuvable : " + id));
        utilisateur.setActif(true);
        utilisateur = utilisateurRepository.save(utilisateur);
        return ResponseEntity.ok(new UtilisateurResume(
                utilisateur.getId(), utilisateur.getEmail(), utilisateur.getRole(),
                utilisateur.getNom(), utilisateur.getPrenom(), utilisateur.isActif()));
    }

    /**
     * Suppression DEFINITIVE d'un compte - contrairement a desactiver(), efface
     * reellement toutes les donnees vivantes liees. Avant toute suppression, un
     * dossier archive est genere/mis a jour (voir DossierService) et marque
     * "compte supprime" - c'est cette trace qui persiste, independamment du
     * compte utilisateur qui, lui, disparait completement.
     *
     * Ordre important : archivage AVANT suppression, jamais l'inverse.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATRICE')")
    @Transactional
    public ResponseEntity<Void> supprimerDefinitivement(@PathVariable String id) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Utilisateur introuvable : " + id));

        // 1. Archiver AVANT de toucher a quoi que ce soit
        Dossier dossier = dossierRepository.findByUtilisateurIdOrigine(id)
                .orElseGet(() -> {
                    Dossier nouveau = new Dossier();
                    nouveau.setUtilisateurIdOrigine(id);
                    nouveau.setDateCreation(java.time.LocalDateTime.now());
                    return nouveau;
                });
        dossier.setNom(utilisateur.getNom());
        dossier.setPrenom(utilisateur.getPrenom());
        dossier.setEmail(utilisateur.getEmail());
        dossier.setRole(utilisateur.getRole().name());
        dossier.setCompteSupprime(true);
        dossier.setDateDerniereMaj(java.time.LocalDateTime.now());
        dossier.setContenu(dossierService.genererResume(utilisateur));
        dossierRepository.save(dossier);

        // 2. Cascade de suppression des donnees vivantes liees, selon le role
        switch (utilisateur.getRole()) {
            case MAMAN -> mamanRepository.findByUtilisateurId(id).ifPresent(maman -> {
                // Un partenaire peut pointer vers cette maman - on debranche le lien plutot
                // que de supprimer le partenaire lui-meme.
                partenaireRepository.findByMamanId(maman.getId())
                        .forEach(p -> { p.setMamanId(null); partenaireRepository.save(p); });
                questionnaireRepository.findByMamanId(maman.getId()).forEach(questionnaireRepository::delete);
                inscriptionAtelierRepository.findByUtilisateurId(id).forEach(inscriptionAtelierRepository::delete);
                messageRepository.findByExpediteurId(id).forEach(messageRepository::delete);
                mamanRepository.delete(maman);
            });
            case PARTENAIRE -> partenaireRepository.findAll().stream()
                    .filter(p -> p.getUtilisateur().getId().equals(id))
                    .findFirst()
                    .ifPresent(partenaire -> {
                        inscriptionAtelierRepository.findByUtilisateurId(id).forEach(inscriptionAtelierRepository::delete);
                        messageRepository.findByExpediteurId(id).forEach(messageRepository::delete);
                        partenaireRepository.delete(partenaire);
                    });
            case PROFESSIONNEL -> professionnelRepository.findByUtilisateurId(id).ifPresent(professionnel -> {
                // Les ateliers ne sont pas supprimes - juste debranches de ce professionnel.
                atelierRepository.findByProfessionnelId(professionnel.getId())
                        .forEach(a -> { a.setProfessionnel(null); atelierRepository.save(a); });
                compteRenduRepository.findByProfessionnelId(professionnel.getId()).forEach(compteRenduRepository::delete);
                conventionRepository.findByProfessionnelId(professionnel.getId()).forEach(conventionRepository::delete);
                professionnelRepository.delete(professionnel);
            });
            case COORDINATRICE -> messageRepository.findByExpediteurId(id).forEach(messageRepository::delete);
        }

        lectureRepository.findAll().stream()
                .filter(l -> l.getUtilisateur().getId().equals(id))
                .forEach(lectureRepository::delete);

        utilisateurRepository.delete(utilisateur);
        return ResponseEntity.noContent().build();
    }

    private String genererMotDePasseTemporaire() {
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}