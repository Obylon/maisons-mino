package com.mino.controller;

import com.mino.dto.AtelierDtos.AtelierRequest;
import com.mino.dto.AtelierDtos.AtelierResponse;
import com.mino.model.Atelier;
import com.mino.model.Groupe;
import com.mino.model.Professionnel;
import com.mino.repository.AtelierRepository;
import com.mino.repository.GroupeRepository;
import com.mino.repository.ProfessionnelRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

/**
 * Creation et gestion administrative des ateliers - reservee a la COORDINATRICE.
 * A distinguer de AtelierController (qui expose /mes-ateliers, cote PROFESSIONNEL)
 * et de InscriptionAtelierController (inscription/desinscription, cote MAMAN/PARTENAIRE).
 */
@RestController
@RequestMapping("/api/ateliers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('COORDINATRICE')")
public class AtelierAdminController {

    private final AtelierRepository atelierRepository;
    private final ProfessionnelRepository professionnelRepository;
    private final GroupeRepository groupeRepository;

    @PostMapping
    public ResponseEntity<AtelierResponse> creer(@Valid @RequestBody AtelierRequest request) {
        Atelier atelier = new Atelier();
        appliquerRequest(atelier, request);
        atelier = atelierRepository.save(atelier);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(atelier));
    }

    @GetMapping
    public ResponseEntity<List<AtelierResponse>> lister() {
        List<AtelierResponse> ateliers = atelierRepository.findAll()
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(ateliers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AtelierResponse> obtenir(@PathVariable String id) {
        Atelier atelier = atelierRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Atelier introuvable : " + id));
        return ResponseEntity.ok(toResponse(atelier));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AtelierResponse> modifier(@PathVariable String id,
                                                    @Valid @RequestBody AtelierRequest request) {
        Atelier atelier = atelierRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Atelier introuvable : " + id));
        appliquerRequest(atelier, request);
        atelier = atelierRepository.save(atelier);
        return ResponseEntity.ok(toResponse(atelier));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable String id) {
        if (!atelierRepository.existsById(id)) {
            throw new NoSuchElementException("Atelier introuvable : " + id);
        }
        atelierRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void appliquerRequest(Atelier atelier, AtelierRequest request) {
        atelier.setTitre(request.titre());
        atelier.setType(request.type());
        atelier.setDateHeure(request.dateHeure());
        atelier.setDureeMinutes(request.dureeMinutes() != null ? request.dureeMinutes() : 120);

        if (request.professionnelId() != null) {
            Professionnel professionnel = professionnelRepository.findById(request.professionnelId())
                    .orElseThrow(() -> new NoSuchElementException("Professionnel introuvable : " + request.professionnelId()));
            atelier.setProfessionnel(professionnel);
        } else {
            atelier.setProfessionnel(null);
        }

        if (request.groupeId() != null) {
            Groupe groupe = groupeRepository.findById(request.groupeId())
                    .orElseThrow(() -> new NoSuchElementException("Groupe introuvable : " + request.groupeId()));
            atelier.setGroupe(groupe);
        } else {
            atelier.setGroupe(null);
        }
    }

    private AtelierResponse toResponse(Atelier a) {
        return new AtelierResponse(
                a.getId(),
                a.getTitre(),
                a.getType(),
                a.getDateHeure(),
                a.getDureeMinutes(),
                a.getProfessionnel() != null ? a.getProfessionnel().getId() : null,
                a.getProfessionnel() != null
                        ? a.getProfessionnel().getUtilisateur().getPrenom() + " " + a.getProfessionnel().getUtilisateur().getNom()
                        : null,
                a.getGroupe() != null ? a.getGroupe().getId() : null
        );
    }
}