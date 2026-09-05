package com.mino.controller;

import com.mino.dto.GroupeDtos.*;
import com.mino.model.Atelier;
import com.mino.model.Cohorte;
import com.mino.model.Groupe;
import com.mino.model.Maman;
import com.mino.model.Message;
import com.mino.model.Utilisateur;
import com.mino.repository.AtelierRepository;
import com.mino.repository.CohorteRepository;
import com.mino.repository.GroupeRepository;
import com.mino.repository.MamanRepository;
import com.mino.repository.MessageRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

/**
 * Deux vues distinctes sur les groupes, avec des droits differents :
 * - Vue admin (creer/lister/detail/modifier/supprimer/constituer/ajouter-maman) : COORDINATRICE.
 * - Vue "mon groupe" (/mon-groupe) : reservee MAMAN, ne montre que SON groupe et
 *   le prenom des autres membres, jamais de donnees de sante (voir GroupeDtos).
 */
@RestController
@RequestMapping("/api/groupes")
@RequiredArgsConstructor
public class GroupeController {

    private final GroupeRepository groupeRepository;
    private final CohorteRepository cohorteRepository;
    private final MamanRepository mamanRepository;
    private final AtelierRepository atelierRepository;
    private final MessageRepository messageRepository;

    /** Creation d'un groupe VIDE, independamment de toute selection de mamans. */
    @PostMapping
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<GroupeResponse> creer(@Valid @RequestBody GroupeRequest request) {
        Cohorte cohorte = cohorteRepository.findById(request.cohorteId())
                .orElseThrow(() -> new NoSuchElementException("Cohorte introuvable : " + request.cohorteId()));

        Groupe groupe = new Groupe();
        groupe.setCohorte(cohorte);
        groupe.setNom(request.nom());
        groupe.setDateConstitution(request.dateConstitution());
        groupe = groupeRepository.save(groupe);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(groupe));
    }

    /**
     * Cree un groupe ET affecte immediatement les mamans selectionnees, en une seule
     * action - reflete le bouton "Constituer un groupe avec la selection" du mockup.
     */
    @PostMapping("/constituer")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<GroupeResponse> constituer(@Valid @RequestBody ConstituerGroupeRequest request) {
        Cohorte cohorte = cohorteRepository.findById(request.cohorteId())
                .orElseThrow(() -> new NoSuchElementException("Cohorte introuvable : " + request.cohorteId()));

        List<String> ids = request.mamanIds() != null ? request.mamanIds() : List.of();
        if (ids.isEmpty()) {
            throw new IllegalArgumentException("Selectionnez au moins une maman pour constituer un groupe.");
        }

        List<Maman> mamans = ids.stream()
                .map(id -> mamanRepository.findById(id)
                        .orElseThrow(() -> new NoSuchElementException("Maman introuvable : " + id)))
                .toList();

        for (Maman m : mamans) {
            if (!m.getCohorte().getId().equals(request.cohorteId())) {
                throw new IllegalArgumentException(
                        "La maman " + m.getUtilisateur().getPrenom() + " n'appartient pas a cette cohorte.");
            }
            if (m.getGroupe() != null) {
                throw new IllegalStateException(
                        "La maman " + m.getUtilisateur().getPrenom() + " a deja un groupe assigne.");
            }
        }

        Groupe groupe = new Groupe();
        groupe.setCohorte(cohorte);
        groupe.setNom(request.nom());
        groupe.setDateConstitution(request.dateConstitution());
        groupe = groupeRepository.save(groupe);

        for (Maman m : mamans) {
            m.setGroupe(groupe);
            mamanRepository.save(m);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(groupe));
    }

    /**
     * Ajoute UNE maman a un groupe DEJA EXISTANT (au lieu de systematiquement en creer
     * un nouveau). Refuse si le groupe est deja complet (5) ou si la maman a deja un groupe.
     */
    @PostMapping("/{id}/mamans")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<GroupeResponse> ajouterMaman(@PathVariable String id,
                                                          @Valid @RequestBody AjouterMamanRequest request) {
        Groupe groupe = groupeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Groupe introuvable : " + id));
        Maman maman = mamanRepository.findById(request.mamanId())
                .orElseThrow(() -> new NoSuchElementException("Maman introuvable : " + request.mamanId()));

        if (maman.getGroupe() != null) {
            throw new IllegalStateException(
                    "La maman " + maman.getUtilisateur().getPrenom() + " a deja un groupe assigne.");
        }
        if (!maman.getCohorte().getId().equals(groupe.getCohorte().getId())) {
            throw new IllegalArgumentException("Cette maman n'appartient pas a la cohorte de ce groupe.");
        }
        long tailleActuelle = mamanRepository.findByGroupeId(id).size();
        if (tailleActuelle >= Groupe.TAILLE_CIBLE) {
            throw new IllegalStateException("Ce groupe est deja complet (" + Groupe.TAILLE_CIBLE + " membres).");
        }

        maman.setGroupe(groupe);
        mamanRepository.save(maman);

        return ResponseEntity.ok(toResponse(groupe));
    }

    /**
     * Retire UNE maman d'un groupe (elle repasse "en attente"), sans supprimer le
     * groupe entier - complementaire de la suppression totale du groupe.
     */
    @DeleteMapping("/{groupeId}/mamans/{mamanId}")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<GroupeResponse> retirerMaman(@PathVariable String groupeId, @PathVariable String mamanId) {
        Groupe groupe = groupeRepository.findById(groupeId)
                .orElseThrow(() -> new NoSuchElementException("Groupe introuvable : " + groupeId));
        Maman maman = mamanRepository.findById(mamanId)
                .orElseThrow(() -> new NoSuchElementException("Maman introuvable : " + mamanId));

        if (maman.getGroupe() == null || !maman.getGroupe().getId().equals(groupeId)) {
            throw new IllegalArgumentException("Cette maman n'appartient pas a ce groupe.");
        }

        maman.setGroupe(null);
        mamanRepository.save(maman);

        return ResponseEntity.ok(toResponse(groupe));
    }

    @GetMapping
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<List<GroupeResponse>> lister() {
        List<GroupeResponse> groupes = groupeRepository.findAll()
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(groupes);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<GroupeResponse> obtenir(@PathVariable String id) {
        Groupe groupe = groupeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Groupe introuvable : " + id));
        return ResponseEntity.ok(toResponse(groupe));
    }

    /** Vue admin des membres d'un groupe (equivalent de /mon-groupe, mais cote COORDINATRICE). */
    @GetMapping("/{id}/membres")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<List<MembreDto>> membres(@PathVariable String id) {
        if (!groupeRepository.existsById(id)) {
            throw new NoSuchElementException("Groupe introuvable : " + id);
        }
        List<MembreDto> membres = mamanRepository.findByGroupeId(id).stream()
                .filter(m -> m.getUtilisateur().isActif())
                .map(m -> new MembreDto(m.getId(), m.getUtilisateur().getId(), m.getUtilisateur().getPrenom()))
                .toList();
        return ResponseEntity.ok(membres);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<GroupeResponse> modifier(@PathVariable String id,
                                                     @Valid @RequestBody GroupeRequest request) {
        Groupe groupe = groupeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Groupe introuvable : " + id));
        Cohorte cohorte = cohorteRepository.findById(request.cohorteId())
                .orElseThrow(() -> new NoSuchElementException("Cohorte introuvable : " + request.cohorteId()));
        groupe.setCohorte(cohorte);
        groupe.setNom(request.nom());
        groupe.setDateConstitution(request.dateConstitution());
        groupe = groupeRepository.save(groupe);
        return ResponseEntity.ok(toResponse(groupe));
    }

    /**
     * Supprime le groupe. Les mamans qui y etaient rattachees repassent automatiquement
     * "en attente" (leur groupe_id redevient null) plutot que d'etre supprimees elles-memes.
     * Les ateliers qui pointaient vers ce groupe sont debranches (groupe_id -> null),
     * pas supprimes - ce sont des donnees institutionnelles independantes du groupe.
     * Les messages du groupe, eux, sont supprimes avec le groupe (ils n'ont de sens
     * que dans le contexte de ce groupe precis, contrairement aux ateliers).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<Void> supprimer(@PathVariable String id) {
        Groupe groupe = groupeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Groupe introuvable : " + id));

        List<Maman> membres = mamanRepository.findByGroupeId(id);
        for (Maman m : membres) {
            m.setGroupe(null);
            mamanRepository.save(m);
        }

        List<Atelier> ateliers = atelierRepository.findByGroupeId(id);
        for (Atelier a : ateliers) {
            a.setGroupe(null);
            atelierRepository.save(a);
        }

        List<Message> messages = messageRepository.findByGroupeIdOrderByDateEnvoiAsc(id);
        messageRepository.deleteAll(messages);

        groupeRepository.delete(groupe);
        return ResponseEntity.noContent().build();
    }

    /**
     * Vue "effet village" - une maman ne voit que son propre groupe, jamais la liste
     * complete des groupes ni les groupes des autres.
     */
    @GetMapping("/mon-groupe")
    @PreAuthorize("hasRole('MAMAN')")
    public ResponseEntity<GroupeDetailResponse> monGroupe(@AuthenticationPrincipal Utilisateur utilisateurConnecte) {
        Maman maman = mamanRepository.findByUtilisateurId(utilisateurConnecte.getId())
                .orElseThrow(() -> new IllegalStateException("Aucun profil maman associe a ce compte"));

        Groupe groupe = maman.getGroupe();
        if (groupe == null) {
            throw new NoSuchElementException("Aucun groupe n'est encore assigne a ce compte.");
        }

        List<MembreDto> membres = mamanRepository.findByGroupeId(groupe.getId()).stream()
                .filter(m -> m.getUtilisateur().isActif())
                .map(m -> new MembreDto(m.getId(), m.getUtilisateur().getId(), m.getUtilisateur().getPrenom()))
                .toList();

        return ResponseEntity.ok(new GroupeDetailResponse(groupe.getId(), groupe.getNom(), groupe.getDateConstitution(), membres));
    }

    private GroupeResponse toResponse(Groupe g) {
        int tailleActuelle = (int) mamanRepository.findByGroupeId(g.getId()).stream()
                .filter(m -> m.getUtilisateur().isActif())
                .count();
        return new GroupeResponse(
                g.getId(),
                g.getCohorte().getId(),
                g.getCohorte().getNom(),
                g.getNom(),
                g.getDateConstitution(),
                tailleActuelle,
                Groupe.TAILLE_CIBLE
        );
    }
}
